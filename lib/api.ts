import { Platform } from 'react-native';
import { getAccessToken } from '@/lib/session';

export const API_BASE_URL =
  Platform.select({
    android: 'http://10.0.2.2:3000',
    default: 'http://localhost:3000',
  }) ?? 'http://localhost:3000';

type ApiFetchOptions = RequestInit & { auth?: boolean };
const API_TIMEOUT_MS = 10000;

export function toAbsoluteImageUrl(path: string | null | undefined, fallback?: string) {
  const normalize = (value?: string) => {
    const cleaned = String(value || '').trim();
    if (!cleaned) return '';
    if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) return cleaned;
    const raw = cleaned.replace(/^\/+/, '');
    return `${API_BASE_URL}/${raw}`;
  };

  return normalize(path) || normalize(fallback) || undefined;
}

export async function apiFetch(path: string, options: ApiFetchOptions = {}) {
  const { auth = true, headers, ...rest } = options;
  const token = getAccessToken();
  const authHeaders =
    auth && token ? ({ Authorization: `Bearer ${token}` } as Record<string, string>) : {};
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    return await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      signal: rest.signal ?? controller.signal,
      headers: {
        ...authHeaders,
        ...(headers || {}),
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}
