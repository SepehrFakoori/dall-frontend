import { useState } from 'react';
import { Switch, Tabs } from 'radix-ui';
import { Icon } from '../../shared/icon';
import { departments } from '../members/model';
import { useLocale } from '../../shared/preferences';
import {
  Badge,
  Button,
  Combobox,
  Empty,
  Field,
  Help,
  Loading,
  Modal,
  PageHeader,
  Popover,
  useNotify,
} from '../../shared/ui';
const feedbackIcons = {
  info: 'info-circle',
  success: 'tick-circle',
  warning: 'danger',
  danger: 'warning-2',
} as const;

export function Component() {
  const { t, money } = useLocale();
  const notify = useNotify();
  const [department, setDepartment] = useState('engineering');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  return (
    <>
      <PageHeader title={t('components')} description={t('showcaseIntro')} />
      <div className="showcase">
        <section className="panel">
          <h2>{t('tokens')}</h2>
          <p className="muted">{t('tokenHint')}</p>
          <div className="swatches">
            {['primary', 'success', 'warning', 'danger', 'info'].map((color) => (
              <div key={color} className="swatch">
                <i style={{ background: `var(--${color})` }} />
                <span>{t(color === 'primary' ? 'primary' : (color as 'success'))}</span>
              </div>
            ))}
          </div>
          <hr />
          <div className="button-row">
            <Badge status="active" />
            <Badge status="inactive" />
          </div>
        </section>
        <section className="panel">
          <h2>{t('buttons')}</h2>
          <div className="button-row">
            <Button onClick={() => notify(t('sampleNotice'))}>{t('primary')}</Button>
            <Button variant="secondary" onClick={() => notify(t('sampleNotice'))}>
              {t('secondary')}
            </Button>
            <Button disabled>{t('disabled')}</Button>
            <Button loading>{t('loading')}</Button>
            <Help>{t('tooltip')}</Help>
          </div>
          <div className="form-grid">
            {(['info', 'success', 'warning', 'danger'] as const).map((type) => (
              <div key={type} className={`alert ${type}`}>
                <Icon name={feedbackIcons[type]} size={15} /> {t(type)}
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <h2>{t('fields')}</h2>
          <div className="form-grid">
            <Field label={t('text')}>
              {(props) => <input {...props} placeholder={t('sampleDescription')} />}
            </Field>
            <Field label={t('number')}>
              {(props) => <input {...props} type="number" inputMode="decimal" />}
            </Field>
            <Field label={t('amount')} hint={money('1234.50')}>
              {(props) => (
                <input
                  {...props}
                  type="text"
                  inputMode="decimal"
                  dir="ltr"
                  defaultValue="1234.50"
                  pattern="[0-9]+(\.[0-9]{1,2})?"
                />
              )}
            </Field>
            <Field label={t('password')}>
              {(props) => <input {...props} type="password" autoComplete="new-password" />}
            </Field>
            <Field label={t('notes')}>{(props) => <textarea {...props} rows={3} />}</Field>
            <div className="field">
              <span>{t('department')}</span>
              <Combobox
                label={t('searchDepartment')}
                options={departments.map((value) => ({ value, label: t(value) }))}
                value={department}
                onChange={setDepartment}
              />
            </div>
            <Field label={t('from')}>
              {(props) => (
                <input
                  {...props}
                  type="date"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              )}
            </Field>
            <Field
              label={t('to')}
              error={start && end && end < start ? t('endDateError') : undefined}
            >
              {(props) => (
                <input
                  {...props}
                  type="date"
                  min={start}
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
              )}
            </Field>
            <label className="choice-row">
              <input type="checkbox" />
              {t('checkbox')}
            </label>
            <fieldset>
              <legend>{t('select')}</legend>
              <label className="choice-row">
                <input type="radio" name="sample" defaultChecked />
                {t('optionA')}
              </label>
              <label className="choice-row">
                <input type="radio" name="sample" />
                {t('optionB')}
              </label>
            </fieldset>
            <label className="choice-row">
              <Switch.Root className="switch" aria-label={t('enabled')}>
                <Switch.Thumb />
              </Switch.Root>
              {t('enabled')}
            </label>
          </div>
        </section>
        <section className="panel">
          <h2>{t('overlays')}</h2>
          <div className="button-row">
            <Modal
              trigger={<Button variant="secondary">{t('dialog')}</Button>}
              title={t('dialogTitle')}
              description={t('dialogHint')}
            />
            <Modal
              drawer
              trigger={<Button variant="secondary">{t('drawer')}</Button>}
              title={t('dialogTitle')}
              description={t('dialogHint')}
            />
            <Popover.Root>
              <Popover.Trigger asChild>
                <Button variant="secondary">{t('popover')}</Button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content className="tooltip" sideOffset={5}>
                  {t('tooltip')}
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          </div>
          <Tabs.Root defaultValue="general" className="showcase-tabs">
            <Tabs.List className="tabs-list" aria-label={t('details')}>
              <Tabs.Trigger value="general">{t('general')}</Tabs.Trigger>
              <Tabs.Trigger value="loading">{t('loading')}</Tabs.Trigger>
              <Tabs.Trigger value="empty">{t('directory')}</Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="general">
              <p>{t('dialogHint')}</p>
            </Tabs.Content>
            <Tabs.Content value="loading">
              <Loading />
            </Tabs.Content>
            <Tabs.Content value="empty">
              <Empty />
            </Tabs.Content>
          </Tabs.Root>
        </section>
      </div>
    </>
  );
}
