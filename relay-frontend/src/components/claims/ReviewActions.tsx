import { useState } from 'react';
import { Check, Edit3, HelpCircle, X as XIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import type { Claim } from '@/types';

interface ReviewActionsProps {
  claim: Claim;
  reviewerName: string;
  onReviewerNameChange: (name: string) => void;
  onAction: (
    action: 'confirm' | 'correct' | 'reject' | 'needs-evidence',
    opts: { correctedStatement?: string; comment?: string },
  ) => Promise<void>;
  busy: boolean;
}

export function ReviewActions({
  claim,
  reviewerName,
  onReviewerNameChange,
  onAction,
  busy,
}: ReviewActionsProps) {
  const [comment, setComment] = useState(claim.reviewerComment ?? '');
  const [correctedStatement, setCorrectedStatement] = useState(
    claim.correctedStatement ?? claim.statement,
  );
  const [mode, setMode] = useState<
    null | 'confirm' | 'correct' | 'reject' | 'needs-evidence'
  >(null);

  const submit = async () => {
    if (!mode) return;
    if (!reviewerName.trim()) return;
    await onAction(mode, {
      correctedStatement:
        mode === 'correct' ? correctedStatement : undefined,
      comment: comment.trim() || undefined,
    });
    setMode(null);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-ink-600">
          Reviewer name
        </label>
        <Input
          value={reviewerName}
          onChange={(e) => onReviewerNameChange(e.target.value)}
          placeholder="e.g. Alex Chen"
          className="mt-1"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Check className="h-3.5 w-3.5" />}
          onClick={() => setMode('confirm')}
          disabled={busy || !reviewerName.trim()}
          className={mode === 'confirm' ? 'ring-2 ring-brand-500' : ''}
        >
          Confirm
        </Button>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Edit3 className="h-3.5 w-3.5" />}
          onClick={() => setMode('correct')}
          disabled={busy || !reviewerName.trim()}
          className={mode === 'correct' ? 'ring-2 ring-brand-500' : ''}
        >
          Correct
        </Button>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<HelpCircle className="h-3.5 w-3.5" />}
          onClick={() => setMode('needs-evidence')}
          disabled={busy || !reviewerName.trim()}
          className={
            mode === 'needs-evidence' ? 'ring-2 ring-brand-500' : ''
          }
        >
          Needs evidence
        </Button>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<XIcon className="h-3.5 w-3.5" />}
          onClick={() => setMode('reject')}
          disabled={busy || !reviewerName.trim()}
          className={mode === 'reject' ? 'ring-2 ring-red-500' : ''}
        >
          Reject
        </Button>
      </div>

      {mode === 'correct' && (
        <div>
          <label className="text-xs font-medium text-ink-600">
            Corrected statement
          </label>
          <Textarea
            value={correctedStatement}
            onChange={(e) => setCorrectedStatement(e.target.value)}
            className="mt-1"
          />
        </div>
      )}

      {(mode === 'confirm' ||
        mode === 'correct' ||
        mode === 'reject' ||
        mode === 'needs-evidence') && (
        <div>
          <label className="text-xs font-medium text-ink-600">
            Comment (optional)
          </label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Why are you taking this action?"
            className="mt-1"
          />
        </div>
      )}

      {mode && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMode(null)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={submit}
            loading={busy}
            disabled={!reviewerName.trim()}
          >
            Submit review
          </Button>
        </div>
      )}
    </div>
  );
}