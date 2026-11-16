import { queryOptions } from '@tanstack/react-query';
import { ApiError } from '../../shared/http';
import { memberSchema, type Member, type MemberInput, departments } from './model';
const names = [
  'Sara Ahmadi',
  'Daniel Foster',
  'Niloofar Karimi',
  'James Chen',
  'Maryam Hosseini',
  'Oliver Grant',
  'Leila Rahimi',
  'Amir Rezaei',
  'Emma Wilson',
  'Reza Mohammadi',
  'Sofia Martin',
  'Arman Nazari',
  'Mina Tavakoli',
  'Noah Park',
  'Yasmin Sadeghi',
  'Lucas Moreau',
  'Ava Thompson',
  'Ali Moradi',
  'Nora Bennett',
  'Kian Farhadi',
  'Zahra Amiri',
  'Leo Mitchell',
  'Tara Ebrahimi',
  'Ryan Cooper',
];
export function seedMembers(): Member[] {
  return names.map((name, i) => ({
    id: `M-${String(i + 1).padStart(4, '0')}`,
    name,
    username: name.toLowerCase().replace(' ', '.'),
    email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
    phone: '',
    department: departments[i % departments.length],
    status: i % 7 === 6 ? 'inactive' : 'active',
    notes: '',
    joined: `2026-${String(11 - Math.floor(i / 4)).padStart(2, '0')}-${String(15 - (i % 4)).padStart(2, '0')}`,
  }));
}
const key = 'dall.demo.members.v1';
let memory: Member[] | undefined;
let fail = false;
export function failNextRequest() {
  fail = true;
}
async function delay(signal?: AbortSignal) {
  if (import.meta.env.VITE_API_MODE && import.meta.env.VITE_API_MODE !== 'mock')
    throw new ApiError('unavailable');
  await new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('Aborted', 'AbortError'));
    const abort = () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', abort);
      resolve();
    }, 260);
    signal?.addEventListener('abort', abort, { once: true });
  });
  if (fail) {
    fail = false;
    throw new ApiError('network');
  }
}
function read(): Member[] {
  if (memory) return memory;
  try {
    const stored = JSON.parse(localStorage.getItem(key) || 'null');
    if (
      Array.isArray(stored) &&
      stored.every(
        (m) =>
          memberSchema.safeParse(m).success &&
          typeof m.id === 'string' &&
          /^\d{4}-\d{2}-\d{2}$/.test(m.joined),
      )
    )
      return (memory = stored);
  } catch {
    /* Start with safe sample records. */
  }
  return (memory = seedMembers());
}
function write(value: Member[]) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    throw new ApiError('network');
  }
  memory = value;
}
export const memberApi = {
  async list(signal?: AbortSignal) {
    await delay(signal);
    return [...read()];
  },
  async get(id: string, signal?: AbortSignal) {
    await delay(signal);
    const member = read().find((m) => m.id === id);
    if (!member) throw new ApiError('notFoundMember', 404);
    return member;
  },
  async save(input: MemberInput, id?: string) {
    await delay();
    const parsed = memberSchema.parse(input);
    const all = read();
    if (all.some((m) => m.id !== id && m.email.toLowerCase() === parsed.email.toLowerCase()))
      throw new ApiError('duplicate', 409, { email: 'duplicate' });
    const current = id ? all.find((m) => m.id === id) : undefined;
    if (id && !current) throw new ApiError('notFoundMember', 404);
    const member: Member = {
      ...parsed,
      id: id || `M-${crypto.randomUUID().slice(0, 8)}`,
      joined: current?.joined || new Date().toISOString().slice(0, 10),
    };
    write(current ? all.map((m) => (m.id === id ? member : m)) : [member, ...all]);
    return member;
  },
  async deactivate(ids: string[]) {
    await delay();
    write(read().map((m) => (ids.includes(m.id) ? { ...m, status: 'inactive' } : m)));
  },
  async reset() {
    await delay();
    write(seedMembers());
  },
};
export const memberKeys = {
  all: ['members'] as const,
  detail: (id: string) => ['members', id] as const,
};
export const membersQuery = () =>
  queryOptions({ queryKey: memberKeys.all, queryFn: ({ signal }) => memberApi.list(signal) });
export const memberQuery = (id: string) =>
  queryOptions({
    queryKey: memberKeys.detail(id),
    queryFn: ({ signal }) => memberApi.get(id, signal),
  });
