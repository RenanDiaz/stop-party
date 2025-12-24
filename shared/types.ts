// Game phases
export type GamePhase =
  | 'lobby'
  | 'countdown'
  | 'playing'
  | 'basta_called'
  | 'voting'
  | 'results'
  | 'ready_check'
  | 'game_over';

// Victory mode
export type VictoryMode = 'rounds' | 'points';

// Room configuration
export interface RoomConfig {
  victoryMode: VictoryMode;
  victoryValue: number; // rounds (5, 10, 15) or points (500, 1000, 1500)
  graceTimeAfterBasta: number; // 0, 3, 5, 10 seconds
  showOthersProgress: boolean;
  roundTimeLimit: number; // 0 = no limit, or 30, 60, 90, 120 seconds
  votingTimeLimit: number; // 15, 30, 45 seconds
  timeBetweenRounds: number; // 0 = wait for ready, or 10, 20, 30 seconds
  maxPlayers: number;
  categories: string[];
  categoryPreset: string;
}

// Player state
export interface Player {
  id: string;
  deviceId: string;
  name: string;
  score: number;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  lastConnectedAt: number;
  filledCount: number; // Number of filled answers in current round
}

// Public player (sent to clients, without deviceId)
export interface PublicPlayer {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  filledCount: number;
}

// Player answers for a round
export interface PlayerAnswers {
  playerId: string;
  answers: Record<string, string>; // category -> answer
  submittedAt: number | null;
}

// Vote on an answer
export interface Vote {
  voterId: string;
  isValid: boolean;
}

// Votes for a category
export interface CategoryVotes {
  category: string;
  votes: Record<string, Vote[]>; // playerId -> votes received
}

// All player answers (for voting phase)
export interface AllPlayerAnswers {
  [playerId: string]: {
    playerName: string;
    answers: Record<string, string>;
  };
}

// Voting result for a single answer
export interface AnswerVotingResult {
  playerId: string;
  playerName: string;
  answer: string;
  validVotes: number;
  invalidVotes: number;
  isValid: boolean;
  needsTieBreaker: boolean;
  tieBreakDecision?: boolean;
}

// Voting results for all categories
export interface VotingResults {
  [category: string]: AnswerVotingResult[];
}

// Score breakdown for a player in a round
export interface PlayerRoundScore {
  playerId: string;
  playerName: string;
  categoryScores: Record<string, number>;
  roundTotal: number;
  totalScore: number;
}

// Round results
export interface RoundResults {
  round: number;
  letter: string;
  playerScores: PlayerRoundScore[];
  duplicateAnswers: Record<string, string[]>; // category -> list of duplicate answers
}

// Final game results
export interface FinalResults {
  winner: PublicPlayer;
  rankings: {
    rank: number;
    player: PublicPlayer;
    totalScore: number;
  }[];
  totalRounds: number;
}

// Public room state (sent to clients)
export interface PublicRoomState {
  roomId: string;
  hostId: string;
  config: RoomConfig;
  phase: GamePhase;
  players: PublicPlayer[];
  currentRound: number;
  totalRounds: number;
  currentLetter: string | null;
  usedLetters: string[];
  roundStartedAt: number | null;
  bastaCalledBy: string | null;
  bastaCalledAt: number | null;
  roundTimeRemaining: number | null;
  votingTimeRemaining: number | null;
}
