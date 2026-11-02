import { useCallback, useEffect, useState } from 'react';
import {
  fetchProject,
  fetchReconstruction,
  startReconstruction,
} from '@/api/projects';
import type { ProjectSummary, ReconstructionStatus } from '@/types';

export function useProject(projectId: string) {
  const [project, setProject] = useState<ProjectSummary | null>(null);
  const [reconstruction, setReconstruction] =
    useState<ReconstructionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reconstructing, setReconstructing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, r] = await Promise.all([
        fetchProject(projectId),
        fetchReconstruction(projectId),
      ]);
      setProject(p);
      setReconstruction(r);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load project',
      );
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const runReconstruction = useCallback(async () => {
    setReconstructing(true);
    setError(null);
    try {
      const r = await startReconstruction(projectId);
      setReconstruction(r);
      setProject((prev) =>
        prev ? { ...prev, reconstruction: r } : prev,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Reconstruction failed',
      );
    } finally {
      setReconstructing(false);
    }
  }, [projectId]);

  return {
    project,
    reconstruction,
    loading,
    error,
    reconstructing,
    reload: load,
    runReconstruction,
  };
}