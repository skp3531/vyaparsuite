'use client';

import * as React from 'react';
import { ChevronDown, Check, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

// ==========================================
// 1. Native Select Component
// ==========================================

export type SelectSize = 'sm' | 'md' | 'lg';

export interface NativeSelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'prefix'> {
  size?: SelectSize;
  label?: string;
  helperText?: string;
  errorMessage?: string;
  prefix?: React.ReactNode;
  wrapperClassName?: string;
  selectClassName?: string;
  labelClassName?: string;
}

const sizeStyles: Record<SelectSize, { select: string; wrapper: string; icon: string }> = {
  sm: {
    select: 'h-7 text-xs px-2.5 py-1',
    wrapper: 'h-7',
    icon: 'h-3.5 w-3.5',
  },
  md: {
    select: 'h-8.5 text-sm px-3 py-1.5',
    wrapper: 'h-8.5',
    icon: 'h-4 w-4',
  },
  lg: {
    select: 'h-10 text-base px-3.5 py-2',
    wrapper: 'h-10',
    icon: 'h-5 w-5',
  },
};

export const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  (
    {
      className,
      size = 'md',
      label,
      helperText,
      errorMessage,
      prefix,
      disabled = false,
      required = false,
      id: customId,
      wrapperClassName,
      selectClassName,
      labelClassName,
      children,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const selectId = customId || generatedId;
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;
    const hasError = Boolean(errorMessage);

    return (
      <div className={cn('w-full flex flex-col space-y-1', className)}>
        {label && (
          <label
            htmlFor={selectId}
            className={cn(
              'block text-xs font-medium text-slate-700 dark:text-slate-300',
              disabled && 'opacity-60 cursor-not-allowed',
              labelClassName
            )}
          >
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}

        <div
          className={cn(
            'relative flex items-center rounded-md border transition-all duration-150 bg-white dark:bg-slate-900',
            hasError
              ? 'border-red-500 focus-within:ring-2 focus-within:ring-red-500/30'
              : 'border-slate-300 dark:border-slate-700 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20',
            disabled && 'bg-slate-50 dark:bg-slate-800/50 opacity-60 cursor-not-allowed',
            sizeStyles[size].wrapper,
            wrapperClassName
          )}
        >
          {prefix && (
            <div className="flex items-center justify-center pl-2.5 text-slate-400 dark:text-slate-500 shrink-0">
              {prefix}
            </div>
          )}

          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            required={required}
            aria-invalid={hasError ? 'true' : undefined}
            aria-describedby={hasError ? errorId : helperText ? helperId : undefined}
            className={cn(
              'w-full bg-transparent text-slate-900 dark:text-slate-100 outline-none appearance-none cursor-pointer pr-8 font-normal',
              sizeStyles[size].select,
              prefix && 'pl-2',
              disabled && 'cursor-not-allowed',
              selectClassName
            )}
            {...props}
          >
            {children}
          </select>

          <div className="pointer-events-none absolute right-2.5 flex items-center text-slate-400 dark:text-slate-500">
            <ChevronDown className={sizeStyles[size].icon} aria-hidden="true" />
          </div>
        </div>

        {hasError ? (
          <p id={errorId} className="text-xs text-red-600 dark:text-red-400 mt-0.5 font-medium">
            {errorMessage}
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);
NativeSelect.displayName = 'NativeSelect';

// ==========================================
// 2. Custom Searchable Select Component
// ==========================================

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  description?: string;
  icon?: React.ReactNode;
}

export interface SelectOptionGroup {
  label: string;
  options: SelectOption[];
}

export type SelectItem = SelectOption | SelectOptionGroup;

function isOptionGroup(item: SelectItem): item is SelectOptionGroup {
  return 'options' in item;
}

export interface CustomSelectProps {
  options: SelectItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  helperText?: string;
  errorMessage?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  clearable?: boolean;
  disabled?: boolean;
  required?: boolean;
  size?: SelectSize;
  className?: string;
  id?: string;
}

export const Select = React.forwardRef<HTMLButtonElement, CustomSelectProps>(
  (
    {
      options,
      value: controlledValue,
      defaultValue = '',
      onChange,
      placeholder = 'Select an option...',
      label,
      helperText,
      errorMessage,
      searchable = false,
      searchPlaceholder = 'Search...',
      clearable = false,
      disabled = false,
      required = false,
      size = 'md',
      className,
      id: customId,
    },
    ref
  ) => {
    const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
    const [open, setOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [highlightedIndex, setHighlightedIndex] = React.useState(-1);

    const isControlled = controlledValue !== undefined;
    const selectedValue = isControlled ? controlledValue : uncontrolledValue;

    const generatedId = React.useId();
    const selectId = customId || generatedId;
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;
    const listboxId = `${selectId}-listbox`;

    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const searchInputRef = React.useRef<HTMLInputElement | null>(null);
    const optionsContainerRef = React.useRef<HTMLDivElement | null>(null);

    // Flatten options for easy index navigation
    const flatOptions = React.useMemo(() => {
      const list: SelectOption[] = [];
      for (const item of options) {
        if (isOptionGroup(item)) {
          list.push(...item.options);
        } else {
          list.push(item);
        }
      }
      return list;
    }, [options]);

    // Find current selected option label
    const selectedOption = flatOptions.find((opt) => opt.value === selectedValue);

    // Filter options by search query
    const filteredItems = React.useMemo(() => {
      if (!searchQuery.trim()) return options;

      const q = searchQuery.toLowerCase().trim();

      const result: SelectItem[] = [];
      for (const item of options) {
        if (isOptionGroup(item)) {
          const matched = item.options.filter(
            (opt) =>
              opt.label.toLowerCase().includes(q) ||
              opt.description?.toLowerCase().includes(q) ||
              opt.value.toLowerCase().includes(q)
          );
          if (matched.length > 0) {
            result.push({ label: item.label, options: matched });
          }
        } else {
          if (
            item.label.toLowerCase().includes(q) ||
            item.description?.toLowerCase().includes(q) ||
            item.value.toLowerCase().includes(q)
          ) {
            result.push(item);
          }
        }
      }
      return result;
    }, [options, searchQuery]);

    const filteredFlatOptions = React.useMemo(() => {
      const list: SelectOption[] = [];
      for (const item of filteredItems) {
        if (isOptionGroup(item)) {
          list.push(...item.options);
        } else {
          list.push(item);
        }
      }
      return list;
    }, [filteredItems]);

    // Handle select item
    const selectOption = React.useCallback(
      (opt: SelectOption) => {
        if (opt.disabled) return;
        if (!isControlled) {
          setUncontrolledValue(opt.value);
        }
        onChange?.(opt.value);
        setOpen(false);
        setSearchQuery('');
      },
      [isControlled, onChange]
    );

    // Handle clear
    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isControlled) {
        setUncontrolledValue('');
      }
      onChange?.('');
      setSearchQuery('');
    };

    // Close on click outside
    React.useEffect(() => {
      if (!open) return;

      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setOpen(false);
          setSearchQuery('');
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [open]);

    // Focus search input when opening
    React.useEffect(() => {
      if (open && searchable) {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 50);
      }
      if (open) {
        // Highlight active item or first
        const activeIdx = filteredFlatOptions.findIndex((o) => o.value === selectedValue);
        setHighlightedIndex(activeIdx >= 0 ? activeIdx : 0);
      }
    }, [open, searchable, selectedValue, filteredFlatOptions]);

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;

      if (!open) {
        if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setOpen(true);
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        setSearchQuery('');
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredFlatOptions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredFlatOptions.length - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredFlatOptions.length) {
          selectOption(filteredFlatOptions[highlightedIndex]);
        }
      }
    };

    const hasError = Boolean(errorMessage);

    return (
      <div ref={containerRef} className={cn('relative w-full flex flex-col space-y-1', className)}>
        {label && (
          <label
            id={`${selectId}-label`}
            className={cn(
              'block text-xs font-medium text-slate-700 dark:text-slate-300',
              disabled && 'opacity-60 cursor-not-allowed'
            )}
          >
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}

        <button
          ref={ref}
          id={selectId}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-labelledby={label ? `${selectId}-label ${selectId}` : undefined}
          disabled={disabled}
          onClick={() => !disabled && setOpen(!open)}
          onKeyDown={handleKeyDown}
          className={cn(
            'flex w-full items-center justify-between rounded-md border text-left font-normal transition-all duration-150 bg-white dark:bg-slate-900',
            sizeStyles[size].wrapper,
            sizeStyles[size].select,
            hasError
              ? 'border-red-500 focus-visible:ring-2 focus-visible:ring-red-500/30'
              : open
              ? 'border-brand-500 ring-2 ring-brand-500/20'
              : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600',
            disabled && 'bg-slate-50 dark:bg-slate-800/50 opacity-60 cursor-not-allowed'
          )}
        >
          <span className="flex items-center gap-2 truncate">
            {selectedOption?.icon && (
              <span className="shrink-0">{selectedOption.icon}</span>
            )}
            <span
              className={cn(
                'truncate',
                !selectedOption ? 'text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'
              )}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </span>

          <span className="flex items-center gap-1 shrink-0 ml-2 text-slate-400 dark:text-slate-500">
            {clearable && selectedValue && !disabled && (
              <span
                role="button"
                tabIndex={0}
                aria-label="Clear selection"
                onClick={handleClear}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleClear(e as unknown as React.MouseEvent);
                  }
                }}
                className="rounded p-0.5 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
            <ChevronDown
              className={cn(
                sizeStyles[size].icon,
                'transition-transform duration-200',
                open && 'rotate-180'
              )}
              aria-hidden="true"
            />
          </span>
        </button>

        {open && (
          <div
            id={listboxId}
            role="listbox"
            tabIndex={-1}
            ref={optionsContainerRef}
            className="absolute left-0 top-full z-50 mt-1 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-1 shadow-lg animate-in-scale focus:outline-hidden"
          >
            {searchable && (
              <div className="sticky top-0 z-10 p-1.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <div className="relative flex items-center">
                  <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={searchPlaceholder}
                    className="w-full rounded bg-slate-50 dark:bg-slate-800 py-1 pl-8 pr-2 text-xs text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-400 focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>
            )}

            <div className="max-h-60 overflow-y-auto py-1">
              {filteredFlatOptions.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-slate-400 dark:text-slate-500">
                  No options found
                </div>
              ) : (
                filteredItems.map((item, idx) => {
                  if (isOptionGroup(item)) {
                    return (
                      <div key={`group-${idx}`} className="py-1">
                        <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          {item.label}
                        </div>
                        {item.options.map((opt) => renderOptionItem(opt))}
                      </div>
                    );
                  }
                  return renderOptionItem(item);
                })
              )}
            </div>
          </div>
        )}

        {hasError ? (
          <p id={errorId} className="text-xs text-red-600 dark:text-red-400 mt-0.5 font-medium">
            {errorMessage}
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {helperText}
          </p>
        ) : null}
      </div>
    );

    function renderOptionItem(opt: SelectOption) {
      const isSelected = opt.value === selectedValue;
      const flatIdx = filteredFlatOptions.indexOf(opt);
      const isHighlighted = flatIdx === highlightedIndex;

      return (
        <div
          key={opt.value}
          role="option"
          aria-selected={isSelected}
          aria-disabled={opt.disabled}
          onClick={() => selectOption(opt)}
          onMouseEnter={() => setHighlightedIndex(flatIdx)}
          className={cn(
            'relative flex cursor-pointer select-none items-center justify-between px-3 py-1.5 text-xs sm:text-sm outline-none transition-colors',
            isHighlighted && 'bg-slate-100 dark:bg-slate-800',
            isSelected && 'font-semibold text-brand-600 dark:text-brand-400',
            opt.disabled && 'opacity-40 cursor-not-allowed pointer-events-none'
          )}
        >
          <div className="flex items-center gap-2 truncate pr-2">
            {opt.icon && <span className="shrink-0">{opt.icon}</span>}
            <div className="truncate">
              <div>{opt.label}</div>
              {opt.description && (
                <div className="text-[11px] font-normal text-slate-400 dark:text-slate-500">
                  {opt.description}
                </div>
              )}
            </div>
          </div>

          {isSelected && (
            <Check className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
          )}
        </div>
      );
    }
  }
);
Select.displayName = 'Select';
