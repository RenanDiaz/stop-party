<script lang="ts">
  import { _ } from '$lib/stores/i18n';
  import type { RoomConfig } from '$shared/types';
  import {
    VICTORY_OPTIONS,
    GRACE_TIME_OPTIONS,
    ROUND_TIME_OPTIONS,
    VOTING_TIME_OPTIONS,
    BETWEEN_ROUNDS_OPTIONS
  } from '$shared/constants';
  import CategorySelector from './CategorySelector.svelte';

  interface Props {
    config: RoomConfig;
    disabled?: boolean;
    onChange: (config: Partial<RoomConfig>) => void;
  }

  let { config, disabled = false, onChange }: Props = $props();

  function handleVictoryModeChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    const mode = target.value as 'rounds' | 'points';
    onChange({
      victoryMode: mode,
      victoryValue: mode === 'rounds' ? VICTORY_OPTIONS.rounds[1] : VICTORY_OPTIONS.points[1]
    });
  }
</script>

<div class="space-y-6">
  <!-- Victory Mode -->
  <div class="grid grid-cols-2 gap-4">
    <div>
      <label class="block text-sm font-medium text-text-secondary mb-2">
        {$_('config.victory_mode')}
      </label>
      <select
        value={config.victoryMode}
        onchange={handleVictoryModeChange}
        {disabled}
        class="w-full px-4 py-2 bg-bg-primary border border-accent-secondary rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
      >
        <option value="rounds">{$_('config.rounds')}</option>
        <option value="points">{$_('config.points')}</option>
      </select>
    </div>

    <div>
      <label class="block text-sm font-medium text-text-secondary mb-2">
        {config.victoryMode === 'rounds' ? $_('config.num_rounds') : $_('config.target_points')}
      </label>
      <select
        value={config.victoryValue}
        onchange={(e) => onChange({ victoryValue: parseInt((e.target as HTMLSelectElement).value) })}
        {disabled}
        class="w-full px-4 py-2 bg-bg-primary border border-accent-secondary rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
      >
        {#each config.victoryMode === 'rounds' ? VICTORY_OPTIONS.rounds : VICTORY_OPTIONS.points as value}
          <option {value}>{value}</option>
        {/each}
      </select>
    </div>
  </div>

  <!-- Timers -->
  <div class="grid grid-cols-2 gap-4">
    <div>
      <label class="block text-sm font-medium text-text-secondary mb-2">
        {$_('config.grace_time')}
      </label>
      <select
        value={config.graceTimeAfterBasta}
        onchange={(e) => onChange({ graceTimeAfterBasta: parseInt((e.target as HTMLSelectElement).value) })}
        {disabled}
        class="w-full px-4 py-2 bg-bg-primary border border-accent-secondary rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
      >
        {#each GRACE_TIME_OPTIONS as seconds}
          <option value={seconds}>
            {seconds === 0 ? $_('config.immediate') : $_('config.seconds', { values: { n: seconds } })}
          </option>
        {/each}
      </select>
    </div>

    <div>
      <label class="block text-sm font-medium text-text-secondary mb-2">
        {$_('config.round_time')}
      </label>
      <select
        value={config.roundTimeLimit}
        onchange={(e) => onChange({ roundTimeLimit: parseInt((e.target as HTMLSelectElement).value) })}
        {disabled}
        class="w-full px-4 py-2 bg-bg-primary border border-accent-secondary rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
      >
        {#each ROUND_TIME_OPTIONS as seconds}
          <option value={seconds}>
            {seconds === 0 ? $_('config.no_limit') : $_('config.seconds', { values: { n: seconds } })}
          </option>
        {/each}
      </select>
    </div>

    <div>
      <label class="block text-sm font-medium text-text-secondary mb-2">
        {$_('config.voting_time')}
      </label>
      <select
        value={config.votingTimeLimit}
        onchange={(e) => onChange({ votingTimeLimit: parseInt((e.target as HTMLSelectElement).value) })}
        {disabled}
        class="w-full px-4 py-2 bg-bg-primary border border-accent-secondary rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
      >
        {#each VOTING_TIME_OPTIONS as seconds}
          <option value={seconds}>{$_('config.seconds', { values: { n: seconds } })}</option>
        {/each}
      </select>
    </div>

    <div>
      <label class="block text-sm font-medium text-text-secondary mb-2">
        {$_('config.between_rounds')}
      </label>
      <select
        value={config.timeBetweenRounds}
        onchange={(e) => onChange({ timeBetweenRounds: parseInt((e.target as HTMLSelectElement).value) })}
        {disabled}
        class="w-full px-4 py-2 bg-bg-primary border border-accent-secondary rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
      >
        {#each BETWEEN_ROUNDS_OPTIONS as seconds}
          <option value={seconds}>
            {seconds === 0 ? $_('config.wait_ready') : $_('config.seconds', { values: { n: seconds } })}
          </option>
        {/each}
      </select>
    </div>
  </div>

  <!-- Show Progress Toggle -->
  <div class="flex items-center justify-between">
    <label class="text-sm font-medium text-text-secondary">
      {$_('config.show_progress')}
    </label>
    <button
      type="button"
      onclick={() => onChange({ showOthersProgress: !config.showOthersProgress })}
      {disabled}
      class="relative w-12 h-6 rounded-full transition-colors
             {config.showOthersProgress ? 'bg-accent-primary' : 'bg-bg-primary'}"
    >
      <span
        class="absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform
               {config.showOthersProgress ? 'translate-x-6' : ''}"
      ></span>
    </button>
  </div>

  <!-- Categories -->
  <CategorySelector
    selectedPreset={config.categoryPreset}
    selectedCategories={config.categories}
    onPresetChange={(preset) => onChange({ categoryPreset: preset })}
    onCategoriesChange={(categories) => onChange({ categories })}
    {disabled}
  />
</div>
