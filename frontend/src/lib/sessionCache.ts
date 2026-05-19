/** Simple sessionStorage cache — avoids repeat API calls per tab session. */

export function readSessionCache<T>(key: string, ttlMs: number): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { timestamp: number; data: T };
    if (!parsed?.data || Date.now() - Number(parsed.timestamp || 0) > ttlMs) {
      sessionStorage.removeItem(key);
      return null;
    }
    return parsed.data;
  } catch {
    sessionStorage.removeItem(key);
    return null;
  }
}

export function writeSessionCache<T>(key: string, data: T) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), data }));
  } catch {
    /* quota — ignore */
  }
}
