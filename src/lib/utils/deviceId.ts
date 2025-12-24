const DEVICE_ID_KEY = 'stopparty_device_id';

/**
 * Generate a unique device ID
 */
function generateDeviceId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${randomPart}`;
}

/**
 * Get or create a persistent device ID
 */
export function getDeviceId(): string {
  if (typeof window === 'undefined') {
    return generateDeviceId();
  }

  let deviceId = localStorage.getItem(DEVICE_ID_KEY);

  if (!deviceId) {
    deviceId = generateDeviceId();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }

  return deviceId;
}

/**
 * Get saved player name if any
 */
export function getSavedPlayerName(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem('stopparty_player_name');
}

/**
 * Save player name for next session
 */
export function savePlayerName(name: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('stopparty_player_name', name);
}
