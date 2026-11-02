import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Plug,
  GitBranch,
  ListChecks,
  FileOutput,
  ScrollText,
  Menu,
  X,
} from 'lucide-react';
import { DEMO_BANNER_TEXT } from '@/lib/constants';
import { fetchAppMode, type AppMode } from '@/api/meta';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  projectId: string;
  projectName: string;
}

export function AppLayout({ projectId, projectName }: AppLayoutProps) {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  const [mode, setMode] = useState<AppMode | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    fetchAppMode().then((m) => setMode(m.mode));
  }, []);

  // Close drawer on navigation
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && drawerOpen) {
        setDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen]);

  if (isLanding) {
    return <Outlet />;
  }

  const nav = [
    { to: `/projects/${projectId}`, icon: LayoutDashboard, label: 'Dashboard' },
    { to: `/projects/${projectId}/sources`, icon: Plug, label: 'Sources' },
    {
      to: `/projects/${projectId}/reconstruction`,
      icon: GitBranch,
      label: 'Reconstruction',
    },
    { to: `/projects/${projectId}/claims`, icon: ListChecks, label: 'Claims' },
    {
      to: `/projects/${projectId}/handover`,
      icon: FileOutput,
      label: 'Handover',
    },
    { to: `/projects/${projectId}/audit`, icon: ScrollText, label: 'Audit' },
  ];

  const bannerText =
    mode === 'live'
      ? 'Data below comes from the live Relay API.'
      : mode === 'unreachable'
        ? 'A backend is configured but could not be reached. Check that the API is running.'
        : DEMO_BANNER_TEXT;

  const bannerClasses =
    mode === 'unreachable'
      ? 'border-red-200 bg-red-50 text-red-800'
      : mode === 'live'
        ? 'border-green-200 bg-green-50 text-green-800'
        : 'border-amber-200 bg-amber-50 text-amber-800';

  const bannerLabel =
    mode === 'live'
      ? 'Live mode.'
      : mode === 'unreachable'
        ? 'Connection error.'
        : mode === 'demo'
          ? 'Demo mode.'
          : null;

  const navigationLinks = (
    <nav className="flex-1 space-y-0.5 px-3 py-3 overflow-y-auto">
      {nav.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === `/projects/${projectId}`}
          onClick={() => setDrawerOpen(false)}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-ink-100 text-ink-950 font-semibold'
                : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900',
            )
          }
        >
          <item.icon className="h-4 w-4 shrink-0" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-ink-50">
      {/* Permanent Desktop Sidebar (1024px and above) */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-ink-200 bg-white lg:flex">
        <Link
          to="/"
          className="flex items-center gap-2 border-b border-ink-100 px-5 py-4"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-ink-950">
            <span className="font-mono text-xs font-bold text-white">R</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-ink-950">Relay</div>
            <div className="text-[10px] uppercase tracking-wider text-ink-500">
              Evidence-backed handover
            </div>
          </div>
        </Link>

        <div className="border-b border-ink-100 px-5 py-3">
          <div className="text-[10px] font-medium uppercase tracking-wider text-ink-500">
            Project
          </div>
          <div className="mt-0.5 truncate text-sm font-semibold text-ink-900">
            {projectName}
          </div>
        </div>

        {navigationLinks}

        <div className="border-t border-ink-100 px-5 py-3 text-[10px] text-ink-400">
          TraceForge · Relay v0.2
        </div>
      </aside>

      {/* Mobile / Tablet Navigation Drawer (< 1024px) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-ink-950/50 backdrop-blur-sm transition-opacity"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-ink-200 bg-white shadow-elevated">
            <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
              <Link
                to="/"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-2"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-ink-950">
                  <span className="font-mono text-xs font-bold text-white">R</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-ink-950">Relay</div>
                  <div className="text-[10px] uppercase tracking-wider text-ink-500">
                    Evidence-backed handover
                  </div>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-md text-ink-500 hover:bg-ink-100 hover:text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="border-b border-ink-100 px-5 py-3">
              <div className="text-[10px] font-medium uppercase tracking-wider text-ink-500">
                Project
              </div>
              <div className="mt-0.5 truncate text-sm font-semibold text-ink-900">
                {projectName}
              </div>
            </div>

            {navigationLinks}

            <div className="border-t border-ink-100 px-5 py-3 text-[10px] text-ink-400">
              TraceForge · Relay v0.2
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile / Tablet Top Header (< 1024px) */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink-200 bg-white px-4 py-3 lg:hidden">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-ink-950">
              <span className="font-mono text-xs font-bold text-white">R</span>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-ink-950 leading-tight">Relay</div>
              <div className="truncate text-[10px] text-ink-500 font-medium">
                {projectName}
              </div>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-ink-200 text-ink-700 hover:bg-ink-50 hover:text-ink-950 focus:outline-none focus:ring-2 focus:ring-brand-500"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        {/* Status / Mode Banner */}
        <div className={cn('border-b px-4 sm:px-6 py-2 text-xs break-words', bannerClasses)}>
          {bannerLabel && <span className="font-medium">{bannerLabel}</span>}{' '}
          {bannerText}
        </div>

        {/* Page Content */}
        <main className="flex-1 min-w-0 px-4 py-6 sm:px-6 sm:py-6 lg:px-10 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
