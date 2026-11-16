import { createContext, useContext, useLayoutEffect, useState, type ReactNode } from 'react';
import { Direction } from 'radix-ui';
import { en, fa, type MessageKey } from './i18n/messages';
export type Preferences = {
  language: 'en' | 'fa';
  theme: 'system' | 'light' | 'dark';
  timezone: string;
  currency: string;
  calendar: 'gregory' | 'persian';
  numbering: 'latn' | 'arabext';
  density: 'comfortable' | 'compact';
};
const defaults: Preferences = {
  language: 'en',
  theme: 'system',
  timezone: 'Asia/Tehran',
  currency: 'USD',
  calendar: 'gregory',
  numbering: 'latn',
  density: 'comfortable',
};
function read(): Preferences {
  try {
    const p = JSON.parse(localStorage.getItem('dall.preferences') || '{}');
    return {
      language: p.language === 'fa' ? 'fa' : 'en',
      theme: ['light', 'dark'].includes(p.theme) ? p.theme : 'system',
      timezone: ['Asia/Tehran', 'UTC', 'Europe/London', 'America/New_York'].includes(p.timezone)
        ? p.timezone
        : defaults.timezone,
      currency: ['USD', 'EUR', 'IRR'].includes(p.currency) ? p.currency : 'USD',
      calendar: p.calendar === 'persian' ? 'persian' : 'gregory',
      numbering: p.numbering === 'arabext' ? 'arabext' : 'latn',
      density: p.density === 'compact' ? 'compact' : 'comfortable',
    };
  } catch {
    return defaults;
  }
}
const Context = createContext<{
  preferences: Preferences;
  update: (patch: Partial<Preferences>) => void;
}>({ preferences: defaults, update: () => {} });
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(read);
  const direction = preferences.language === 'fa' ? 'rtl' : 'ltr';
  useLayoutEffect(() => {
    document.documentElement.lang = preferences.language;
    document.documentElement.dir = direction;
    document.documentElement.dataset.density = preferences.density;
    const media = matchMedia('(prefers-color-scheme: dark)');
    const sync = () => {
      document.documentElement.dataset.theme =
        preferences.theme === 'system' ? (media.matches ? 'dark' : 'light') : preferences.theme;
    };
    sync();
    media.addEventListener('change', sync);
    try {
      localStorage.setItem('dall.preferences', JSON.stringify(preferences));
    } catch {
      /* Preferences still work in memory. */
    }
    return () => media.removeEventListener('change', sync);
  }, [preferences, direction]);
  return (
    <Context.Provider
      value={{ preferences, update: (patch) => setPreferences((p) => ({ ...p, ...patch })) }}
    >
      <Direction.Provider dir={direction}>{children}</Direction.Provider>
    </Context.Provider>
  );
}
export function useLocale() {
  const { preferences, update } = useContext(Context);
  const locale = `${preferences.language}-u-ca-${preferences.calendar}-nu-${preferences.numbering}`;
  const t = (key: MessageKey, vars: Record<string, string | number> = {}) => {
    const message: string =
      (preferences.language === 'fa' ? fa[key] : en[key]) || en[key] || en.error;
    return message.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
  };
  const number = (n: number) => new Intl.NumberFormat(locale).format(n);
  const date = (value: string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(
      new Date(`${value}T12:00:00Z`),
    );
  const timestamp = (value: Date) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: preferences.timezone,
    }).format(value);
  // Decimal canonical values are strings. No arithmetic is done on monetary values here.
  const money = (decimal: string) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: preferences.currency }).format(
      decimal as unknown as number,
    );
  const count = (n: number) =>
    t(
      new Intl.PluralRules(preferences.language).select(n) === 'one' ? 'count_one' : 'count_other',
      { count: number(n) },
    );
  return { preferences, update, t, locale, number, date, timestamp, money, count };
}
