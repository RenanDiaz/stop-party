<script lang="ts">
  import { _ } from '$lib/stores/i18n';
  import { goto } from '$app/navigation';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import { playerState } from '$lib/stores/playerState.svelte';
  import { validatePlayerName, validateRoomCode, cleanRoomCode } from '$lib/utils/validation';

  let playerName = $state(playerState.name);
  let roomCode = $state('');
  let nameError = $state<string | null>(null);
  let codeError = $state<string | null>(null);
  let loading = $state(false);

  function handleJoin() {
    nameError = null;
    codeError = null;

    const nameValidation = validatePlayerName(playerName);
    if (!nameValidation.valid) {
      nameError = nameValidation.error ?? null;
      return;
    }

    const cleanedCode = cleanRoomCode(roomCode);
    if (!validateRoomCode(cleanedCode)) {
      codeError = 'errors.invalid_code';
      return;
    }

    loading = true;
    playerState.setName(playerName.trim());
    goto(`/room/${cleanedCode}`);
  }
</script>

<div class="space-y-4">
  <Input
    bind:value={playerName}
    placeholder={$_('home.enter_name')}
    maxlength={20}
    error={nameError ? $_(nameError) : null}
  />

  <Input
    bind:value={roomCode}
    placeholder={$_('home.enter_code')}
    maxlength={10}
    error={codeError ? $_(codeError) : null}
    onkeydown={(e) => {
      if (e.key === 'Enter') handleJoin();
    }}
  />

  <Button variant="secondary" fullWidth {loading} onclick={handleJoin}>
    {$_('home.join')}
  </Button>
</div>
