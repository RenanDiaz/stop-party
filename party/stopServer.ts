import type * as Party from 'partykit/server';
import type { ClientMessage, ServerMessage } from '../shared/messages';
import type { RoomConfig } from '../shared/types';
import type { RoomState, Timers, ConnectionInfo } from './types';
import {
  MIN_PLAYERS,
  COUNTDOWN_DURATION_MS,
  RECONNECT_TIMEOUT_MS
} from '../shared/constants';
import {
  createRoomState,
  addPlayer,
  removePlayer,
  disconnectPlayer,
  reconnectPlayer,
  findPlayerByDeviceId,
  toPublicPlayer,
  getPublicRoomState,
  updateConfig,
  initializeRound,
  submitAnswers,
  updateFilledCount,
  calculateScores,
  shouldGameEnd,
  calculateFinalResults,
  prepareForNewRound,
  areAllPlayersReady,
  getConnectedPlayerCount,
  validatePlayerName,
  isNameTaken,
  transferHost
} from './gameEngine';
import { selectLetter } from './letterManager';
import {
  initializeVoting,
  recordVote,
  getVoteCount,
  calculateVotingResults,
  applyTieBreaker,
  isVotingComplete,
  getAllAnswersForVoting,
  fillMissingVotesAsValid
} from './votingManager';
import {
  createTimers,
  clearAllTimers,
  setRoundTimer,
  setGraceTimer,
  setVotingTimer,
  setReadyCheckTimer,
  setCountdownTimer,
  clearTimer
} from './timerManager';

export default class StopPartyServer implements Party.Server {
  private state: RoomState;
  private timers: Timers;
  private connections: Map<string, ConnectionInfo> = new Map();

