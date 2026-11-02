import { useCallback, useState } from 'react';
import {
  approveHandover,
  fetchHandover,
  generateHandover,
} from '@/api/handover';
import { toApiError } from '@/api/client';
import type { Handover, HandoverRole } from '@/types';

export function useHandover(projectId: string) {
  const [role, setRole] = useState<HandoverRole>('developer');
  const [handover, setHandover] = useState<Handover | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (r: HandoverRole = role) => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchHandover(projectId, r);
        setHandover(data);
      } catch (err) {
        setError(toApiError(err).message);
      } finally {
        setLoading(false);
      }
    },
    [projectId, role],
  );

  const generate = useCallback(
    async (r: HandoverRole = role) => {
      setGenerating(true);
      setError(null);
      try {
        const data = await generateHandover(projectId, r);
        setHandover(data);
      } catch (err) {
        setError(toApiError(err).message);
      } finally {
        setGenerating(false);
      }
    },
    [projectId, role],
  );

  const approve = useCallback(
    async (approver: string, acknowledgeConflicts = false) => {
      if (!handover) return;
      setLoading(true);
      setError(null);
      try {
        const data = await approveHandover(
          projectId,
          handover.id,
          approver,
          acknowledgeConflicts,
        );
        setHandover(data);
      } catch (err) {
        setError(toApiError(err).message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [projectId, handover],
  );

  const switchRole = useCallback(
    async (r: HandoverRole) => {
      setRole(r);
      await load(r);
    },
    [load],
  );

  return {
    role,
    handover,
    loading,
    generating,
    error,
    load,
    generate,
    approve,
    switchRole,
  };
}