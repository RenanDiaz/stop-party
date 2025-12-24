import { SCORE_UNIQUE, SCORE_DUPLICATE, SCORE_INVALID } from '$shared/constants';

export { SCORE_UNIQUE, SCORE_DUPLICATE, SCORE_INVALID };

/**
 * Get score display with color class
 */
export function getScoreDisplay(score: number): {
  score: number;
  colorClass: string;
  label: string;
} {
  if (score === SCORE_UNIQUE) {
    return {
      score,
      colorClass: 'text-success',
      label: 'scoring.unique'
    };
  }

  if (score === SCORE_DUPLICATE) {
    return {
      score,
      colorClass: 'text-warning',
      label: 'scoring.duplicate'
    };
  }

  return {
    score,
    colorClass: 'text-error',
    label: 'scoring.invalid'
  };
}

/**
 * Format score with sign
 */
export function formatScore(score: number): string {
  if (score > 0) {
    return `+${score}`;
  }
  return score.toString();
}

/**
 * Get ranking suffix (1st, 2nd, 3rd, etc.)
 */
export function getRankingSuffix(rank: number, locale: string): string {
  if (locale.startsWith('es')) {
    return `${rank}º`;
  }

  // English
  const lastDigit = rank % 10;
  const lastTwoDigits = rank % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return `${rank}th`;
  }

  switch (lastDigit) {
    case 1:
      return `${rank}st`;
    case 2:
      return `${rank}nd`;
    case 3:
      return `${rank}rd`;
    default:
      return `${rank}th`;
  }
}
