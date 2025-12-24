<script lang="ts">
  import { _ } from '$lib/stores/i18n';
  import type { PublicPlayer } from '$shared/types';
  import Badge from '$lib/components/ui/Badge.svelte';
  import { playerState } from '$lib/stores/playerState.svelte';

  interface Props {
    players: PublicPlayer[];
    showScore?: boolean;
    isHost?: boolean;
    onKick?: (playerId: string) => void;
  }

  let { players, showScore = false, isHost = false, onKick }: Props = $props();
</script>

<div class="space-y-2">
  <h3 class="text-sm font-medium text-text-secondary">
    {$_('lobby.players')} ({players.length})
  </h3>

  <ul class="space-y-2">
    {#each players as player (player.id)}
      <li
        class="flex items-center justify-between p-3 bg-bg-primary rounded-lg
               {!player.isConnected ? 'opacity-50' : ''}"
      >
        <div class="flex items-center gap-2">
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                   {player.isHost ? 'bg-warning text-bg-primary' : 'bg-accent-secondary text-text-primary'}"
          >
            {player.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="font-medium text-text-primary">{player.name}</span>
              {#if player.id === playerState.id}
                <Badge variant="info" size="sm">{$_('lobby.you')}</Badge>
              {/if}
              {#if player.isHost}
                <Badge variant="warning" size="sm">{$_('lobby.host')}</Badge>
              {/if}
            </div>
            {#if showScore}
              <span class="text-sm text-text-secondary">{player.score} pts</span>
            {/if}
          </div>
        </div>

        <div class="flex items-center gap-2">
          {#if player.isReady}
            <Badge variant="success" size="sm">{$_('lobby.ready')}</Badge>
          {:else}
            <Badge variant="default" size="sm">{$_('lobby.not_ready')}</Badge>
          {/if}

          {#if isHost && player.id !== playerState.id && onKick}
            <button
              onclick={() => onKick(player.id)}
              class="p-1 text-text-secondary hover:text-error transition-colors"
              title={$_('host.kick')}
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          {/if}
        </div>
      </li>
    {/each}
  </ul>
</div>
