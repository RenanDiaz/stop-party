<script lang="ts">
  import { _ } from '$lib/stores/i18n';
  import { CATEGORY_PRESETS, getPresetById } from '$shared/categories';

  interface Props {
    selectedPreset: string;
    selectedCategories: string[];
    onPresetChange: (presetId: string) => void;
    onCategoriesChange: (categories: string[]) => void;
    disabled?: boolean;
  }

  let {
    selectedPreset,
    selectedCategories,
    onPresetChange,
    onCategoriesChange,
    disabled = false
  }: Props = $props();

  let showCustom = $derived(selectedPreset === 'custom');

  function handlePresetChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    const presetId = target.value;
    onPresetChange(presetId);

    if (presetId !== 'custom') {
      const preset = getPresetById(presetId);
      if (preset) {
        onCategoriesChange(preset.categories.map((c) => c.id));
      }
    }
  }

  function toggleCategory(categoryId: string) {
    if (selectedCategories.includes(categoryId)) {
      if (selectedCategories.length > 5) {
        onCategoriesChange(selectedCategories.filter((c) => c !== categoryId));
      }
    } else if (selectedCategories.length < 10) {
      onCategoriesChange([...selectedCategories, categoryId]);
    }
  }

  // Get all unique categories from all presets
  const allCategories = $derived(() => {
    const categories = new Map<string, string>();
    for (const preset of CATEGORY_PRESETS) {
      for (const cat of preset.categories) {
        categories.set(cat.id, cat.nameKey);
      }
    }
    return Array.from(categories.entries());
  });
</script>

<div class="space-y-4">
  <div>
    <label class="block text-sm font-medium text-text-secondary mb-2">
      {$_('config.preset')}
    </label>
    <select
      value={selectedPreset}
      onchange={handlePresetChange}
      {disabled}
      class="w-full px-4 py-2 bg-bg-primary border border-accent-secondary rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
    >
      {#each CATEGORY_PRESETS as preset}
        <option value={preset.id}>{$_(preset.nameKey)}</option>
      {/each}
      <option value="custom">{$_('config.custom')}</option>
    </select>
  </div>

  {#if showCustom}
    <div>
      <label class="block text-sm font-medium text-text-secondary mb-2">
        {$_('config.categories')} ({selectedCategories.length}/10)
      </label>
      <div class="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
        {#each allCategories() as [categoryId, nameKey]}
          <button
            type="button"
            onclick={() => toggleCategory(categoryId)}
            {disabled}
            class="px-3 py-2 text-sm text-left rounded-lg transition-colors
                   {selectedCategories.includes(categoryId)
              ? 'bg-accent-primary text-white'
              : 'bg-bg-primary text-text-secondary hover:text-text-primary'}"
          >
            {$_(nameKey)}
          </button>
        {/each}
      </div>
      <p class="text-xs text-text-secondary mt-1">
        Mínimo 5, máximo 10 categorías
      </p>
    </div>
  {:else}
    <div>
      <label class="block text-sm font-medium text-text-secondary mb-2">
        {$_('config.categories')}
      </label>
      <ul class="space-y-1">
        {#each selectedCategories as categoryId}
          <li class="text-sm text-text-primary">• {$_(`categories.${categoryId}`)}</li>
        {/each}
      </ul>
    </div>
  {/if}
</div>
