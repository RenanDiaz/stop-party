<script lang="ts">
  import type { PublicPlayer } from '$shared/types';

  interface Props {
    players: PublicPlayer[];
    currentPlayerId: string | null;
    totalCategories: number;
  }

  let { players, currentPlayerId, totalCategories }: Props = $props();

  const otherPlayers = $derived(
    players.filter((p) => p.id !== currentPlayerId && p.isConnected)
  );
</script>

{#if otherPlayers.length > 0}
  <div class="flex flex-wrap gap-2 justify-center">
    {#each otherPlayers as player}
      {@const progress = (player.filledCount / totalCategories) * 100}

      <div class="flex items-center gap-2 px-3 py-1 bg-bg-secondary rounded-full">
        <span class="text-sm text-text-secondary">{player.name}</span>
        <div class="w-16 h-2 bg-bg-primary rounded-full overflow-hidden">
          <div
            class="h-full bg-accent-primary transition-all duration-300"
            style="width: {progress}%"
          ></div>
        </div>
        <span class="text-xs text-text-secondary">
          {player.filledCount}/{totalCategories}
        </span>
      </div>
    {/each}
  </div>
{/if}
