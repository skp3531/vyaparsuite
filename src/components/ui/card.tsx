'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'flat' | 'raised' | 'bordered';
  hoverable?: boolean;
}

const variantStyles: Record<'default' | 'flat' | 'raised' | 'bordered', string> = {
  default: 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs',
  flat: 'bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800/80',
  raised: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md',
  bordered: 'bg-transparent border-2 border-slate-200 dark:border-slate-800',
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', hoverable = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg text-slate-900 dark:text-slate-100 transition-all duration-150',
          variantStyles[variant],
          hoverable &&
            'hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer',
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  bordered?: boolean;
}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, bordered = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col space-y-1.5 p-4 sm:p-5',
          bordered && 'border-b border-slate-200/80 dark:border-slate-800 pb-4 mb-4',
          className
        )}
        {...props}
      />
    );
  }
);
CardHeader.displayName = 'CardHeader';

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div';
}

export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as: Component = 'h3', ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(
          'font-semibold text-base sm:text-lg text-slate-900 dark:text-slate-100 tracking-tight leading-none',
          className
        )}
        {...props}
      />
    );
  }
);
CardTitle.displayName = 'CardTitle';

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn('text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-normal', className)}
        {...props}
      />
    );
  }
);
CardDescription.displayName = 'CardDescription';

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('p-4 sm:p-5 pt-0', className)}
        {...props}
      />
    );
  }
);
CardContent.displayName = 'CardContent';

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  bordered?: boolean;
}

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, bordered = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center p-4 sm:p-5 pt-0',
          bordered && 'border-t border-slate-200/80 dark:border-slate-800 pt-4 mt-4',
          className
        )}
        {...props}
      />
    );
  }
);
CardFooter.displayName = 'CardFooter';
