import type {
  GamePhase,
  RoomConfig,
  Player,
  PlayerAnswers,
  Vote
} from '../shared/types';

// Internal room state (server-side only)
export interface RoomState {
  roomId: string;
  hostId: string;
  config: RoomConfig;
  phase: GamePhase;
  players: Map<string, Player>;
  currentRound: number;
  currentLetter: string | null;
  usedLetters: string[];
  letterPool: string[];
  roundStartedAt: number | null;
  bastaCalledBy: string | null;
  bastaCalledAt: number | null;
  answers: Map<string, PlayerAnswers>;
  votes: Map<string, Map<string, Vote[]>>; // category -> playerId -> votes
  votingStartedAt: number | null;
  readyCheckStartedAt: number | null;
  votingReadyPlayers: Set<string>; // Players who finished voting and are ready
  processingBasta: boolean; // Lock to prevent race conditions
}

// Timer references
export interface Timers {
  roundTimer: ReturnType<typeof setTimeout> | null;
  graceTimer: ReturnType<typeof setTimeout> | null;
  votingTimer: ReturnType<typeof setTimeout> | null;
  readyCheckTimer: ReturnType<typeof setTimeout> | null;
  countdownTimer: ReturnType<typeof setTimeout> | null;
}

// Connection info
export interface ConnectionInfo {
  playerId: string;
  deviceId: string;
}
