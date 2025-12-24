<script lang="ts">
  import { _ } from '$lib/stores/i18n';
  import CategoryInput from './CategoryInput.svelte';

  interface Props {
    categories: string[];
    answers: Record<string, string>;
    letter: string;
    disabled?: boolean;
    onAnswerChange: (category: string, value: string) => void;
  }

  let { categories, answers, letter, disabled = false, onAnswerChange }: Props = $props();

  const filledCount = $derived(
    Object.values(answers).filter((a) => a.trim() !== '').length
  );
</script>

<div class="space-y-4">
  <div class="flex justify-between items-center">
    <h3 class="font-medium text-text-primary">{$_('game.your_answers')}</h3>
    <span class="text-sm text-text-secondary">
      {filledCount}/{categories.length} {$_('game.filled')}
    </span>
  </div>

  <div class="space-y-3">
    {#each categories as category, i}
      <CategoryInput
        categoryId={category}
        value={answers[category] ?? ''}
        {letter}
        {disabled}
        onchange={(value) => onAnswerChange(category, value)}
      />
    {/each}
  </div>
</div>
