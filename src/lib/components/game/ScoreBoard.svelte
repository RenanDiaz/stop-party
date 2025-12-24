<script lang="ts">
  import { _ } from '$lib/stores/i18n';
  import type { PublicPlayer } from '$shared/types';
  import Badge from '$lib/components/ui/Badge.svelte';

  interface Props {
    players: PublicPlayer[];
    currentPlayerId?: string | null;
  }

  let { players, currentPlayerId }: Props = $props();

  const sortedPlayers = $derived(
    [...players].sort((a, b) => b.score - a.score)
  );
</script>

<div class="card">
  <h3 class="font-semibold text-text-primary mb-3">{$_('results.title')}</h3>

  <div class="space-y-2">
    {#each sortedPlayers as player, index (player.id)}
      {@const isMe = player.id === currentPlayerId}

      <div
        class="flex items-center justify-between p-2 rounded-lg
               {isMe ? 'bg-accent-primary/20' : ''}"
      >
        <div class="flex items-center gap-3">
          <span
            class="w-6 h-6 flex items-center justify-center text-sm font-bold rounded-full
                   {index === 0 ? 'bg-warning text-bg-primary' : 'bg-bg-primary text-text-secondary'}"
          >
            {index + 1}
          </span>
          <span class="font-medium {isMe ? 'text-accent-primary' : 'text-text-primary'}">
            {player.name}
          </span>
          {#if isMe}
            <Badge variant="info" size="sm">{$_('lobby.you')}</Badge>
          {/if}
        </div>
        <span class="font-bold text-text-primary">{player.score}</span>
      </div>
    {/each}
  </div>
</div>
