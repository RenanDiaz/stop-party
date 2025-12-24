import { browser } from '$app/environment';
import { init, register, locale, _, waitLocale } from 'svelte-i18n';

// Register locales
register('es', () => import('$lib/i18n/es.json'));
register('en', () => import('$lib/i18n/en.json'));

// Initialize i18n
export async function initI18n(): Promise<void> {
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

  // Wait for the locale to be fully loaded before returning
  await waitLocale();
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
