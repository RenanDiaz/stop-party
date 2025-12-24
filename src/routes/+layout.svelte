<script lang="ts">
  import { onMount } from 'svelte';
  import '../app.css';
  import { initI18n } from '$lib/stores/i18n';
  import { initSounds } from '$lib/utils/sounds';
  import LanguageSelector from '$lib/components/LanguageSelector.svelte';
  import Toast from '$lib/components/ui/Toast.svelte';

  let { children } = $props();

  let ready = $state(false);

  onMount(async () => {
    await initI18n();
    initSounds();
    ready = true;
  });
</script>

<svelte:head>
  <title>StopParty</title>
  <meta name="description" content="Juego multijugador de Stop/Basta/Tuttifrutti" />
</svelte:head>

{#if ready}
  <div class="min-h-screen bg-bg-primary flex flex-col">
    <!-- Header -->
    <header class="safe-top px-4 py-3 flex items-center justify-between border-b border-accent-secondary">
      <a href="/" class="text-xl font-bold text-accent-primary">
        StopParty
      </a>
      <LanguageSelector />
    </header>

    <!-- Main Content -->
    <main class="flex-1 px-4 py-6 overflow-auto">
      {@render children()}
    </main>
  </div>

  <Toast />
{:else}
  <div class="min-h-screen bg-bg-primary flex items-center justify-center">
    <div class="animate-spin w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full"></div>
  </div>
{/if}
