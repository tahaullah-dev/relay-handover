import { api, isBackendConfigured } from './client';

export type AppMode = 'demo' | 'live' | 'unreachable';

export interface MetaInfo {
  mode: AppMode;
  geminiConfigured: boolean;
}

export async function fetchAppMode(): Promise<MetaInfo> {
  if (!isBackendConfigured()) {
    return { mode: 'demo', geminiConfigured: false };
  }
  try {
    const { data } = await api.get<{ mode: string; geminiConfigured: boolean }>('/meta');
    return { mode: 'live', geminiConfigured: data.geminiConfigured };
  } catch {
    return { mode: 'unreachable', geminiConfigured: false };
  }
}