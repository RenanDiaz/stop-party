<script lang="ts">
  import { _ } from '$lib/stores/i18n';
  import { gameState } from '$lib/stores/gameState.svelte';
  import { playerState } from '$lib/stores/playerState.svelte';
  import { MAX_COMMENT_LENGTH } from '$shared/constants';

  let commentText = $state('');
  let inputElement: HTMLInputElement | undefined = $state();
  let commentsContainer: HTMLDivElement | undefined = $state();

  const comments = $derived(gameState.comments);

  // Auto-scroll to bottom when new comments arrive
  $effect(() => {
    if (comments.length > 0 && commentsContainer) {
      // Use requestAnimationFrame to ensure DOM is updated before scrolling
      requestAnimationFrame(() => {
        commentsContainer?.scrollTo({
          top: commentsContainer.scrollHeight,
          behavior: 'smooth'
        });
      });
    }
  });

  function handleSubmit(e: Event) {
    e.preventDefault();
    const trimmed = commentText.trim();
    if (trimmed.length === 0) return;

    gameState.sendComment(trimmed);
    commentText = '';
    inputElement?.focus();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }
</script>

<div class="card">
  <h3 class="font-semibold text-text-primary mb-3 flex items-center gap-2">
    <span>{$_('comments.title')}</span>
    {#if comments.length > 0}
      <span class="text-sm text-text-secondary">({comments.length})</span>
    {/if}
  </h3>

  <!-- Comments list -->
  <div bind:this={commentsContainer} class="space-y-2 max-h-48 overflow-y-auto mb-3">
    {#if comments.length === 0}
      <p class="text-text-secondary text-sm italic">{$_('comments.empty')}</p>
    {:else}
      {#each comments as comment (comment.id)}
        {@const isMe = comment.playerId === playerState.id}
        <div class="flex gap-2 text-sm {isMe ? 'flex-row-reverse' : ''}">
          <div
            class="rounded-lg px-3 py-2 max-w-[80%] break-words
                   {isMe ? 'bg-accent-primary text-white' : 'bg-bg-primary text-text-primary'}"
          >
            {#if !isMe}
              <span class="font-semibold text-accent-primary">{comment.playerName}:</span>
            {/if}
            <span class={isMe ? '' : 'ml-1'}>{comment.text}</span>
          </div>
        </div>
      {/each}
    {/if}
  </div>

  <!-- Input -->
  <form onsubmit={handleSubmit} class="flex gap-2">
    <input
      bind:this={inputElement}
      bind:value={commentText}
      type="text"
      maxlength={MAX_COMMENT_LENGTH}
      placeholder={$_('comments.placeholder')}
      onkeydown={handleKeydown}
      class="flex-1 px-3 py-2 bg-bg-primary border border-accent-secondary rounded-lg text-text-primary placeholder-text-secondary text-sm
             focus:outline-none focus:ring-2 focus:ring-accent-primary transition-colors"
    />
    <button
      type="submit"
      disabled={commentText.trim().length === 0}
      class="px-4 py-2 bg-accent-primary text-white rounded-lg font-semibold text-sm
             hover:bg-opacity-90 transition-all duration-200 active:scale-95
             disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
    >
      {$_('comments.send')}
    </button>
  </form>
</div>
