import PartySocket from 'partysocket';
import type { ServerMessage, ClientMessage } from '$shared/messages';
import { browser } from '$app/environment';
import { PUBLIC_PARTYKIT_HOST } from '$env/static/public';

type MessageHandler = (message: ServerMessage) => void;
type ReconnectHandler = () => void;

// Reconnection constants
const RECONNECT_BASE_DELAY = 1000; // 1 second
const RECONNECT_MAX_DELAY = 30000; // 30 seconds
const RECONNECT_MAX_ATTEMPTS = 10;
const HEARTBEAT_INTERVAL = 25000; // 25 seconds (less than typical 30s timeout)
const CONNECTION_TIMEOUT = 15000; // 15 seconds for mobile networks

class ConnectionStore {
  socket = $state<PartySocket | null>(null);
  connected = $state(false);
  reconnecting = $state(false);
  error = $state<string | null>(null);

  private messageHandlers: Set<MessageHandler> = new Set();
  private reconnectHandlers: Set<ReconnectHandler> = new Set();
  private roomId: string | null = null;
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private visibilityHandler: (() => void) | null = null;
  private onlineHandler: (() => void) | null = null;
  private offlineHandler: (() => void) | null = null;
  private lastPongTime = 0;
  private wasConnectedBeforeHidden = false;
  private hasConnectedOnce = false;

  constructor() {
    if (browser) {
      this.setupBrowserEventListeners();
    }
  }

