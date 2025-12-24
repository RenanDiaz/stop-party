import type { Timers } from './types';

/**
 * Create timer manager
 */
export function createTimers(): Timers {
  return {
    roundTimer: null,
    graceTimer: null,
    votingTimer: null,
    readyCheckTimer: null,
    countdownTimer: null
  };
}

/**
 * Clear a specific timer
 */
export function clearTimer(timers: Timers, timerName: keyof Timers): void {
  const timer = timers[timerName];
  if (timer) {
    clearTimeout(timer);
    timers[timerName] = null;
  }
}

/**
 * Clear all timers
 */
export function clearAllTimers(timers: Timers): void {
  clearTimer(timers, 'roundTimer');
  clearTimer(timers, 'graceTimer');
  clearTimer(timers, 'votingTimer');
  clearTimer(timers, 'readyCheckTimer');
  clearTimer(timers, 'countdownTimer');
}

/**
 * Set round timer
 */
export function setRoundTimer(
  timers: Timers,
  durationMs: number,
  callback: () => void
): void {
  clearTimer(timers, 'roundTimer');
  timers.roundTimer = setTimeout(callback, durationMs);
}

/**
 * Set grace timer (after basta is called)
 */
export function setGraceTimer(
  timers: Timers,
  durationMs: number,
  callback: () => void
): void {
  clearTimer(timers, 'graceTimer');
  timers.graceTimer = setTimeout(callback, durationMs);
}

/**
 * Set voting timer
 */
export function setVotingTimer(
  timers: Timers,
  durationMs: number,
  callback: () => void
): void {
  clearTimer(timers, 'votingTimer');
  timers.votingTimer = setTimeout(callback, durationMs);
}

/**
 * Set ready check timer (between rounds)
 */
export function setReadyCheckTimer(
  timers: Timers,
  durationMs: number,
  callback: () => void
): void {
  clearTimer(timers, 'readyCheckTimer');
  timers.readyCheckTimer = setTimeout(callback, durationMs);
}

/**
 * Set countdown timer
 */
export function setCountdownTimer(
  timers: Timers,
  durationMs: number,
  callback: () => void
): void {
  clearTimer(timers, 'countdownTimer');
  timers.countdownTimer = setTimeout(callback, durationMs);
}
