const getDefaultApiUrl = () => {
  if (typeof window === 'undefined') {
    return import.meta.env.VITE_API_URL || '/kahoot-builder/api';
  }
  return `${window.location.origin}${import.meta.env.VITE_API_PATH || '/kahoot-builder/api'}`;
};

const shouldOverrideApiUrl = (apiUrl: string | undefined) => {
  if (!apiUrl) {
    return true;
  }

  return false;
};

export const getApiBaseUrl = () =>
  shouldOverrideApiUrl(import.meta.env.VITE_API_URL)
    ? getDefaultApiUrl()
    : import.meta.env.VITE_API_URL || getDefaultApiUrl();

import type { ErrorCode } from '../../types/auth.types';

export class ApiError extends Error {
  constructor(
    public status: number, 
    message: string, 
    public code?: ErrorCode, 
    public details?: any, 
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const BASE_URL = getApiBaseUrl();
  const url = `${BASE_URL}${path}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Important for HttpOnly cookies
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? `No se pudo conectar al backend (${error.message}). Revisa que el servidor de API esté corriendo y que la URL de ${url} sea accesible desde este dispositivo.`
        : `No se pudo conectar al backend. Revisa tu conexión y la URL de ${url}.`;
    throw new ApiError(0, message, undefined, undefined, { url, originalError: error });
  }

  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data.error || 'Something went wrong',
      data.code,
      data.details,
      data
    );
  }

  return data as T;
}

export const apiService = {
  get: <T>(path: string, options?: RequestInit) => 
    request<T>(path, { ...options, method: 'GET' }),
  
  post: <T>(path: string, body?: any, options?: RequestInit) => 
    request<T>(path, { ...options, method: 'POST', body: JSON.stringify(body) }),
  
  put: <T>(path: string, body?: any, options?: RequestInit) => 
    request<T>(path, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  
  patch: <T>(path: string, body?: any, options?: RequestInit) => 
    request<T>(path, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  
  delete: <T>(path: string, options?: RequestInit) => 
    request<T>(path, { ...options, method: 'DELETE' }),
};
