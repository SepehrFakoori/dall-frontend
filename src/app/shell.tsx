import { useEffect, useRef, useState } from 'react';
import { NavLink, Link, Outlet, useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  Users,
  UserRound,
  Settings2,
  PanelsTopLeft,
  ArrowUpRight,
  Menu,
  ChevronRight,
  Sprout,
  Building2,
  CircleHelp,
  X,
} from 'lucide-react';
import { Dialog } from 'radix-ui';
import { useMutation } from '@tanstack/react-query';
import { demoMode, displayName } from '../shared/account-api';
import { useLocale } from '../shared/preferences';
import { useSession } from '../shared/session';
import { ActionMenu, Avatar, Modal } from '../shared/ui';
export function Shell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t, preferences } = useLocale();
  const { user, role, toggle, can, signOut } = useSession();
  const logout = useMutation({ mutationFn: signOut });
  const location = useLocation();
  const navigate = useNavigate();
  const main = useRef<HTMLElement>(null);
  const section = location.pathname.startsWith('/members')
    ? 'members'
    : location.pathname === '/settings'
      ? 'settings'
      : location.pathname === '/account'
        ? 'myAccount'
        : location.pathname === '/components'
          ? 'components'
          : 'overview';
  useEffect(() => {
    document.title = `${t(section)} · ${t('app')}`;
    main.current?.focus();
  }, [location.pathname, preferences.language]); // eslint-disable-line react-hooks/exhaustive-deps
  const nav = (
    <>
      <div className="brand">
        <span className="brand-mark">
          <Sprout size={23} />
        </span>
        <span>
          {t('app')}
          <small>{t('workspace')}</small>
        </span>
      </div>
      <div className="company">
        <span className="company-icon">
          <Building2 size={19} />
        </span>
        <div>
          <strong>{t('company')}</strong>
          {demoMode && <small>{t('demo')}</small>}
        </div>
      </div>
      <p className="nav-label">{t('workspace')}</p>
      <nav aria-label={t('workspace')}>
        {demoMode && (
          <NavLink end to="/" onClick={() => setMobileOpen(false)}>
            <LayoutDashboard size={18} />
            {t('overview')}
          </NavLink>
        )}
        {can('member.read') && (
          <NavLink to="/members" onClick={() => setMobileOpen(false)}>
            <Users size={18} />
            {t('members')}
            <span className="nav-dot" />
          </NavLink>
        )}
      </nav>
      <p className="nav-label">{t('administration')}</p>
      <nav aria-label={t('administration')}>
        <NavLink to="/account" onClick={() => setMobileOpen(false)}>
          <UserRound size={18} />
          {t('myAccount')}
        </NavLink>
        <NavLink to="/settings" onClick={() => setMobileOpen(false)}>
          <Settings2 size={18} />
          {t('settings')}
        </NavLink>
        {import.meta.env.DEV && (
          <NavLink to="/components" onClick={() => setMobileOpen(false)}>
            <PanelsTopLeft size={18} />
            {t('components')}
          </NavLink>
        )}
      </nav>
      <div className="sidebar-bottom">
        <div className="workspace-note">
          <span className="note-icon">
            <Sprout size={20} />
          </span>
          <strong>{t('orgHint')}</strong>
          <p>{t('orgBody')}</p>
        </div>
        {demoMode && (
          <Modal
            trigger={
              <button className="help-link">
                <CircleHelp size={17} />
                {t('learnMore')}
                <ArrowUpRight size={15} className="directional" />
              </button>
            }
            title={t('learnMore')}
            description={t('aboutDemo')}
          />
        )}
      </div>
    </>
  );
  return (
    <>
      <a className="skip-link" href="#main">
        {t('skip')}
      </a>
      <div className="app-shell">
        <aside className="sidebar">{nav}</aside>
        <div className="workspace-content">
          <header className="topbar">
            <div className="top-context">
              <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
                <Dialog.Trigger asChild>
                  <button className="icon-button mobile-menu" aria-label={t('openNav')}>
                    <Menu size={20} />
                  </button>
                </Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Overlay className="overlay" />
                  <Dialog.Content className="mobile-sidebar" aria-describedby={undefined}>
                    <Dialog.Title className="sr-only">{t('workspace')}</Dialog.Title>
                    {nav}
                    <Dialog.Close asChild>
                      <button aria-label={t('close')} className="icon-button dialog-close">
                        <X size={18} />
                      </button>
                    </Dialog.Close>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
              <span className="top-company">{t('company')}</span>
              <ChevronRight size={14} className="directional" />
              <span>{t(section)}</span>
            </div>
            <div className="top-actions">
              {demoMode && (
                <span className="demo-indicator">
                  <span className="status-dot" />
                  {t('demo')}
                </span>
              )}
              {user && <Avatar name={displayName(user)} small />}
              <ActionMenu
                label={t('account')}
                items={[
                  { label: t('myAccount'), onSelect: () => navigate('/account') },
                  { label: t('settings'), onSelect: () => navigate('/settings') },
                  ...(demoMode
                    ? [
                        {
                          label: `${t('switchRole')} · ${t(role === 'admin' ? 'viewer' : 'admin')}`,
                          onSelect: toggle,
                        },
                      ]
                    : []),
                  {
                    label: t('signOut'),
                    disabled: logout.isPending,
                    onSelect: () => logout.mutate(),
                  },
                ]}
              />
            </div>
          </header>
          <main id="main" ref={main} tabIndex={-1} className="main-content">
            {logout.isError && (
              <p role="alert" className="alert danger">
                {t('signOutFailed')}
              </p>
            )}
            <nav className="breadcrumbs" aria-label={t('home')}>
              <Link to="/">{t('workspace')}</Link>
              <ChevronRight size={12} className="directional" />
              <span aria-current="page">{t(section)}</span>
            </nav>
            {role === 'viewer' && <div className="alert info">{t('readOnly')}</div>}
            <Outlet />
          </main>
          <footer className="workspace-footer">
            <span>{t('company')}</span>
            {demoMode && <span>{t('demoNote')}</span>}
          </footer>
        </div>
      </div>
    </>
  );
}
