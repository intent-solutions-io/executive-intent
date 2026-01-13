import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ReactNode, forwardRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  href?: string;
  external?: boolean;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  onClick?: () => void;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 border-transparent',
  secondary: 'bg-neutral-900 text-white hover:bg-neutral-800 active:bg-neutral-700 border-transparent',
  ghost: 'bg-transparent text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200 border-transparent',
  outline: 'bg-white text-neutral-900 hover:bg-neutral-50 active:bg-neutral-100 border-neutral-300',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-body-sm gap-1.5',
  md: 'h-10 px-4 text-body-md gap-2',
  lg: 'h-12 px-6 text-body-lg gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  function Button(
    {
      variant = 'primary',
      size = 'md',
      children,
      className,
      icon,
      iconPosition = 'left',
      href,
      external,
      type = 'button',
      disabled,
      onClick,
    },
    ref
  ) {
    const styles = cn(
      'inline-flex items-center justify-center rounded-lg border font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
      variantStyles[variant],
      sizeStyles[size],
      className
    );

    const content = (
      <>
        {icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>}
        <span>{children}</span>
        {icon && iconPosition === 'right' && <span className="flex-shrink-0">{icon}</span>}
      </>
    );

    if (href) {
      if (external) {
        return (
          <a
            ref={ref as React.Ref<HTMLAnchorElement>}
            href={href}
            className={styles}
            target="_blank"
            rel="noopener noreferrer"
          >
            {content}
          </a>
        );
      }
      return (
        <Link ref={ref as React.Ref<HTMLAnchorElement>} href={href} className={styles}>
          {content}
        </Link>
      );
    }

    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type={type}
        className={styles}
        disabled={disabled}
        onClick={onClick}
      >
        {content}
      </button>
    );
  }
);
