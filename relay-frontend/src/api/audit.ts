import { api, isBackendConfigured } from './client';
import { DEMO_AUDIT } from '@/data/demo';
import type { AuditEntry } from '@/types';

export async function fetchAudit(projectId: string): Promise<AuditEntry[]> {
  if (!isBackendConfigured()) {
    return [...DEMO_AUDIT];
  }
  const { data } = await api.get<AuditEntry[]>(
    `/projects/${projectId}/audit`,
  );
  return data;
}