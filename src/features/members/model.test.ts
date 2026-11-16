import { describe, it, expect } from 'vitest';
import { memberSchema, parseList, filterMembers } from './model';
import { seedMembers } from './api';
describe('directory contract', () => {
  it('validates required identity and email', () => {
    const member = seedMembers()[0];
    expect(memberSchema.safeParse(member).success).toBe(true);
    for (const patch of [{ name: '' }, { username: 'a b' }, { email: 'bad' }, { phone: 'abc' }])
      expect(memberSchema.safeParse({ ...member, ...patch }).success).toBe(false);
  });
  it('normalizes invalid URL parameters', () => {
    expect(parseList(new URLSearchParams('page=-3&status=unknown&sort=unknown'))).toMatchObject({
      page: 1,
      status: '',
      sort: 'newest',
    });
  });
  it('combines search, status and ordering without mutating records', () => {
    const records = seedMembers();
    const first = records[0].id;
    const result = filterMembers(records, {
      search: 'example.com',
      status: 'active',
      sort: 'az',
      page: 1,
    });
    expect(result.every((m) => m.status === 'active')).toBe(true);
    expect(result[0].name.localeCompare(result[1].name)).toBeLessThanOrEqual(0);
    expect(records[0].id).toBe(first);
    expect(
      filterMembers(records, { search: 'no-match', status: '', sort: 'newest', page: 1 }),
    ).toHaveLength(0);
  });
});
