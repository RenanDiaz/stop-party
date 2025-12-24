// Category presets with translations
export interface CategoryPreset {
  id: string;
  nameKey: string; // i18n key
  categories: {
    id: string;
    nameKey: string; // i18n key
  }[];
}

export const CATEGORY_PRESETS: CategoryPreset[] = [
  {
    id: 'classic',
    nameKey: 'presets.classic',
    categories: [
      { id: 'name', nameKey: 'categories.name' },
      { id: 'animal', nameKey: 'categories.animal' },
      { id: 'city_country', nameKey: 'categories.city_country' },
      { id: 'fruit_food', nameKey: 'categories.fruit_food' },
      { id: 'color', nameKey: 'categories.color' },
      { id: 'thing', nameKey: 'categories.thing' },
      { id: 'profession', nameKey: 'categories.profession' }
    ]
  },
  {
    id: 'geography',
    nameKey: 'presets.geography',
    categories: [
      { id: 'country', nameKey: 'categories.country' },
      { id: 'city', nameKey: 'categories.city' },
      { id: 'river', nameKey: 'categories.river' },
      { id: 'mountain', nameKey: 'categories.mountain' },
      { id: 'sea_ocean', nameKey: 'categories.sea_ocean' },
      { id: 'capital', nameKey: 'categories.capital' },
      { id: 'continent', nameKey: 'categories.continent' }
    ]
  },
  {
    id: 'party',
    nameKey: 'presets.party',
    categories: [
      { id: 'song', nameKey: 'categories.song' },
      { id: 'artist', nameKey: 'categories.artist' },
      { id: 'movie', nameKey: 'categories.movie' },
      { id: 'tv_series', nameKey: 'categories.tv_series' },
      { id: 'drink', nameKey: 'categories.drink' },
      { id: 'food', nameKey: 'categories.food' },
      { id: 'celebrity', nameKey: 'categories.celebrity' }
    ]
  },
  {
    id: 'kids',
    nameKey: 'presets.kids',
    categories: [
      { id: 'animal', nameKey: 'categories.animal' },
      { id: 'color', nameKey: 'categories.color' },
      { id: 'food', nameKey: 'categories.food' },
      { id: 'toy', nameKey: 'categories.toy' },
      { id: 'cartoon', nameKey: 'categories.cartoon' },
      { id: 'superhero', nameKey: 'categories.superhero' },
      { id: 'fruit', nameKey: 'categories.fruit' }
    ]
  }
];

// Get preset by ID
export function getPresetById(id: string): CategoryPreset | undefined {
  return CATEGORY_PRESETS.find(preset => preset.id === id);
}

// Get default categories (classic preset)
export function getDefaultCategories(): string[] {
  const classic = getPresetById('classic');
  return classic?.categories.map(c => c.id) ?? [];
}
