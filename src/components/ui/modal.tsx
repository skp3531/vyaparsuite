'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titleId: string;
  descriptionId: string;
  closeOnBackdropClick: boolean;
  closeOnEscape: boolean;
}

const DialogContext = React.createContext<DialogContextValue | null>(null);

function useDialogContext() {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error('Dialog components must be used within a <Dialog />');
  }
  return context;
}

export interface DialogProps {
  open?: boolean;
  isOpen?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  title?: string;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({
  open: controlledOpen,
  isOpen,
  defaultOpen = false,
  onOpenChange,
  onClose,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  title,
  children,
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const resolvedOpen = controlledOpen !== undefined ? controlledOpen : isOpen;
  const isControlled = resolvedOpen !== undefined;
  const open = isControlled ? resolvedOpen : uncontrolledOpen;

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
      if (!nextOpen) {
        onClose?.();
      }
    },
    [isControlled, onOpenChange, onClose]
  );

  const titleId = React.useId();
  const descriptionId = React.useId();

  return (
    <DialogContext.Provider
      value={{
        open,
        onOpenChange: handleOpenChange,
        titleId,
        descriptionId,
        closeOnBackdropClick,
        closeOnEscape,
      }}
    >
      {children}
    </DialogContext.Provider>
  );
};

export interface DialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export const DialogTrigger = React.forwardRef<HTMLButtonElement, DialogTriggerProps>(
  ({ className, onClick, children, ...props }, ref) => {
    const { onOpenChange } = useDialogContext();

    return (
      <button
        ref={ref}
        type="button"
        aria-haspopup="dialog"
        onClick={(e) => {
          onClick?.(e);
          if (!e.defaultPrevented) {
            onOpenChange(true);
          }
        }}
        className={className}
        {...props}
      >
        {children}
      </button>
    );
  }
);
DialogTrigger.displayName = 'DialogTrigger';

export interface DialogPortalProps {
  children: React.ReactNode;
  container?: Element | DocumentFragment | null;
}

export const DialogPortal: React.FC<DialogPortalProps> = ({ children, container }) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(children, container || document.body);
};

export interface DialogOverlayProps extends React.HTMLAttributes<HTMLDivElement> {}

export const DialogOverlay = React.forwardRef<HTMLDivElement, DialogOverlayProps>(
  ({ className, onClick, ...props }, ref) => {
    const { onOpenChange, closeOnBackdropClick } = useDialogContext();

    return (
      <div
        ref={ref}
        aria-hidden="true"
        onClick={(e) => {
          onClick?.(e);
          if (!e.defaultPrevented && closeOnBackdropClick) {
            onOpenChange(false);
          }
        }}
        className={cn(
          'fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-200 animate-in-fade',
          className
        )}
        {...props}
      />
    );
  }
);
DialogOverlay.displayName = 'DialogOverlay';

export type DialogSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

const dialogSizeStyles: Record<DialogSize, string> = {
  xs: 'max-w-xs',
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  '2xl': 'max-w-5xl',
  full: 'max-w-[calc(100vw-2rem)] h-[calc(100vh-2rem)]',
};

export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: DialogSize;
  hideCloseButton?: boolean;
}

