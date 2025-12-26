<script lang="ts">
  import { _ } from '$lib/stores/i18n';
  import type { RoundResults as RoundResultsType } from '$shared/types';
  import { SCORE_UNIQUE, SCORE_DUPLICATE } from '$shared/constants';
  import Badge from '$lib/components/ui/Badge.svelte';
  import RoundComments from './RoundComments.svelte';

  interface Props {
    results: RoundResultsType;
    categories: string[];
    currentPlayerId: string | null;
  }

  let { results, categories, currentPlayerId }: Props = $props();

  const myResults = $derived(
    results.playerScores.find((s) => s.playerId === currentPlayerId)
  );

  function getScoreVariant(score: number): 'success' | 'warning' | 'error' {
    if (score === SCORE_UNIQUE) return 'success';
    if (score === SCORE_DUPLICATE) return 'warning';
    return 'error';
  }

  function getScoreLabel(score: number): string {
    if (score === SCORE_UNIQUE) return 'results.unique';
    if (score === SCORE_DUPLICATE) return 'results.duplicate';
    return 'results.invalid';
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="text-center">
    <h2 class="text-2xl font-bold text-text-primary">
      {$_('results.round_results', { values: { round: results.round } })}
    </h2>
    <p class="text-4xl font-bold text-accent-primary mt-2">{results.letter}</p>
  </div>

  <!-- My Results -->
  {#if myResults}
    <div class="card">
      <h3 class="font-semibold text-text-primary mb-4">{$_('results.your_score')}</h3>

      <div class="space-y-2">
        {#each categories as category}
          {@const score = myResults.categoryScores[category] ?? 0}

          <div class="flex items-center justify-between py-2 border-b border-accent-secondary last:border-0">
            <span class="text-text-secondary">{$_(`categories.${category}`)}</span>
            <div class="flex items-center gap-2">
              <Badge variant={getScoreVariant(score)} size="sm">
                {$_(getScoreLabel(score))}
              </Badge>
              <span class="font-bold text-text-primary w-12 text-right">
                +{score}
              </span>
            </div>
          </div>
        {/each}
      </div>

      <div class="mt-4 pt-4 border-t border-accent-secondary flex justify-between items-center">
        <span class="text-text-primary font-medium">Total de la ronda</span>
        <span class="text-2xl font-bold text-accent-primary">+{myResults.roundTotal}</span>
      </div>
    </div>
  {/if}

  <!-- Leaderboard -->
  <div class="card">
    <h3 class="font-semibold text-text-primary mb-4">{$_('results.total_score')}</h3>

    <div class="space-y-2">
      {#each results.playerScores as score, index}
        {@const isMe = score.playerId === currentPlayerId}

        <div
          class="flex items-center justify-between p-3 rounded-lg
                 {isMe ? 'bg-accent-primary/20' : 'bg-bg-primary'}"
        >
          <div class="flex items-center gap-3">
            <span
              class="w-8 h-8 flex items-center justify-center text-sm font-bold rounded-full
                     {index === 0 ? 'bg-warning text-bg-primary' : 'bg-accent-secondary text-text-primary'}"
            >
              {index + 1}
            </span>
            <div>
              <span class="font-medium {isMe ? 'text-accent-primary' : 'text-text-primary'}">
                {score.playerName}
              </span>
              <span class="text-sm text-text-secondary ml-2">
                (+{score.roundTotal})
              </span>
            </div>
          </div>
          <span class="text-xl font-bold text-text-primary">{score.totalScore}</span>
        </div>
      {/each}
    </div>
  </div>

  <!-- Comments -->
  <RoundComments />
</div>
