'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

// ==========================================
// 1. Spinner Component
// ==========================================

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerColor = 'brand' | 'white' | 'slate' | 'current';

export interface SpinnerProps extends React.SVGAttributes<SVGSVGElement> {
  size?: SpinnerSize;
  color?: SpinnerColor;
  label?: string;
}

const spinnerSizes: Record<SpinnerSize, string> = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-7 w-7',
  xl: 'h-9 w-9',
};

const spinnerColors: Record<SpinnerColor, string> = {
  brand: 'text-brand-600 dark:text-brand-400',
  white: 'text-white',
  slate: 'text-slate-500 dark:text-slate-400',
  current: 'text-current',
};

export const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(
  ({ className, size = 'md', color = 'brand', label = 'Loading...', ...props }, ref) => {
    return (
      <svg
        ref={ref}
        role="status"
        aria-label={label}
        className={cn('animate-spin shrink-0', spinnerSizes[size], spinnerColors[color], className)}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        {...props}
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
    );
  }
);
Spinner.displayName = 'Spinner';

// ==========================================
// 2. Skeleton Component
// ==========================================

export type SkeletonShape = 'rectangle' | 'rounded' | 'circle' | 'pill';
export type SkeletonAnimation = 'pulse' | 'shimmer' | 'none';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shape?: SkeletonShape;
  animation?: SkeletonAnimation;
  width?: string | number;
  height?: string | number;
}

const shapeStyles: Record<SkeletonShape, string> = {
  rectangle: 'rounded-none',
  rounded: 'rounded-md',
  circle: 'rounded-full',
  pill: 'rounded-full',
};

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      className,
      shape = 'rounded',
      animation = 'pulse',
      width,
      height,
      style,
      ...props
    },
    ref
  ) => {
    const inlineStyle: React.CSSProperties = {
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
      ...style,
    };

    return (
      <div
        ref={ref}
        aria-hidden="true"
        style={inlineStyle}
        className={cn(
          'bg-slate-200/80 dark:bg-slate-800 shrink-0 select-none overflow-hidden',
          shapeStyles[shape],
          animation === 'pulse' && 'animate-pulse',
          animation === 'shimmer' && 'animate-shimmer',
          className
        )}
        {...props}
      />
    );
  }
);
Skeleton.displayName = 'Skeleton';

// ==========================================
// 3. ProgressBar Component
// ==========================================

export type ProgressVariant = 'brand' | 'success' | 'warning' | 'danger';
export type ProgressSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  indeterminate?: boolean;
  size?: ProgressSize;
  variant?: ProgressVariant;
  label?: string;
  showValue?: boolean;
}

const progressSizeStyles: Record<ProgressSize, string> = {
  xs: 'h-1',
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

const progressVariantStyles: Record<ProgressVariant, string> = {
  brand: 'bg-brand-600 dark:bg-brand-500',
  success: 'bg-emerald-600 dark:bg-emerald-500',
  warning: 'bg-amber-500 dark:bg-amber-400',
  danger: 'bg-red-600 dark:bg-red-500',
};

export const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      className,
      value = 0,
      max = 100,
      indeterminate = false,
      size = 'md',
      variant = 'brand',
      label,
      showValue = false,
      ...props
    },
    ref
  ) => {
    const clampedValue = Math.min(Math.max(0, value), max);
    const percentage = Math.round((clampedValue / max) * 100);

    return (
      <div ref={ref} className={cn('w-full space-y-1.5', className)} {...props}>
        {(label || showValue) && (
          <div className="flex justify-between items-center text-xs font-medium text-slate-700 dark:text-slate-300">
            {label && <span>{label}</span>}
            {showValue && !indeterminate && (
              <span className="tabular-nums font-mono">{percentage}%</span>
            )}
          </div>
        )}

        <div
          role="progressbar"
          aria-valuenow={indeterminate ? undefined : clampedValue}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label || 'Progress'}
          className={cn(
            'w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800 relative',
            progressSizeStyles[size]
          )}
        >
          {indeterminate ? (
            <div
              className={cn(
                'h-full w-1/3 rounded-full animate-[shimmer_1.5s_infinite_ease-in-out]',
                progressVariantStyles[variant]
              )}
              style={{
                animation: 'slideIn 1.2s infinite ease-in-out',
              }}
            />
          ) : (
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300 ease-out',
                progressVariantStyles[variant]
              )}
              style={{ width: `${percentage}%` }}
            />
          )}
        </div>
      </div>
    );
  }
);
ProgressBar.displayName = 'ProgressBar';

// ==========================================
// 4. LoadingOverlay Component
// ==========================================

export interface LoadingOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  visible: boolean;
  message?: string;
  blur?: boolean;
  fullScreen?: boolean;
  spinnerSize?: SpinnerSize;
}

export const LoadingOverlay = React.forwardRef<HTMLDivElement, LoadingOverlayProps>(
  (
    {
      className,
      visible,
      message = 'Loading...',
      blur = true,
      fullScreen = false,
      spinnerSize = 'lg',
      children,
      ...props
    },
    ref
  ) => {
    if (!visible) return null;

    return (
      <div
        ref={ref}
        aria-live="polite"
        aria-busy="true"
        className={cn(
          'z-40 flex flex-col items-center justify-center p-4 transition-all duration-200 animate-in-fade',
          fullScreen ? 'fixed inset-0' : 'absolute inset-0',
          blur ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs' : 'bg-white/95 dark:bg-slate-900/95',
          className
        )}
        {...props}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <Spinner size={spinnerSize} />
          {message && (
            <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 animate-pulse">
              {message}
            </p>
          )}
          {children}
        </div>
      </div>
    );
  }
);
LoadingOverlay.displayName = 'LoadingOverlay';