  /**
   * Setup browser event listeners for visibility and network changes
   */
  private setupBrowserEventListeners(): void {
    // Handle visibility change (tab/app background/foreground)
    this.visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        this.handleVisibilityVisible();
      } else {
        this.handleVisibilityHidden();
      }
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);

    // Handle network online/offline
    this.onlineHandler = () => {
      console.log('[Connection] Network online, attempting reconnect');
      if (this.roomId && !this.connected) {
        this.attemptReconnect();
      }
    };
    this.offlineHandler = () => {
      console.log('[Connection] Network offline');
      this.connected = false;
      this.reconnecting = true;
    };
    window.addEventListener('online', this.onlineHandler);
    window.addEventListener('offline', this.offlineHandler);
  }

  /**
   * Handle when the page becomes visible again
   */
  private handleVisibilityVisible(): void {
    console.log('[Connection] Page visible, checking connection');

    if (!this.roomId) return;

    // Check if connection is still alive
    if (this.socket) {
      const socketState = this.socket.readyState;

      // If socket is closed or closing, reconnect
      if (socketState === WebSocket.CLOSED || socketState === WebSocket.CLOSING) {
        console.log('[Connection] Socket closed while hidden, reconnecting');
        this.reconnecting = true;
        this.attemptReconnect();
        return;
      }

      // If socket appears open, verify with a ping
      if (socketState === WebSocket.OPEN) {
        this.connected = true;
        // Send a ping to verify connection is alive
        this.sendPing();
      }
    } else if (this.wasConnectedBeforeHidden) {
      // No socket but we were connected - reconnect
      console.log('[Connection] No socket but was connected, reconnecting');
      this.reconnecting = true;
      this.attemptReconnect();
    }
  }

  /**
   * Handle when the page becomes hidden
   */
  private handleVisibilityHidden(): void {
    this.wasConnectedBeforeHidden = this.connected;
  }

  /**
   * Connect to a room
   */
  connect(roomId: string): void {
    if (!browser) return;
    if (this.socket && this.roomId === roomId && this.connected) return;

    this.disconnect();
    this.roomId = roomId;
    this.error = null;
    this.reconnectAttempts = 0;

    this.createSocket();
  }

  /**
   * Create the WebSocket connection
   */
  private createSocket(): void {
    if (!this.roomId) return;

    const host = PUBLIC_PARTYKIT_HOST || 'localhost:1999';

    console.log('[Connection] Creating socket to room:', this.roomId);

    this.socket = new PartySocket({
      host,
      room: this.roomId,
      party: 'main'
    });

    // Set a connection timeout for slow mobile networks
    const connectionTimeout = setTimeout(() => {
      if (!this.connected && this.socket) {
        console.log('[Connection] Connection timeout, retrying');
        this.socket.close();
        this.attemptReconnect();
      }
    }, CONNECTION_TIMEOUT);

    this.socket.addEventListener('open', () => {
      clearTimeout(connectionTimeout);
      const isReconnection = this.hasConnectedOnce;
      console.log('[Connection] Connected', isReconnection ? '(reconnection)' : '(initial)');

      this.connected = true;
      this.reconnecting = false;
      this.error = null;
      this.reconnectAttempts = 0;
      this.lastPongTime = Date.now();
      this.hasConnectedOnce = true;
      this.startHeartbeat();

      // Notify reconnect handlers if this is a reconnection
      if (isReconnection) {
        this.notifyReconnectHandlers();
      }
    });

    this.socket.addEventListener('close', (event) => {
      clearTimeout(connectionTimeout);
      console.log('[Connection] Closed:', event.code, event.reason);
      this.connected = false;
      this.stopHeartbeat();

      if (this.roomId) {
        this.reconnecting = true;
        // Auto-reconnect on unexpected close
        if (!event.wasClean || event.code !== 1000) {
          this.attemptReconnect();
        }
      }
    });

    this.socket.addEventListener('error', (event) => {
      console.error('[Connection] Error:', event);
      this.error = 'errors.connection_error';
    });

    this.socket.addEventListener('message', (event) => {
      try {
        const message: ServerMessage = JSON.parse(event.data);

        // Handle pong messages for heartbeat
        if (message.type === 'pong') {
          this.lastPongTime = Date.now();
          return;
        }

        this.handleMessage(message);
      } catch {
        console.error('Failed to parse message:', event.data);
      }
    });
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (!this.roomId) return;
    if (this.reconnectAttempts >= RECONNECT_MAX_ATTEMPTS) {
      console.log('[Connection] Max reconnect attempts reached');
      this.error = 'errors.connection_lost';
      this.reconnecting = false;
      return;
    }

    // Clear any existing timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    // Calculate delay with exponential backoff + jitter
    const delay = Math.min(
      RECONNECT_BASE_DELAY * Math.pow(2, this.reconnectAttempts) + Math.random() * 1000,
      RECONNECT_MAX_DELAY
    );

    console.log(`[Connection] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${RECONNECT_MAX_ATTEMPTS})`);

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;

      // Close existing socket if any
      if (this.socket) {
        this.socket.close();
        this.socket = null;
      }

      this.createSocket();
    }, delay);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      if (this.connected && this.socket) {
        // Check if we missed too many pongs
        const timeSinceLastPong = Date.now() - this.lastPongTime;
        if (timeSinceLastPong > HEARTBEAT_INTERVAL * 2) {
          console.log('[Connection] Connection seems dead, reconnecting');
          this.connected = false;
          this.reconnecting = true;
          this.attemptReconnect();
          return;
        }

        this.sendPing();
      }
    }, HEARTBEAT_INTERVAL);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Send a ping message
   */
  private sendPing(): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify({ type: 'ping' }));
      } catch {
        // Socket might be in bad state
        this.attemptReconnect();
      }
    }
  }

  /**
   * Disconnect from room
   */
  disconnect(): void {
    // Clear reconnection timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.stopHeartbeat();

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.connected = false;
    this.reconnecting = false;
    this.roomId = null;
    this.reconnectAttempts = 0;
    this.wasConnectedBeforeHidden = false;
    this.hasConnectedOnce = false;
  }

  /**
   * Force a reconnection attempt (useful for manual retry)
   */
  forceReconnect(): void {
    if (this.roomId && !this.connected) {
      this.reconnectAttempts = 0; // Reset attempts
      this.attemptReconnect();
    }
  }

  /**
   * Send a message to the server
   */
  send(message: ClientMessage): void {
    if (this.socket && this.connected) {
      this.socket.send(JSON.stringify(message));
    }
  }

  /**
   * Subscribe to messages
   */
  subscribe(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  /**
   * Subscribe to reconnection events
   * Called when the connection is restored after being lost
   */
  onReconnect(handler: ReconnectHandler): () => void {
    this.reconnectHandlers.add(handler);
    return () => {
      this.reconnectHandlers.delete(handler);
    };
  }

  private handleMessage(message: ServerMessage): void {
    for (const handler of this.messageHandlers) {
      handler(message);
    }
  }

  private notifyReconnectHandlers(): void {
    for (const handler of this.reconnectHandlers) {
      handler();
    }
  }

  /**
   * Get the current room ID (for rejoining)
   */
  getRoomId(): string | null {
    return this.roomId;
  }
}

export const connection = new ConnectionStore();
