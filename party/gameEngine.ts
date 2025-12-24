import type {
  RoomConfig,
  Player,
  PublicPlayer,
  PublicRoomState,
  PlayerRoundScore,
  RoundResults,
  FinalResults
} from '../shared/types';
import type { RoomState } from './types';
import { DEFAULT_CONFIG, SCORE_UNIQUE, SCORE_DUPLICATE, SCORE_INVALID } from '../shared/constants';
import { getDefaultCategories } from '../shared/categories';
import { createLetterPool, normalizeString, areAnswersDuplicate, answerStartsWithLetter } from './letterManager';
import type { VotingResults } from '../shared/types';

/**
 * Create initial room state
 */
export function createRoomState(roomId: string): RoomState {
  return {
    roomId,
    hostId: '',
    config: {
      ...DEFAULT_CONFIG,
      categories: getDefaultCategories()
    },
    phase: 'lobby',
    players: new Map(),
    currentRound: 0,
    currentLetter: null,
    usedLetters: [],
    letterPool: createLetterPool(),
    roundStartedAt: null,
    bastaCalledBy: null,
    bastaCalledAt: null,
    answers: new Map(),
    votes: new Map(),
    votingStartedAt: null,
    readyCheckStartedAt: null
  };
}

/**
 * Add a player to the room
 */
export function addPlayer(
  state: RoomState,
  id: string,
  deviceId: string,
  name: string
): Player {
  const isFirst = state.players.size === 0;

  const player: Player = {
    id,
    deviceId,
    name,
    score: 0,
    isHost: isFirst,
    isReady: false,
    isConnected: true,
    lastConnectedAt: Date.now(),
    filledCount: 0
  };

  state.players.set(id, player);

  if (isFirst) {
    state.hostId = id;
  }

  return player;
}

/**
 * Remove a player from the room
 */
export function removePlayer(state: RoomState, playerId: string): boolean {
  const player = state.players.get(playerId);
  if (!player) return false;

  state.players.delete(playerId);
  state.answers.delete(playerId);

  // Transfer host if needed
  if (player.isHost && state.players.size > 0) {
    const newHost = Array.from(state.players.values()).find(p => p.isConnected);
    if (newHost) {
      newHost.isHost = true;
      state.hostId = newHost.id;
    }
  }

  return true;
}

/**
 * Mark player as disconnected (for reconnection)
 */
export function disconnectPlayer(state: RoomState, playerId: string): void {
  const player = state.players.get(playerId);
  if (player) {
    player.isConnected = false;
    player.lastConnectedAt = Date.now();
  }
}

/**
 * Reconnect a player by device ID
 */
export function reconnectPlayer(state: RoomState, deviceId: string, newConnectionId: string): Player | null {
  for (const [oldId, player] of state.players) {
    if (player.deviceId === deviceId && !player.isConnected) {
      // Update player with new connection ID
      state.players.delete(oldId);
      player.id = newConnectionId;
      player.isConnected = true;
      player.lastConnectedAt = Date.now();
      state.players.set(newConnectionId, player);

      // Update host reference if needed
      if (player.isHost) {
        state.hostId = newConnectionId;
      }

      // Transfer answers to new ID
      const answers = state.answers.get(oldId);
      if (answers) {
        state.answers.delete(oldId);
        answers.playerId = newConnectionId;
        state.answers.set(newConnectionId, answers);
      }

      return player;
    }
  }
  return null;
}

/**
 * Convert internal player to public player (hide deviceId)
 */
export function toPublicPlayer(player: Player): PublicPlayer {
  return {
    id: player.id,
    name: player.name,
    score: player.score,
    isHost: player.isHost,
    isReady: player.isReady,
    isConnected: player.isConnected,
    filledCount: player.filledCount
  };
}

/**
 * Get public room state
 */
export function getPublicRoomState(state: RoomState): PublicRoomState {
  const players = Array.from(state.players.values()).map(toPublicPlayer);

  let totalRounds = 0;
  if (state.config.victoryMode === 'rounds') {
    totalRounds = state.config.victoryValue;
  }

  return {
    roomId: state.roomId,
    hostId: state.hostId,
    config: state.config,
    phase: state.phase,
    players,
    currentRound: state.currentRound,
    totalRounds,
    currentLetter: state.currentLetter,
    usedLetters: state.usedLetters,
    roundStartedAt: state.roundStartedAt,
    bastaCalledBy: state.bastaCalledBy,
    bastaCalledAt: state.bastaCalledAt,
    roundTimeRemaining: null,
    votingTimeRemaining: null
  };
}

/**
 * Update room config
 */
export function updateConfig(state: RoomState, partialConfig: Partial<RoomConfig>): void {
  state.config = { ...state.config, ...partialConfig };
}

/**
 * Initialize a new round
 */
export function initializeRound(state: RoomState, letter: string): void {
  state.currentLetter = letter;
  state.usedLetters.push(letter);
  state.currentRound += 1;
  state.roundStartedAt = Date.now();
  state.bastaCalledBy = null;
  state.bastaCalledAt = null;
  state.answers = new Map();
  state.votes = new Map();

  // Reset player ready state and filled count
  for (const player of state.players.values()) {
    player.isReady = false;
    player.filledCount = 0;
  }
}

/**
 * Submit answers for a player
 */
export function submitAnswers(
  state: RoomState,
  playerId: string,
  answers: Record<string, string>
): void {
  state.answers.set(playerId, {
    playerId,
    answers,
    submittedAt: Date.now()
  });
}

