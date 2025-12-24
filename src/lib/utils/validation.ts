/**
 * Normalize string for comparison (lowercase, remove accents)
 */
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
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
 * Validate player name
 */
export function validatePlayerName(name: string): {
  valid: boolean;
  error?: string;
} {
  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return { valid: false, error: 'errors.name_too_short' };
  }

  if (trimmed.length > 20) {
    return { valid: false, error: 'errors.name_too_long' };
  }

  return { valid: true };
}

/**
 * Validate room code format
 */
export function validateRoomCode(code: string): boolean {
  const cleaned = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return cleaned.length >= 4 && cleaned.length <= 10;
}

/**
 * Clean room code (remove invalid characters, uppercase)
 */
export function cleanRoomCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '');
}
