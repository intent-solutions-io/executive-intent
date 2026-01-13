import { IntegrationStatus } from '@/lib/evidence/types';
import { getStatusIcon, getStatusLabel } from '@/lib/evidence/format';
import { cn } from '@/lib/utils';

interface StatusPillProps {
  status: IntegrationStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const statusStyles: Record<IntegrationStatus, string> = {
  verified: 'bg-status-verified-bg text-status-verified-text border-status-verified-border',
  processing: 'bg-status-processing-bg text-status-processing-text border-status-processing-border',
  connected: 'bg-status-connected-bg text-status-connected-text border-status-connected-border',
  configured: 'bg-status-configured-bg text-status-configured-text border-status-configured-border',
  degraded: 'bg-status-degraded-bg text-status-degraded-text border-status-degraded-border',
  error: 'bg-status-error-bg text-status-error-text border-status-error-border',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-body-xs',
  md: 'px-2.5 py-1 text-body-sm',
  lg: 'px-3 py-1.5 text-body-md',
};

export function StatusPill({
  status,
  size = 'md',
  showIcon = true,
  className,
}: StatusPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        statusStyles[status],
        sizeStyles[size],
        className
      )}
    >
      {showIcon && <span aria-hidden="true">{getStatusIcon(status)}</span>}
      <span>{getStatusLabel(status)}</span>
    </span>
  );
}
