import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Upload, Link2, AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';
import { fetchSources, connectGitHub, uploadExport } from '@/api/sources';
import { toApiError } from '@/api/client';
import type { Source, SourceKind } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, SectionHeading } from '@/components/ui/Card';
import { SourceCard } from '@/components/sources/SourceCard';
import { Modal } from '@/components/ui/Modal';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';

export function Sources() {
  const { projectId = '' } = useParams();
  const [sources, setSources] = useState<Source[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [githubOpen, setGithubOpen] = useState(false);
  const [githubUrl, setGithubUrl] = useState('');
  const [githubBusy, setGithubBusy] = useState(false);

  const [uploadOpen, setUploadOpen] = useState<SourceKind | null>(null);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadContent, setUploadContent] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSources(projectId);
      setSources(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleConnectGitHub = async () => {
    if (!githubUrl.trim()) return;
    setGithubBusy(true);
    setActionError(null);
    try {
      const updated = await connectGitHub(projectId, { repositoryUrl: githubUrl });
      setSources((prev) =>
        prev?.map((s) => (s.kind === 'github' ? updated : s)) ?? prev,
      );
      setGithubOpen(false);
      setGithubUrl('');
    } catch (err) {
      setActionError(toApiError(err).message);
    } finally {
      setGithubBusy(false);
    }
  };

  const handleUpload = async (kind: SourceKind) => {
    if (!uploadFileName.trim() || !uploadContent) return;
    setUploadBusy(true);
    setActionError(null);
    try {
      const updated = await uploadExport(projectId, {
        kind: kind as 'jira' | 'slack' | 'notion',
        fileName: uploadFileName,
        content: uploadContent,
      });
      setSources((prev) =>
        prev?.map((s) => (s.kind === kind ? updated : s)) ?? prev,
      );
      setUploadOpen(null);
      setUploadFileName('');
      setUploadContent('');
    } catch (err) {
      setActionError(toApiError(err).message);
    } finally {
      setUploadBusy(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFileName(file.name);
    setUploadContent(await file.text());
  };

  if (loading) return <LoadingState label="Loading sources…" />;
  if (error || !sources) {
    return <ErrorState message={error ?? 'Failed to load sources'} onRetry={load} />;
  }

  const byKind = (k: SourceKind) => sources.find((s) => s.kind === k);

  return (
    <div className="mx-auto max-w-6xl space-y-6 min-w-0">
      <SectionHeading
        eyebrow="Sources"
        title="Connected sources"
        description="Relay reads from these authorised sources only. Secrets and personal data are redacted on import."
      />

      {actionError && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50/60 px-4 py-3 text-sm text-red-800 break-words">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1">{actionError}</span>
        </div>
      )}

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {(['github', 'jira', 'slack', 'notion'] as SourceKind[]).map((k) => {
          const source = byKind(k);
          if (!source) return null;
          const action =
            k === 'github' ? (
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Link2 className="h-3.5 w-3.5" />}
                onClick={() => {
                  setActionError(null);
                  setGithubOpen(true);
                }}
              >
                Change repository
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Upload className="h-3.5 w-3.5" />}
                onClick={() => {
                  setActionError(null);
                  setUploadOpen(k);
                }}
              >
                Upload export
              </Button>
            );
          return <SourceCard key={k} source={source} action={action} />;
        })}
      </div>

      <Card>
        <CardContent className="text-xs text-ink-500 break-words leading-relaxed">
          <p>
            <span className="font-medium text-ink-700">Privacy note.</span>{' '}
            Relay stores each source's permissions at import time, applies
            access filters inside retrieval queries, and redacts secrets and
            personal data before any claim extraction.
          </p>
        </CardContent>
      </Card>

      <Modal
        open={githubOpen}
        onClose={() => setGithubOpen(false)}
        title="Connect GitHub repository"
        description="Read-only access. Relay imports commits, pull requests, and issues from a public repository."
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-ink-600">
              Repository URL
            </label>
            <Input
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
              className="mt-1"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={() => setGithubOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => void handleConnectGitHub()}
              loading={githubBusy}
              disabled={!githubUrl.trim()}
            >
              Connect
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={uploadOpen !== null}
        onClose={() => setUploadOpen(null)}
        title={`Upload ${
            uploadOpen ? uploadOpen.charAt(0).toUpperCase() + uploadOpen.slice(1) : ''
        } export`}
        description="Upload a JSON or CSV export. Relay will parse and redact it before extraction."
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-ink-600">Export file</label>
            <input
              type="file"
              accept=".json,.csv"
              onChange={(e) => void handleFileChange(e)}
              className="mt-1 block w-full text-sm text-ink-600 file:mr-3 file:rounded-md file:border file:border-ink-200 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ink-700 hover:file:bg-ink-50"
            />
            {uploadFileName && (
              <p className="mt-1.5 text-xs text-ink-500 break-all">
                Selected: <span className="font-mono">{uploadFileName}</span>
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={() => setUploadOpen(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => void handleUpload(uploadOpen!)}
              loading={uploadBusy}
              disabled={!uploadFileName.trim() || !uploadContent}
            >
              Import
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
