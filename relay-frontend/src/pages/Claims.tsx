import { useParams, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useEffect } from 'react';
import { useClaims, type TrustFilter } from '@/hooks/useClaims';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, SectionHeading } from '@/components/ui/Card';
import { Tabs } from '@/components/ui/Tabs';
import { ClaimCard } from '@/components/claims/ClaimCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import type { TrustLabel } from '@/types';
import { TRUST_LABEL_META } from '@/lib/constants';

const FILTERS: { value: TrustFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  ...((Object.keys(TRUST_LABEL_META) as TrustLabel[]).map((k) => ({
    value: k,
    label: TRUST_LABEL_META[k].label,
  })) as { value: TrustFilter; label: string }[]),
];

export function Claims() {
  const { projectId = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilter = (searchParams.get('filter') as TrustFilter) ?? 'all';

  const {
    claims,
    filtered,
    loading,
    error,
    filter,
    setFilter,
    query,
    setQuery,
    reload,
  } = useClaims(projectId);

  useEffect(() => {
    setFilter(initialFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFilter]);

  const counts = {
    all: claims.length,
    verified: claims.filter((c) => c.trustLabel === 'verified').length,
    'single-source': claims.filter((c) => c.trustLabel === 'single-source')
      .length,
    conflicting: claims.filter((c) => c.trustLabel === 'conflicting').length,
    'no-evidence': claims.filter((c) => c.trustLabel === 'no-evidence').length,
    'reviewer-confirmed': claims.filter(
      (c) => c.trustLabel === 'reviewer-confirmed',
    ).length,
    'reviewer-corrected': claims.filter(
      (c) => c.trustLabel === 'reviewer-corrected',
    ).length,
  };

  const updateFilter = (v: TrustFilter) => {
    setFilter(v);
    const next = new URLSearchParams(searchParams);
    if (v === 'all') next.delete('filter');
    else next.set('filter', v);
    setSearchParams(next, { replace: true });
  };

  if (loading) return <LoadingState label="Loading claims…" />;
  if (error) {
    return <ErrorState message={error} onRetry={reload} />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 min-w-0">
      <SectionHeading
        eyebrow="Claims"
        title="Reconstructed claims"
        description="Every claim is linked to supporting and contradicting evidence. Conflicts are shown, not smoothed."
      />

      <Card className="min-w-0">
        <CardContent className="space-y-4 min-w-0">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between min-w-0">
            <div className="min-w-0 max-w-full overflow-x-auto pb-1">
              <Tabs
                value={filter}
                onChange={updateFilter}
                tabs={FILTERS.map((f) => ({
                  value: f.value,
                  label: f.label,
                  count: counts[f.value],
                }))}
              />
            </div>
            <div className="relative w-full lg:w-72 shrink-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search claims or identifiers…"
                className="pl-9"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              title="No claims match"
              description="Try a different filter or clear the search."
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setFilter('all');
                    setQuery('');
                  }}
                >
                  Reset filters
                </Button>
              }
            />
          ) : (
            <div className="grid gap-3 min-w-0">
              {filtered.map((c) => (
                <ClaimCard key={c.id} claim={c} projectId={projectId} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
