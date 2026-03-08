import { Badge } from './badge';
import { StoreStatus } from '@/types/store';

interface StoreStatusBadgeProps {
  status: StoreStatus;
  className?: string;
}

export function StoreStatusBadge({ status, className }: StoreStatusBadgeProps) {
  const variants: Record<StoreStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success'; label: string }> = {
    PENDING: { variant: 'secondary', label: 'Pending' },
    APPROVED: { variant: 'success', label: 'Approved' },
    SUSPENDED: { variant: 'destructive', label: 'Suspended' },
    CLOSED: { variant: 'outline', label: 'Closed' },
  };

  const config = variants[status];
  
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}

