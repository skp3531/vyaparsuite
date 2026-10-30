'use client';

import * as React from 'react';
import { FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type EmptyStateSize = 'sm' | 'md' | 'lg';

export interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  bordered?: boolean;
  size?: EmptyStateSize;
}

const sizeStyles: Record<EmptyStateSize, { container: string; iconBox: string; iconSize: string; title: string; desc: string }> = {
  sm: {
    container: 'p-6 py-8',
    iconBox: 'h-10 w-10',
    iconSize: 'h-5 w-5',
    title: 'text-sm font-semibold',
    desc: 'text-xs max-w-sm',
  },
  md: {
    container: 'p-8 py-12',
    iconBox: 'h-12 w-12',
    iconSize: 'h-6 w-6',
    title: 'text-base font-semibold',
    desc: 'text-xs sm:text-sm max-w-md',
  },
  lg: {
    container: 'p-10 py-16',
    iconBox: 'h-16 w-16',
    iconSize: 'h-8 w-8',
    title: 'text-lg font-semibold',
    desc: 'text-sm max-w-lg',
  },
};

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      className,
      icon,
      title,
      description,
      action,
      secondaryAction,
      bordered = false,
      size = 'md',
      children,
      ...props
    },
    ref
  ) => {
    const config = sizeStyles[size] || sizeStyles.md;

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center text-center',
          bordered &&
            'rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30',
          config.container,
          className
        )}
        {...props}
      >
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mb-3.5',
            config.iconBox
          )}
        >
          {icon ? (
            <span className={cn('inline-flex items-center justify-center', config.iconSize)}>
              {icon}
            </span>
          ) : (
            <FolderOpen className={config.iconSize} aria-hidden="true" />
          )}
        </div>

        <h3 className={cn('text-slate-900 dark:text-slate-100 tracking-tight', config.title)}>
          {title}
        </h3>

        {description && (
          <p className={cn('text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed', config.desc)}>
            {description}
          </p>
        )}

        {(action || secondaryAction) && (
          <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5">
            {action}
            {secondaryAction}
          </div>
        )}

        {children && <div className="mt-4">{children}</div>}
      </div>
    );
  }
);
EmptyState.displayName = 'EmptyState';
