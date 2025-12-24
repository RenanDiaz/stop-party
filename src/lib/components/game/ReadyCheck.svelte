<script lang="ts">
  import { _ } from '$lib/stores/i18n';
  import type { PublicPlayer } from '$shared/types';
  import Button from '$lib/components/ui/Button.svelte';
  import Timer from '$lib/components/ui/Timer.svelte';

  interface Props {
    players: PublicPlayer[];
    currentPlayerId: string | null;
    timeRemaining: number | null;
    onToggleReady: () => void;
  }

  let { players, currentPlayerId, timeRemaining, onToggleReady }: Props = $props();

  const me = $derived(players.find((p) => p.id === currentPlayerId));
  const readyCount = $derived(players.filter((p) => p.isReady).length);
</script>

<div class="text-center space-y-6">
  <div>
    <h2 class="text-2xl font-bold text-text-primary">{$_('game.get_ready')}</h2>
    {#if timeRemaining !== null}
      <Timer seconds={timeRemaining} size="lg" />
    {:else}
      <p class="text-text-secondary mt-2">{$_('results.waiting_ready')}</p>
    {/if}
  </div>

  <!-- Player Ready Status -->
  <div class="flex flex-wrap justify-center gap-3">
    {#each players as player}
      <div
        class="px-4 py-2 rounded-lg
               {player.isReady ? 'bg-success/20 text-success' : 'bg-bg-secondary text-text-secondary'}"
      >
        <span class="font-medium">{player.name}</span>
        {#if player.isReady}
          <span class="ml-2">✓</span>
        {/if}
      </div>
    {/each}
  </div>

  <p class="text-text-secondary">
    {readyCount}/{players.length} {$_('lobby.ready').toLowerCase()}
  </p>

  <Button
    variant={me?.isReady ? 'outline' : 'primary'}
    size="lg"
    onclick={onToggleReady}
  >
    {me?.isReady ? $_('lobby.not_ready') : $_('lobby.ready')}
  </Button>
</div>
