import { TRUST_LABEL_META } from '@/lib/constants';
import type { TrustLabel as TrustLabelType } from '@/types';
import { Badge } from '@/components/ui/Badge';

export function TrustLabelBadge({ value }: { value: TrustLabelType }) {
  const meta = TRUST_LABEL_META[value];
  return (
    <Badge tone={meta.tone} dot>
      {meta.label}
    </Badge>
  );
}