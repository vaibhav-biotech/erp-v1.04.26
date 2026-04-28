/**
 * Store Configuration Utility
 * 
 * Purpose: Detect which store is being accessed and provide store context to frontend
 * 
 * STEP 4: Option C Implementation - Frontend store detection
 * 
 * Features:
 * - Detects store from domain/localhost
 * - Provides store name for API headers
 * - Provides primary color for theme customization
 * - Handles development and production environments
 * 
 * Usage:
 *   import { getStoreFromDomain, getStoreConfig, addStoreHeader } from '@/lib/storeConfig';
 *   
 *   const storeName = getStoreFromDomain(); // 'plantsingarden', 'store2', etc.
 *   const config = getStoreConfig(); // full config object
 */

/**
 * Extract store name from current domain/hostname
 * 
 * Examples:
 * - localhost:3000 → 'localhost'
 * - plantsingarden.localhost:3000 → 'plantsingarden'
 * - plantsingarden.com → 'plantsingarden'
 * - store2.com → 'store2'
 */
const normalizeStoreName = (value: string): string => {
  const normalized = String(value || '').toLowerCase().trim();

  if (
    normalized === 'plants in garden'
    || normalized === 'plants-in-garden'
    || normalized === 'plantingarden'
  ) {
    return 'plantsingarden';
  }

  return normalized.replace(/\s+/g, '');
};

export const getStoreFromDomain = (): string => {
  if (typeof window === 'undefined') {
    // Server-side (during SSR/build)
    const store = process.env.NEXT_PUBLIC_STORE_NAME || 'plantsingarden';
    return normalizeStoreName(store);
  }

  try {
    const hostname = window.location.hostname;
    
    // For localhost development, use the env variable or default
    if (hostname.includes('localhost')) {
      const storeName = normalizeStoreName(process.env.NEXT_PUBLIC_STORE_NAME || 'plantsingarden');
      console.log(`[storeConfig] Development mode - using store: ${storeName}`);
      return storeName;
    }
    
    // Remove port if present (e.g., "plantsingarden.com:3000" → "plantsingarden.com")
    const hostWithoutPort = hostname.split(':')[0].toLowerCase();

    // Split by dots and get first part (subdomain)
    const parts = hostWithoutPort.split('.').filter(Boolean);
    let storeName = parts[0] || '';

    // Handle www domains (www.plantingarden.com -> plantingarden)
    if (storeName === 'www' && parts.length > 1) {
      storeName = parts[1];
    }
    
    storeName = normalizeStoreName(storeName);

    // Validate store name (alphanumeric, hyphen, underscore)
    const isValid = /^[a-z0-9-_]+$/.test(storeName);
    
    if (!isValid) {
      console.warn(`[storeConfig] Invalid store name detected: ${storeName}, using default`);
      return normalizeStoreName(process.env.NEXT_PUBLIC_STORE_NAME || 'plantsingarden');
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[storeConfig] Detected store: ${storeName} from hostname: ${hostname}`);
    }
    
    return storeName;
  } catch (error) {
    console.error(`[storeConfig] Error detecting store:`, error);
    return normalizeStoreName(process.env.NEXT_PUBLIC_STORE_NAME || 'plantsingarden');
  }
};

const getAdminStoreFromLocalStorage = (): string | null => {
  if (typeof window === 'undefined') return null;

  try {
    const rawAdmin = localStorage.getItem('admin');
    if (!rawAdmin || rawAdmin === 'undefined' || rawAdmin === 'null') return null;

    const parsedAdmin = JSON.parse(rawAdmin) as { storeName?: string | null };
    const adminStore = parsedAdmin?.storeName ? normalizeStoreName(String(parsedAdmin.storeName)) : '';

    if (!adminStore) return null;
    return adminStore;
  } catch {
    return null;
  }
};

export const getStoreForApi = (token?: string): string => {
  // For authenticated admin calls on shared ERP domain, prefer admin.storeName.
  // This prevents wrong store header like "erp-v1-...".
  if (token) {
    const adminStore = getAdminStoreFromLocalStorage();
    if (adminStore) return adminStore;
  }

  return getStoreFromDomain();
};

/**
 * Get full store configuration
 */
export const getStoreConfig = () => {
  const storeName = getStoreFromDomain();
  
  // Store color mapping (should match backend stores collection)
  const colorMap: Record<string, string> = {
    plantsingarden: '#22c55e', // green
    store2: '#3b82f6', // blue
    store3: '#f59e0b', // amber
    store4: '#ef4444', // red
    store5: '#8b5cf6', // violet
    store6: '#06b6d4', // cyan
    store7: '#10b981', // emerald
    store8: '#f97316', // orange
    store9: '#6366f1', // indigo
    store10: '#d946ef', // fuchsia
  };
  
  return {
    storeName,
    primaryColor: colorMap[storeName] || '#22c55e',
    domain: typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  };
};

/**
 * Create API headers with store context
 * 
 * Usage:
 *   const headers = getApiHeaders();
 *   const response = await fetch('/api/products', { headers });
 */
export const getApiHeaders = (
  token?: string
): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Store-Name': getStoreForApi(token),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

/**
 * Fetch wrapper that automatically adds store header
 * 
 * Usage:
 *   const response = await fetchWithStore('/api/products', {
 *     method: 'GET',
 *   });
 */
export const fetchWithStore = async (
  url: string,
  options: RequestInit & { token?: string } = {}
): Promise<Response> => {
  const { token, ...fetchOptions } = options;
  
  const headers = getApiHeaders(token);
  
  // Merge headers
  if (fetchOptions.headers) {
    Object.assign(headers, fetchOptions.headers);
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[API] ${options.method || 'GET'} ${url} with store: ${getStoreFromDomain()}`);
  }

  const resolvedUrl = /^https?:\/\//i.test(url) ? url : buildApiUrl(url);
  
  return fetch(resolvedUrl, {
    ...fetchOptions,
    headers,
  });
};

/**
 * Get API base URL (backend URL)
 */
export const getApiBaseUrl = (): string => {
  const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';

  try {
    const parsedUrl = new URL(rawUrl);
    const normalizedPath = parsedUrl.pathname.replace(/\/+$/, '');
    const safePath = !normalizedPath || normalizedPath === '/' || normalizedPath.startsWith('/api')
      ? ''
      : normalizedPath;

    return `${parsedUrl.origin}${safePath}`;
  } catch {
    return rawUrl.replace(/\/api(?:\/.*)?$/, '').replace(/\/+$/, '');
  }
};

/**
 * Build full API URL
 */
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

/**
 * Store config info (for debugging)
 */
export const getStoreDebugInfo = () => {
  if (typeof window === 'undefined') {
    return {
      environment: 'server',
      message: 'Store detection only works in browser',
    };
  }
  
  return {
    hostname: window.location.hostname,
    storeName: getStoreFromDomain(),
    storeConfig: getStoreConfig(),
    apiBaseUrl: getApiBaseUrl(),
    apiHeaders: getApiHeaders(),
  };
};
