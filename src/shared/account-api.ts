import { z } from 'zod';
import { ApiError, request } from './http';

export const profileSchema = z.object({
  first_name: z.string().trim().max(150, 'nameTooLong'),
  last_name: z.string().trim().max(150, 'nameTooLong'),
  email: z
    .string()
    .trim()
    .max(254, 'invalidEmail')
    .pipe(z.union([z.literal(''), z.email({ error: 'invalidEmail' })], { error: 'invalidEmail' })),
});
export type ProfileInput = z.infer<typeof profileSchema>;
export type Account = ProfileInput & { id: string; username: string };
type Credentials = { username: string; password: string };
type SessionResponse = { user: Account };
export const displayName = (user: Account) =>
  [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username;

export const demoMode = (import.meta.env.VITE_API_MODE || 'mock') === 'mock';
export const demoCredentials = { username: 'demo', password: 'Dall-Demo-2026' };
const demoSession = 'dall.demo.signed-in';
const demoProfile = 'dall.demo.profile.v1';
const seedProfile: ProfileInput = {
  first_name: 'Demo',
  last_name: 'Admin',
  email: 'demo@example.com',
};
function sampleAccount(): Account {
  let profile = seedProfile;
  try {
    const saved = profileSchema.safeParse(JSON.parse(localStorage.getItem(demoProfile) || 'null'));
    if (saved.success) profile = saved.data;
  } catch {
    /* A damaged sample profile can be replaced on the next save. */
  }
  return { ...profile, id: 'sample', username: demoCredentials.username };
}

interface AccountApi {
  current(signal?: AbortSignal): Promise<Account | null>;
  signIn(credentials: Credentials): Promise<Account>;
  signOut(): Promise<void>;
  save(profile: ProfileInput): Promise<Account>;
}

const demoApi: AccountApi = {
  async current() {
    return sessionStorage.getItem(demoSession) === 'yes' ? sampleAccount() : null;
  },
  async signIn({ username, password }) {
    if (username !== demoCredentials.username || password !== demoCredentials.password)
      throw new ApiError('unauthorized', 401);
    sessionStorage.setItem(demoSession, 'yes');
    return sampleAccount();
  },
  async signOut() {
    sessionStorage.removeItem(demoSession);
  },
  async save(values) {
    if (sessionStorage.getItem(demoSession) !== 'yes') throw new ApiError('unauthorized', 401);
    localStorage.setItem(demoProfile, JSON.stringify(profileSchema.parse(values)));
    return sampleAccount();
  },
};
const djangoApi: AccountApi = {
  async current(signal) {
    return (await request<{ user: Account | null }>('/auth/session/', { signal })).user;
  },
  async signIn(credentials) {
    return (
      await request<SessionResponse>('/auth/login/', {
        method: 'POST',
        body: JSON.stringify(credentials),
      })
    ).user;
  },
  signOut() {
    return request<void>('/auth/logout/', { method: 'POST' });
  },
  async save(values) {
    return (
      await request<SessionResponse>('/auth/profile/', {
        method: 'PATCH',
        body: JSON.stringify(values),
      })
    ).user;
  },
};
export const accountApi = demoMode ? demoApi : djangoApi;
