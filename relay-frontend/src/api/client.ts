import axios, { type AxiosError } from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '';

export const api = axios.create({
  baseURL: BASE_URL || undefined,
  timeout: 120_000,
  headers: { 'Content-Type': 'application/json' },
});

export function isBackendConfigured(): boolean {
  return Boolean(BASE_URL);
}

export interface ApiErrorPayload {
  message: string;
  status: number;
  code?: string;
}

export function toApiError(err: unknown): ApiErrorPayload {
  if (axios.isAxiosError(err)) {
    const ax = err as AxiosError<{ message?: string; detail?: string; code?: string }>;
    const data = ax.response?.data;
    return {
      message: data?.detail ?? data?.message ?? ax.message ?? 'Request failed',
      status: ax.response?.status ?? 0,
      code: data?.code ?? ax.code,
    };
  }
  return {
    message: err instanceof Error ? err.message : 'Unknown error',
    status: 0,
  };
}