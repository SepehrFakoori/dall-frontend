export class ApiError extends Error {
  constructor(
    public code:
      'network' | 'unauthorized' | 'forbidden' | 'unavailable' | 'notFoundMember' | 'duplicate',
    public status = 0,
    public fields: Record<string, string> = {},
  ) {
    super(code);
  }
}
export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const csrf = document.cookie
    .split('; ')
    .find((part) => part.startsWith('csrftoken='))
    ?.split('=')
    .slice(1)
    .join('=');
  try {
    const headers = new Headers(options.headers);
    if (typeof options.body === 'string' && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    const method = (options.method ?? 'GET').toUpperCase();
    if (csrf && !['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(method)) {
      headers.set('X-CSRFToken', decodeURIComponent(csrf));
    }
    const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}${path}`, {
      ...options,
      mode: 'same-origin',
      credentials: 'same-origin',
      headers,
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status === 401
          ? 'unauthorized'
          : response.status === 403
            ? 'forbidden'
            : 'network',
        response.status,
        body?.fields ?? {},
      );
    }
    return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
  } catch (error) {
    if (error instanceof ApiError || (error instanceof DOMException && error.name === 'AbortError'))
      throw error;
    throw new ApiError('network');
  }
}
// Wire this to your reporter. Report codes and route templates only, never records or credentials.
export function reportError(error: unknown) {
  window.dispatchEvent(
    new CustomEvent('dall:error', {
      detail: { code: error instanceof ApiError ? error.code : 'unexpected' },
    }),
  );
}
