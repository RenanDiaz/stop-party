import type { RoomConfig } from './types';

// Letter weights for random selection (Spanish-optimized)
export const LETTER_WEIGHTS: Record<string, number> = {
  // High probability (common in Spanish)
  A: 10, E: 10, O: 10, S: 9, C: 9, P: 9, M: 9, T: 9, L: 8, R: 8,
  // Medium probability
  B: 6, D: 6, F: 6, G: 6, N: 6, H: 5, I: 5, U: 5, V: 5,
  // Low probability (difficult letters)
  J: 3, K: 2, Q: 2, W: 1, X: 1, Y: 2, Z: 2
};

// All available letters
export const ALL_LETTERS = Object.keys(LETTER_WEIGHTS);

// Scoring constants
export const SCORE_UNIQUE = 100;
export const SCORE_DUPLICATE = 50;
export const SCORE_INVALID = 0;
export const SCORE_EMPTY = 0;

// Room constraints
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 12;
export const MIN_CATEGORIES = 5;
export const MAX_CATEGORIES = 10;

// Reconnection timeout (5 minutes)
export const RECONNECT_TIMEOUT_MS = 5 * 60 * 1000;

// Default room configuration
export const DEFAULT_CONFIG: RoomConfig = {
  victoryMode: 'rounds',
  victoryValue: 10,
  graceTimeAfterBasta: 5,
  showOthersProgress: false,
  roundTimeLimit: 0,
  votingTimeLimit: 30,
  timeBetweenRounds: 0, // Wait for all ready
  maxPlayers: MAX_PLAYERS,
  categories: [],
  categoryPreset: 'classic'
};

// Victory options
export const VICTORY_OPTIONS = {
  rounds: [5, 10, 15],
  points: [500, 1000, 1500]
};

// Grace time options (seconds)
export const GRACE_TIME_OPTIONS = [0, 3, 5, 10];

// Round time limit options (seconds, 0 = no limit)
export const ROUND_TIME_OPTIONS = [0, 30, 60, 90, 120];

// Voting time limit options (seconds)
export const VOTING_TIME_OPTIONS = [15, 30, 45];

// Time between rounds options (seconds, 0 = wait for ready)
export const BETWEEN_ROUNDS_OPTIONS = [0, 10, 20, 30];

// Room code settings
export const ROOM_CODE_LENGTH = 6;
export const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No confusing chars (0, O, 1, I)

// Countdown duration before round starts
export const COUNTDOWN_DURATION_MS = 3000;
