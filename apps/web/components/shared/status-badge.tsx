import { Badge } from '@kit/ui/badge';
import { cn } from '@kit/ui/utils';

interface StatusBadgeProps {
  status: string;
  variant?:
    | 'default'
    | 'secondary'
    | 'destructive'
    | 'outline'
    | 'success'
    | 'warning'
    | 'info';
  className?: string;
}

const STATUS_VARIANTS: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'
> = {
  // Lead statuses
  new: 'info',
  contacted: 'warning',
  qualified: 'success',
  unqualified: 'destructive',

  // Quote statuses
  draft: 'secondary',
  pending: 'warning',
  sent: 'info',
  approved: 'success',
  rejected: 'destructive',
  expired: 'outline',

  // Order statuses
  created: 'secondary',
  confirmed: 'info',
  processing: 'warning',
  shipped: 'success',
  delivered: 'success',
  cancelled: 'destructive',

  // Payment statuses
  unpaid: 'warning',
  partial: 'info',
  paid: 'success',
  overdue: 'destructive',

  // General statuses
  active: 'success',
  inactive: 'secondary',
  deleted: 'destructive',
  archived: 'outline',
};

export function StatusBadge({
  status,
  variant,
  className,
}: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, '_');
  const badgeVariant = variant || STATUS_VARIANTS[normalizedStatus] || 'default';

  // Format status for display
  const displayStatus = status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <Badge variant={badgeVariant} className={cn('font-medium', className)}>
      {displayStatus}
    </Badge>
  );
}
