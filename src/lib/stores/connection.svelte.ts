import PartySocket from 'partysocket';
import type { ServerMessage, ClientMessage } from '$shared/messages';
import { browser } from '$app/environment';
import { PUBLIC_PARTYKIT_HOST } from '$env/static/public';

type MessageHandler = (message: ServerMessage) => void;

class ConnectionStore {
  socket = $state<PartySocket | null>(null);
  connected = $state(false);
  reconnecting = $state(false);
  error = $state<string | null>(null);

  private messageHandlers: Set<MessageHandler> = new Set();
  private roomId: string | null = null;

  /**
   * Connect to a room
   */
  connect(roomId: string): void {
    if (!browser) return;
    if (this.socket && this.roomId === roomId) return;

    this.disconnect();
    this.roomId = roomId;
    this.error = null;

    const host = PUBLIC_PARTYKIT_HOST || 'localhost:1999';

    this.socket = new PartySocket({
      host,
      room: roomId,
      party: 'stopparty'
    });

    this.socket.addEventListener('open', () => {
      this.connected = true;
      this.reconnecting = false;
      this.error = null;
    });

    this.socket.addEventListener('close', () => {
      this.connected = false;
    });

    this.socket.addEventListener('error', () => {
      this.error = 'errors.connection_error';
    });

    this.socket.addEventListener('message', (event) => {
      try {
        const message: ServerMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch {
        console.error('Failed to parse message:', event.data);
      }
    });

    // Handle reconnection
    this.socket.onclose = () => {
      this.connected = false;
      if (this.roomId) {
        this.reconnecting = true;
      }
    };
  }

  /**
   * Disconnect from room
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.connected = false;
    this.reconnecting = false;
    this.roomId = null;
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

  private handleMessage(message: ServerMessage): void {
    for (const handler of this.messageHandlers) {
      handler(message);
    }
  }
}

export const connection = new ConnectionStore();
