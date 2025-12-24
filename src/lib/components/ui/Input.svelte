<script lang="ts">
  interface Props {
    value?: string;
    placeholder?: string;
    type?: 'text' | 'email' | 'password' | 'number';
    disabled?: boolean;
    maxlength?: number;
    autofocus?: boolean;
    error?: string | null;
    label?: string;
    id?: string;
    name?: string;
    oninput?: (e: Event) => void;
    onkeydown?: (e: KeyboardEvent) => void;
  }

  let {
    value = $bindable(''),
    placeholder = '',
    type = 'text',
    disabled = false,
    maxlength,
    autofocus = false,
    error = null,
    label,
    id,
    name,
    oninput,
    onkeydown
  }: Props = $props();

  const inputId = id ?? `input-${Math.random().toString(36).slice(2)}`;
</script>

<div class="w-full">
  {#if label}
    <label for={inputId} class="block text-sm font-medium text-text-secondary mb-1">
      {label}
    </label>
  {/if}
  <input
    {type}
    {name}
    id={inputId}
    bind:value
    {placeholder}
    {disabled}
    {maxlength}
    autofocus={autofocus}
    {oninput}
    {onkeydown}
    class="w-full px-4 py-3 bg-bg-secondary border rounded-lg text-text-primary placeholder-text-secondary
           focus:outline-none focus:ring-2 focus:ring-accent-primary transition-colors
           {error ? 'border-error' : 'border-accent-secondary'}"
  />
  {#if error}
    <p class="mt-1 text-sm text-error">{error}</p>
  {/if}
</div>
