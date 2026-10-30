'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type DocumentStatusVariant =
  | 'draft'
  | 'pending'
  | 'pending_approval'
  | 'approved'
  | 'submitted'
  | 'posted'
  | 'fulfilled'
  | 'partially_fulfilled'
  | 'closed'
  | 'rejected'
  | 'cancelled'
  | 'on_hold'
  | 'onhold'
  | 'amended';

export type SemanticBadgeVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'destructive'
  | 'error'
  | 'info'
  | 'outline';

export type BadgeVariant = DocumentStatusVariant | SemanticBadgeVariant;

export type BadgeSize = 'xs' | 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  dotPulse?: boolean;
  removable?: boolean;
  onRemove?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  removeButtonAriaLabel?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; border: string; dot: string }> = {
  // Document Status Variants
  draft: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-300 dark:border-slate-700',
    dot: 'bg-slate-500 dark:bg-slate-400',
  },
  pending: {
    bg: 'bg-amber-50 dark:bg-amber-950/60',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-300/80 dark:border-amber-800',
    dot: 'bg-amber-500',
  },
  pending_approval: {
    bg: 'bg-amber-50 dark:bg-amber-950/60',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-300/80 dark:border-amber-800',
    dot: 'bg-amber-500',
  },
  approved: {
    bg: 'bg-blue-50 dark:bg-blue-950/60',
    text: 'text-blue-800 dark:text-blue-300',
    border: 'border-blue-300/80 dark:border-blue-800',
    dot: 'bg-blue-500',
  },
  submitted: {
    bg: 'bg-purple-50 dark:bg-purple-950/60',
    text: 'text-purple-800 dark:text-purple-300',
    border: 'border-purple-300/80 dark:border-purple-800',
    dot: 'bg-purple-500',
  },
  posted: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/60',
    text: 'text-emerald-800 dark:text-emerald-300',
    border: 'border-emerald-300/80 dark:border-emerald-800',
    dot: 'bg-emerald-500',
  },
  fulfilled: {
    bg: 'bg-teal-50 dark:bg-teal-950/60',
    text: 'text-teal-800 dark:text-teal-300',
    border: 'border-teal-300/80 dark:border-teal-800',
    dot: 'bg-teal-500',
  },
  partially_fulfilled: {
    bg: 'bg-cyan-50 dark:bg-cyan-950/60',
    text: 'text-cyan-800 dark:text-cyan-300',
    border: 'border-cyan-300/80 dark:border-cyan-800',
    dot: 'bg-cyan-500',
  },
  closed: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-300 dark:border-slate-700',
    dot: 'bg-slate-400',
  },
  rejected: {
    bg: 'bg-rose-50 dark:bg-rose-950/60',
    text: 'text-rose-800 dark:text-rose-300',
    border: 'border-rose-300/80 dark:border-rose-800',
    dot: 'bg-rose-500',
  },
  cancelled: {
    bg: 'bg-red-50 dark:bg-red-950/60',
    text: 'text-red-800 dark:text-red-300',
    border: 'border-red-300/80 dark:border-red-800',
    dot: 'bg-red-600',
  },
  on_hold: {
    bg: 'bg-orange-50 dark:bg-orange-950/60',
    text: 'text-orange-800 dark:text-orange-300',
    border: 'border-orange-300/80 dark:border-orange-800',
    dot: 'bg-orange-500',
  },
  onhold: {
    bg: 'bg-orange-50 dark:bg-orange-950/60',
    text: 'text-orange-800 dark:text-orange-300',
    border: 'border-orange-300/80 dark:border-orange-800',
    dot: 'bg-orange-500',
  },
  amended: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/60',
    text: 'text-indigo-800 dark:text-indigo-300',
    border: 'border-indigo-300/80 dark:border-indigo-800',
    dot: 'bg-indigo-500',
  },

  // Semantic Variants
  default: {
    bg: 'bg-brand-50 dark:bg-brand-950/60',
    text: 'text-brand-800 dark:text-brand-300',
    border: 'border-brand-300/80 dark:border-brand-800',
    dot: 'bg-brand-500',
  },
  primary: {
    bg: 'bg-brand-600 dark:bg-brand-600 text-white',
    text: 'text-white',
    border: 'border-brand-700/30 dark:border-brand-500/30',
    dot: 'bg-white',
  },
  secondary: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-800 dark:text-slate-200',
    border: 'border-slate-300 dark:border-slate-700',
    dot: 'bg-slate-500',
  },
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/60',
    text: 'text-emerald-800 dark:text-emerald-300',
    border: 'border-emerald-300/80 dark:border-emerald-800',
    dot: 'bg-emerald-500',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/60',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-300/80 dark:border-amber-800',
    dot: 'bg-amber-500',
  },
  danger: {
    bg: 'bg-red-50 dark:bg-red-950/60',
    text: 'text-red-800 dark:text-red-300',
    border: 'border-red-300/80 dark:border-red-800',
    dot: 'bg-red-500',
  },
  destructive: {
    bg: 'bg-red-50 dark:bg-red-950/60',
    text: 'text-red-800 dark:text-red-300',
    border: 'border-red-300/80 dark:border-red-800',
    dot: 'bg-red-500',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-950/60',
    text: 'text-red-800 dark:text-red-300',
    border: 'border-red-300/80 dark:border-red-800',
    dot: 'bg-red-500',
  },
  info: {
    bg: 'bg-sky-50 dark:bg-sky-950/60',
    text: 'text-sky-800 dark:text-sky-300',
    border: 'border-sky-300/80 dark:border-sky-800',
    dot: 'bg-sky-500',
  },
  outline: {
    bg: 'bg-transparent',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-300 dark:border-slate-700',
    dot: 'bg-slate-500',
  },
};

