<script lang="ts">
  import { _ } from '$lib/stores/i18n';
  import CreateRoom from '$lib/components/lobby/CreateRoom.svelte';
  import JoinRoom from '$lib/components/lobby/JoinRoom.svelte';

  let mode = $state<'create' | 'join' | null>(null);
</script>

<div class="max-w-md mx-auto space-y-8">
  <!-- Logo and Tagline -->
  <div class="text-center space-y-2">
    <h1 class="text-4xl font-bold text-accent-primary">StopParty</h1>
    <p class="text-text-secondary">{$_('app.tagline')}</p>
  </div>

  <!-- Main Actions -->
  {#if mode === null}
    <div class="space-y-4">
      <button
        onclick={() => (mode = 'create')}
        class="w-full p-6 bg-bg-secondary rounded-xl border-2 border-transparent hover:border-accent-primary transition-colors text-left group"
      >
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-accent-primary/20 rounded-lg flex items-center justify-center group-hover:bg-accent-primary/30 transition-colors">
            <svg class="w-6 h-6 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <h2 class="text-lg font-semibold text-text-primary">{$_('home.create_room')}</h2>
            <p class="text-sm text-text-secondary">Crea una nueva sala y comparte el código</p>
          </div>
        </div>
      </button>

      <button
        onclick={() => (mode = 'join')}
        class="w-full p-6 bg-bg-secondary rounded-xl border-2 border-transparent hover:border-accent-secondary transition-colors text-left group"
      >
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-accent-secondary/20 rounded-lg flex items-center justify-center group-hover:bg-accent-secondary/30 transition-colors">
            <svg class="w-6 h-6 text-accent-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h2 class="text-lg font-semibold text-text-primary">{$_('home.join_room')}</h2>
            <p class="text-sm text-text-secondary">Únete a una sala existente con un código</p>
          </div>
        </div>
      </button>
    </div>

    <!-- How to Play -->
    <div class="card space-y-3">
      <h3 class="font-semibold text-text-primary">{$_('home.how_to_play')}</h3>
      <ul class="space-y-2 text-sm text-text-secondary">
        <li class="flex gap-2">
          <span class="text-accent-primary">1.</span>
          {$_('home.rules.rule1')}
        </li>
        <li class="flex gap-2">
          <span class="text-accent-primary">2.</span>
          {$_('home.rules.rule2')}
        </li>
        <li class="flex gap-2">
          <span class="text-accent-primary">3.</span>
          {$_('home.rules.rule3')}
        </li>
        <li class="flex gap-2">
          <span class="text-accent-primary">4.</span>
          {$_('home.rules.rule4')}
        </li>
        <li class="flex gap-2">
          <span class="text-accent-primary">5.</span>
          {$_('home.rules.rule5')}
        </li>
      </ul>
    </div>

    <!-- Temporary: Logo variations review -->
    <a
      href="/logo-variations.svg"
      target="_blank"
      class="block text-center text-xs text-text-secondary/50 hover:text-accent-primary transition-colors"
    >
      Ver variaciones de logo
    </a>
  {:else}
    <div class="card">
      <button
        onclick={() => (mode = null)}
        class="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-4"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        {$_('common.back')}
      </button>

      <h2 class="text-xl font-semibold text-text-primary mb-4">
        {mode === 'create' ? $_('home.create_room') : $_('home.join_room')}
      </h2>

      {#if mode === 'create'}
        <CreateRoom />
      {:else}
        <JoinRoom />
      {/if}
    </div>
  {/if}
</div>
