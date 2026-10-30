'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  size?: InputSize;
  label?: string;
  helperText?: string;
  errorMessage?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
  showPasswordToggle?: boolean;
  wrapperClassName?: string;
  inputClassName?: string;
  labelClassName?: string;
}

const sizeStyles: Record<InputSize, { input: string; wrapper: string; icon: string }> = {
  sm: {
    input: 'h-7 text-xs px-2.5 py-1',
    wrapper: 'h-7',
    icon: 'h-3.5 w-3.5',
  },
  md: {
    input: 'h-8.5 text-sm px-3 py-1.5',
    wrapper: 'h-8.5',
    icon: 'h-4 w-4',
  },
  lg: {
    input: 'h-10 text-base px-3.5 py-2',
    wrapper: 'h-10',
    icon: 'h-5 w-5',
  },
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      size = 'md',
      label,
      helperText,
      errorMessage,
      prefix,
      suffix,
      clearable = false,
      onClear,
      showPasswordToggle = false,
      disabled = false,
      readOnly = false,
      required = false,
      id: customId,
      value,
      defaultValue,
      onChange,
      wrapperClassName,
      inputClassName,
      labelClassName,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const id = customId || generatedId;
    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;

    const [showPassword, setShowPassword] = React.useState(false);
    const [internalValue, setInternalValue] = React.useState(defaultValue ?? '');

    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : internalValue;

    const inputRef = React.useRef<HTMLInputElement | null>(null);

    // Merge internal and external refs
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isControlled) {
        setInternalValue('');
      }
      if (inputRef.current) {
        inputRef.current.value = '';
        const syntheticEvent = new Event('input', { bubbles: true });
        inputRef.current.dispatchEvent(syntheticEvent);
      }
      onClear?.();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) {
        setInternalValue(e.target.value);
      }
      onChange?.(e);
    };

    const isPassword = type === 'password';
    const computedType = isPassword && showPassword ? 'text' : type;
    const hasError = Boolean(errorMessage);
    const showClear = clearable && !disabled && !readOnly && String(currentValue ?? '').length > 0;

    return (
      <div className={cn('flex flex-col gap-1 w-full text-left', className)}>
        {label && (
          <label
            htmlFor={id}
            className={cn(
              'text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between',
              disabled && 'opacity-60 cursor-not-allowed',
              labelClassName
            )}
          >
            <span>
              {label}
              {required && <span className="text-red-500 ml-0.5">*</span>}
            </span>
          </label>
        )}

        <div
          className={cn(
            'relative flex items-center w-full rounded-md border bg-white dark:bg-slate-900 transition-all duration-150',
            sizeStyles[size].wrapper,
            hasError
              ? 'border-red-500 focus-within:ring-2 focus-within:ring-red-500/20 focus-within:border-red-600 dark:border-red-500'
              : 'border-slate-300 dark:border-slate-700 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 dark:focus-within:border-brand-500 dark:focus-within:ring-brand-400/30',
            disabled && 'bg-slate-100 dark:bg-slate-800/60 opacity-60 cursor-not-allowed',
            readOnly && 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400',
            wrapperClassName
          )}
        >
          {prefix && (
            <div
              className={cn(
                'flex items-center pl-2.5 text-slate-400 dark:text-slate-500 shrink-0 pointer-events-none select-none',
                sizeStyles[size].icon
              )}
            >
              {prefix}
            </div>
          )}

          <input
            ref={inputRef}
            id={id}
            type={computedType}
            value={currentValue}
            defaultValue={defaultValue}
            onChange={handleChange}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
            aria-invalid={hasError ? 'true' : undefined}
            aria-describedby={
              hasError ? errorId : helperText ? helperId : undefined
            }
            className={cn(
              'w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none font-normal',
              sizeStyles[size].input,
              prefix && 'pl-2',
              (suffix || showClear || (isPassword && showPasswordToggle)) && 'pr-2',
              disabled && 'cursor-not-allowed',
              readOnly && 'cursor-default',
              inputClassName
            )}
            {...props}
          />

          <div className="flex items-center gap-1 pr-2 shrink-0">
            {showClear && (
              <button
                type="button"
                onClick={handleClear}
                tabIndex={-1}
                aria-label="Clear input"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-0.5 rounded transition-colors focus:outline-none"
              >
                <svg
                  className={sizeStyles[size].icon}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}

            {isPassword && showPasswordToggle && !disabled && (
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-0.5 rounded transition-colors focus:outline-none"
              >
                {showPassword ? (
                  <svg
                    className={sizeStyles[size].icon}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                    />
                  </svg>
                ) : (
                  <svg
                    className={sizeStyles[size].icon}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            )}

            {suffix && (
              <div
                className={cn(
                  'text-slate-400 dark:text-slate-500 shrink-0 select-none',
                  sizeStyles[size].icon
                )}
              >
                {suffix}
              </div>
            )}
          </div>
        </div>

        {hasError ? (
          <p
            id={errorId}
            role="alert"
            className="text-xs text-red-600 dark:text-red-400 mt-0.5 flex items-center gap-1 animate-in-fade"
          >
            <svg
              className="h-3 w-3 shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span>{errorMessage}</span>
          </p>
        ) : helperText ? (
          <p
            id={helperId}
            className="text-xs text-slate-500 dark:text-slate-400 mt-0.5"
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
