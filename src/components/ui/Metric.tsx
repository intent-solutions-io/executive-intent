import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface MetricProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: {
    label: 'text-body-xs',
    value: 'text-display-xs',
  },
  md: {
    label: 'text-body-sm',
    value: 'text-display-sm',
  },
  lg: {
    label: 'text-body-md',
    value: 'text-display-md',
  },
};

export function Metric({
  label,
  value,
  sublabel,
  icon,
  className,
  size = 'md',
}: MetricProps) {
  const styles = sizeStyles[size];

  return (
    <div className={cn('flex flex-col', className)}>
      <dt className={cn('text-neutral-500 uppercase tracking-wider font-medium', styles.label)}>
        {label}
      </dt>
      <dd className="mt-1 flex items-baseline gap-2">
        {icon && <span className="flex-shrink-0 text-neutral-400">{icon}</span>}
        <span className={cn('font-bold text-neutral-900', styles.value)}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {sublabel && (
          <span className="text-body-sm text-neutral-500">{sublabel}</span>
        )}
      </dd>
    </div>
  );
}

interface MetricGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function MetricGrid({ children, columns = 3, className }: MetricGridProps) {
  const colStyles = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
  };

  return (
    <dl className={cn('grid gap-6', colStyles[columns], className)}>
      {children}
    </dl>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  className?: string;
}

export function MetricCard({ label, value, sublabel, className }: MetricCardProps) {
  return (
    <div className={cn('bg-neutral-50 rounded-lg p-4', className)}>
      <Metric label={label} value={value} sublabel={sublabel} size="md" />
    </div>
  );
}
