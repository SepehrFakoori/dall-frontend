import { z } from 'zod';
export const departments = [
  'engineering',
  'operations',
  'finance',
  'people',
  'management',
] as const;
export const memberSchema = z.object({
  name: z.string().trim().min(2, 'invalidName').max(100, 'invalidName'),
  username: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9_.-]{3,50}$/, 'invalidUsername'),
  email: z.email('invalidEmail').max(254, 'invalidEmail'),
  phone: z
    .string()
    .refine(
      (v) =>
        !v ||
        (/^\+?[\d -]+$/.test(v) &&
          v.replace(/\D/g, '').length >= 7 &&
          v.replace(/\D/g, '').length <= 20),
      'invalidPhone',
    ),
  department: z.enum(departments),
  status: z.enum(['active', 'inactive']),
  notes: z.string().max(1000),
});
export type MemberInput = z.infer<typeof memberSchema>;
export type Member = MemberInput & { id: string; joined: string };
export type ListState = { search: string; status: string; sort: string; page: number };
export const PAGE_SIZE = 8;
export function parseList(params: URLSearchParams): ListState {
  return {
    search: params.get('q')?.slice(0, 100) || '',
    status: ['active', 'inactive'].includes(params.get('status') || '')
      ? params.get('status')!
      : '',
    sort: ['az', 'za'].includes(params.get('sort') || '') ? params.get('sort')! : 'newest',
    page: Math.min(100000, Math.max(1, Math.floor(Number(params.get('page')) || 1))),
  };
}
export function filterMembers(members: Member[], state: ListState, language = 'en') {
  const search = state.search.toLocaleLowerCase();
  return members
    .filter(
      (m) =>
        (!state.status || m.status === state.status) &&
        `${m.name} ${m.email} ${m.username}`.toLocaleLowerCase().includes(search),
    )
    .sort((a, b) =>
      state.sort === 'az'
        ? a.name.localeCompare(b.name, language)
        : state.sort === 'za'
          ? b.name.localeCompare(a.name, language)
          : b.joined.localeCompare(a.joined) || a.id.localeCompare(b.id),
    );
}