export const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, size = 'md', hideCloseButton = false, ...props }, ref) => {
    const { open, onOpenChange, titleId, descriptionId, closeOnEscape } = useDialogContext();
    const internalRef = React.useRef<HTMLDivElement | null>(null);
    const lastActiveElement = React.useRef<HTMLElement | null>(null);

    // Sync external ref and internalRef
    const setRefs = React.useCallback(
      (node: HTMLDivElement | null) => {
        internalRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
      },
      [ref]
    );

    // Save previous focus & Lock body scroll
    React.useEffect(() => {
      if (open) {
        lastActiveElement.current = document.activeElement as HTMLElement | null;
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
          document.body.style.overflow = originalOverflow;
          lastActiveElement.current?.focus();
        };
      }
    }, [open]);

    // Handle Escape key and focus trap
    React.useEffect(() => {
      if (!open) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (closeOnEscape && e.key === 'Escape') {
          e.preventDefault();
          onOpenChange(false);
          return;
        }

        if (e.key === 'Tab') {
          const container = internalRef.current;
          if (!container) return;

          const focusable = container.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );

          if (focusable.length === 0) {
            e.preventDefault();
            return;
          }

          const first = focusable[0];
          const last = focusable[focusable.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);

      // Initial focus into modal
      const timer = setTimeout(() => {
        const container = internalRef.current;
        if (!container) return;
        const autoFocusElement = container.querySelector<HTMLElement>('[data-autofocus]');
        if (autoFocusElement) {
          autoFocusElement.focus();
        } else {
          const focusable = container.querySelector<HTMLElement>(
            'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
          );
          if (focusable) {
            focusable.focus();
          } else {
            container.focus();
          }
        }
      }, 50);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        clearTimeout(timer);
      };
    }, [open, closeOnEscape, onOpenChange]);

    if (!open) return null;

    return (
      <DialogPortal>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <DialogOverlay />
          <div
            ref={setRefs}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            tabIndex={-1}
            className={cn(
              'relative z-50 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl p-5 sm:p-6 text-slate-900 dark:text-slate-100',
              'animate-in-scale focus:outline-hidden',
              dialogSizeStyles[size],
              className
            )}
            {...props}
          >
            {children}

            {!hideCloseButton && (
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label="Close dialog"
                className="absolute right-4 top-4 rounded-md p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500 transition-colors"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </DialogPortal>
    );
  }
);
DialogContent.displayName = 'DialogContent';

export interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export const DialogHeader = React.forwardRef<HTMLDivElement, DialogHeaderProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex flex-col space-y-1.5 text-left mb-4 pr-6', className)}
        {...props}
      />
    );
  }
);
DialogHeader.displayName = 'DialogHeader';

export interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export const DialogFooter = React.forwardRef<HTMLDivElement, DialogFooterProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 space-y-2 space-y-reverse sm:space-y-0 mt-6 pt-3 border-t border-slate-100 dark:border-slate-800',
          className
        )}
        {...props}
      />
    );
  }
);
DialogFooter.displayName = 'DialogFooter';

export interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'div';
}

export const DialogTitle = React.forwardRef<HTMLHeadingElement, DialogTitleProps>(
  ({ className, as: Component = 'h2', ...props }, ref) => {
    const { titleId } = useDialogContext();
    return (
      <Component
        ref={ref}
        id={titleId}
        className={cn(
          'text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100',
          className
        )}
        {...props}
      />
    );
  }
);
DialogTitle.displayName = 'DialogTitle';

export interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export const DialogDescription = React.forwardRef<HTMLParagraphElement, DialogDescriptionProps>(
  ({ className, ...props }, ref) => {
    const { descriptionId } = useDialogContext();
    return (
      <p
        ref={ref}
        id={descriptionId}
        className={cn('text-sm text-slate-500 dark:text-slate-400', className)}
        {...props}
      />
    );
  }
);
DialogDescription.displayName = 'DialogDescription';

export interface DialogCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const DialogClose = React.forwardRef<HTMLButtonElement, DialogCloseProps>(
  ({ className, onClick, ...props }, ref) => {
    const { onOpenChange } = useDialogContext();
    return (
      <button
        ref={ref}
        type="button"
        onClick={(e) => {
          onClick?.(e);
          if (!e.defaultPrevented) {
            onOpenChange(false);
          }
        }}
        className={className}
        {...props}
      />
    );
  }
);
DialogClose.displayName = 'DialogClose';

// Convenient Aliases
export const Modal = Dialog;
export const ModalContent = DialogContent;
export const ModalHeader = DialogHeader;
export const ModalFooter = DialogFooter;
export const ModalTitle = DialogTitle;
export const ModalDescription = DialogDescription;
export const ModalClose = DialogClose;
