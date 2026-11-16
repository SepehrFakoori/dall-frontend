import { describe, it, expect } from 'vitest';
import { memberApi, failNextRequest, seedMembers } from './api';
describe('mock API', () => {
  it('reports a failure once and recovers', async () => {
    failNextRequest();
    await expect(memberApi.list()).rejects.toMatchObject({ code: 'network' });
    await expect(memberApi.list()).resolves.toHaveLength(24);
  });
  it('cancels pending reads', async () => {
    const controller = new AbortController();
    const request = memberApi.list(controller.signal);
    controller.abort();
    await expect(request).rejects.toMatchObject({ name: 'AbortError' });
  });
  it('creates, rejects duplicates, edits and deactivates stable identities', async () => {
    const input = { ...seedMembers()[0], email: 'test@example.com', name: 'Test Person' };
    const saved = await memberApi.save(input);
    expect(saved.id).not.toBe(input.id);
    await expect(memberApi.save(input)).rejects.toMatchObject({ fields: { email: 'duplicate' } });
    const edited = await memberApi.save({ ...input, name: 'Edited Person' }, saved.id);
    expect(edited.id).toBe(saved.id);
    await memberApi.deactivate([saved.id]);
    expect((await memberApi.get(saved.id)).status).toBe('inactive');
    await memberApi.reset();
  });
});
