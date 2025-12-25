<script lang="ts">
  import { _ } from '$lib/stores/i18n';
  import type { AllPlayerAnswers, ReactionType, AnswerReactions } from '$shared/types';
  import VotingCard from './VotingCard.svelte';
  import Timer from '$lib/components/ui/Timer.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { answerStartsWithLetter } from '$lib/utils/validation';

  interface Props {
    categories: string[];
    allAnswers: AllPlayerAnswers;
    currentLetter: string;
    currentPlayerId: string;
    localVotes: Record<string, Record<string, boolean>>;
    reactions: Record<string, Record<string, AnswerReactions>>;
    timeRemaining: number | null;
    isReady: boolean;
    readyCount: number;
    totalPlayers: number;
    onVote: (category: string, playerId: string, valid: boolean) => void;
    onReact: (category: string, playerId: string, reaction: ReactionType) => void;
    onReady: () => void;
  }

  let {
    categories,
    allAnswers,
    currentLetter,
    currentPlayerId,
    localVotes,
    reactions,
    timeRemaining,
    isReady,
    readyCount,
    totalPlayers,
    onVote,
    onReact,
    onReady
  }: Props = $props();

  let currentCategoryIndex = $state(0);

  const currentCategory = $derived(categories[currentCategoryIndex]);
  const playerIds = $derived(Object.keys(allAnswers));

  // Check if an answer is auto-invalid (empty or wrong letter)
  function isAutoInvalid(answer: string | undefined): boolean {
    if (!answer || answer.trim() === '') return true;
    return !answerStartsWithLetter(answer, currentLetter);
  }

  // Calculate if all other players' answers have been voted on
  // Auto-invalid answers (empty or wrong letter) don't need manual votes
  const hasVotedAll = $derived(() => {
    for (const category of categories) {
      for (const playerId of playerIds) {
        if (playerId === currentPlayerId) continue;
        const answer = allAnswers[playerId]?.answers[category];
        // Skip auto-invalid answers - they don't need manual votes
        if (isAutoInvalid(answer)) continue;
        if (localVotes[category]?.[playerId] === undefined) {
          return false;
        }
      }
    }
    return true;
  });

  function nextCategory() {
    if (currentCategoryIndex < categories.length - 1) {
      currentCategoryIndex++;
    }
  }

  function prevCategory() {
    if (currentCategoryIndex > 0) {
      currentCategoryIndex--;
    }
  }

  // Swipe handling
  let touchStartX = $state(0);
  let touchEndX = $state(0);
  const SWIPE_THRESHOLD = 50;

  function handleTouchStart(e: TouchEvent) {
    touchStartX = e.touches[0].clientX;
    touchEndX = e.touches[0].clientX;
  }

  function handleTouchMove(e: TouchEvent) {
    touchEndX = e.touches[0].clientX;
  }

  function handleTouchEnd() {
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      if (diff > 0) {
        // Swipe left -> next category
        nextCategory();
      } else {
        // Swipe right -> previous category
        prevCategory();
      }
    }
  }
</script>

<div class="space-y-4">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <h2 class="text-xl font-bold text-text-primary">{$_('voting.title')}</h2>
    <Timer seconds={timeRemaining} />
  </div>

  <!-- Category Navigation -->
  <div class="flex items-center justify-between">
    <button
      onclick={prevCategory}
      disabled={currentCategoryIndex === 0}
      class="p-2 text-text-secondary hover:text-text-primary disabled:opacity-30 transition-colors"
    >
      <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </button>

    <div class="text-center">
      <p class="text-sm text-text-secondary">
        {currentCategoryIndex + 1} / {categories.length}
      </p>
      <h3 class="text-lg font-semibold text-accent-primary">
        {$_(`categories.${currentCategory}`)}
      </h3>
    </div>

    <button
      onclick={nextCategory}
      disabled={currentCategoryIndex === categories.length - 1}
      class="p-2 text-text-secondary hover:text-text-primary disabled:opacity-30 transition-colors"
    >
      <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  </div>

  <!-- Answers for current category -->
  <div
    class="space-y-3 touch-pan-y"
    ontouchstart={handleTouchStart}
    ontouchmove={handleTouchMove}
    ontouchend={handleTouchEnd}
  >
    {#each playerIds as playerId}
      {@const playerData = allAnswers[playerId]}
      {@const answer = playerData.answers[currentCategory] ?? ''}
      {@const isSelf = playerId === currentPlayerId}
      {@const voted = localVotes[currentCategory]?.[playerId] ?? null}
      {@const answerReactions = reactions[currentCategory]?.[playerId] ?? {}}

      <VotingCard
        playerName={playerData.playerName}
        {answer}
        letter={currentLetter}
        {isSelf}
        {voted}
        reactions={answerReactions}
        onVote={(valid) => onVote(currentCategory, playerId, valid)}
        onReact={(reaction) => onReact(currentCategory, playerId, reaction)}
      />
    {/each}
  </div>

  <!-- Category dots -->
  <div class="flex justify-center gap-2">
    {#each categories as _, i}
      <button
        onclick={() => (currentCategoryIndex = i)}
        class="w-2 h-2 rounded-full transition-colors
               {i === currentCategoryIndex ? 'bg-accent-primary' : 'bg-text-secondary/30'}"
        aria-label="Category {i + 1}"
      />
    {/each}
  </div>

  <!-- Ready button and status -->
  <div class="mt-4 pt-4 border-t border-accent-secondary/30">
    <div class="flex items-center justify-between">
      <p class="text-sm text-text-secondary">
        {$_('voting.ready_count', { values: { ready: readyCount, total: totalPlayers } })}
      </p>
      {#if !isReady}
        <Button
          onclick={onReady}
          disabled={!hasVotedAll()}
          variant={hasVotedAll() ? 'primary' : 'secondary'}
        >
          {$_('voting.im_ready')}
        </Button>
      {:else}
        <span class="text-accent-primary font-medium flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          {$_('voting.ready')}
        </span>
      {/if}
    </div>
  </div>
</div>
