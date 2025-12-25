<script lang="ts">
  import { _ } from '$lib/stores/i18n';
  import Button from '$lib/components/ui/Button.svelte';
  import { answerStartsWithLetter } from '$lib/utils/validation';
  import type { ReactionType, AnswerReactions } from '$shared/types';

  const AVAILABLE_REACTIONS: ReactionType[] = ['👍', '😂', '🔥', '🤔'];

  interface Props {
    playerName: string;
    answer: string;
    letter: string;
    isSelf: boolean;
    voted?: boolean | null;
    disabled?: boolean;
    reactions?: AnswerReactions;
    onVote?: (valid: boolean) => void;
    onReact?: (reaction: ReactionType) => void;
  }

  let {
    playerName,
    answer,
    letter,
    isSelf,
    voted = null,
    disabled = false,
    reactions = {},
    onVote,
    onReact
  }: Props = $props();

  const isEmpty = $derived(!answer || answer.trim() === '');
  const startsWithLetter = $derived(!isEmpty && answerStartsWithLetter(answer, letter));
  const isAutoInvalid = $derived(isEmpty || !startsWithLetter);

  // Get total reaction count for a specific emoji
  function getReactionCount(reaction: ReactionType): number {
    return reactions[reaction]?.length ?? 0;
  }

  // Check if there are any reactions
  const hasReactions = $derived(
    Object.values(reactions).some((arr) => arr && arr.length > 0)
  );
</script>

<div
  class="card {isSelf ? 'ring-2 ring-accent-primary' : ''} {isAutoInvalid ? 'opacity-60' : ''}"
>
  <div class="flex items-start justify-between gap-4">
    <div class="flex-1 min-w-0">
      <p class="text-sm text-text-secondary mb-1">
        {playerName}
        {#if isSelf}
          <span class="text-accent-primary">({$_('voting.your_answer')})</span>
        {/if}
      </p>
      <p class="text-lg font-medium text-text-primary truncate">
        {#if isEmpty}
          <span class="text-text-secondary italic">{$_('voting.no_answer')}</span>
        {:else}
          {answer}
        {/if}
      </p>
      {#if !isEmpty && !startsWithLetter}
        <p class="text-xs text-error mt-1">{$_('voting.wrong_letter')}</p>
      {/if}
    </div>

    {#if !isSelf && !isAutoInvalid}
      <div class="flex gap-2">
        {#if voted === null}
          <Button
            variant="ghost"
            size="sm"
            {disabled}
            onclick={() => onVote?.(true)}
          >
            <span class="text-success text-xl">✓</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            {disabled}
            onclick={() => onVote?.(false)}
          >
            <span class="text-error text-xl">✗</span>
          </Button>
        {:else}
          <span class="px-3 py-1 rounded-lg text-sm font-medium
                       {voted ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}">
            {voted ? $_('voting.valid') : $_('voting.invalid')}
          </span>
        {/if}
      </div>
    {:else if isAutoInvalid}
      <span class="px-3 py-1 rounded-lg text-sm font-medium bg-error/20 text-error">
        {$_('voting.invalid')}
      </span>
    {/if}
  </div>

  <!-- Quick Reactions -->
  {#if !isSelf}
    <div class="flex items-center gap-1 mt-2 pt-2 border-t border-accent-secondary/20">
      {#each AVAILABLE_REACTIONS as reaction}
        {@const count = getReactionCount(reaction)}
        <button
          onclick={() => onReact?.(reaction)}
          class="flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-all
                 hover:bg-accent-secondary/20 active:scale-95
                 {count > 0 ? 'bg-accent-secondary/10' : ''}"
          aria-label={$_('voting.react_with', { values: { reaction } })}
        >
          <span>{reaction}</span>
          {#if count > 0}
            <span class="text-xs text-text-secondary">{count}</span>
          {/if}
        </button>
      {/each}
    </div>
  {:else if hasReactions}
    <!-- Show reactions on own answer (read-only) -->
    <div class="flex items-center gap-1 mt-2 pt-2 border-t border-accent-secondary/20">
      {#each AVAILABLE_REACTIONS as reaction}
        {@const count = getReactionCount(reaction)}
        {#if count > 0}
          <span class="flex items-center gap-1 px-2 py-1 rounded-full text-sm bg-accent-secondary/10">
            <span>{reaction}</span>
            <span class="text-xs text-text-secondary">{count}</span>
          </span>
        {/if}
      {/each}
    </div>
  {/if}
</div>
