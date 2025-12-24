<script lang="ts">
  import { _ } from '$lib/stores/i18n';

  interface Props {
    letter: string | null;
    round?: number;
    totalRounds?: number;
    usedLetters?: string[];
  }

  let { letter, round, totalRounds, usedLetters = [] }: Props = $props();
</script>

<div class="text-center">
  {#if letter}
    <div class="letter-display animate-pop">{letter}</div>
    {#if round && totalRounds}
      <p class="text-text-secondary mt-2">
        {$_('game.round')} {round} {$_('game.of')} {totalRounds}
      </p>
    {/if}
  {:else}
    <div class="text-6xl text-text-secondary">?</div>
  {/if}

  {#if usedLetters.length > 0}
    <div class="mt-4 flex justify-center gap-2 flex-wrap">
      <span class="text-xs text-text-secondary">Letras usadas:</span>
      {#each usedLetters.slice(-5) as usedLetter}
        <span class="text-xs px-2 py-1 bg-bg-secondary rounded text-text-secondary">
          {usedLetter}
        </span>
      {/each}
    </div>
  {/if}
</div>
