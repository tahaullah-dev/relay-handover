import { Link, useParams } from 'react-router-dom';
import {
  ArrowUpRight,
  GitBranch,
  ListChecks,
  Plug,
  FileOutput,
  AlertTriangle,
  CheckCircle2,
  MessageSquareWarning,
  Database,
} from 'lucide-react';
import { useProject } from '@/hooks/useProject';
import { Button } from '@/components/ui/Button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  SectionHeading,
} from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { formatDateTime } from '@/lib/utils';

export function Dashboard() {
  const { projectId = '' } = useParams();
  const { project, reconstruction, loading, error, reload, runReconstruction } =
    useProject(projectId);

  if (loading) return <LoadingState label="Loading project…" />;
  if (error || !project) {
    return (
      <ErrorState
        message={error ?? 'Project not found'}
        onRetry={reload}
      />
    );
  }

  const metrics = [
    {
      label: 'Connected sources',
      value: project.sourcesCount,
      icon: <Plug className="h-4 w-4" />,
      tone: 'text-ink-900',
    },
    {
      label: 'Reconstructed claims',
      value: project.claimsCount,
      icon: <ListChecks className="h-4 w-4" />,
      tone: 'text-ink-900',
    },
    {
      label: 'Verified',
      value: project.verifiedCount,
      icon: <CheckCircle2 className="h-4 w-4" />,
      tone: 'text-green-700',
    },
    {
      label: 'Conflicting',
      value: project.conflictingCount,
      icon: <AlertTriangle className="h-4 w-4" />,
      tone: 'text-amber-700',
    },
    {
      label: 'Unresolved questions',
      value: project.unresolvedCount,
      icon: <MessageSquareWarning className="h-4 w-4" />,
      tone: 'text-ink-700',
    },
    {
      label: 'Approved handovers',
      value: project.approvedHandoversCount,
      icon: <FileOutput className="h-4 w-4" />,
      tone: 'text-ink-900',
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 sm:space-y-8 min-w-0">
      <SectionHeading
        eyebrow="Project"
        title={project.name}
        description={project.description}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Link to={`/projects/${projectId}/claims`}>
              <Button variant="secondary" size="sm">
                Review claims
              </Button>
            </Link>
            <Link to={`/projects/${projectId}/handover`}>
              <Button size="sm" rightIcon={<ArrowUpRight className="h-3.5 w-3.5" />}>
                View handover
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3">
        {metrics.map((m) => (
          <Card key={m.label} className="min-w-0">
            <CardContent className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-ink-500 truncate">
                  {m.label}
                </div>
                <div className={`mt-1 text-xl sm:text-2xl font-semibold ${m.tone}`}>
                  {m.value}
                </div>
              </div>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-ink-100 text-ink-600">
                {m.icon}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="min-w-0 lg:col-span-2">
          <CardHeader>
            <CardTitle>Reconstruction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <div className="text-xs text-ink-500">Status</div>
                <div className="mt-0.5 text-sm font-medium text-ink-900 capitalize">
                  {reconstruction?.stage ?? 'idle'}
                </div>
              </div>
              <div className="sm:text-right">
                <div className="text-xs text-ink-500">Last run</div>
                <div className="mt-0.5 text-sm text-ink-900">
                  {formatDateTime(reconstruction?.completedAt ?? null)}
                </div>
              </div>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
              <div
                className="h-full rounded-full bg-ink-900 transition-all"
                style={{
                  width: `${reconstruction?.progressPercent ?? 0}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-ink-500 gap-2">
              <span className="break-words min-w-0 flex-1">
                {reconstruction?.errorMessage
                  ? `Failed: ${reconstruction.errorMessage}`
                  : 'All sources ingested · claims extracted · evidence verified'}
              </span>
              <span className="font-mono shrink-0">
                {reconstruction?.progressPercent ?? 0}%
              </span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<GitBranch className="h-3.5 w-3.5" />}
                onClick={() => void runReconstruction()}
              >
                Run reconstruction
              </Button>
              <Link to={`/projects/${projectId}/reconstruction`}>
                <Button variant="ghost" size="sm">
                  View details
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Repository Card: URL safely wraps without overflow */}
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Repository</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 min-w-0">
            <div className="flex items-start gap-2 text-sm min-w-0">
              <Database className="h-4 w-4 text-ink-500 shrink-0 mt-0.5" />
              <span className="font-mono text-ink-700 break-all min-w-0 flex-1">
                {project.repositoryUrl ?? '—'}
              </span>
            </div>
            <div>
              <div className="text-xs text-ink-500">Departing</div>
              <div className="mt-0.5 text-sm font-medium text-ink-900 break-words">
                {project.departingPerson}
              </div>
            </div>
            <div>
              <div className="text-xs text-ink-500">Incoming</div>
              <div className="mt-0.5 text-sm font-medium text-ink-900 break-words">
                {project.incomingPerson ?? 'Awaiting assignment'}
              </div>
            </div>
            <div>
              <div className="text-xs text-ink-500">Last updated</div>
              <div className="mt-0.5 text-sm text-ink-900 break-words">
                {formatDateTime(project.updatedAt)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="min-w-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Next steps</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            <Step
              n={1}
              title="Inspect connected sources"
              description="Confirm GitHub, Jira, Slack and Notion are all imported correctly."
              to={`/projects/${projectId}/sources`}
            />
            <Step
              n={2}
              title="Review conflicting claims"
              description="These are the claims where sources disagree — the highest-value review work."
              to={`/projects/${projectId}/claims?filter=conflicting`}
            />
            <Step
              n={3}
              title="Generate and approve the handover"
              description="Produce the role-based handover and approve it before sharing."
              to={`/projects/${projectId}/handover`}
            />
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

function Step({
  n,
  title,
  description,
  to,
}: {
  n: number;
  title: string;
  description: string;
  to: string;
}) {
  return (
    <li>
      <Link
        to={to}
        className="group flex items-start gap-3 sm:gap-4 rounded-md border border-transparent p-2 hover:border-ink-200 hover:bg-ink-50 min-w-0"
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-950 font-mono text-xs font-semibold text-white">
          {n}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-ink-950 group-hover:text-ink-950 break-words">
            {title}
          </div>
          <div className="mt-0.5 text-sm text-ink-500 break-words">{description}</div>
        </div>
        <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-ink-300 transition-colors group-hover:text-ink-600" />
      </Link>
    </li>
  );
}
