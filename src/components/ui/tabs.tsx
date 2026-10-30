'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export type TabsOrientation = 'horizontal' | 'vertical';
export type TabsVariant = 'pills' | 'underline' | 'enclosed';

interface TabsContextValue {
  value: string;
  onValueChange: (val: string) => void;
  orientation: TabsOrientation;
  variant: TabsVariant;
  tabsId: string;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a <Tabs />');
  }
  return context;
}

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: TabsOrientation;
  variant?: TabsVariant;
}

export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  (
    {
      className,
      value: controlledValue,
      defaultValue = '',
      onValueChange,
      orientation = 'horizontal',
      variant = 'pills',
      children,
      ...props
    },
    ref
  ) => {
    const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
    const isControlled = controlledValue !== undefined;
    const value = isControlled ? controlledValue : uncontrolledValue;
    const tabsId = React.useId();

    const handleValueChange = React.useCallback(
      (nextValue: string) => {
        if (!isControlled) {
          setUncontrolledValue(nextValue);
        }
        onValueChange?.(nextValue);
      },
      [isControlled, onValueChange]
    );

    return (
      <TabsContext.Provider
        value={{
          value,
          onValueChange: handleValueChange,
          orientation,
          variant,
          tabsId,
        }}
      >
        <div
          ref={ref}
          data-orientation={orientation}
          className={cn(
            orientation === 'vertical' ? 'flex flex-row gap-4' : 'flex flex-col gap-2',
            className
          )}
          {...props}
        >
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);
Tabs.displayName = 'Tabs';

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

export const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, children, onKeyDown, ...props }, ref) => {
    const { orientation, variant } = useTabsContext();
    const listRef = React.useRef<HTMLDivElement | null>(null);

    const setMergedRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        listRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
      },
      [ref]
    );

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(e);
      if (e.defaultPrevented) return;

      const container = listRef.current;
      if (!container) return;

      const tabs = Array.from(
        container.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])')
      );
      if (tabs.length === 0) return;

      const currentIndex = tabs.indexOf(document.activeElement as HTMLButtonElement);
      if (currentIndex === -1) return;

      let nextIndex = currentIndex;
      const isHorizontal = orientation === 'horizontal';

      if ((isHorizontal && e.key === 'ArrowRight') || (!isHorizontal && e.key === 'ArrowDown')) {
        e.preventDefault();
        nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
      } else if ((isHorizontal && e.key === 'ArrowLeft') || (!isHorizontal && e.key === 'ArrowUp')) {
        e.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
      } else if (e.key === 'Home') {
        e.preventDefault();
        nextIndex = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        nextIndex = tabs.length - 1;
      } else {
        return;
      }

      tabs[nextIndex]?.focus();
      tabs[nextIndex]?.click();
    };

    return (
      <div
        ref={setMergedRef}
        role="tablist"
        aria-orientation={orientation}
        onKeyDown={handleKeyDown}
        className={cn(
          'inline-flex items-center text-slate-500 dark:text-slate-400 select-none',
          orientation === 'horizontal' ? 'w-fit flex-row' : 'w-full flex-col items-stretch',
          variant === 'pills' &&
            'p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg gap-1 border border-slate-200/60 dark:border-slate-800',
          variant === 'underline' &&
            (orientation === 'horizontal'
              ? 'border-b border-slate-200 dark:border-slate-800 gap-6 px-1'
              : 'border-l border-slate-200 dark:border-slate-800 gap-2 pl-1'),
          variant === 'enclosed' &&
            'border-b border-slate-200 dark:border-slate-800 gap-1 px-1',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TabsList.displayName = 'TabsList';

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  badge?: React.ReactNode;
}

export const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value: triggerValue, disabled = false, badge, children, onClick, ...props }, ref) => {
    const { value, onValueChange, variant, tabsId } = useTabsContext();
    const isSelected = value === triggerValue;

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        id={`${tabsId}-tab-${triggerValue}`}
        aria-selected={isSelected}
        aria-controls={`${tabsId}-panel-${triggerValue}`}
        tabIndex={isSelected ? 0 : -1}
        disabled={disabled}
        onClick={(e) => {
          onClick?.(e);
          if (!disabled) {
            onValueChange(triggerValue);
          }
        }}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap text-xs sm:text-sm font-medium transition-all duration-150 outline-hidden',
          'focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 ring-offset-white dark:ring-offset-slate-900',
          disabled && 'opacity-50 cursor-not-allowed pointer-events-none',

          // Pills Variant
          variant === 'pills' && [
            'px-3 py-1.5 rounded-md',
            isSelected
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50',
          ],

          // Underline Variant
          variant === 'underline' && [
            'py-2 px-1 border-b-2 -mb-px',
            isSelected
              ? 'border-brand-600 dark:border-brand-500 text-brand-600 dark:text-brand-400 font-semibold'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700',
          ],

          // Enclosed Variant
          variant === 'enclosed' && [
            'px-3.5 py-1.5 rounded-t-md border-t border-l border-r -mb-px',
            isSelected
              ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200',
          ],

          className
        )}
        {...props}
      >
        <span>{children}</span>
        {badge !== undefined && (
          <span className="ml-1.5 inline-flex items-center text-xs">{badge}</span>
        )}
      </button>
    );
  }
);
TabsTrigger.displayName = 'TabsTrigger';

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  forceMount?: boolean;
}

export const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value: contentValue, forceMount = false, children, ...props }, ref) => {
    const { value, tabsId } = useTabsContext();
    const isSelected = value === contentValue;

    if (!isSelected && !forceMount) {
      return null;
    }

    return (
      <div
        ref={ref}
        role="tabpanel"
        id={`${tabsId}-panel-${contentValue}`}
        aria-labelledby={`${tabsId}-tab-${contentValue}`}
        tabIndex={0}
        hidden={!isSelected}
        className={cn(
          'outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 rounded-md transition-opacity duration-150',
          !isSelected && 'hidden',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TabsContent.displayName = 'TabsContent';
