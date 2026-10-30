'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'destructive'
  | 'success'
  | 'link';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white border border-brand-700/20 shadow-xs focus-visible:ring-brand-500/40',
  secondary:
    'bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:active:bg-slate-600 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700 focus-visible:ring-slate-400/30',
  outline:
    'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 active:bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 focus-visible:ring-brand-500/40 shadow-xs',
  ghost:
    'bg-transparent hover:bg-slate-100 active:bg-slate-200 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:active:bg-slate-700 border border-transparent focus-visible:ring-slate-400/30',
  danger:
    'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white border border-red-700/20 shadow-xs focus-visible:ring-red-500/40',
  destructive:
    'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white border border-red-700/20 shadow-xs focus-visible:ring-red-500/40',
  success:
    'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white border border-emerald-700/20 shadow-xs focus-visible:ring-emerald-500/40',
  link:
    'bg-transparent text-brand-600 dark:text-brand-400 hover:underline active:opacity-80 p-0 h-auto border-none shadow-none focus-visible:ring-brand-500/40',
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'h-6 px-2 text-xs gap-1 rounded font-medium',
  sm: 'h-7 px-2.5 text-xs font-medium gap-1.5 rounded-md',
  md: 'h-8.5 px-3 text-sm font-medium gap-2 rounded-md',
  lg: 'h-10 px-4 text-sm font-medium gap-2.5 rounded-md',
};

const iconSizes: Record<ButtonSize, string> = {
  xs: 'h-3 w-3',
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-4.5 w-4.5',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isLoading}
        aria-disabled={isDisabled}
        className={cn(
          'inline-flex items-center justify-center select-none font-medium transition-colors duration-150',
          'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-1',
          'ring-offset-white dark:ring-offset-slate-900',
          variant !== 'link' && 'whitespace-nowrap',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          isDisabled &&
            'opacity-50 cursor-not-allowed pointer-events-none shadow-none filter grayscale-[20%]',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className={cn('animate-spin', iconSizes[size], 'shrink-0')}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3.5"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>{loadingText || children}</span>
          </>
        ) : (
          <>
            {leftIcon && (
              <span className={cn('shrink-0 inline-flex items-center', iconSizes[size])}>
                {leftIcon}
              </span>
            )}
            {children}
            {rightIcon && (
              <span className={cn('shrink-0 inline-flex items-center', iconSizes[size])}>
                {rightIcon}
              </span>
            )}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
