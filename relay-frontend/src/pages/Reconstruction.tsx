import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import {
  Database,
  Link2,
  Sparkles,
  ShieldCheck,
  ClipboardList,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { useProject } from '@/hooks/useProject';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, SectionHeading } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import type { ReconstructionStage } from '@/types';

const STAGES: {
  id: ReconstructionStage;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'ingesting',
    label: 'Source ingestion',
    description:
      'Pull records from GitHub, Jira, Slack and Notion. Redact secrets and personal data.',
    icon: <Database className="h-4 w-4" />,
  },
  {
    id: 'linking',
    label: 'Cross-source linking',
    description:
      'Match records across tools using shared identifiers like Jira keys and PR references.',
    icon: <Link2 className="h-4 w-4" />,
  },
  {
    id: 'extracting',
    label: 'Claim extraction',
    description:
      'Extract typed claims: decisions, task status, ownership, dependencies, risks, and open questions.',
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    id: 'verifying',
    label: 'Evidence verification',
    description:
      'For each claim, search for supporting and contradicting evidence. Verify exact quotes.',
    icon: <ShieldCheck className="h-4 w-4" />,
  },
  {
    id: 'preparing',
    label: 'Review preparation',
    description:
      'Assign trust labels and surface conflicts for the human reviewer.',
    icon: <ClipboardList className="h-4 w-4" />,
  },
];

const ORDER: ReconstructionStage[] = [
  'ingesting',
  'linking',
  'extracting',
  'verifying',
  'preparing',
];

export function Reconstruction() {
  const { projectId = '' } = useParams();
  const { project, reconstruction, loading, error, reload, runReconstruction } =
    useProject(projectId);

  if (loading) return <LoadingState label="Loading reconstruction…" />;
  if (error || !project) {
    return (
      <ErrorState
        message={error ?? 'Project not found'}
        onRetry={reload}
      />
    );
  }

  const stage = reconstruction?.stage ?? 'idle';
  const isComplete = stage === 'complete';
  const isFailed = stage === 'failed';
  const currentIndex = ORDER.indexOf(stage as ReconstructionStage);

  return (
    <div className="mx-auto max-w-5xl space-y-6 min-w-0">
      <SectionHeading
        eyebrow="Reconstruction"
        title="How Relay rebuilds the project"
        description="Five deterministic stages. Each one produces a verifiable artefact that feeds the next."
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void runReconstruction()}
            >
              Run again
            </Button>
            {isComplete && (
              <Link to={`/projects/${projectId}/claims`}>
                <Button
                  size="sm"
                  rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                >
                  Review claims
                </Button>
              </Link>
            )}
          </div>
        }
      />

      <div className="space-y-3">
        {STAGES.map((s, i) => {
          const done = isComplete || currentIndex > i;
          const active = !isComplete && !isFailed && currentIndex === i;
          return (
            <div
              key={s.id}
              className={cn(
                'flex items-start gap-3 sm:gap-4 rounded-lg border p-3.5 sm:p-4 min-w-0',
                done
                  ? 'border-green-200 bg-green-50/40'
                  : active
                    ? 'border-brand-500 bg-brand-50/40'
                    : 'border-ink-200 bg-white',
              )}
            >
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-md',
                  done
                    ? 'bg-green-600 text-white'
                    : active
                      ? 'bg-brand-600 text-white'
                      : 'bg-ink-100 text-ink-500',
                )}
              >
                {done ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  s.icon
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="font-mono text-xs text-ink-500">
                    Stage {i + 1}
                  </div>
                  {active && (
                    <span className="rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-medium text-white">
                      Running
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-sm font-semibold text-ink-950 break-words">
                  {s.label}
                </div>
                <div className="mt-0.5 text-sm text-ink-600 break-words">
                  {s.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Card>
        <CardContent className="text-xs text-ink-500 break-words leading-relaxed">
          <p>
            <span className="font-medium text-ink-700">Transparency.</span>{' '}
            Relay uses AI only for extraction and judgement. Deterministic rules
            handle anything a rule can do — for example, flagging a Jira ticket
            marked Done whose linked pull request was never merged.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
