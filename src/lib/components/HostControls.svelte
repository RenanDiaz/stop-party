<script lang="ts">
  import { _ } from '$lib/stores/i18n';
  import type { PublicPlayer } from '$shared/types';
  import Button from '$lib/components/ui/Button.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';

  interface Props {
    players: PublicPlayer[];
    currentPlayerId: string | null;
    canStart: boolean;
    minPlayers: number;
    onStartGame: () => void;
    onKickPlayer: (playerId: string) => void;
    onTransferHost: (playerId: string) => void;
  }

  let {
    players,
    currentPlayerId,
    canStart,
    minPlayers,
    onStartGame,
    onKickPlayer,
    onTransferHost
  }: Props = $props();

  let showKickModal = $state(false);
  let showTransferModal = $state(false);
  let selectedPlayer = $state<PublicPlayer | null>(null);

  const otherPlayers = $derived(
    players.filter((p) => p.id !== currentPlayerId)
  );

  function confirmKick(player: PublicPlayer) {
    selectedPlayer = player;
    showKickModal = true;
  }

  function confirmTransfer(player: PublicPlayer) {
    selectedPlayer = player;
    showTransferModal = true;
  }

  function doKick() {
    if (selectedPlayer) {
      onKickPlayer(selectedPlayer.id);
      showKickModal = false;
      selectedPlayer = null;
    }
  }

  function doTransfer() {
    if (selectedPlayer) {
      onTransferHost(selectedPlayer.id);
      showTransferModal = false;
      selectedPlayer = null;
    }
  }
</script>

<div class="space-y-4">
  <!-- Start Game Button -->
  <Button
    variant="primary"
    fullWidth
    size="lg"
    disabled={!canStart}
    onclick={onStartGame}
  >
    {$_('lobby.start_game')}
  </Button>

  {#if !canStart}
    <p class="text-sm text-text-secondary text-center">
      {$_('lobby.min_players', { values: { min: minPlayers } })}
    </p>
  {/if}

  <!-- Player Management -->
  {#if otherPlayers.length > 0}
    <div class="card">
      <h4 class="text-sm font-medium text-text-secondary mb-3">Gestionar jugadores</h4>
      <div class="space-y-2">
        {#each otherPlayers as player}
          <div class="flex items-center justify-between">
            <span class="text-text-primary">{player.name}</span>
            <div class="flex gap-2">
              <button
                onclick={() => confirmTransfer(player)}
                class="text-xs px-2 py-1 text-text-secondary hover:text-accent-primary transition-colors"
              >
                {$_('host.transfer_host')}
              </button>
              <button
                onclick={() => confirmKick(player)}
                class="text-xs px-2 py-1 text-text-secondary hover:text-error transition-colors"
              >
                {$_('host.kick')}
              </button>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<!-- Kick Confirmation Modal -->
<Modal bind:open={showKickModal} title={$_('host.kick')}>
  <p class="text-text-primary">
    {$_('host.confirm_kick', { values: { name: selectedPlayer?.name ?? '' } })}
  </p>

  {#snippet footer()}
    <div class="flex gap-3 justify-end">
      <Button variant="ghost" onclick={() => (showKickModal = false)}>
        {$_('common.cancel')}
      </Button>
      <Button variant="danger" onclick={doKick}>
        {$_('host.kick')}
      </Button>
    </div>
  {/snippet}
</Modal>

<!-- Transfer Host Confirmation Modal -->
<Modal bind:open={showTransferModal} title={$_('host.transfer_host')}>
  <p class="text-text-primary">
    {$_('host.confirm_transfer', { values: { name: selectedPlayer?.name ?? '' } })}
  </p>

  {#snippet footer()}
    <div class="flex gap-3 justify-end">
      <Button variant="ghost" onclick={() => (showTransferModal = false)}>
        {$_('common.cancel')}
      </Button>
      <Button variant="primary" onclick={doTransfer}>
        {$_('common.confirm')}
      </Button>
    </div>
  {/snippet}
</Modal>
