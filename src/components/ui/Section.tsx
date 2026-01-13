import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface SectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
  background?: 'white' | 'gray' | 'dark';
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  border?: 'top' | 'bottom' | 'both' | 'none';
}

const backgroundStyles = {
  white: 'bg-white',
  gray: 'bg-neutral-50',
  dark: 'bg-neutral-900 text-white',
};

const paddingStyles = {
  sm: 'py-8',
  md: 'py-12',
  lg: 'py-16',
  xl: 'py-20',
};

const borderStyles = {
  top: 'border-t border-neutral-200',
  bottom: 'border-b border-neutral-200',
  both: 'border-y border-neutral-200',
  none: '',
};

export function Section({
  children,
  className,
  id,
  background = 'white',
  padding = 'lg',
  border = 'none',
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        backgroundStyles[background],
        paddingStyles[padding],
        border !== 'none' && background !== 'dark' && borderStyles[border],
        className
      )}
    >
      {children}
    </section>
  );
}

interface ContainerProps {
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const containerSizes = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: 'max-w-full',
};

export function Container({ children, className, size = 'lg' }: ContainerProps) {
  return (
    <div className={cn('mx-auto px-4 sm:px-6 lg:px-6', containerSizes[size], className)}>
      {children}
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  description?: string;
  className?: string;
  centered?: boolean;
  actions?: ReactNode;
}

export function SectionHeader({ title, description, className, centered = false, actions }: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4',
        centered ? 'items-center text-center' : 'sm:flex-row sm:items-end sm:justify-between',
        className
      )}
    >
      <div className={cn('min-w-0', centered && 'flex flex-col items-center')}>
        <h2 className="text-display-md font-semibold text-neutral-900 tracking-tight">{title}</h2>
        {description && (
          <p className={cn('mt-2 text-body-lg text-neutral-700 max-w-prose-wide', centered && 'mx-auto')}>
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className={cn('flex flex-col sm:flex-row gap-3', centered && 'justify-center')}>
          {actions}
        </div>
      )}
    </div>
  );
}
