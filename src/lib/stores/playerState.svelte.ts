import { getDeviceId, getSavedPlayerName, savePlayerName } from '$lib/utils/deviceId';

class PlayerStore {
  deviceId = $state('');
  name = $state('');
  id = $state<string | null>(null);

  constructor() {
    if (typeof window !== 'undefined') {
      this.deviceId = getDeviceId();
      this.name = getSavedPlayerName() ?? '';
    }
  }

  setName(name: string): void {
    this.name = name;
    savePlayerName(name);
  }

  setId(id: string): void {
    this.id = id;
  }

  reset(): void {
    this.id = null;
  }
}

export const playerState = new PlayerStore();
