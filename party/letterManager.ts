import { LETTER_WEIGHTS, ALL_LETTERS } from '../shared/constants';

/**
 * Create initial letter pool with weighted probabilities
 */
export function createLetterPool(): string[] {
  const pool: string[] = [];

  for (const letter of ALL_LETTERS) {
    const weight = LETTER_WEIGHTS[letter];
    // Add letter multiple times based on weight
    for (let i = 0; i < weight; i++) {
      pool.push(letter);
    }
  }

  return shuffleArray(pool);
}

/**
 * Select a random letter from the pool and remove it
 */
export function selectLetter(pool: string[], usedLetters: string[]): { letter: string; newPool: string[] } | null {
  // Filter out already used letters
  const availablePool = pool.filter(l => !usedLetters.includes(l));

  if (availablePool.length === 0) {
    // All letters used, create a new pool without used letters
    const freshPool = createLetterPool().filter(l => !usedLetters.includes(l));
    if (freshPool.length === 0) {
      return null; // No more letters available
    }
    return selectFromPool(freshPool);
  }

  return selectFromPool(availablePool);
}

function selectFromPool(pool: string[]): { letter: string; newPool: string[] } {
  const randomIndex = Math.floor(Math.random() * pool.length);
  const letter = pool[randomIndex];

  // Remove all instances of the selected letter from the pool
  const newPool = pool.filter(l => l !== letter);

  return { letter, newPool };
}

/**
 * Fisher-Yates shuffle
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Check if an answer starts with the required letter
 */
export function answerStartsWithLetter(answer: string, letter: string): boolean {
  const normalizedAnswer = normalizeString(answer);
  const normalizedLetter = letter.toLowerCase();

  return normalizedAnswer.startsWith(normalizedLetter);
}

/**
 * Normalize string for comparison (lowercase, remove accents)
 */
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .trim();
}

/**
 * Check if two answers are considered duplicates
 */
export function areAnswersDuplicate(answer1: string, answer2: string): boolean {
  const normalized1 = normalizeString(answer1);
  const normalized2 = normalizeString(answer2);

  return normalized1 === normalized2 && normalized1.length > 0;
}
