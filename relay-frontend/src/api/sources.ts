import { api, isBackendConfigured } from './client';
import { DEMO_SOURCES } from '@/data/demo';
import type { Source, SourceKind } from '@/types';

export async function fetchSources(projectId: string): Promise<Source[]> {
  if (!isBackendConfigured()) {
    return DEMO_SOURCES.map((s) => ({ ...s }));
  }
  const { data } = await api.get<Source[]>(`/projects/${projectId}/sources`);
  return data;
}

export interface ConnectGitHubPayload {
  repositoryUrl: string;
}

export async function connectGitHub(
  projectId: string,
  payload: ConnectGitHubPayload,
): Promise<Source> {
  if (!isBackendConfigured()) {
    return {
      id: 'src_github',
      kind: 'github',
      name: 'GitHub',
      identifier: payload.repositoryUrl,
      status: 'connected',
      recordCount: 0,
      lastImportedAt: new Date().toISOString(),
      isSynthetic: false,
    };
  }
  const { data } = await api.post<Source>(
    `/projects/${projectId}/sources/github`,
    payload,
  );
  return data;
}

export interface UploadExportPayload {
  kind: Extract<SourceKind, 'jira' | 'slack' | 'notion'>;
  fileName: string;
  content: string;
}

export async function uploadExport(
  projectId: string,
  payload: UploadExportPayload,
): Promise<Source> {
  if (!isBackendConfigured()) {
    return {
      id: `src_${payload.kind}`,
      kind: payload.kind,
      name:
        payload.kind === 'jira'
          ? 'Jira'
          : payload.kind === 'slack'
            ? 'Slack'
            : 'Notion',
      identifier: `${payload.fileName} (demo)`,
      status: 'imported',
      recordCount: 0,
      lastImportedAt: new Date().toISOString(),
      isSynthetic: false,
    };
  }
  const { data } = await api.post<Source>(
    `/projects/${projectId}/sources/${payload.kind}/upload`,
    { fileName: payload.fileName, content: payload.content },
  );
  return data;
}