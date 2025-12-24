<script lang="ts">
  import { areSoundsEnabled, setSoundsEnabled, playSound, preloadAudio } from '$lib/utils/sounds';

  let enabled = $state(areSoundsEnabled());

  function toggle() {
    // Preload audio on first interaction
    preloadAudio();

    enabled = !enabled;
    setSoundsEnabled(enabled);

    // Play a click sound if enabling
    if (enabled) {
      playSound('click');
    }
  }
</script>

<button
  onclick={toggle}
  class="p-2 rounded-lg hover:bg-bg-secondary transition-colors"
  aria-label={enabled ? 'Mute sounds' : 'Unmute sounds'}
  title={enabled ? 'Mute sounds' : 'Unmute sounds'}
>
  {#if enabled}
    <!-- Speaker on icon -->
    <svg class="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
      />
    </svg>
  {:else}
    <!-- Speaker off icon -->
    <svg class="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
      />
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
      />
    </svg>
  {/if}
</button>
