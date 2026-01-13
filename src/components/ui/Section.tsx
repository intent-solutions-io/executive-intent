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
  lg: 'max-w-7xl',
  xl: 'max-w-8xl',
  full: 'max-w-full',
};

export function Container({ children, className, size = 'lg' }: ContainerProps) {
  return (
    <div className={cn('mx-auto px-4 sm:px-6 lg:px-8', containerSizes[size], className)}>
      {children}
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  description?: string;
  className?: string;
  centered?: boolean;
}

export function SectionHeader({ title, description, className, centered = false }: SectionHeaderProps) {
  return (
    <div className={cn(centered && 'text-center', className)}>
      <h2 className="text-display-sm font-bold text-neutral-900">{title}</h2>
      {description && (
        <p className="mt-3 text-body-lg text-neutral-600 max-w-prose-wide">
          {description}
        </p>
      )}
    </div>
  );
}
