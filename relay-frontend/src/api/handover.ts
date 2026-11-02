import { api, isBackendConfigured, toApiError } from './client';
import {
  DEMO_HANDOVER_DEVELOPER,
  DEMO_HANDOVER_STAKEHOLDER,
} from '@/data/demo';
import type { Handover, HandoverRole } from '@/types';

export async function fetchHandover(
  projectId: string,
  role: HandoverRole,
): Promise<Handover | null> {
  if (!isBackendConfigured()) {
    return role === 'developer'
      ? { ...DEMO_HANDOVER_DEVELOPER }
      : { ...DEMO_HANDOVER_STAKEHOLDER };
  }
  try {
    const { data } = await api.get<Handover>(
      `/projects/${projectId}/handover?role=${role}`,
    );
    return data;
  } catch (err) {
    const apiErr = toApiError(err);
    if (apiErr.status === 404) return null;
    throw err;
  }
}

export async function generateHandover(
  projectId: string,
  role: HandoverRole,
): Promise<Handover> {
  if (!isBackendConfigured()) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(
          role === 'developer'
            ? { ...DEMO_HANDOVER_DEVELOPER, generatedAt: new Date().toISOString() }
            : { ...DEMO_HANDOVER_STAKEHOLDER, generatedAt: new Date().toISOString() },
        );
      }, 1200);
    });
  }
  const { data } = await api.post<Handover>(`/projects/${projectId}/handover`, { role });
  return data;
}

export async function approveHandover(
  projectId: string,
  handoverId: string,
  approver: string,
  acknowledgeConflicts = false,
): Promise<Handover> {
  if (!isBackendConfigured()) {
    const base =
      handoverId === DEMO_HANDOVER_DEVELOPER.id
        ? DEMO_HANDOVER_DEVELOPER
        : DEMO_HANDOVER_STAKEHOLDER;
    return {
      ...base,
      approvedAt: new Date().toISOString(),
      approvedBy: approver,
    };
  }
  const { data } = await api.post<Handover>(
    `/projects/${projectId}/handover/${handoverId}/approve`,
    { approver, acknowledgeConflicts },
  );
  return data;
}