const sizeStyles: Record<BadgeSize, { badge: string; dot: string; icon: string; close: string }> = {
  xs: {
    badge: 'text-[10px] leading-tight px-1.5 py-0.5 gap-1 rounded',
    dot: 'h-1.5 w-1.5',
    icon: 'h-3 w-3',
    close: 'h-2.5 w-2.5',
  },
  sm: {
    badge: 'text-xs font-medium px-2 py-0.5 gap-1.5 rounded-md',
    dot: 'h-1.5 w-1.5',
    icon: 'h-3.5 w-3.5',
    close: 'h-3 w-3',
  },
  md: {
    badge: 'text-xs font-semibold px-2.5 py-1 gap-1.5 rounded-md',
    dot: 'h-2 w-2',
    icon: 'h-4 w-4',
    close: 'h-3.5 w-3.5',
  },
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant = 'default',
      size = 'sm',
      dot = false,
      dotPulse = false,
      removable = false,
      onRemove,
      removeButtonAriaLabel = 'Remove badge',
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    const config = variantStyles[variant] || variantStyles.default;
    const sizes = sizeStyles[size] || sizeStyles.sm;

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium border select-none transition-colors duration-150',
          config.bg,
          config.text,
          config.border,
          sizes.badge,
          className
        )}
        {...props}
      >
        {dot && (
          <span className="relative flex shrink-0">
            {dotPulse && (
              <span
                className={cn(
                  'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                  config.dot
                )}
              />
            )}
            <span className={cn('relative inline-flex rounded-full', sizes.dot, config.dot)} />
          </span>
        )}

        {leftIcon && (
          <span className={cn('inline-flex items-center shrink-0', sizes.icon)}>{leftIcon}</span>
        )}

        <span className="truncate">{children}</span>

        {rightIcon && !removable && (
          <span className={cn('inline-flex items-center shrink-0', sizes.icon)}>{rightIcon}</span>
        )}

        {removable && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.(e);
            }}
            aria-label={removeButtonAriaLabel}
            className={cn(
              'inline-flex items-center justify-center -mr-0.5 rounded-sm hover:opacity-80 active:opacity-100 transition-opacity focus:outline-hidden focus:ring-1 focus:ring-brand-500',
              sizes.close
            )}
          >
            <X className="h-full w-full" aria-hidden="true" />
          </button>
        )}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

/**
 * Convenience helper to render DocumentStatus badges with standard formatting.
 */
export interface DocumentStatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: string;
}

export const DocumentStatusBadge: React.FC<DocumentStatusBadgeProps> = ({
  status,
  children,
  ...props
}) => {
  const normalized = status?.toLowerCase().replace(/\s+/g, '_') as BadgeVariant;
  const validVariant = (variantStyles[normalized] ? normalized : 'draft') as BadgeVariant;
  const label = children || status.replace(/_/g, ' ').toUpperCase();

  return (
    <Badge variant={validVariant} dot {...props}>
      {label}
    </Badge>
  );
};