  constructor(readonly room: Party.Room) {
    this.state = createRoomState(room.id);
    this.timers = createTimers();
  }

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext): void {
    // Connection established, waiting for join message
    console.log(`[${this.room.id}] Connection: ${conn.id}`);
  }

  onClose(conn: Party.Connection): void {
    const connectionInfo = this.connections.get(conn.id);
    if (!connectionInfo) return;

    const player = this.state.players.get(connectionInfo.playerId);
    if (!player) return;

    console.log(`[${this.room.id}] Disconnected: ${player.name}`);

    // Mark as disconnected but keep in game for reconnection
    disconnectPlayer(this.state, connectionInfo.playerId);

    // Notify others
    this.broadcast({
      type: 'player_left',
      playerId: connectionInfo.playerId
    });

    // If in lobby and player leaves, just remove them
    if (this.state.phase === 'lobby') {
      removePlayer(this.state, connectionInfo.playerId);

      // If host changed, notify
      const newHost = this.state.players.get(this.state.hostId);
      if (newHost) {
        this.broadcast({
          type: 'host_changed',
          newHostId: this.state.hostId,
          newHostName: newHost.name
        });
      }
    }

    this.connections.delete(conn.id);

    // Check if all players disconnected during game
    if (getConnectedPlayerCount(this.state) === 0 && this.state.phase !== 'lobby') {
      this.resetGame();
    }

    // Schedule cleanup for disconnected players
    setTimeout(() => {
      this.cleanupDisconnectedPlayers();
    }, RECONNECT_TIMEOUT_MS);
  }

  onMessage(message: string, sender: Party.Connection): void {
    try {
      const msg: ClientMessage = JSON.parse(message);
      this.handleMessage(msg, sender);
    } catch (error) {
      console.error(`[${this.room.id}] Invalid message:`, error);
      this.sendTo(sender, {
        type: 'error',
        message: 'Invalid message format',
        code: 'INVALID_MESSAGE'
      });
    }
  }

  private handleMessage(msg: ClientMessage, sender: Party.Connection): void {
    switch (msg.type) {
      case 'join':
        this.handleJoin(msg.playerName, msg.deviceId, sender);
        break;
      case 'ready':
        this.handleReady(sender, true);
        break;
      case 'not_ready':
        this.handleReady(sender, false);
        break;
      case 'start_game':
        this.handleStartGame(sender);
        break;
      case 'submit_answers':
        this.handleSubmitAnswers(sender, msg.answers);
        break;
      case 'update_answer':
        this.handleUpdateAnswer(sender, msg.category, msg.answer);
        break;
      case 'call_basta':
        this.handleCallBasta(sender);
        break;
      case 'vote':
        this.handleVote(sender, msg.category, msg.targetPlayerId, msg.valid);
        break;
      case 'voting_ready':
        this.handleVotingReady(sender);
        break;
      case 'host_decide_tie':
        this.handleHostDecideTie(sender, msg.category, msg.targetPlayerId, msg.valid);
        break;
      case 'kick_player':
        this.handleKickPlayer(sender, msg.targetPlayerId);
        break;
      case 'update_config':
        this.handleUpdateConfig(sender, msg.config);
        break;
      case 'transfer_host':
        this.handleTransferHost(sender, msg.targetPlayerId);
        break;
      case 'react':
        this.handleReaction(sender, msg.category, msg.targetPlayerId, msg.reaction);
        break;
      case 'ping':
        this.sendTo(sender, { type: 'pong' });
        break;
    }
  }

  private handleJoin(playerName: string, deviceId: string, conn: Party.Connection): void {
    // Check if game already in progress
    if (this.state.phase !== 'lobby' && this.state.phase !== 'ready_check') {
      // Check if this player exists (for closing old connection)
      const existingPlayer = findPlayerByDeviceId(this.state, deviceId);
      const oldConnectionId = existingPlayer?.oldConnectionId;

      // Try to reconnect
      const reconnected = reconnectPlayer(this.state, deviceId, conn.id);
      if (reconnected) {
        // Close the old connection if it exists and is different
        if (oldConnectionId && oldConnectionId !== conn.id) {
          const oldConn = this.room.getConnection(oldConnectionId);
          if (oldConn) {
            console.log(`[${this.room.id}] Closing stale connection for: ${reconnected.name}`);
            oldConn.close();
          }
          this.connections.delete(oldConnectionId);
        }

        this.connections.set(conn.id, {
          playerId: conn.id,
          deviceId
        });

        // Send current state
        this.sendTo(conn, {
          type: 'room_state',
          state: getPublicRoomState(this.state)
        });

        this.broadcast({
          type: 'player_reconnected',
          playerId: conn.id
        });

        console.log(`[${this.room.id}] Reconnected: ${reconnected.name}`);
        return;
      }

      this.sendTo(conn, {
        type: 'error',
        message: 'Game already in progress',
        code: 'GAME_IN_PROGRESS'
      });
      return;
    }

    // Check for existing connection with same deviceId (reconnection)
    // This must happen BEFORE name validation to allow reconnecting players
    const existingPlayerInfo = findPlayerByDeviceId(this.state, deviceId);
    const oldConnId = existingPlayerInfo?.oldConnectionId;

    const existingPlayer = reconnectPlayer(this.state, deviceId, conn.id);
    if (existingPlayer) {
      // Close the old connection if it exists and is different
      if (oldConnId && oldConnId !== conn.id) {
        const oldConn = this.room.getConnection(oldConnId);
        if (oldConn) {
          console.log(`[${this.room.id}] Closing stale connection in lobby for: ${existingPlayer.name}`);
          oldConn.close();
        }
        this.connections.delete(oldConnId);
      }

      this.connections.set(conn.id, {
        playerId: conn.id,
        deviceId
      });

      this.sendTo(conn, {
        type: 'room_state',
        state: getPublicRoomState(this.state)
      });

      this.broadcast({
        type: 'player_reconnected',
        playerId: conn.id
      });

      return;
    }

    // Validate name (only for new players, not reconnections)
    const nameValidation = validatePlayerName(playerName);
    if (nameValidation === 'too_short') {
      this.sendTo(conn, {
        type: 'error',
        message: 'Name too short',
        code: 'NAME_TOO_SHORT'
      });
      return;
    }
    if (nameValidation === 'too_long') {
      this.sendTo(conn, {
        type: 'error',
        message: 'Name too long',
        code: 'NAME_TOO_LONG'
      });
      return;
    }

    // Check for duplicate name
    if (isNameTaken(this.state, playerName)) {
      this.sendTo(conn, {
        type: 'error',
        message: 'Name already taken',
        code: 'DUPLICATE_NAME'
      });
      return;
    }

    // Check room capacity
    if (this.state.players.size >= this.state.config.maxPlayers) {
      this.sendTo(conn, {
        type: 'error',
        message: 'Room is full',
        code: 'ROOM_FULL'
      });
      return;
    }

    // Add new player
    const player = addPlayer(this.state, conn.id, deviceId, playerName.trim());
    this.connections.set(conn.id, {
      playerId: conn.id,
      deviceId
    });

    console.log(`[${this.room.id}] Joined: ${player.name} (host: ${player.isHost})`);

    // Send full state to new player
    this.sendTo(conn, {
      type: 'room_state',
      state: getPublicRoomState(this.state)
    });

    // Notify others
    this.broadcastExcept(conn.id, {
      type: 'player_joined',
      player: toPublicPlayer(player)
    });
  }

  private handleReady(conn: Party.Connection, isReady: boolean): void {
    const connectionInfo = this.connections.get(conn.id);
    if (!connectionInfo) return;

    const player = this.state.players.get(connectionInfo.playerId);
    if (!player) return;

    player.isReady = isReady;

    this.broadcast({
      type: 'player_ready',
      playerId: player.id,
      isReady
    });

    // In ready_check phase, check if all ready
    if (this.state.phase === 'ready_check' && areAllPlayersReady(this.state)) {
      clearTimer(this.timers, 'readyCheckTimer');
      this.startCountdown();
    }
  }

  private handleStartGame(conn: Party.Connection): void {
    const connectionInfo = this.connections.get(conn.id);
    if (!connectionInfo) return;

    // Only host can start
    if (connectionInfo.playerId !== this.state.hostId) {
      this.sendTo(conn, {
        type: 'error',
        message: 'Only host can start the game',
        code: 'NOT_HOST'
      });
      return;
    }

    // Need at least MIN_PLAYERS
    if (getConnectedPlayerCount(this.state) < MIN_PLAYERS) {
      this.sendTo(conn, {
        type: 'error',
        message: `Need at least ${MIN_PLAYERS} players`,
        code: 'NOT_ENOUGH_PLAYERS'
      });
      return;
    }

    // Must be in lobby
    if (this.state.phase !== 'lobby') {
      this.sendTo(conn, {
        type: 'error',
        message: 'Game already started',
        code: 'INVALID_PHASE'
      });
      return;
    }

    this.startCountdown();
  }

  private startCountdown(): void {
    this.state.phase = 'countdown';

    this.broadcast({
      type: 'countdown_started',
      duration: COUNTDOWN_DURATION_MS
    });

    setCountdownTimer(this.timers, COUNTDOWN_DURATION_MS, () => {
      this.startRound();
    });
  }

  private startRound(): void {
    // Select a letter
    const result = selectLetter(this.state.letterPool, this.state.usedLetters);
    if (!result) {
      // No more letters, end game
      this.endGame();
      return;
    }

    this.state.letterPool = result.newPool;
    initializeRound(this.state, result.letter);
    this.state.phase = 'playing';

    const totalRounds = this.state.config.victoryMode === 'rounds'
      ? this.state.config.victoryValue
      : 0;

    this.broadcast({
      type: 'round_started',
      round: this.state.currentRound,
      letter: result.letter,
      totalRounds
    });

    // Set round timer if configured
    if (this.state.config.roundTimeLimit > 0) {
      setRoundTimer(
        this.timers,
        this.state.config.roundTimeLimit * 1000,
        () => this.handleRoundTimeout()
      );
    }
  }

  private handleRoundTimeout(): void {
    if (this.state.phase !== 'playing') return;

    // Simulate basta call from system
    this.state.bastaCalledBy = 'system';
    this.state.bastaCalledAt = Date.now();
    this.state.phase = 'basta_called';

    this.broadcast({
      type: 'basta_called',
      playerId: 'system',
      playerName: 'Timer',
      graceTime: 0
    });

    // End round immediately
    this.endRound();
  }

  private handleSubmitAnswers(conn: Party.Connection, answers: Record<string, string>): void {
    const connectionInfo = this.connections.get(conn.id);
    if (!connectionInfo) return;

    if (this.state.phase !== 'playing' && this.state.phase !== 'basta_called') {
      return;
    }

    submitAnswers(this.state, connectionInfo.playerId, answers);
  }

  private handleUpdateAnswer(conn: Party.Connection, category: string, answer: string): void {
    const connectionInfo = this.connections.get(conn.id);
    if (!connectionInfo) return;

    if (this.state.phase !== 'playing' && this.state.phase !== 'basta_called') {
      return;
    }

    // Update answers map
    const existingAnswers = this.state.answers.get(connectionInfo.playerId);
    if (existingAnswers) {
      existingAnswers.answers[category] = answer;
    } else {
      this.state.answers.set(connectionInfo.playerId, {
        playerId: connectionInfo.playerId,
        answers: { [category]: answer },
        submittedAt: null
      });
    }

    // Update filled count
    const filledCount = Object.values(
      this.state.answers.get(connectionInfo.playerId)?.answers ?? {}
    ).filter(a => a.trim() !== '').length;

    updateFilledCount(this.state, connectionInfo.playerId, filledCount);

    // Broadcast progress if enabled
    if (this.state.config.showOthersProgress) {
      this.broadcast({
        type: 'player_progress',
        playerId: connectionInfo.playerId,
        filledCount
      });
    }
  }

  private handleCallBasta(conn: Party.Connection): void {
    const connectionInfo = this.connections.get(conn.id);
    if (!connectionInfo) return;

    // Atomic check: prevent race conditions when multiple players call basta simultaneously
    if (this.state.phase !== 'playing' || this.state.processingBasta) {
      return;
    }

    // Lock to prevent concurrent basta calls
    this.state.processingBasta = true;

    const player = this.state.players.get(connectionInfo.playerId);
    if (!player) {
      this.state.processingBasta = false;
      return;
    }

    this.state.bastaCalledBy = connectionInfo.playerId;
    this.state.bastaCalledAt = Date.now();
    this.state.phase = 'basta_called';

    // Clear round timer
    clearTimer(this.timers, 'roundTimer');

    const graceTime = this.state.config.graceTimeAfterBasta;

    this.broadcast({
      type: 'basta_called',
      playerId: connectionInfo.playerId,
      playerName: player.name,
      graceTime
    });

    if (graceTime > 0) {
      setGraceTimer(this.timers, graceTime * 1000, () => {
        this.endRound();
      });
    } else {
      this.endRound();
    }
  }

  private endRound(): void {
    clearTimer(this.timers, 'graceTimer');
    clearTimer(this.timers, 'roundTimer');

    // Reset the basta lock for next round
    this.state.processingBasta = false;

    this.broadcast({ type: 'round_ended' });

    // Start voting phase
    this.state.phase = 'voting';
    this.state.votingReadyPlayers = new Set();
    initializeVoting(this.state);

    const allAnswers = getAllAnswersForVoting(this.state);

    this.broadcast({
      type: 'voting_started',
      answers: allAnswers,
      timeLimit: this.state.config.votingTimeLimit
    });

    // Set voting timer only if there's a time limit
    // If votingTimeLimit is 0, we wait for all players to mark themselves as ready
    if (this.state.config.votingTimeLimit > 0) {
      setVotingTimer(
        this.timers,
        this.state.config.votingTimeLimit * 1000,
        () => this.handleVotingTimeout()
      );
    }
  }

  private handleVote(
    conn: Party.Connection,
    category: string,
    targetPlayerId: string,
    valid: boolean
  ): void {
    const connectionInfo = this.connections.get(conn.id);
    if (!connectionInfo) return;

    if (this.state.phase !== 'voting') {
      return;
    }

    // Can't vote on own answer
    if (connectionInfo.playerId === targetPlayerId) {
      this.sendTo(conn, {
        type: 'error',
        message: 'Cannot vote on your own answer',
        code: 'CANNOT_VOTE_SELF'
      });
      return;
    }

    const success = recordVote(
      this.state,
      connectionInfo.playerId,
      category,
      targetPlayerId,
      valid
    );

    if (!success) {
      this.sendTo(conn, {
        type: 'error',
        message: 'Already voted',
        code: 'ALREADY_VOTED'
      });
      return;
    }

    const voteCount = getVoteCount(this.state, category, targetPlayerId);

    this.broadcast({
      type: 'vote_received',
      category,
      targetPlayerId,
      votesCount: voteCount.validVotes + voteCount.invalidVotes,
      totalVoters: voteCount.totalVoters
    });
  }

  private handleVotingReady(conn: Party.Connection): void {
    const connectionInfo = this.connections.get(conn.id);
    if (!connectionInfo) return;

    if (this.state.phase !== 'voting') {
      return;
    }

    const player = this.state.players.get(connectionInfo.playerId);
    if (!player || !player.isConnected) return;

    // Mark this player as ready
    this.state.votingReadyPlayers.add(connectionInfo.playerId);

    // Notify all clients
    const connectedPlayers = Array.from(this.state.players.values()).filter(p => p.isConnected);
    this.broadcast({
      type: 'player_voting_ready',
      playerId: connectionInfo.playerId,
      readyCount: this.state.votingReadyPlayers.size,
      totalPlayers: connectedPlayers.length
    });

    // Check if all connected players are ready
    const allReady = connectedPlayers.every(p => this.state.votingReadyPlayers.has(p.id));

    if (allReady) {
      // All players ready, fill missing votes and finish
      fillMissingVotesAsValid(this.state);
      this.finishVoting();
    }
  }

  private handleVotingTimeout(): void {
    if (this.state.phase !== 'voting') return;

    // Fill missing votes as valid
    fillMissingVotesAsValid(this.state);

    this.finishVoting();
  }

  private finishVoting(): void {
    clearTimer(this.timers, 'votingTimer');

    const votingResults = calculateVotingResults(this.state);

    // Check for tie-breakers
    if (!isVotingComplete(votingResults)) {
      // Wait for host to decide ties
      this.broadcast({
        type: 'voting_ended',
        results: votingResults
      });
      return;
    }

    this.processVotingResults(votingResults);
  }

  private handleHostDecideTie(
    conn: Party.Connection,
    category: string,
    targetPlayerId: string,
    valid: boolean
  ): void {
    const connectionInfo = this.connections.get(conn.id);
    if (!connectionInfo) return;

    // Only host can decide ties
    if (connectionInfo.playerId !== this.state.hostId) {
      this.sendTo(conn, {
        type: 'error',
        message: 'Only host can decide ties',
        code: 'NOT_HOST'
      });
      return;
    }

    // Calculate current results and apply tie-breaker
    const votingResults = calculateVotingResults(this.state);
    applyTieBreaker(votingResults, category, targetPlayerId, valid);

    // Check if all ties resolved
    if (isVotingComplete(votingResults)) {
      this.processVotingResults(votingResults);
    } else {
      // Send updated results
      this.broadcast({
        type: 'voting_ended',
        results: votingResults
      });
    }
  }

  private processVotingResults(votingResults: ReturnType<typeof calculateVotingResults>): void {
    this.state.phase = 'results';

    // Calculate scores
    const roundResults = calculateScores(this.state, votingResults);

    this.broadcast({
      type: 'round_results',
      results: roundResults
    });

    // Check if game should end
    if (shouldGameEnd(this.state)) {
      setTimeout(() => this.endGame(), 5000);
      return;
    }

    // Start ready check phase
    setTimeout(() => this.startReadyCheck(), 3000);
  }

  private startReadyCheck(): void {
    prepareForNewRound(this.state);
    this.state.phase = 'ready_check';

    const timeLimit = this.state.config.timeBetweenRounds;

    this.broadcast({
      type: 'ready_check_started',
      timeLimit
    });

    // If auto-continue is set, start timer
    if (timeLimit > 0) {
      setReadyCheckTimer(
        this.timers,
        timeLimit * 1000,
        () => {
          if (this.state.phase === 'ready_check') {
            this.startCountdown();
          }
        }
      );
    }
  }

  private endGame(): void {
    clearAllTimers(this.timers);

    this.state.phase = 'game_over';
    const finalResults = calculateFinalResults(this.state);

    this.broadcast({
      type: 'game_over',
      finalResults
    });
  }

  private resetGame(): void {
    clearAllTimers(this.timers);
    this.state = createRoomState(this.room.id);
  }

  private handleKickPlayer(conn: Party.Connection, targetPlayerId: string): void {
    const connectionInfo = this.connections.get(conn.id);
    if (!connectionInfo) return;

    // Only host can kick
    if (connectionInfo.playerId !== this.state.hostId) {
      this.sendTo(conn, {
        type: 'error',
        message: 'Only host can kick players',
        code: 'NOT_HOST'
      });
      return;
    }

    // Can't kick self
    if (connectionInfo.playerId === targetPlayerId) {
      return;
    }

    const targetPlayer = this.state.players.get(targetPlayerId);
    if (!targetPlayer) return;

    const playerName = targetPlayer.name;

    // Remove from game
    removePlayer(this.state, targetPlayerId);
    this.connections.delete(targetPlayerId);

    this.broadcast({
      type: 'player_kicked',
      playerId: targetPlayerId,
      playerName
    });

    // Close target's connection
    for (const [connId, info] of this.connections) {
      if (info.playerId === targetPlayerId) {
        const targetConn = this.room.getConnection(connId);
        if (targetConn) {
          targetConn.close();
        }
        this.connections.delete(connId);
        break;
      }
    }
  }

  private handleUpdateConfig(conn: Party.Connection, config: Partial<RoomConfig>): void {
    const connectionInfo = this.connections.get(conn.id);
    if (!connectionInfo) return;

    // Only host can update config
    if (connectionInfo.playerId !== this.state.hostId) {
      this.sendTo(conn, {
        type: 'error',
        message: 'Only host can update config',
        code: 'NOT_HOST'
      });
      return;
    }

    // Only in lobby
    if (this.state.phase !== 'lobby') {
      this.sendTo(conn, {
        type: 'error',
        message: 'Can only change config in lobby',
        code: 'INVALID_PHASE'
      });
      return;
    }

    updateConfig(this.state, config);

    this.broadcast({
      type: 'config_updated',
      config: this.state.config
    });
  }

  private handleTransferHost(conn: Party.Connection, targetPlayerId: string): void {
    const connectionInfo = this.connections.get(conn.id);
    if (!connectionInfo) return;

    // Only current host can transfer
    if (connectionInfo.playerId !== this.state.hostId) {
      this.sendTo(conn, {
        type: 'error',
        message: 'Only host can transfer host',
        code: 'NOT_HOST'
      });
      return;
    }

    const success = transferHost(this.state, targetPlayerId);
    if (!success) {
      this.sendTo(conn, {
        type: 'error',
        message: 'Player not found',
        code: 'PLAYER_NOT_FOUND'
      });
      return;
    }

    const newHost = this.state.players.get(targetPlayerId);
    if (newHost) {
      this.broadcast({
        type: 'host_changed',
        newHostId: targetPlayerId,
        newHostName: newHost.name
      });
    }
  }

  private handleReaction(
    conn: Party.Connection,
    category: string,
    targetPlayerId: string,
    reaction: string
  ): void {
    const connectionInfo = this.connections.get(conn.id);
    if (!connectionInfo) return;

    // Only allow reactions during voting phase
    if (this.state.phase !== 'voting') {
      return;
    }

    // Get or create category reactions map
    if (!this.state.reactions.has(category)) {
      this.state.reactions.set(category, new Map());
    }
    const categoryReactions = this.state.reactions.get(category)!;

    // Get or create player reactions
    if (!categoryReactions.has(targetPlayerId)) {
      categoryReactions.set(targetPlayerId, {});
    }
    const playerReactions = categoryReactions.get(targetPlayerId)!;

    // Get or create reaction array
    if (!playerReactions[reaction]) {
      playerReactions[reaction] = [];
    }

    const reactorId = connectionInfo.playerId;

    // Toggle reaction (add if not present, remove if present)
    const reactionIndex = playerReactions[reaction].indexOf(reactorId);
    if (reactionIndex === -1) {
      playerReactions[reaction].push(reactorId);
    } else {
      playerReactions[reaction].splice(reactionIndex, 1);
      // Clean up empty arrays
      if (playerReactions[reaction].length === 0) {
        delete playerReactions[reaction];
      }
    }

    // Broadcast updated reactions
    this.broadcast({
      type: 'reaction_received',
      category,
      targetPlayerId,
      reactions: playerReactions
    });
  }

  private cleanupDisconnectedPlayers(): void {
    const now = Date.now();

    for (const [playerId, player] of this.state.players) {
      if (!player.isConnected && now - player.lastConnectedAt > RECONNECT_TIMEOUT_MS) {
        removePlayer(this.state, playerId);
        console.log(`[${this.room.id}] Cleaned up: ${player.name}`);
      }
    }
  }

  private sendTo(conn: Party.Connection, message: ServerMessage): void {
    conn.send(JSON.stringify(message));
  }

  private broadcast(message: ServerMessage): void {
    this.room.broadcast(JSON.stringify(message));
  }

  private broadcastExcept(excludeConnId: string, message: ServerMessage): void {
    const messageStr = JSON.stringify(message);
    for (const conn of this.room.getConnections()) {
      if (conn.id !== excludeConnId) {
        conn.send(messageStr);
      }
    }
  }
}
