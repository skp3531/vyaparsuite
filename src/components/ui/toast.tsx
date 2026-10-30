'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info';
export type ToastPosition =
  | 'top-right'
  | 'top-left'
  | 'top-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-center';

export interface ToastAction {
  label: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: 'primary' | 'secondary' | 'outline';
}

export interface ToastData {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: ToastVariant;
  type?: ToastVariant;
  duration?: number; // ms, default 5000, 0 for infinite
  action?: ToastAction;
  onDismiss?: () => void;
  icon?: React.ReactNode;
}

export interface ToastOptions extends Omit<ToastData, 'id'> {}

export interface ToastContextValue {
  toasts: ToastData[];
  toast: {
    (options: ToastOptions): string;
    success: (title: React.ReactNode, options?: Partial<ToastOptions>) => string;
    error: (title: React.ReactNode, options?: Partial<ToastOptions>) => string;
    warning: (title: React.ReactNode, options?: Partial<ToastOptions>) => string;
    info: (title: React.ReactNode, options?: Partial<ToastOptions>) => string;
  };
  addToast: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

let globalToastId = 0;

export interface ToastProviderProps {
  children: React.ReactNode;
  position?: ToastPosition;
  maxToasts?: number;
}

const positionStyles: Record<ToastPosition, string> = {
  'top-right': 'top-4 right-4 sm:top-6 sm:right-6 flex-col',
  'top-left': 'top-4 left-4 sm:top-6 sm:left-6 flex-col',
  'top-center': 'top-4 left-1/2 -translate-x-1/2 sm:top-6 flex-col items-center',
  'bottom-right': 'bottom-4 right-4 sm:bottom-6 sm:right-6 flex-col-reverse',
  'bottom-left': 'bottom-4 left-4 sm:bottom-6 sm:left-6 flex-col-reverse',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 sm:bottom-6 flex-col-reverse items-center',
};

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  position = 'top-right',
  maxToasts = 5,
}) => {
  const [toasts, setToasts] = React.useState<ToastData[]>([]);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => {
      const match = prev.find((t) => t.id === id);
      if (match?.onDismiss) {
        match.onDismiss();
      }
      return prev.filter((t) => t.id !== id);
    });
  }, []);

  const dismissAll = React.useCallback(() => {
    setToasts((prev) => {
      prev.forEach((t) => t.onDismiss?.());
      return [];
    });
  }, []);

  const addToast = React.useCallback(
    (options: ToastOptions): string => {
      const id = `toast-${++globalToastId}-${Date.now()}`;
      const newToast: ToastData = {
        id,
        duration: 5000,
        variant: 'default',
        ...options,
      };

      setToasts((prev) => {
        const next = [newToast, ...prev];
        if (next.length > maxToasts) {
          return next.slice(0, maxToasts);
        }
        return next;
      });

      return id;
    },
    [maxToasts]
  );

  const toastMethods = React.useMemo(() => {
    const fn = (options: ToastOptions) => addToast(options);
    fn.success = (title: React.ReactNode, options?: Partial<ToastOptions>) =>
      addToast({ title, variant: 'success', ...options });
    fn.error = (title: React.ReactNode, options?: Partial<ToastOptions>) =>
      addToast({ title, variant: 'error', duration: 7000, ...options });
    fn.warning = (title: React.ReactNode, options?: Partial<ToastOptions>) =>
      addToast({ title, variant: 'warning', ...options });
    fn.info = (title: React.ReactNode, options?: Partial<ToastOptions>) =>
      addToast({ title, variant: 'info', ...options });
    return fn;
  }, [addToast]);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        toast: toastMethods,
        addToast,
        dismiss,
        dismissAll,
      }}
    >
      {children}
      {mounted &&
        createPortal(
          <div
            aria-live="polite"
            className={cn(
              'pointer-events-none fixed z-100 flex max-h-screen w-full max-w-sm gap-2.5 p-4',
              positionStyles[position]
            )}
          >
            {toasts.map((toastItem) => (
              <ToastItem key={toastItem.id} toast={toastItem} onDismiss={() => dismiss(toastItem.id)} />
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a <ToastProvider />');
  }
  return context;
}

const variantConfig: Record<
  ToastVariant,
  {
    icon: React.ElementType;
    iconClass: string;
    containerClass: string;
    role: 'alert' | 'status';
  }
> = {
  default: {
    icon: Info,
    iconClass: 'text-slate-500 dark:text-slate-400',
    containerClass: 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100',
    role: 'status',
  },
  success: {
    icon: CheckCircle2,
    iconClass: 'text-emerald-600 dark:text-emerald-400',
    containerClass: 'bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-800/80 text-slate-900 dark:text-slate-100',
    role: 'status',
  },
  error: {
    icon: AlertCircle,
    iconClass: 'text-red-600 dark:text-red-400',
    containerClass: 'bg-white dark:bg-slate-900 border-red-300 dark:border-red-800/80 text-slate-900 dark:text-slate-100',
    role: 'alert',
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-amber-600 dark:text-amber-400',
    containerClass: 'bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-800/80 text-slate-900 dark:text-slate-100',
    role: 'alert',
  },
  info: {
    icon: Info,
    iconClass: 'text-brand-600 dark:text-brand-400',
    containerClass: 'bg-white dark:bg-slate-900 border-brand-300 dark:border-brand-800/80 text-slate-900 dark:text-slate-100',
    role: 'status',
  },
};

interface ToastItemProps {
  toast: ToastData;
  onDismiss: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const { variant: explicitVariant, type: fallbackVariant, duration = 5000, title, description, action, icon: customIcon } = toast;
  const variant = explicitVariant || fallbackVariant || 'default';
  const config = variantConfig[variant] || variantConfig.default;
  const IconComponent = config.icon;

  const [isPaused, setIsPaused] = React.useState(false);
  const remainingTime = React.useRef(duration);
  const startTime = React.useRef(Date.now());

  React.useEffect(() => {
    if (duration <= 0 || isPaused) return;

    startTime.current = Date.now();
    const timer = setTimeout(() => {
      onDismiss();
    }, remainingTime.current);

    return () => {
      clearTimeout(timer);
      const elapsed = Date.now() - startTime.current;
      remainingTime.current = Math.max(0, remainingTime.current - elapsed);
    };
  }, [duration, isPaused, onDismiss]);

  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  return (
    <div
      role={config.role}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'pointer-events-auto relative flex w-full items-start gap-3 rounded-lg border p-3.5 shadow-lg transition-all duration-200',
        'animate-in-scale',
        config.containerClass
      )}
    >
      <div className="shrink-0 mt-0.5">
        {customIcon ? (
          <span className={cn('h-5 w-5 inline-flex items-center', config.iconClass)}>
            {customIcon}
          </span>
        ) : (
          <IconComponent className={cn('h-5 w-5', config.iconClass)} aria-hidden="true" />
        )}
      </div>

      <div className="flex-1 space-y-1">
        {title && (
          <div className="text-xs sm:text-sm font-semibold tracking-tight leading-snug">
            {title}
          </div>
        )}
        {description && (
          <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {description}
          </div>
        )}
        {action && (
          <div className="pt-1.5">
            <button
              type="button"
              onClick={(e) => {
                action.onClick(e);
                onDismiss();
              }}
              className="inline-flex items-center text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 underline underline-offset-2 focus:outline-hidden"
            >
              {action.label}
            </button>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Close notification"
        className="shrink-0 rounded-md p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-hidden transition-colors"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
};

export const Toast = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { variant?: ToastVariant }>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const config = variantConfig[variant] || variantConfig.default;
    return (
      <div
        ref={ref}
        role={config.role}
        className={cn(
          'flex w-full items-center gap-3 rounded-lg border p-3.5 shadow-md',
          config.containerClass,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Toast.displayName = 'Toast';
