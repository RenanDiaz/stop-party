<script lang="ts">
  import { _ } from '$lib/stores/i18n';
  import { answerStartsWithLetter } from '$lib/utils/validation';

  interface Props {
    categoryId: string;
    value: string;
    letter: string;
    disabled?: boolean;
    onchange: (value: string) => void;
  }

  let { categoryId, value, letter, disabled = false, onchange }: Props = $props();

  const isValid = $derived(value.trim() === '' || answerStartsWithLetter(value, letter));
</script>

<div class="space-y-1">
  <label class="block text-sm font-medium text-text-secondary" for={`category-${categoryId}`}>
    {$_(`categories.${categoryId}`)}
  </label>
  <input
    id={`category-${categoryId}`}
    type="text"
    {value}
    {disabled}
    oninput={(e) => onchange((e.target as HTMLInputElement).value)}
    placeholder="{letter}..."
    class="w-full px-4 py-3 bg-bg-secondary border rounded-lg text-text-primary placeholder-text-secondary
           focus:outline-none focus:ring-2 transition-colors
           {!isValid ? 'border-error focus:ring-error' : 'border-accent-secondary focus:ring-accent-primary'}"
  />
  {#if !isValid}
    <p class="text-xs text-error">{$_('voting.wrong_letter')}</p>
  {/if}
</div>
