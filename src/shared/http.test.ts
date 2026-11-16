import { afterEach, expect, it, vi } from 'vitest';
import { request } from './http';

afterEach(() => {
  vi.unstubAllGlobals();
  document.cookie = 'csrftoken=; Max-Age=0';
});

it('sends Django CSRF and caller headers on same-origin writes', async () => {
  document.cookie = 'csrftoken=test-value';
  const fetch = vi
    .fn<typeof globalThis.fetch>()
    .mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal('fetch', fetch);
  await request('/members', {
    method: 'PATCH',
    body: '{}',
    headers: new Headers({ 'If-Match': 'version-1' }),
  });
  const init = fetch.mock.calls[0][1];
  expect(init?.mode).toBe('same-origin');
  const headers = new Headers(init?.headers);
  expect(headers.get('If-Match')).toBe('version-1');
  expect(headers.get('X-CSRFToken')).toBe('test-value');
  expect(headers.get('Content-Type')).toBe('application/json');
});

it('normalizes an unreadable success response and preserves HTTP errors with a null body', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce(new Response('invalid JSON'))
      .mockResolvedValueOnce(new Response('null', { status: 403 })),
  );
  await expect(request('/members')).rejects.toMatchObject({ code: 'network' });
  await expect(request('/members')).rejects.toMatchObject({ code: 'forbidden', status: 403 });
});
