import { createBrowserRouter, Link, Navigate, useLocation, useRouteError } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Shell } from './shell';
import { useLocale } from '../shared/preferences';
import { ErrorState, Loading, NotificationProvider } from '../shared/ui';
import { useEffect, useState } from 'react';
import { ApiError, reportError } from '../shared/http';
import { useSession } from '../shared/session';
import { demoMode } from '../shared/account-api';

function PrivateWorkspace() {
  const { user } = useSession();
  const location = useLocation();
  if (!user)
    return (
      <Navigate
        replace
        to="/login"
        state={{ from: location.pathname + location.search + location.hash }}
      />
    );
  if (!demoMode && location.pathname === '/') return <Navigate replace to="/account" />;
  return <Workspace key={user.id} />;
}
function Workspace() {
  // Discard the workspace cache and its notifications when the account changes.
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: (count, err) => count < 1 && err instanceof ApiError && err.status >= 500,
            refetchOnWindowFocus: false,
          },
          mutations: { retry: false },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <NotificationProvider>
        <Shell />
      </NotificationProvider>
    </QueryClientProvider>
  );
}
function RouteError() {
  const error = useRouteError();
  const { t } = useLocale();
  useEffect(() => reportError(error), [error]);
  return (
    <main className="recovery">
      <ErrorState error={error} />
      <a href="/">{t('backHome')}</a>
    </main>
  );
}
function Missing() {
  const { t } = useLocale();
  return (
    <div className="state">
      <h1>{t('notFound')}</h1>
      <Link to="/">{t('backHome')}</Link>
    </div>
  );
}
export const router = createBrowserRouter([
  {
    path: '/login',
    lazy: () => import('../features/account/login-page'),
    HydrateFallback: Loading,
    ErrorBoundary: RouteError,
  },
  {
    path: '/',
    Component: PrivateWorkspace,
    HydrateFallback: Loading,
    ErrorBoundary: RouteError,
    children: [
      { index: true, lazy: () => import('../features/overview/page') },
      { path: 'account', lazy: () => import('../features/account/profile-page') },
      { path: 'members', lazy: () => import('../features/members/list-page') },
      { path: 'members/new', lazy: () => import('../features/members/form-page') },
      { path: 'members/:id', lazy: () => import('../features/members/detail-page') },
      { path: 'members/:id/edit', lazy: () => import('../features/members/form-page') },
      { path: 'settings', lazy: () => import('../features/settings/page') },
      ...(import.meta.env.DEV
        ? [{ path: 'components', lazy: () => import('../features/showcase/page') }]
        : []),
      { path: '*', Component: Missing },
    ],
  },
]);
