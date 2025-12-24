<script lang="ts">
  import { _ } from '$lib/stores/i18n';
  import Button from '$lib/components/ui/Button.svelte';

  interface Props {
    roomId: string;
  }

  let { roomId }: Props = $props();
  let copied = $state(false);

  function getRoomUrl(): string {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/room/${roomId}`;
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(getRoomUrl());
      copied = true;
      setTimeout(() => {
        copied = false;
      }, 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = getRoomUrl();
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      copied = true;
      setTimeout(() => {
        copied = false;
      }, 2000);
    }
  }

  async function shareLink() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'StopParty',
          text: $_('app.tagline'),
          url: getRoomUrl()
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      copyLink();
    }
  }
</script>

<div class="card space-y-3">
  <div class="text-center">
    <p class="text-sm text-text-secondary mb-1">{$_('lobby.room_code')}</p>
    <p class="text-3xl font-bold text-accent-primary tracking-wider">{roomId}</p>
  </div>

  <div class="flex gap-2">
    <Button variant="outline" fullWidth onclick={copyLink}>
      {#if copied}
        <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        {$_('lobby.link_copied')}
      {:else}
        <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        {$_('lobby.copy_link')}
      {/if}
    </Button>

    {#if typeof navigator !== 'undefined' && 'share' in navigator}
      <Button variant="secondary" onclick={shareLink}>
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
      </Button>
    {/if}
  </div>
</div>
