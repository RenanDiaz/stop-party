import type {
  GamePhase,
  RoomConfig,
  PublicPlayer,
  PublicRoomState,
  AllPlayerAnswers,
  VotingResults,
  RoundResults,
  FinalResults,
  ReactionType,
  AnswerReactions
} from '$shared/types';
import type { ServerMessage } from '$shared/messages';
import { DEFAULT_CONFIG } from '$shared/constants';
import { getDefaultCategories } from '$shared/categories';
import { connection } from './connection.svelte';
import { playerState } from './playerState.svelte';
import { playSound, vibrate } from '$lib/utils/sounds';

class GameStore {
  // Room state
  roomId = $state<string | null>(null);
  phase = $state<GamePhase>('lobby');
  config = $state<RoomConfig>({
    ...DEFAULT_CONFIG,
    categories: getDefaultCategories()
  });

  // Players
  players = $state<PublicPlayer[]>([]);
  hostId = $state<string | null>(null);
  isHost = $derived(playerState.id === this.hostId);

  // Round state
  currentRound = $state(0);
  totalRounds = $state(0);
  currentLetter = $state<string | null>(null);
  usedLetters = $state<string[]>([]);
  roundStartedAt = $state<number | null>(null);
  bastaCalledBy = $state<string | null>(null);
  bastaCalledByName = $state<string | null>(null);
  countdownRemaining = $state<number | null>(null);

  // Local answers (during playing phase)
  localAnswers = $state<Record<string, string>>({});
  submittedAnswers = $state(false);

  // Voting state
  allAnswers = $state<AllPlayerAnswers | null>(null);
  votingResults = $state<VotingResults | null>(null);
  localVotes = $state<Record<string, Record<string, boolean>>>({});
  votingTimeLimit = $state(0);
  votingReadyPlayers = $state<Set<string>>(new Set());
  isVotingReady = $state(false);

  // Reactions state: category -> playerId -> reactions
  reactions = $state<Record<string, Record<string, AnswerReactions>>>({});

  // Results
  roundResults = $state<RoundResults | null>(null);
  finalResults = $state<FinalResults | null>(null);

  // Timers
  roundTimeRemaining = $state<number | null>(null);
  votingTimeRemaining = $state<number | null>(null);
  betweenRoundsTimeRemaining = $state<number | null>(null);
  graceTimeRemaining = $state<number | null>(null);

  // Error handling
  lastError = $state<string | null>(null);

  private unsubscribe: (() => void) | null = null;
  private timerInterval: ReturnType<typeof setInterval> | null = null;

  private reconnectUnsubscribe: (() => void) | null = null;

  /**
   * Join a room
   */
  joinRoom(roomId: string, playerName: string): void {
    this.roomId = roomId;
    this.resetState();

    // Subscribe to messages
    this.unsubscribe = connection.subscribe((msg) => this.handleMessage(msg));

    // Subscribe to reconnection events for automatic rejoin
    this.reconnectUnsubscribe = connection.onReconnect(() => {
      console.log('[GameState] Reconnection detected, rejoining room');
      this.sendJoinMessage();
    });

    // Connect
    connection.connect(roomId);

    // Wait for connection then send join
    this.waitForConnectionAndJoin();
  }

  /**
   * Wait for connection and send join message
   */
  private waitForConnectionAndJoin(): void {
    const maxAttempts = 150; // 15 seconds (100ms * 150)
    let attempts = 0;

    const checkConnection = setInterval(() => {
      attempts++;

      if (connection.connected) {
        clearInterval(checkConnection);
        this.sendJoinMessage();
      } else if (attempts >= maxAttempts) {
        clearInterval(checkConnection);
        console.log('[GameState] Connection timeout after 15 seconds');
      }
    }, 100);
  }

  /**
   * Send join message to server
   */
  private sendJoinMessage(): void {
    if (connection.connected && playerState.name) {
      connection.send({
        type: 'join',
        playerName: playerState.name,
        deviceId: playerState.deviceId
      });
    }
  }

  /**
   * Leave the room
   */
  leaveRoom(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    if (this.reconnectUnsubscribe) {
      this.reconnectUnsubscribe();
      this.reconnectUnsubscribe = null;
    }
    connection.disconnect();
    this.resetState();
  }

