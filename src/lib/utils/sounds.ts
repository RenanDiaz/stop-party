/**
 * Sound system using Web Audio API for programmatic sound generation
 * No external audio files required - sounds are synthesized in real-time
 */

export type SoundName =
  | 'countdown' // Countdown tick (3, 2, 1)
  | 'roundStart' // Letter reveal / round begins
  | 'basta' // Basta called - alarm
  | 'timeWarning' // Timer low warning
  | 'vote' // Vote cast confirmation
  | 'votingStart' // Voting phase begins
  | 'results' // Results fanfare
  | 'gameOver' // Game over / winner
  | 'click' // UI click
  | 'error' // Error / invalid action
  | 'ready' // Player ready toggle
  | 'tick' // Timer tick (final seconds)
  | 'message'; // New comment/message received

let audioContext: AudioContext | null = null;
let soundsEnabled = true;
let masterVolume = 0.5;

/**
 * Initialize sounds system
 */
export function initSounds(): void {
  if (typeof window === 'undefined') return;

  // Load enabled state from localStorage
  const stored = localStorage.getItem('stopparty_sounds');
  soundsEnabled = stored !== 'false';

  const volumeStored = localStorage.getItem('stopparty_volume');
  if (volumeStored) {
    masterVolume = parseFloat(volumeStored);
  }
}

/**
 * Get or create AudioContext (lazy initialization)
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch {
      return null;
    }
  }

  // Resume if suspended (browser autoplay policy)
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  return audioContext;
}

/**
 * Enable or disable sounds
 */
export function setSoundsEnabled(enabled: boolean): void {
  soundsEnabled = enabled;
  if (typeof window !== 'undefined') {
    localStorage.setItem('stopparty_sounds', enabled.toString());
  }
}

/**
 * Check if sounds are enabled
 */
export function areSoundsEnabled(): boolean {
  return soundsEnabled;
}

/**
 * Set master volume (0-1)
 */
export function setVolume(volume: number): void {
  masterVolume = Math.max(0, Math.min(1, volume));
  if (typeof window !== 'undefined') {
    localStorage.setItem('stopparty_volume', masterVolume.toString());
  }
}

/**
 * Get master volume
 */
export function getVolume(): number {
  return masterVolume;
}

/**
 * Create a gain node with master volume
 */
function createGain(ctx: AudioContext, volume: number = 1): GainNode {
  const gain = ctx.createGain();
  gain.gain.value = volume * masterVolume;
  gain.connect(ctx.destination);
  return gain;
}

/**
 * Play an oscillator for a duration
 */
function playTone(
  ctx: AudioContext,
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.3,
  startTime: number = 0
): void {
  const osc = ctx.createOscillator();
  const gain = createGain(ctx, volume);

  osc.type = type;
  osc.frequency.value = frequency;
  osc.connect(gain);

  const now = ctx.currentTime + startTime;
  gain.gain.setValueAtTime(volume * masterVolume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc.start(now);
  osc.stop(now + duration);
}

/**
 * Play a beep with frequency sweep
 */
function playSweep(
  ctx: AudioContext,
  startFreq: number,
  endFreq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.3
): void {
  const osc = ctx.createOscillator();
  const gain = createGain(ctx, volume);

  osc.type = type;
  osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + duration);
  osc.connect(gain);

  gain.gain.setValueAtTime(volume * masterVolume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.start();
  osc.stop(ctx.currentTime + duration);
}

/**
 * Play noise burst (for percussive sounds)
 */
function playNoise(ctx: AudioContext, duration: number, volume: number = 0.1): void {
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const gain = createGain(ctx, volume);
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 1000;

  noise.connect(filter);
  filter.connect(gain);

  gain.gain.setValueAtTime(volume * masterVolume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  noise.start();
  noise.stop(ctx.currentTime + duration);
}

// Sound generators for each sound type
const soundGenerators: Record<SoundName, (ctx: AudioContext) => void> = {
  // Countdown tick - ascending tone
  countdown: (ctx) => {
    playTone(ctx, 880, 0.15, 'sine', 0.4);
  },

  // Round start - triumphant ascending notes
  roundStart: (ctx) => {
    playTone(ctx, 523, 0.12, 'triangle', 0.35, 0);
    playTone(ctx, 659, 0.12, 'triangle', 0.35, 0.1);
    playTone(ctx, 784, 0.2, 'triangle', 0.4, 0.2);
  },

  // Basta! - alarm sound
  basta: (ctx) => {
    // Two-tone alarm
    for (let i = 0; i < 3; i++) {
      playTone(ctx, 800, 0.08, 'square', 0.25, i * 0.15);
      playTone(ctx, 600, 0.08, 'square', 0.25, i * 0.15 + 0.08);
    }
  },

  // Time warning - urgent beeps
  timeWarning: (ctx) => {
    playTone(ctx, 600, 0.1, 'triangle', 0.35);
    playNoise(ctx, 0.05, 0.1);
  },

  // Vote cast confirmation - soft click
  vote: (ctx) => {
    playTone(ctx, 1200, 0.05, 'sine', 0.2);
    playTone(ctx, 1800, 0.08, 'sine', 0.15, 0.03);
  },

  // Voting starts - transition sound
  votingStart: (ctx) => {
    playSweep(ctx, 400, 800, 0.2, 'triangle', 0.3);
  },

  // Results - fanfare
  results: (ctx) => {
    // C major arpeggio
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      playTone(ctx, freq, 0.2, 'triangle', 0.3, i * 0.1);
    });
  },

  // Game over - victory fanfare
  gameOver: (ctx) => {
    // Extended victory jingle
    const melody = [
      { freq: 523, dur: 0.1 },
      { freq: 659, dur: 0.1 },
      { freq: 784, dur: 0.1 },
      { freq: 1047, dur: 0.3 }
    ];
    let time = 0;
    melody.forEach(({ freq, dur }) => {
      playTone(ctx, freq, dur, 'triangle', 0.35, time);
      time += dur * 0.8;
    });
    // Add shimmer
    playTone(ctx, 1568, 0.4, 'sine', 0.15, 0.3);
  },

  // UI click
  click: (ctx) => {
    playTone(ctx, 1000, 0.03, 'sine', 0.15);
  },

  // Error sound
  error: (ctx) => {
    playTone(ctx, 200, 0.15, 'sawtooth', 0.2);
    playTone(ctx, 150, 0.2, 'sawtooth', 0.15, 0.1);
  },

  // Ready toggle
  ready: (ctx) => {
    playTone(ctx, 660, 0.08, 'triangle', 0.25);
    playTone(ctx, 880, 0.1, 'triangle', 0.25, 0.06);
  },

  // Timer tick (final seconds)
  tick: (ctx) => {
    playTone(ctx, 440, 0.05, 'sine', 0.2);
  },

  // New message/comment notification
  message: (ctx) => {
    playTone(ctx, 800, 0.08, 'sine', 0.2);
    playTone(ctx, 1000, 0.1, 'sine', 0.15, 0.06);
  }
};

/**
 * Play a sound effect
 */
export function playSound(name: SoundName): void {
  if (!soundsEnabled) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const generator = soundGenerators[name];
  if (generator) {
    try {
      generator(ctx);
    } catch {
      // Ignore sound errors
    }
  }
}

/**
 * Vibrate device (if supported)
 */
export function vibrate(pattern: number | number[]): void {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

/**
 * Preload audio context on user interaction
 * Call this on first user interaction to ensure sounds work
 */
export function preloadAudio(): void {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume();
  }
}
