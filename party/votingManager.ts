import type { Vote, AnswerVotingResult, VotingResults, AllPlayerAnswers } from '../shared/types';
import type { RoomState } from './types';
import { answerStartsWithLetter, normalizeString } from './letterManager';

/**
 * Initialize voting for a round
 */
export function initializeVoting(state: RoomState): void {
  state.votes = new Map();
  state.votingStartedAt = Date.now();

  // Initialize votes map for each category and player
  for (const category of state.config.categories) {
    const categoryVotes = new Map<string, Vote[]>();
    for (const [playerId] of state.players) {
      categoryVotes.set(playerId, []);
    }
    state.votes.set(category, categoryVotes);
  }
}

/**
 * Record a vote
 */
export function recordVote(
  state: RoomState,
  voterId: string,
  category: string,
  targetPlayerId: string,
  isValid: boolean
): boolean {
  const categoryVotes = state.votes.get(category);
  if (!categoryVotes) return false;

  const playerVotes = categoryVotes.get(targetPlayerId);
  if (!playerVotes) return false;

  // Check if already voted
  if (playerVotes.some(v => v.voterId === voterId)) {
    return false;
  }

  // Can't vote on own answer
  if (voterId === targetPlayerId) {
    return false;
  }

  playerVotes.push({ voterId, isValid });
  return true;
}

/**
 * Get vote count for a specific answer
 */
export function getVoteCount(
  state: RoomState,
  category: string,
  targetPlayerId: string
): { validVotes: number; invalidVotes: number; totalVoters: number } {
  const categoryVotes = state.votes.get(category);
  if (!categoryVotes) {
    return { validVotes: 0, invalidVotes: 0, totalVoters: 0 };
  }

  const playerVotes = categoryVotes.get(targetPlayerId) ?? [];
  const validVotes = playerVotes.filter(v => v.isValid).length;
  const invalidVotes = playerVotes.filter(v => !v.isValid).length;

  // Total voters = all connected players except the target
  const totalVoters = Array.from(state.players.values())
    .filter(p => p.isConnected && p.id !== targetPlayerId)
    .length;

  return { validVotes, invalidVotes, totalVoters };
}

/**
 * Calculate voting results for all categories
 */
export function calculateVotingResults(state: RoomState): VotingResults {
  const results: VotingResults = {};
  const currentLetter = state.currentLetter ?? '';

  for (const category of state.config.categories) {
    results[category] = [];
    const categoryVotes = state.votes.get(category);

    for (const [playerId, player] of state.players) {
      if (!player.isConnected) continue;

      const playerAnswers = state.answers.get(playerId);
      const answer = playerAnswers?.answers[category] ?? '';
      const votes = categoryVotes?.get(playerId) ?? [];

      const validVotes = votes.filter(v => v.isValid).length;
      const invalidVotes = votes.filter(v => !v.isValid).length;

      // Calculate total eligible voters (all connected players except self)
      const totalVoters = Array.from(state.players.values())
        .filter(p => p.isConnected && p.id !== playerId)
        .length;

      // Auto-invalidate empty answers or answers not starting with letter
      let isValid = true;
      const needsTieBreaker = false;

      if (!answer || answer.trim() === '') {
        isValid = false;
      } else if (!answerStartsWithLetter(answer, currentLetter)) {
        isValid = false;
      } else if (totalVoters > 0) {
        // Majority rule: >50% invalid votes means invalid
        // In case of tie, answer is considered VALID (benefit of the doubt)
        if (invalidVotes > totalVoters / 2) {
          isValid = false;
        }
        // Note: tie (invalidVotes === validVotes) results in isValid = true
      }

      results[category].push({
        playerId,
        playerName: player.name,
        answer,
        validVotes,
        invalidVotes,
        isValid,
        needsTieBreaker
      });
    }
  }

  return results;
}

/**
 * Apply tie-breaker decision from host
 */
export function applyTieBreaker(
  results: VotingResults,
  category: string,
  targetPlayerId: string,
  isValid: boolean
): void {
  const categoryResults = results[category];
  if (!categoryResults) return;

  const answerResult = categoryResults.find(r => r.playerId === targetPlayerId);
  if (answerResult && answerResult.needsTieBreaker) {
    answerResult.isValid = isValid;
    answerResult.needsTieBreaker = false;
    answerResult.tieBreakDecision = isValid;
  }
}

/**
 * Check if all voting is complete (including tie-breakers)
 */
export function isVotingComplete(results: VotingResults): boolean {
  for (const category in results) {
    for (const answer of results[category]) {
      if (answer.needsTieBreaker) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Get all player answers formatted for voting phase
 */
export function getAllAnswersForVoting(state: RoomState): AllPlayerAnswers {
  const allAnswers: AllPlayerAnswers = {};

  for (const [playerId, player] of state.players) {
    if (!player.isConnected) continue;

    const playerAnswers = state.answers.get(playerId);
    allAnswers[playerId] = {
      playerName: player.name,
      answers: playerAnswers?.answers ?? {}
    };
  }

  return allAnswers;
}

/**
 * Fill missing votes as "valid" (for timeout)
 */
export function fillMissingVotesAsValid(state: RoomState): void {
  for (const category of state.config.categories) {
    let categoryVotes = state.votes.get(category);
    if (!categoryVotes) {
      categoryVotes = new Map();
      state.votes.set(category, categoryVotes);
    }

    for (const [targetPlayerId, targetPlayer] of state.players) {
      if (!targetPlayer.isConnected) continue;

      // Ensure player has an entry in the votes map
      let playerVotes = categoryVotes.get(targetPlayerId);
      if (!playerVotes) {
        playerVotes = [];
        categoryVotes.set(targetPlayerId, playerVotes);
      }

      // Get voters who haven't voted
      for (const [voterId, voter] of state.players) {
        if (!voter.isConnected) continue;
        if (voterId === targetPlayerId) continue;

        const hasVoted = playerVotes.some(v => v.voterId === voterId);
        if (!hasVoted) {
          playerVotes.push({ voterId, isValid: true });
        }
      }
    }
  }
}
