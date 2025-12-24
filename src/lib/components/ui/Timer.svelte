<script lang="ts">
  interface Props {
    seconds: number | null;
    size?: 'sm' | 'md' | 'lg';
    warning?: boolean;
    showIcon?: boolean;
  }

  let { seconds, size = 'md', warning = false, showIcon = true }: Props = $props();

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl font-bold'
  };

  function formatTime(totalSeconds: number): string {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  const isLow = $derived(seconds !== null && seconds <= 10);
</script>

{#if seconds !== null}
  <div
    class="inline-flex items-center gap-1 {sizeClasses[size]} {isLow || warning
      ? 'text-warning animate-pulse-fast'
      : 'text-text-secondary'}"
  >
    {#if showIcon}
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    {/if}
    <span class={isLow ? 'animate-pulse-fast' : ''}>{formatTime(seconds)}</span>
  </div>
{/if}
