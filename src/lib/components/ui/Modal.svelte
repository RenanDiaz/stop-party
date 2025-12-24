<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    open?: boolean;
    title?: string;
    onclose?: () => void;
    children: Snippet;
    footer?: Snippet;
  }

  let { open = $bindable(false), title, onclose, children, footer }: Props = $props();

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      open = false;
      onclose?.();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      open = false;
      onclose?.();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-pop"
    onclick={handleBackdropClick}
  >
    <div
      class="w-full max-w-md bg-bg-secondary rounded-xl shadow-2xl overflow-hidden animate-pop"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {#if title}
        <div class="flex items-center justify-between px-4 py-3 border-b border-accent-secondary">
          <h2 id="modal-title" class="text-lg font-semibold text-text-primary">{title}</h2>
          <button
            onclick={() => {
              open = false;
              onclose?.();
            }}
            class="p-1 text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Close"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      {/if}

      <div class="p-4">
        {@render children()}
      </div>

      {#if footer}
        <div class="px-4 py-3 border-t border-accent-secondary bg-bg-primary/50">
          {@render footer()}
        </div>
      {/if}
    </div>
  </div>
{/if}
