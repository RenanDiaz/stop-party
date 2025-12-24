import { browser } from '$app/environment';
import { init, register, locale, _ } from 'svelte-i18n';

// Register locales
register('es', () => import('$lib/i18n/es.json'));
register('en', () => import('$lib/i18n/en.json'));

// Initialize i18n
export function initI18n(): void {
  const storedLocale = browser ? localStorage.getItem('stopparty_locale') : null;

  // Detect browser locale, prefer Spanish for es-* locales
  let initialLocale = 'es';
  if (browser && !storedLocale) {
    const browserLang = navigator.language.toLowerCase();
    if (!browserLang.startsWith('es')) {
      initialLocale = 'en';
    }
  }

  init({
    fallbackLocale: 'es',
    initialLocale: storedLocale ?? initialLocale
  });
}

// Set locale and persist
export function setLocale(newLocale: string): void {
  locale.set(newLocale);
  if (browser) {
    localStorage.setItem('stopparty_locale', newLocale);
  }
}

// Get current locale
export function getLocale(): string {
  let currentLocale = 'es';
  locale.subscribe((value) => {
    if (value) currentLocale = value;
  })();
  return currentLocale;
}

// Re-export for convenience
export { locale, _ };
