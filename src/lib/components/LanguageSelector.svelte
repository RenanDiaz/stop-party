<script lang="ts">
  import { locale, setLocale } from '$lib/stores/i18n';

  let currentLocale = $state('es');

  $effect(() => {
    const unsubscribe = locale.subscribe((value) => {
      if (value) currentLocale = value;
    });
    return unsubscribe;
  });

  function toggleLocale() {
    const newLocale = currentLocale === 'es' ? 'en' : 'es';
    setLocale(newLocale);
  }
</script>

<button
  onclick={toggleLocale}
  class="flex items-center gap-2 px-3 py-1.5 bg-bg-secondary rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
  title={currentLocale === 'es' ? 'Switch to English' : 'Cambiar a Español'}
>
  <span class="text-lg">{currentLocale === 'es' ? '🇪🇸' : '🇺🇸'}</span>
  <span class="uppercase">{currentLocale}</span>
</button>