  /**
   * Toggle ready state
   */
  toggleReady(): void {
    const me = this.players.find((p) => p.id === playerState.id);
    if (me) {
      connection.send({ type: me.isReady ? 'not_ready' : 'ready' });
      playSound('ready');
    }
  }

  /**
   * Start the game (host only)
   */
  startGame(): void {
    if (this.isHost) {
      connection.send({ type: 'start_game' });
    }
  }

  /**
   * Update a single answer
   */
  updateAnswer(category: string, answer: string): void {
    this.localAnswers[category] = answer;
    connection.send({
      type: 'update_answer',
      category,
      answer
    });
  }

  /**
   * Submit all answers
   */
  submitAnswers(): void {
    connection.send({
      type: 'submit_answers',
      answers: this.localAnswers
    });
    this.submittedAnswers = true;
  }

  /**
   * Call BASTA!
   */
  callBasta(): void {
    connection.send({ type: 'call_basta' });
    vibrate(200);
  }

  /**
   * Vote on an answer
   */
  vote(category: string, targetPlayerId: string, valid: boolean): void {
    connection.send({
      type: 'vote',
      category,
      targetPlayerId,
      valid
    });

    // Play vote sound
    playSound('vote');

    // Track local votes
    if (!this.localVotes[category]) {
      this.localVotes[category] = {};
    }
    this.localVotes[category][targetPlayerId] = valid;
  }

  /**
   * Host decides tie
   */
  decideTie(category: string, targetPlayerId: string, valid: boolean): void {
    if (this.isHost) {
      connection.send({
        type: 'host_decide_tie',
        category,
        targetPlayerId,
        valid
      });
    }
  }

  /**
   * Mark voting as ready (done voting)
   */
  markVotingReady(): void {
    if (!this.isVotingReady) {
      connection.send({ type: 'voting_ready' });
      this.isVotingReady = true;
      playSound('ready');
    }
  }

  /**
   * Send a reaction to an answer
   */
  react(category: string, targetPlayerId: string, reaction: ReactionType): void {
    connection.send({
      type: 'react',
      category,
      targetPlayerId,
      reaction
    });
  }

  /**
   * Update room config (host only)
   */
  updateConfig(config: Partial<RoomConfig>): void {
    if (this.isHost) {
      connection.send({
        type: 'update_config',
        config
      });
    }
  }

  /**
   * Kick a player (host only)
   */
  kickPlayer(playerId: string): void {
    if (this.isHost) {
      connection.send({
        type: 'kick_player',
        targetPlayerId: playerId
      });
    }
  }

  /**
   * Transfer host role (host only)
   */
  transferHost(playerId: string): void {
    if (this.isHost) {
      connection.send({
        type: 'transfer_host',
        targetPlayerId: playerId
      });
    }
  }

  /**
   * Get current player
   */
  getMe(): PublicPlayer | undefined {
    return this.players.find((p) => p.id === playerState.id);
  }

