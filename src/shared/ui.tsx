import {
  createContext,
  useContext,
  useId,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react';
import { AlertDialog, Dialog, Direction, DropdownMenu, Tooltip, Tabs, Popover } from 'radix-ui';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  Loader2,
  MoreHorizontal,
  Search,
  Users,
  X,
} from 'lucide-react';
import { useLocale } from './preferences';
import type { MessageKey } from './i18n/messages';
import { ApiError } from './http';
export { Tabs, Popover };
export function Button({
  variant = 'primary',
  loading,
  children,
  className = '',
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
}) {
  return (
    <button
      {...props}
      className={`button ${variant} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading && <Loader2 className="spin" size={16} />}
      {children}
    </button>
  );
}
export function Field({
  label,
  required,
  hint,
  error,
  children,
  id,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: (props: {
    id: string;
    'aria-describedby'?: string;
    'aria-invalid'?: true;
  }) => ReactNode;
  id?: string;
}) {
  const uid = useId();
  const fieldId = id || uid;
  return (
    <div className="field">
      <label htmlFor={fieldId}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {children({
        id: fieldId,
        'aria-describedby': error || hint ? `${fieldId}-help` : undefined,
        'aria-invalid': error ? true : undefined,
      })}
      {(error || hint) && (
        <small id={`${fieldId}-help`} className={error ? 'field-error' : 'muted'}>
          {error || hint}
        </small>
      )}
    </div>
  );
}
export function Badge({ status }: { status: 'active' | 'inactive' }) {
  const { t } = useLocale();
  return (
    <span className={`badge ${status}`}>
      <span aria-hidden="true" className="status-dot" />
      {t(status)}
    </span>
  );
}
export function Avatar({ name, small = false }: { name: string; small?: boolean }) {
  return (
    <span aria-hidden="true" className={`avatar ${small ? 'small' : ''}`}>
      {name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')}
    </span>
  );
}
export function PageHeader({
  title,
  description,
  action,
  eyebrow,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>
          <bdi>{title}</bdi>
        </h1>
        <p className="muted">{description}</p>
      </div>
      {action}
    </header>
  );
}
export function Loading() {
  const { t } = useLocale();
  return (
    <div role="status" aria-label={t('loading')} className="loading-state">
      <div className="skeleton" />
      <div className="skeleton" />
      <div className="skeleton" />
      <span>{t('loading')}</span>
    </div>
  );
}
export function ErrorState({ error, retry }: { error?: unknown; retry?: () => void }) {
  const { t } = useLocale();
  const key = error instanceof ApiError ? error.code : 'error';
  return (
    <div className="state" role="alert">
      <AlertCircle />
      <h2>{t(key)}</h2>
      {retry && (
        <Button variant="secondary" onClick={retry}>
          {t('retry')}
        </Button>
      )}
    </div>
  );
}
export function Empty({ filtered, action }: { filtered?: boolean; action?: ReactNode }) {
  const { t } = useLocale();
  return (
    <div className="state">
      <span className="empty-icon">
        <Users />
      </span>
      <h2>{t(filtered ? 'noResults' : 'empty')}</h2>
      <p className="muted">{t(filtered ? 'noResultsHint' : 'emptyHint')}</p>
      {action}
    </div>
  );
}
export function Help({ children }: { children: ReactNode }) {
  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button className="icon-button" type="button">
            <AlertCircle size={16} />
            <span className="sr-only">{children}</span>
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="tooltip" sideOffset={6}>
            {children}
            <Tooltip.Arrow />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
export function ActionMenu({
  label,
  items,
  icon = true,
}: {
  label: string;
  items: { label: string; onSelect: () => void; danger?: boolean; disabled?: boolean }[];
  icon?: boolean;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className={icon ? 'icon-button' : 'button secondary'} aria-label={label}>
          {icon ? (
            <MoreHorizontal size={18} />
          ) : (
            <>
              {label}
              <ChevronDown size={14} />
            </>
          )}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" className="menu" sideOffset={6}>
          {items.map((item) => (
            <DropdownMenu.Item
              key={item.label}
              disabled={item.disabled}
              onSelect={item.onSelect}
              className={item.danger ? 'danger-text' : ''}
            >
              {item.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
export function Confirm({
  open,
  onOpenChange,
  title,
  description,
  confirm,
  onConfirm,
  busy,
  error,
  destructive = true,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirm: string;
  onConfirm: () => void;
  busy?: boolean;
  error?: Error | null;
  destructive?: boolean;
}) {
  const { t } = useLocale();
  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(value) => {
        if (!busy) onOpenChange(value);
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="overlay" />
        <AlertDialog.Content className="dialog">
          <AlertDialog.Title>{title}</AlertDialog.Title>
          <AlertDialog.Description>{description}</AlertDialog.Description>
          {error && (
            <p className="alert danger" role="alert">
              {t(error instanceof ApiError ? error.code : 'error')}
            </p>
          )}
          <div className="dialog-actions">
            <AlertDialog.Cancel asChild>
              <Button variant="secondary" disabled={busy}>
                {t('cancel')}
              </Button>
            </AlertDialog.Cancel>
            <Button variant={destructive ? 'danger' : 'primary'} onClick={onConfirm} loading={busy}>
              {confirm}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
export function Modal({
  trigger,
  title,
  description,
  children,
  drawer = false,
}: {
  trigger: ReactNode;
  title: string;
  description: string;
  children?: ReactNode;
  drawer?: boolean;
}) {
  const { t } = useLocale();
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay" />
        <Dialog.Content className={drawer ? 'drawer' : 'dialog'}>
          <Dialog.Title>{title}</Dialog.Title>
          <Dialog.Description>{description}</Dialog.Description>
          {children}
          <Dialog.Close asChild>
            <button className="icon-button dialog-close" aria-label={t('close')}>
              <X size={18} />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
const Notice = createContext<(message: string) => void>(() => {});
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<{ id: number; message: string } | null>(null);
  return (
    <Notice.Provider value={(message) => setNotice({ id: Date.now(), message })}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {notice && (
          <div className="toast" key={notice.id}>
            <CheckCircle2 size={18} />
            <span>{notice.message}</span>
            <Dismiss onClick={() => setNotice(null)} />
          </div>
        )}
      </div>
    </Notice.Provider>
  );
}
function Dismiss({ onClick }: { onClick: () => void }) {
  const { t } = useLocale();
  return (
    <button className="icon-button" aria-label={t('close')} onClick={onClick}>
      <X size={16} />
    </button>
  );
}
export const useNotify = () => useContext(Notice);
export function Combobox({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const id = useId();
  const dir = Direction.useDirection();
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button id={id} type="button" className="control combo" aria-label={label}>
          {options.find((o) => o.value === value)?.label || label}
          <ChevronDown size={16} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content dir={dir} className="menu combo-menu" align="start" sideOffset={5}>
          <label className="search-box">
            <Search size={16} />
            <input
              dir="auto"
              aria-label={label}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="combo-options">
            {options
              .filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
              .map((o) => (
                <button
                  type="button"
                  key={o.value}
                  aria-pressed={o.value === value}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                    setQuery('');
                  }}
                >
                  {o.label}
                  {o.value === value && <Check size={15} />}
                </button>
              ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
export function TranslationError({ message }: { message?: string }) {
  const { t } = useLocale();
  return message ? <>{t(message as MessageKey)}</> : null;
}
