import { createContext, useContext, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { accountApi, demoMode, type Account, type ProfileInput } from './account-api';
import { ApiError } from './http';
import { ErrorState, Loading } from './ui';

export type Permission = 'member.read' | 'member.write';
const sessionKey = ['session'] as const;
type SessionValue = {
  user: Account | null;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (values: ProfileInput) => Promise<Account>;
  role: 'admin' | 'viewer';
  toggle: () => void;
  can: (permission: Permission) => boolean;
};
const Session = createContext<SessionValue | null>(null);
export function SessionProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const session = useQuery({
    queryKey: sessionKey,
    queryFn: ({ signal }) => accountApi.current(signal),
    refetchOnWindowFocus: 'always',
    retry: false,
  });
  const [role, setRole] = useState<'admin' | 'viewer'>('admin');
  async function accept(user: Account | null) {
    await client.cancelQueries({ queryKey: sessionKey });
    client.setQueryData(sessionKey, user);
  }
  if (session.isPending)
    return (
      <main>
        <Loading />
      </main>
    );
  // A transient background refresh failure should preserve the user's open form.
  if (
    session.data === undefined ||
    (session.error instanceof ApiError && session.error.status === 403)
  )
    return (
      <main>
        <ErrorState error={session.error} retry={() => void session.refetch()} />
      </main>
    );
  return (
    <Session.Provider
      value={{
        user: session.data,
        async signIn(username, password) {
          const user = await accountApi.signIn({ username, password });
          setRole('admin');
          await accept(user);
        },
        async signOut() {
          await accountApi.signOut();
          await accept(null);
        },
        async updateProfile(values) {
          try {
            const user = await accountApi.save(values);
            if (client.getQueryData<Account | null>(sessionKey)?.id === user.id) await accept(user);
            return user;
          } catch (error) {
            if (error instanceof ApiError && error.status === 401) await accept(null);
            throw error;
          }
        },
        role,
        toggle: () => {
          if (demoMode) setRole((r) => (r === 'admin' ? 'viewer' : 'admin'));
        },
        can: (permission) =>
          !!session.data && demoMode && (permission === 'member.read' || role === 'admin'),
      }}
    >
      {children}
    </Session.Provider>
  );
}
export function useSession() {
  const session = useContext(Session);
  if (!session) throw new Error('SessionProvider is required');
  return session;
}
