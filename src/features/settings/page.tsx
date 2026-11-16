import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Monitor, Moon, Sun, Globe2, Palette, Wrench } from 'lucide-react';
import { useLocale, type Preferences } from '../../shared/preferences';
import { useSession } from '../../shared/session';
import { demoMode } from '../../shared/account-api';
import { Button, Confirm, Field, PageHeader, useNotify } from '../../shared/ui';
import { failNextRequest, memberApi, memberKeys } from '../members/api';
export function Component() {
  const { t, preferences, update, date, timestamp, money } = useLocale();
  const { role, toggle, can } = useSession();
  const notify = useNotify();
  const client = useQueryClient();
  const [reset, setReset] = useState(false);
  const restore = useMutation({
    mutationFn: memberApi.reset,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: memberKeys.all });
      notify(t('resetDone'));
      setReset(false);
    },
  });
  const select = <K extends keyof Preferences>(
    key: K,
    options: { value: Preferences[K]; label: string }[],
  ) => (
    <Field label={t(key)}>
      {(props) => (
        <select
          {...props}
          value={preferences[key]}
          onChange={(e) => update({ [key]: e.target.value })}
        >
          {options.map((option) => (
            <option key={String(option.value)} value={String(option.value)}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
  return (
    <>
      <PageHeader title={t('preferences')} description={t('preferencesIntro')} />
      <div className="settings-stack">
        <section className="panel settings-section">
          <div className="settings-title">
            <Palette size={20} />
            <div>
              <h2>{t('appearance')}</h2>
              <p>{t('appearanceHint')}</p>
            </div>
          </div>
          <fieldset className="theme-options">
            <legend>{t('theme')}</legend>
            {[
              { value: 'light', icon: Sun },
              { value: 'dark', icon: Moon },
              { value: 'system', icon: Monitor },
            ].map(({ value, icon: Icon }) => (
              <label key={value} className={preferences.theme === value ? 'selected' : ''}>
                <input
                  type="radio"
                  name="theme"
                  checked={preferences.theme === value}
                  onChange={() => update({ theme: value as Preferences['theme'] })}
                />
                <Icon size={22} />
                <span>{t(value as 'light')}</span>
              </label>
            ))}
          </fieldset>
          {select('density', [
            { value: 'comfortable', label: t('comfortable') },
            { value: 'compact', label: t('compact') },
          ])}
        </section>
        <section className="panel settings-section">
          <div className="settings-title">
            <Globe2 size={20} />
            <div>
              <h2>{t('regional')}</h2>
              <p>{t('regionalHint')}</p>
            </div>
          </div>
          <div className="form-grid">
            {select('language', [
              { value: 'en', label: 'English' },
              { value: 'fa', label: 'فارسی' },
            ])}
            {select(
              'timezone',
              ['Asia/Tehran', 'UTC', 'Europe/London', 'America/New_York'].map((value) => ({
                value,
                label: value,
              })),
            )}
            {select(
              'currency',
              ['USD', 'EUR', 'IRR'].map((value) => ({ value, label: value })),
            )}
            {select('calendar', [
              { value: 'gregory', label: t('gregory') },
              { value: 'persian', label: t('persian') },
            ])}
            {select('numbering', [
              { value: 'latn', label: t('latn') },
              { value: 'arabext', label: t('arabext') },
            ])}
          </div>
          <div className="format-preview">
            <h3>{t('preview')}</h3>
            <dl>
              <div>
                <dt>{t('date')}</dt>
                <dd>{date('2026-11-16')}</dd>
              </div>
              <div>
                <dt>{t('amount')}</dt>
                <dd>{money('12345.67')}</dd>
              </div>
              <div>
                <dt>{t('time')}</dt>
                <dd>{timestamp(new Date('2026-11-16T08:30:00Z'))}</dd>
              </div>
            </dl>
          </div>
          <p className="muted">{t('preferencesSaved')}</p>
        </section>
        {demoMode && (
          <section className="panel settings-section">
            <div className="settings-title">
              <Wrench size={20} />
              <div>
                <h2>{t('demoTools')}</h2>
                <p>{t('demoToolsHint')}</p>
              </div>
            </div>
            <p>{t('aboutDemo')}</p>
            <div className="button-row">
              <Button variant="secondary" onClick={toggle}>
                {t('switchRole')} · {t(role === 'admin' ? 'admin' : 'viewer')}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  failNextRequest();
                  notify(t('failureArmed'));
                }}
              >
                {t('failNext')}
              </Button>
              {can('member.write') && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    restore.reset();
                    setReset(true);
                  }}
                >
                  {t('reset')}
                </Button>
              )}
            </div>
            <p className="muted">{t('failureHint')}</p>
          </section>
        )}
      </div>
      <Confirm
        open={reset && can('member.write')}
        onOpenChange={setReset}
        title={t('resetTitle')}
        description={t('resetHint')}
        confirm={t('resetConfirm')}
        busy={restore.isPending}
        error={restore.error}
        onConfirm={() => restore.mutate()}
      />
    </>
  );
}