  private handleMessage(msg: ServerMessage): void {
    switch (msg.type) {
      case 'room_state':
        this.handleRoomState(msg.state);
        break;

      case 'player_joined':
        this.players = [...this.players, msg.player];
        break;

      case 'player_left':
        this.players = this.players.filter((p) => p.id !== msg.playerId);
        break;

      case 'player_reconnected':
        this.players = this.players.map((p) =>
          p.id === msg.playerId ? { ...p, isConnected: true } : p
        );
        break;

      case 'player_ready':
        this.players = this.players.map((p) =>
          p.id === msg.playerId ? { ...p, isReady: msg.isReady } : p
        );
        break;

      case 'countdown_started':
        this.phase = 'countdown';
        this.startCountdown(msg.duration);
        playSound('countdown');
        break;

      case 'round_started':
        this.handleRoundStarted(msg);
        break;

      case 'basta_called':
        this.handleBastaCalled(msg);
        break;

      case 'round_ended':
        this.stopTimer();
        break;

      case 'voting_started':
        this.handleVotingStarted(msg);
        break;

      case 'vote_received':
        // Could show vote progress if needed
        break;

      case 'reaction_received':
        // Update reactions state
        if (!this.reactions[msg.category]) {
          this.reactions[msg.category] = {};
        }
        this.reactions[msg.category][msg.targetPlayerId] = msg.reactions;
        break;

      case 'player_voting_ready':
        this.votingReadyPlayers = new Set([...this.votingReadyPlayers, msg.playerId]);
        break;

      case 'voting_ended':
        this.votingResults = msg.results;
        break;

      case 'round_results':
        this.handleRoundResults(msg.results);
        break;

      case 'ready_check_started':
        this.phase = 'ready_check';
        // Reset all players' ready state for the new round
        this.players = this.players.map((p) => ({ ...p, isReady: false }));
        if (msg.timeLimit > 0) {
          this.betweenRoundsTimeRemaining = msg.timeLimit;
          this.startBetweenRoundsTimer();
        }
        break;

      case 'game_over':
        this.handleGameOver(msg.finalResults);
        break;

      case 'error':
        this.lastError = msg.code;
        break;

      case 'player_progress':
        this.players = this.players.map((p) =>
          p.id === msg.playerId ? { ...p, filledCount: msg.filledCount } : p
        );
        break;

      case 'config_updated':
        this.config = msg.config;
        break;

      case 'host_changed':
        this.hostId = msg.newHostId;
        this.players = this.players.map((p) => ({
          ...p,
          isHost: p.id === msg.newHostId
        }));
        break;

      case 'player_kicked':
        this.players = this.players.filter((p) => p.id !== msg.playerId);
        if (msg.playerId === playerState.id) {
          this.leaveRoom();
        }
        break;

      case 'timer_update':
        this.handleTimerUpdate(msg);
        break;
    }
  }

  private handleRoomState(state: PublicRoomState): void {
    this.roomId = state.roomId;
    this.hostId = state.hostId;
    this.config = state.config;
    this.phase = state.phase;
    this.players = state.players;
    this.currentRound = state.currentRound;
    this.totalRounds = state.totalRounds;
    this.currentLetter = state.currentLetter;
    this.usedLetters = state.usedLetters;
    this.roundStartedAt = state.roundStartedAt;
    this.bastaCalledBy = state.bastaCalledBy;

    // Set player ID from the joined player
    const me = state.players.find((p) => p.name === playerState.name);
    if (me) {
      playerState.setId(me.id);
    }
  }

  private handleRoundStarted(msg: { round: number; letter: string; totalRounds: number }): void {
    this.phase = 'playing';
    this.currentRound = msg.round;
    this.currentLetter = msg.letter;
    this.totalRounds = msg.totalRounds;
    this.roundStartedAt = Date.now();
    this.localAnswers = {};
    this.submittedAnswers = false;
    this.bastaCalledBy = null;
    this.bastaCalledByName = null;
    this.localVotes = {};
    this.countdownRemaining = null;

    // Play round start sound
    playSound('roundStart');

    // Start round timer if configured
    if (this.config.roundTimeLimit > 0) {
      this.roundTimeRemaining = this.config.roundTimeLimit;
      this.startRoundTimer();
    }
  }

  private handleBastaCalled(msg: {
    playerId: string;
    playerName: string;
    graceTime: number;
  }): void {
    this.phase = 'basta_called';
    this.bastaCalledBy = msg.playerId;
    this.bastaCalledByName = msg.playerName;
    this.stopTimer();

    playSound('basta');
    vibrate([100, 50, 100]);

    if (msg.graceTime > 0) {
      this.graceTimeRemaining = msg.graceTime;
      this.startGraceTimer();
    }
  }

  private handleVotingStarted(msg: { answers: AllPlayerAnswers; timeLimit: number }): void {
    this.phase = 'voting';
    this.allAnswers = msg.answers;
    this.votingTimeLimit = msg.timeLimit;
    this.votingTimeRemaining = msg.timeLimit > 0 ? msg.timeLimit : null;
    this.votingResults = null;
    this.localVotes = {};
    this.reactions = {};
    this.graceTimeRemaining = null;
    this.votingReadyPlayers = new Set();
    this.isVotingReady = false;

    // Play voting start sound
    playSound('votingStart');

    // Only start timer if there's a time limit
    if (msg.timeLimit > 0) {
      this.startVotingTimer();
    }
  }

