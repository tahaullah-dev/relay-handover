import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Download,
  FileOutput,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { useHandover } from '@/hooks/useHandover';
import { Button } from '@/components/ui/Button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  SectionHeading,
} from '@/components/ui/Card';
import { RoleSelector } from '@/components/handover/RoleSelector';
import { HandoverSectionView } from '@/components/handover/HandoverSection';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { formatDateTime } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';

export function Handover() {
  const { projectId = '' } = useParams();
  const {
    role,
    handover,
    loading,
    generating,
    error,
    load,
    generate,
    approve,
    switchRole,
  } = useHandover(projectId);

  const [approveOpen, setApproveOpen] = useState(false);
  const [approver, setApprover] = useState('Alex Chen');
  const [acknowledge, setAcknowledge] = useState(false);
  const [approveBusy, setApproveBusy] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleApprove = async () => {
    if (!approver.trim()) return;
    setApproveBusy(true);
    setApproveError(null);
    try {
      await approve(approver, acknowledge);
      setApproveOpen(false);
      setAcknowledge(false);
    } catch (err) {
      setApproveError(
        err instanceof Error ? err.message : 'Approval failed. See conflicts.',
      );
    } finally {
      setApproveBusy(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 min-w-0">
      <SectionHeading
        eyebrow="Handover"
        title="Actionable handover package"
        description="A role-based document the next developer or stakeholder can act on. Generated from reviewed, evidence-backed claims."
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <RoleSelector value={role} onChange={(r) => void switchRole(r)} />
          </div>
        }
      />

      <Card className="min-w-0">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between min-w-0">
            <div className="min-w-0 flex-1">
              <CardTitle>Generation</CardTitle>
              <p className="mt-1 text-xs text-ink-500 break-words">
                Generate the handover from the currently reviewed claims. The
                stakeholder view automatically filters out code-level detail.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Sparkles className="h-3.5 w-3.5" />}
                onClick={() => void generate()}
                loading={generating}
              >
                {handover ? 'Regenerate' : 'Generate handover'}
              </Button>
              {handover && (
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Download className="h-3.5 w-3.5" />}
                  onClick={handlePrint}
                >
                  Print / PDF
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        {error && (
          <CardContent>
            <ErrorState message={error} onRetry={() => void load()} />
          </CardContent>
        )}
      </Card>

      {loading && <LoadingState label="Loading handover…" />}

      {!loading && !handover && !error && (
        <EmptyState
          icon={<FileOutput className="h-5 w-5" />}
          title="No handover yet"
          description="Generate a handover from the reviewed claims to produce the role-based document."
          action={
            <Button
              size="sm"
              leftIcon={<Sparkles className="h-3.5 w-3.5" />}
              onClick={() => void generate()}
              loading={generating}
            >
              Generate handover
            </Button>
          }
        />
      )}

      {handover && (
        <div className="grid gap-6 lg:grid-cols-4 min-w-0">
          <Card className="min-w-0 lg:col-span-3">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 min-w-0">
                <div className="min-w-0">
                  <CardTitle>
                    {role === 'developer'
                      ? 'Developer handover'
                      : 'Stakeholder handover'}
                  </CardTitle>
                  <p className="mt-1 text-xs text-ink-500 break-words">
                    Version {handover.version} · generated{' '}
                    {formatDateTime(handover.generatedAt)}
                  </p>
                </div>
                <div className="shrink-0">
                  {handover.approvedAt ? (
                    <Badge tone="positive" dot>
                      <CheckCircle2 className="h-3 w-3" />
                      Approved by {handover.approvedBy}
                    </Badge>
                  ) : (
                    <Badge tone="warning" dot>
                      Pending approval
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-1 min-w-0">
              {handover.sections.map((s, i) => (
                <HandoverSectionView key={s.id} section={s} index={i} />
              ))}

              <section className="scroll-mt-24 border-t border-ink-100 pt-6 min-w-0">
                <h3 className="text-base font-semibold text-ink-950">
                  Continuation plan
                </h3>
                <div className="mt-4 grid gap-4 grid-cols-1 md:grid-cols-3 min-w-0">
                  {handover.plan.map((p) => (
                    <div
                      key={p.horizon}
                      className="rounded-md border border-ink-200 bg-ink-50/40 p-4 min-w-0"
                    >
                      <div className="text-xs font-medium uppercase tracking-wider text-ink-500">
                        {p.horizon === 'day-1'
                          ? 'Day 1'
                          : p.horizon === 'week-1'
                            ? 'Week 1'
                            : 'Month 1'}
                      </div>
                      <ul className="mt-2 space-y-2 min-w-0">
                        {p.items.map((item, i) => (
                          <li key={i} className="flex gap-2 text-sm text-ink-700 min-w-0">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink-400" />
                            <span className="leading-relaxed break-words min-w-0 flex-1">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            </CardContent>
          </Card>

          <Card className="min-w-0 lg:col-span-1">
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 min-w-0">
              {handover.approvedAt ? (
                <div className="rounded-md border border-green-200 bg-green-50/60 p-3 text-xs text-green-800 break-words">
                  <div className="font-medium">Approved</div>
                  <div className="mt-0.5">
                    {handover.approvedBy} · {formatDateTime(handover.approvedAt)}
                  </div>
                </div>
              ) : (
                <Button size="sm" className="w-full" onClick={() => setApproveOpen(true)}>
                  Approve handover
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                leftIcon={<Download className="h-3.5 w-3.5" />}
                onClick={handlePrint}
              >
                Print / PDF
              </Button>
              <div className="rounded-md border border-ink-200 bg-ink-50/40 p-3 text-xs text-ink-600 break-words leading-relaxed">
                {role === 'developer'
                  ? 'Developer view includes full evidence chain, codebase entry points, blockers, and dependencies.'
                  : 'Stakeholder view filters out code-level detail and private discussion. Restricted content is omitted, not summarised.'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Modal
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        title="Approve handover"
        description="This records your approval in the audit log and marks the handover as ready to share."
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-ink-600">Approver name</label>
            <Input
              value={approver}
              onChange={(e) => setApprover(e.target.value)}
              className="mt-1"
            />
          </div>

          <label className="flex items-start gap-2 rounded-md border border-ink-200 bg-ink-50/40 p-3 text-xs text-ink-700">
            <input
              type="checkbox"
              checked={acknowledge}
              onChange={(e) => setAcknowledge(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-ink-300"
            />
            <span className="leading-relaxed break-words">
              Approve even if conflicting claims are still unresolved. Use this
              only when you have reviewed the conflicts and accept them as-is.
            </span>
          </label>

          {approveError && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50/60 px-3 py-2 text-xs text-red-800 break-words">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="min-w-0 flex-1">{approveError}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={() => setApproveOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => void handleApprove()}
              loading={approveBusy}
              disabled={!approver.trim()}
            >
              Approve
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
