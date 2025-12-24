<script lang="ts">
  import { _ } from '$lib/stores/i18n';
  import { goto } from '$app/navigation';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import { playerState } from '$lib/stores/playerState.svelte';
  import { validatePlayerName } from '$lib/utils/validation';
  import { ROOM_CODE_LENGTH, ROOM_CODE_CHARS } from '$shared/constants';

  let playerName = $state(playerState.name);
  let error = $state<string | null>(null);
  let loading = $state(false);

  function generateRoomCode(): string {
    let code = '';
    for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
      code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
    }
    return code;
  }

  function handleCreate() {
    const validation = validatePlayerName(playerName);
    if (!validation.valid) {
      error = validation.error ?? null;
      return;
    }

    loading = true;
    playerState.setName(playerName.trim());
    const roomCode = generateRoomCode();
    goto(`/room/${roomCode}`);
  }
</script>

<div class="space-y-4">
  <Input
    bind:value={playerName}
    placeholder={$_('home.enter_name')}
    maxlength={20}
    error={error ? $_(error) : null}
    onkeydown={(e) => {
      if (e.key === 'Enter') handleCreate();
    }}
  />

  <Button variant="primary" fullWidth {loading} onclick={handleCreate}>
    {$_('home.create_room')}
  </Button>
</div>
