type SoundName = 'basta' | 'countdown' | 'results' | 'vote' | 'error';

const soundCache = new Map<string, HTMLAudioElement>();
let soundsEnabled = true;

/**
 * Initialize sounds system
 */
export function initSounds(): void {
  if (typeof window === 'undefined') return;

  // Load enabled state from localStorage
  const stored = localStorage.getItem('stopparty_sounds');
  soundsEnabled = stored !== 'false';
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
 * Play a sound effect
 */
export function playSound(name: SoundName): void {
  if (!soundsEnabled) return;
  if (typeof window === 'undefined') return;

  try {
    let audio = soundCache.get(name);

    if (!audio) {
      audio = new Audio(`/sounds/${name}.mp3`);
      audio.volume = 0.5;
      soundCache.set(name, audio);
    }

    // Reset and play
    audio.currentTime = 0;
    audio.play().catch(() => {
      // Ignore autoplay errors
    });
  } catch {
    // Ignore sound errors
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
