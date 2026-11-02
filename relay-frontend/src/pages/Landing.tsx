import { Link } from 'react-router-dom';
import {
  ArrowRight,
  GitBranch,
  ShieldCheck,
  FileOutput,
  CheckCircle2,
  AlertTriangle,
  Quote,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DEMO_PROJECT_ID } from '@/data/demo';

export function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-ink-100 sticky top-0 z-20 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-ink-950">
              <span className="font-mono text-sm font-bold text-white">
                R
              </span>
            </div>
            <div>
              <div className="text-sm font-semibold text-ink-950">Relay</div>
              <div className="text-[10px] uppercase tracking-wider text-ink-500">
                Evidence-backed handover
              </div>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-ink-600 sm:flex">
            <a href="#how" className="hover:text-ink-900">
              How it works
            </a>
            <a href="#trust" className="hover:text-ink-900">
              Trust model
            </a>
          </nav>
          <Link to={`/projects/${DEMO_PROJECT_ID}`}>
            <Button size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
              Explore demo
            </Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-12 sm:pt-20 pb-12 sm:pb-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-ink-50 px-3 py-1 text-xs font-medium text-ink-600">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            Built by TraceForge
          </div>
          <h1 className="mt-6 text-3xl font-semibold leading-tight tracking-tight text-ink-950 sm:text-5xl">
            Don't just hand over code.
            <br />
            <span className="text-ink-500">
              Hand over the knowledge behind it.
            </span>
          </h1>
          <p className="mx-auto mt-4 sm:mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-ink-600">
            Relay reconstructs project knowledge from GitHub, Jira, Slack and
            Notion, verifies every claim against evidence, and gives the next
            developer a clear path forward.
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link to={`/projects/${DEMO_PROJECT_ID}`}>
              <Button
                size="lg"
                className="w-full sm:w-auto"
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Explore demo project
              </Button>
            </Link>
            <a href="#how" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                See how it works
              </Button>
            </a>
          </div>
        </div>
      </section>

      <section id="how" className="border-t border-ink-100 bg-ink-50/50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-xl sm:text-2xl font-semibold text-ink-950">
              Three capabilities. One workflow.
            </h2>
            <p className="mt-2 text-sm text-ink-600">
              Relay replaces the "write a long handover doc you'll never finish"
              pattern with a verifiable reconstruction.
            </p>
          </div>

          <div className="mt-8 sm:mt-10 grid gap-5 grid-cols-1 md:grid-cols-3">
            <CapabilityCard
              step="01"
              icon={<GitBranch className="h-5 w-5" />}
              title="Reconstruct knowledge"
              description="Relay pulls from GitHub, Jira, Slack and Notion and extracts typed claims: decisions, task status, ownership, dependencies, risks, and open questions."
            />
            <CapabilityCard
              step="02"
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Verify every claim"
              description="Each claim is matched against supporting and contradicting evidence. Conflicts are shown, not smoothed. Trust labels make uncertainty visible."
            />
            <CapabilityCard
              step="03"
              icon={<FileOutput className="h-5 w-5" />}
              title="Generate actionable handovers"
              description="A human reviews and approves. Relay then produces a role-based handover with a Day 1 / Week 1 / Month 1 plan the next developer can act on."
            />
          </div>
        </div>
      </section>

      <section id="trust" className="border-t border-ink-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-16">
          <div className="grid gap-8 lg:gap-10 grid-cols-1 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-ink-950">
                Designed for trust.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-600">
                Relay never presents an assumption as a verified fact. Every
                claim is labelled, every quote links back to its source, and
                every handover is approved by a human before it is shared.
              </p>
              <ul className="mt-6 space-y-3">
                <TrustPoint
                  icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
                  text="Two-sided evidence — we look for contradictions, not just confirmations."
                />
                <TrustPoint
                  icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
                  text="Exact-quote verification — citations are dropped if they don't match the source."
                />
                <TrustPoint
                  icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
                  text="Access control at every layer — import, retrieval, generation, and sharing."
                />
                <TrustPoint
                  icon={<AlertTriangle className="h-4 w-4 text-amber-600" />}
                  text="When evidence is missing, Relay says so — it never invents answers."
                />
              </ul>
            </div>
            <div className="rounded-lg border border-ink-200 bg-white p-4 sm:p-5 shadow-card min-w-0">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-ink-500">
                <Quote className="h-3.5 w-3.5" />
                Example claim
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink-900 break-words">
                "PROJ-123 'Event RSVP flow' is complete and shipped."
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">
                  Conflicting
                </span>
                <span className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[10px] text-ink-600">
                  PROJ-123
                </span>
              </div>
              <div className="mt-4 space-y-2 text-xs">
                <div className="rounded border border-green-200 bg-green-50/40 p-2 break-words">
                  <div className="font-medium text-green-900">
                    Jira · PROJ-123
                  </div>
                  <div className="mt-0.5 text-green-800">
                    "Status changed to Done. Acceptance criteria met."
                  </div>
                </div>
                <div className="rounded border border-red-200 bg-red-50/40 p-2 break-words">
                  <div className="font-medium text-red-900">
                    GitHub · PR #47
                  </div>
                  <div className="mt-0.5 text-red-800">
                    "Pull request is open, 2 approvals pending, not merged."
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-ink-100 bg-ink-950 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:px-6 py-8 sm:py-10 sm:flex-row">
          <div>
            <div className="text-sm font-semibold">
              See it in action.
            </div>
            <div className="mt-1 text-sm text-ink-300">
              Walk through a synthetic project with planted inconsistencies. No
              account required.
            </div>
          </div>
          <Link to={`/projects/${DEMO_PROJECT_ID}`} className="w-full sm:w-auto shrink-0">
            <Button
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto !bg-white !text-ink-950 hover:!bg-ink-100"
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Explore demo project
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-ink-100">
        <div className="mx-auto flex max-w-6xl flex-col sm:flex-row items-center justify-between gap-2 px-4 sm:px-6 py-4 sm:py-5 text-xs text-ink-500 text-center sm:text-left">
          <div>© 2026 TraceForge</div>
          <div>Relay · Evidence-backed project handover</div>
        </div>
      </footer>
    </div>
  );
}

function CapabilityCard({
  step,
  icon,
  title,
  description,
}: {
  step: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-ink-200 bg-white p-4 sm:p-5 shadow-card min-w-0">
      <div className="flex items-center gap-2 text-xs font-medium text-ink-500">
        <span className="font-mono">{step}</span>
        <span className="h-px flex-1 bg-ink-200" />
      </div>
      <div className="mt-3 flex h-9 w-9 items-center justify-center rounded-md bg-ink-950 text-white">
        {icon}
      </div>
      <h3 className="mt-4 text-base font-semibold text-ink-950 break-words">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-600 break-words">
        {description}
      </p>
    </div>
  );
}

function TrustPoint({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <li className="flex items-start gap-3 text-sm text-ink-700">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span className="leading-relaxed">{text}</span>
    </li>
  );
}
