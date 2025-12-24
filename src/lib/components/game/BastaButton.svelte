<script lang="ts">
  import { _ } from '$lib/stores/i18n';

  interface Props {
    disabled?: boolean;
    onclick: () => void;
  }

  let { disabled = false, onclick }: Props = $props();
</script>

<button
  {onclick}
  {disabled}
  class="fixed bottom-6 left-1/2 -translate-x-1/2 safe-bottom
         px-8 py-4 bg-accent-primary text-white text-xl font-bold rounded-full
         shadow-lg shadow-accent-primary/30
         transition-all duration-200
         hover:scale-105 hover:shadow-xl hover:shadow-accent-primary/40
         active:scale-95
         disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
         animate-pulse-fast"
  style="min-width: 200px;"
>
  {$_('game.basta')}
</button>
