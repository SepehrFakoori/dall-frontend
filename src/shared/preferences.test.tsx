import { render, screen, fireEvent } from '@testing-library/react';
import { it, expect } from 'vitest';
import { PreferencesProvider, useLocale } from './preferences';
function Probe() {
  const { t, update, date, count } = useLocale();
  return (
    <>
      <button onClick={() => update({ language: 'fa', theme: 'dark' })}>{t('settings')}</button>
      <span>{date('2026-11-16')}</span>
      <span>{count(2)}</span>
    </>
  );
}
it('switches language, document direction and theme and persists preferences', () => {
  localStorage.clear();
  render(
    <PreferencesProvider>
      <Probe />
    </PreferencesProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
  expect(document.documentElement.dir).toBe('rtl');
  expect(document.documentElement.lang).toBe('fa');
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(screen.getByRole('button', { name: 'تنظیمات' })).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem('dall.preferences')!).language).toBe('fa');
});
