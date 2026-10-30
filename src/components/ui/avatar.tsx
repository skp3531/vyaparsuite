'use client';

import * as React from 'react';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type AvatarShape = 'circle' | 'rounded';
export type AvatarStatus = 'online' | 'offline' | 'busy' | 'away';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  name?: string;
  fallback?: React.ReactNode;
  size?: AvatarSize;
  shape?: AvatarShape;
  status?: AvatarStatus;
}

const sizeStyles: Record<
  AvatarSize,
  {
    container: string;
    text: string;
    icon: string;
    dot: string;
    dotOffset: string;
  }
> = {
  xs: {
    container: 'h-5 w-5',
    text: 'text-[9px] font-semibold',
    icon: 'h-3 w-3',
    dot: 'h-1.5 w-1.5 ring-1',
    dotOffset: 'bottom-0 right-0',
  },
  sm: {
    container: 'h-6 w-6',
    text: 'text-[11px] font-semibold',
    icon: 'h-3.5 w-3.5',
    dot: 'h-2 w-2 ring-1.5',
    dotOffset: 'bottom-0 right-0',
  },
  md: {
    container: 'h-8 w-8',
    text: 'text-xs font-semibold',
    icon: 'h-4 w-4',
    dot: 'h-2.5 w-2.5 ring-2',
    dotOffset: '-bottom-0.5 -right-0.5',
  },
  lg: {
    container: 'h-10 w-10',
    text: 'text-sm font-semibold',
    icon: 'h-5 w-5',
    dot: 'h-3 w-3 ring-2',
    dotOffset: 'bottom-0 right-0',
  },
  xl: {
    container: 'h-12 w-12',
    text: 'text-base font-semibold',
    icon: 'h-6 w-6',
    dot: 'h-3.5 w-3.5 ring-2',
    dotOffset: 'bottom-0.5 right-0.5',
  },
  '2xl': {
    container: 'h-16 w-16',
    text: 'text-lg font-semibold',
    icon: 'h-8 w-8',
    dot: 'h-4 w-4 ring-2',
    dotOffset: 'bottom-0.5 right-0.5',
  },
};

const shapeStyles: Record<AvatarShape, string> = {
  circle: 'rounded-full',
  rounded: 'rounded-lg',
};

const statusStyles: Record<AvatarStatus, { bg: string; label: string }> = {
  online: { bg: 'bg-emerald-500', label: 'Online' },
  offline: { bg: 'bg-slate-400', label: 'Offline' },
  busy: { bg: 'bg-red-500', label: 'Busy' },
  away: { bg: 'bg-amber-500', label: 'Away' },
};

function getInitials(name?: string): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      className,
      src,
      alt,
      name,
      fallback,
      size = 'md',
      shape = 'circle',
      status,
      ...props
    },
    ref
  ) => {
    const [imageError, setImageError] = React.useState(false);
    const config = sizeStyles[size] || sizeStyles.md;
    const initials = React.useMemo(() => getInitials(name), [name]);
    const showImage = Boolean(src) && !imageError;

    // Reset error when src changes
    React.useEffect(() => {
      setImageError(false);
    }, [src]);

    return (
      <div
        ref={ref}
        className={cn(
          'relative inline-flex shrink-0 select-none items-center justify-center bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 overflow-visible',
          config.container,
          shapeStyles[shape],
          className
        )}
        {...props}
      >
        <div
          className={cn(
            'flex h-full w-full items-center justify-center overflow-hidden',
            shapeStyles[shape]
          )}
        >
          {showImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src!}
              alt={alt || name || 'Avatar'}
              onError={() => setImageError(true)}
              className="h-full w-full object-cover"
            />
          ) : fallback ? (
            <span className={cn('inline-flex items-center justify-center', config.text)}>
              {fallback}
            </span>
          ) : initials ? (
            <span className={cn('uppercase font-semibold tracking-wider', config.text)}>
              {initials}
            </span>
          ) : (
            <User className={config.icon} aria-hidden="true" />
          )}
        </div>

        {status && (
          <span
            role="status"
            aria-label={statusStyles[status].label}
            className={cn(
              'absolute rounded-full ring-white dark:ring-slate-900',
              config.dot,
              config.dotOffset,
              statusStyles[status].bg
            )}
          />
        )}
      </div>
    );
  }
);
Avatar.displayName = 'Avatar';

// ==========================================
// Avatar Group Component
// ==========================================

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  max?: number;
  size?: AvatarSize;
  shape?: AvatarShape;
}

export const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ className, max = 4, size = 'md', shape = 'circle', children, ...props }, ref) => {
    const childrenArray = React.Children.toArray(children);
    const visibleChildren = childrenArray.slice(0, max);
    const remainingCount = Math.max(0, childrenArray.length - max);
    const config = sizeStyles[size] || sizeStyles.md;

    return (
      <div
        ref={ref}
        className={cn('inline-flex items-center -space-x-2 overflow-hidden py-0.5', className)}
        {...props}
      >
        {visibleChildren.map((child, index) => {
          if (React.isValidElement<AvatarProps>(child)) {
            return React.cloneElement(child, {
              key: index,
              size: child.props.size || size,
              shape: child.props.shape || shape,
              className: cn(
                'ring-2 ring-white dark:ring-slate-900 transition-transform hover:z-10 hover:scale-105',
                child.props.className
              ),
            });
          }
          return child;
        })}

        {remainingCount > 0 && (
          <div
            className={cn(
              'relative inline-flex shrink-0 select-none items-center justify-center bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold ring-2 ring-white dark:ring-slate-900',
              config.container,
              config.text,
              shapeStyles[shape]
            )}
          >
            +{remainingCount}
          </div>
        )}
      </div>
    );
  }
);
AvatarGroup.displayName = 'AvatarGroup';
