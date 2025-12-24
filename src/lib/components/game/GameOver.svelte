<script lang="ts">
  import { _ } from '$lib/stores/i18n';
  import type { FinalResults } from '$shared/types';
  import Button from '$lib/components/ui/Button.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';

  interface Props {
    results: FinalResults;
    currentPlayerId: string | null;
    onPlayAgain: () => void;
    onBackToHome: () => void;
  }

  let { results, currentPlayerId, onPlayAgain, onBackToHome }: Props = $props();

  const isWinner = $derived(results.winner.id === currentPlayerId);
</script>

<div class="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
  <!-- Winner Announcement -->
  <div class="space-y-4">
    <h1 class="text-3xl font-bold text-text-primary">{$_('game_over.title')}</h1>

    <div class="relative">
      <div
        class="w-24 h-24 mx-auto rounded-full flex items-center justify-center text-4xl font-bold
               {isWinner ? 'bg-warning text-bg-primary animate-bounce-light' : 'bg-accent-primary text-white'}"
      >
        {results.winner.name.charAt(0).toUpperCase()}
      </div>
      <div class="absolute -top-2 -right-2 text-4xl">🏆</div>
    </div>

    <div>
      <p class="text-xl font-semibold text-warning">{$_('game_over.winner')}</p>
      <p class="text-2xl font-bold text-text-primary">{results.winner.name}</p>
      <p class="text-lg text-text-secondary">{results.winner.score} pts</p>
    </div>
  </div>

  <!-- Final Standings -->
  <div class="w-full max-w-sm card">
    <h3 class="font-semibold text-text-primary mb-4">{$_('game_over.final_standings')}</h3>

    <div class="space-y-2">
      {#each results.rankings as ranking}
        {@const isMe = ranking.player.id === currentPlayerId}

        <div
          class="flex items-center justify-between p-3 rounded-lg
                 {isMe ? 'bg-accent-primary/20' : 'bg-bg-primary'}"
        >
          <div class="flex items-center gap-3">
            <span
              class="w-8 h-8 flex items-center justify-center text-sm font-bold rounded-full
                     {ranking.rank === 1 ? 'bg-warning text-bg-primary' : ''}
                     {ranking.rank === 2 ? 'bg-gray-400 text-bg-primary' : ''}
                     {ranking.rank === 3 ? 'bg-amber-700 text-white' : ''}
                     {ranking.rank > 3 ? 'bg-accent-secondary text-text-primary' : ''}"
            >
              {ranking.rank}
            </span>
            <span class="font-medium {isMe ? 'text-accent-primary' : 'text-text-primary'}">
              {ranking.player.name}
            </span>
            {#if isMe}
              <Badge variant="info" size="sm">{$_('lobby.you')}</Badge>
            {/if}
          </div>
          <span class="font-bold text-text-primary">{ranking.totalScore}</span>
        </div>
      {/each}
    </div>

    <p class="text-sm text-text-secondary mt-4">
      {results.totalRounds} {$_('game.round').toLowerCase()}s
    </p>
  </div>

  <!-- Actions -->
  <div class="flex gap-4 w-full max-w-sm">
    <Button variant="outline" fullWidth onclick={onBackToHome}>
      {$_('game_over.back_to_lobby')}
    </Button>
    <Button variant="primary" fullWidth onclick={onPlayAgain}>
      {$_('game_over.play_again')}
    </Button>
  </div>
</div>
