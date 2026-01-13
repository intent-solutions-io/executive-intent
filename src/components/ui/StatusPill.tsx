import { IntegrationStatus } from '@/lib/evidence/types';
import { getStatusIcon, getStatusLabel } from '@/lib/evidence/format';
import { cn } from '@/lib/utils';

interface StatusPillProps {
  status: IntegrationStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const statusBorderStyles: Record<IntegrationStatus, string> = {
  verified: 'border-status-verified-border',
  processing: 'border-status-processing-border',
  connected: 'border-status-connected-border',
  configured: 'border-neutral-300',
  degraded: 'border-status-degraded-border',
  error: 'border-status-error-border',
};

const statusDotStyles: Record<IntegrationStatus, string> = {
  verified: 'bg-status-verified-text',
  processing: 'bg-status-processing-text',
  connected: 'bg-status-connected-text',
  configured: 'bg-neutral-500',
  degraded: 'bg-status-degraded-text',
  error: 'bg-status-error-text',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-body-xs gap-1.5',
  md: 'px-2.5 py-1 text-body-sm gap-2',
  lg: 'px-3 py-1.5 text-body-md gap-2',
};

const dotSizeStyles = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-2.5 h-2.5',
};

export function StatusPill({
  status,
  size = 'md',
  showIcon = false,
  className,
}: StatusPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border bg-white text-neutral-900 font-semibold',
        statusBorderStyles[status],
        sizeStyles[size],
        className
      )}
    >
      <span aria-hidden="true" className={cn('inline-block rounded-full', dotSizeStyles[size], statusDotStyles[status])} />
      {showIcon && <span aria-hidden="true" className="text-neutral-900">{getStatusIcon(status)}</span>}
      <span>{getStatusLabel(status)}</span>
    </span>
  );
}
