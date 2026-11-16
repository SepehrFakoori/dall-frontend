import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router/dom';
import { PreferencesProvider } from './shared/preferences';
import { SessionProvider } from './shared/session';
import { router } from './app/router';
import './styles/tokens.css';
import './styles/app.css';
const client = new QueryClient();
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PreferencesProvider>
      <QueryClientProvider client={client}>
        <SessionProvider>
          <RouterProvider router={router} />
        </SessionProvider>
      </QueryClientProvider>
    </PreferencesProvider>
  </StrictMode>,
);