  private handleRoundResults(results: RoundResults): void {
    this.phase = 'results';
    this.roundResults = results;

    // Update player scores
    for (const score of results.playerScores) {
      this.players = this.players.map((p) =>
        p.id === score.playerId ? { ...p, score: score.totalScore } : p
      );
    }

    playSound('results');
  }

  private handleGameOver(results: FinalResults): void {
    this.phase = 'game_over';
    this.finalResults = results;
    this.stopTimer();

    playSound('gameOver');
    vibrate([100, 50, 100, 50, 200]);
  }

  private handleTimerUpdate(msg: {
    timerType: 'round' | 'voting' | 'between_rounds';
    remaining: number;
  }): void {
    switch (msg.timerType) {
      case 'round':
        this.roundTimeRemaining = msg.remaining;
        break;
      case 'voting':
        this.votingTimeRemaining = msg.remaining;
        break;
      case 'between_rounds':
        this.betweenRoundsTimeRemaining = msg.remaining;
        break;
    }
  }

  private startCountdown(duration: number): void {
    this.stopTimer();
    this.countdownRemaining = Math.ceil(duration / 1000);

    this.timerInterval = setInterval(() => {
      if (this.countdownRemaining !== null && this.countdownRemaining > 0) {
        this.countdownRemaining--;
        if (this.countdownRemaining <= 3 && this.countdownRemaining > 0) {
          playSound('countdown');
        }
      }
    }, 1000);
  }

  private startRoundTimer(): void {
    this.stopTimer();

    this.timerInterval = setInterval(() => {
      if (this.roundTimeRemaining !== null && this.roundTimeRemaining > 0) {
        this.roundTimeRemaining--;

        // Play warning sounds for low time
        if (this.roundTimeRemaining <= 5 && this.roundTimeRemaining > 0) {
          playSound('tick');
        } else if (this.roundTimeRemaining === 10) {
          playSound('timeWarning');
        }
      }
    }, 1000);
  }

  private startGraceTimer(): void {
    this.stopTimer();

    this.timerInterval = setInterval(() => {
      if (this.graceTimeRemaining !== null && this.graceTimeRemaining > 0) {
        this.graceTimeRemaining--;

        // Play tick sounds for grace period countdown
        if (this.graceTimeRemaining > 0) {
          playSound('tick');
        }
      }
    }, 1000);
  }

  private startVotingTimer(): void {
    this.stopTimer();

    this.timerInterval = setInterval(() => {
      if (this.votingTimeRemaining !== null && this.votingTimeRemaining > 0) {
        this.votingTimeRemaining--;

        // Play warning sounds for low time
        if (this.votingTimeRemaining <= 5 && this.votingTimeRemaining > 0) {
          playSound('tick');
        } else if (this.votingTimeRemaining === 10) {
          playSound('timeWarning');
        }
      }
    }, 1000);
  }

  private startBetweenRoundsTimer(): void {
    this.stopTimer();

    this.timerInterval = setInterval(() => {
      if (this.betweenRoundsTimeRemaining !== null && this.betweenRoundsTimeRemaining > 0) {
        this.betweenRoundsTimeRemaining--;
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private resetState(): void {
    this.stopTimer();
    this.phase = 'lobby';
    this.players = [];
    this.hostId = null;
    this.currentRound = 0;
    this.totalRounds = 0;
    this.currentLetter = null;
    this.usedLetters = [];
    this.roundStartedAt = null;
    this.bastaCalledBy = null;
    this.bastaCalledByName = null;
    this.localAnswers = {};
    this.submittedAnswers = false;
    this.allAnswers = null;
    this.votingResults = null;
    this.localVotes = {};
    this.reactions = {};
    this.votingReadyPlayers = new Set();
    this.isVotingReady = false;
    this.roundResults = null;
    this.finalResults = null;
    this.lastError = null;
    this.countdownRemaining = null;
    this.roundTimeRemaining = null;
    this.votingTimeRemaining = null;
    this.betweenRoundsTimeRemaining = null;
    this.graceTimeRemaining = null;
    playerState.reset();
  }
}

export const gameState = new GameStore();