/**
 * Update filled count for a player
 */
export function updateFilledCount(state: RoomState, playerId: string, count: number): void {
  const player = state.players.get(playerId);
  if (player) {
    player.filledCount = count;
  }
}

/**
 * Calculate scores after voting
 */
export function calculateScores(state: RoomState, votingResults: VotingResults): RoundResults {
  const playerScores: PlayerRoundScore[] = [];
  const duplicateAnswers: Record<string, string[]> = {};
  const currentLetter = state.currentLetter ?? '';

  // First, find all duplicate answers for each category
  for (const category of state.config.categories) {
    const answerGroups = new Map<string, string[]>(); // normalizedAnswer -> playerIds

    for (const [playerId, playerAnswers] of state.answers) {
      const answer = playerAnswers.answers[category] ?? '';
      if (answer.trim() === '') continue;
      if (!answerStartsWithLetter(answer, currentLetter)) continue;

      const normalized = normalizeString(answer);
      const existing = answerGroups.get(normalized) ?? [];
      existing.push(playerId);
      answerGroups.set(normalized, existing);
    }

    // Find duplicates (more than one player with same answer)
    const dupes: string[] = [];
    for (const [normalized, playerIds] of answerGroups) {
      if (playerIds.length > 1) {
        dupes.push(normalized);
      }
    }
    if (dupes.length > 0) {
      duplicateAnswers[category] = dupes;
    }
  }

  // Calculate score for each player
  for (const [playerId, player] of state.players) {
    if (!player.isConnected) continue;

    const categoryScores: Record<string, number> = {};
    let roundTotal = 0;

    for (const category of state.config.categories) {
      const playerAnswers = state.answers.get(playerId);
      const answer = playerAnswers?.answers[category] ?? '';

      // Check voting results
      const categoryResults = votingResults[category] ?? [];
      const answerResult = categoryResults.find(r => r.playerId === playerId);

      let score = SCORE_INVALID;

      if (answerResult?.isValid && answer.trim() !== '') {
        // Check if answer is duplicate
        const normalized = normalizeString(answer);
        const isDuplicate = duplicateAnswers[category]?.includes(normalized) ?? false;

        score = isDuplicate ? SCORE_DUPLICATE : SCORE_UNIQUE;
      }

      categoryScores[category] = score;
      roundTotal += score;
    }

    player.score += roundTotal;

    playerScores.push({
      playerId,
      playerName: player.name,
      categoryScores,
      roundTotal,
      totalScore: player.score
    });
  }

  // Sort by round total (descending)
  playerScores.sort((a, b) => b.roundTotal - a.roundTotal);

  return {
    round: state.currentRound,
    letter: currentLetter,
    playerScores,
    duplicateAnswers
  };
}

/**
 * Check if game should end
 */
export function shouldGameEnd(state: RoomState): boolean {
  if (state.config.victoryMode === 'rounds') {
    return state.currentRound >= state.config.victoryValue;
  }

  // Points mode: check if any player reached target
  for (const player of state.players.values()) {
    if (player.score >= state.config.victoryValue) {
      return true;
    }
  }

  return false;
}

/**
 * Calculate final results
 */
export function calculateFinalResults(state: RoomState): FinalResults {
  const connectedPlayers = Array.from(state.players.values())
    .filter(p => p.isConnected)
    .sort((a, b) => b.score - a.score);

  const winner = connectedPlayers[0];

  const rankings = connectedPlayers.map((player, index) => ({
    rank: index + 1,
    player: toPublicPlayer(player),
    totalScore: player.score
  }));

  return {
    winner: toPublicPlayer(winner),
    rankings,
    totalRounds: state.currentRound
  };
}

/**
 * Reset for new round (during ready check)
 */
export function prepareForNewRound(state: RoomState): void {
  for (const player of state.players.values()) {
    player.isReady = false;
    player.filledCount = 0;
  }
  state.bastaCalledBy = null;
  state.bastaCalledAt = null;
}

/**
 * Check if all connected players are ready
 */
export function areAllPlayersReady(state: RoomState): boolean {
  for (const player of state.players.values()) {
    if (player.isConnected && !player.isReady) {
      return false;
    }
  }
  return true;
}

/**
 * Get connected player count
 */
export function getConnectedPlayerCount(state: RoomState): number {
  return Array.from(state.players.values()).filter(p => p.isConnected).length;
}

/**
 * Validate player name
 */
export function validatePlayerName(name: string): 'valid' | 'too_short' | 'too_long' {
  const trimmed = name.trim();
  if (trimmed.length < 2) return 'too_short';
  if (trimmed.length > 20) return 'too_long';
  return 'valid';
}

/**
 * Check if name is already taken
 */
export function isNameTaken(state: RoomState, name: string, excludePlayerId?: string): boolean {
  const normalizedName = normalizeString(name);
  for (const [playerId, player] of state.players) {
    if (excludePlayerId && playerId === excludePlayerId) continue;
    if (normalizeString(player.name) === normalizedName) {
      return true;
    }
  }
  return false;
}

/**
 * Transfer host to another player
 */
export function transferHost(state: RoomState, newHostId: string): boolean {
  const newHost = state.players.get(newHostId);
  if (!newHost || !newHost.isConnected) return false;

  // Remove host from current host
  const currentHost = state.players.get(state.hostId);
  if (currentHost) {
    currentHost.isHost = false;
  }

  // Set new host
  newHost.isHost = true;
  state.hostId = newHostId;

  return true;
}
