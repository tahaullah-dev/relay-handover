import { api, isBackendConfigured } from './client';
import {
  DEMO_PROJECT,
  DEMO_RECONSTRUCTION,
} from '@/data/demo';
import type { ProjectSummary, ReconstructionStatus } from '@/types';

export async function fetchProject(
  projectId: string,
): Promise<ProjectSummary> {
  if (!isBackendConfigured()) {
    return { ...DEMO_PROJECT, id: projectId };
  }
  const { data } = await api.get<ProjectSummary>(`/projects/${projectId}`);
  return data;
}

export async function fetchReconstruction(
  projectId: string,
): Promise<ReconstructionStatus> {
  if (!isBackendConfigured()) {
    return { ...DEMO_RECONSTRUCTION };
  }
  const { data } = await api.get<ReconstructionStatus>(
    `/projects/${projectId}/reconstruction`,
  );
  return data;
}

export async function startReconstruction(
  projectId: string,
): Promise<ReconstructionStatus> {
  if (!isBackendConfigured()) {
    // Simulate a reconstruction cycle for the demo.
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ...DEMO_RECONSTRUCTION,
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        });
      }, 1200);
    });
  }
  const { data } = await api.post<ReconstructionStatus>(
    `/projects/${projectId}/reconstruction`,
  );
  return data;
}