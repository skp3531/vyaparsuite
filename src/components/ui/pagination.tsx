'use client';

import * as React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface PaginationProps extends React.HTMLAttributes<HTMLDivElement> {
  page?: number;
  currentPage?: number;
  totalRecords?: number;
  totalItems?: number;
  pageSize?: number;
  totalPages?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  showTotalRecords?: boolean;
  showFirstLast?: boolean;
  siblingCount?: number;
  disabled?: boolean;
  compact?: boolean;
}

export const Pagination = React.forwardRef<HTMLDivElement, PaginationProps>(
  (
    {
      className,
      page: propPage,
      currentPage: propCurrentPage,
      totalRecords: propTotalRecords,
      totalItems: propTotalItems,
      pageSize = 25,
      totalPages: controlledTotalPages,
      onPageChange,
      onPageSizeChange,
      pageSizeOptions = [10, 25, 50, 100],
      showPageSizeSelector = true,
      showTotalRecords = true,
      showFirstLast = true,
      siblingCount = 1,
      disabled = false,
      compact = false,
      ...props
    },
    ref
  ) => {
    const rawPage = propPage ?? propCurrentPage ?? 1;
    const totalRecords = propTotalRecords ?? propTotalItems ?? 0;
    const computedTotalPages = Math.max(1, Math.ceil(totalRecords / (pageSize || 1)));
    const totalPages = controlledTotalPages !== undefined ? controlledTotalPages : computedTotalPages;
    const currentPage = Math.min(Math.max(1, rawPage), totalPages);

    // Calculate range of records being shown (1-indexed)
    const fromRecord = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const toRecord = Math.min(currentPage * pageSize, totalRecords);

    // Compute visible page numbers with ellipsis
    const pageNumbers = React.useMemo(() => {
      const totalPageNumbers = siblingCount * 2 + 5; // siblingCount + first + last + current + 2*ellipsis

      if (totalPages <= totalPageNumbers) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
      }

      const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
      const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

      const shouldShowLeftDots = leftSiblingIndex > 2;
      const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

      const firstPageIndex = 1;
      const lastPageIndex = totalPages;

      if (!shouldShowLeftDots && shouldShowRightDots) {
        const leftItemCount = 3 + 2 * siblingCount;
        const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
        return [...leftRange, 'dots-right', lastPageIndex];
      }

      if (shouldShowLeftDots && !shouldShowRightDots) {
        const rightItemCount = 3 + 2 * siblingCount;
        const rightRange = Array.from(
          { length: rightItemCount },
          (_, i) => totalPages - rightItemCount + i + 1
        );
        return [firstPageIndex, 'dots-left', ...rightRange];
      }

      if (shouldShowLeftDots && shouldShowRightDots) {
        const middleRange = Array.from(
          { length: rightSiblingIndex - leftSiblingIndex + 1 },
          (_, i) => leftSiblingIndex + i
        );
        return [firstPageIndex, 'dots-left', ...middleRange, 'dots-right', lastPageIndex];
      }

      return [];
    }, [totalPages, currentPage, siblingCount]);

    const canPrev = currentPage > 1 && !disabled;
    const canNext = currentPage < totalPages && !disabled;

    return (
      <nav
        ref={ref}
        role="navigation"
        aria-label="Pagination Navigation"
        className={cn(
          'flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400 select-none py-2',
          className
        )}
        {...props}
      >
        {/* Left Side: Total Records Count & Page Size Selector */}
        <div className="flex flex-wrap items-center gap-3">
          {showTotalRecords && (
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Showing{' '}
              <span className="font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                {fromRecord.toLocaleString()}
              </span>{' '}
              to{' '}
              <span className="font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                {toRecord.toLocaleString()}
              </span>{' '}
              of{' '}
              <span className="font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                {totalRecords.toLocaleString()}
              </span>{' '}
              entries
            </div>
          )}

          {showPageSizeSelector && onPageSizeChange && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 dark:text-slate-400">Rows:</span>
              <select
                aria-label="Rows per page"
                value={pageSize}
                disabled={disabled}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="h-7 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-0.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              >
                {pageSizeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right Side: Page navigation controls */}
        <div className="flex items-center gap-1">
          {showFirstLast && (
            <button
              type="button"
              aria-label="Go to first page"
              disabled={!canPrev}
              onClick={() => canPrev && onPageChange(1)}
              className={cn(
                'inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors',
                !canPrev && 'opacity-40 cursor-not-allowed hover:bg-white dark:hover:bg-slate-900'
              )}
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
          )}

          <button
            type="button"
            aria-label="Go to previous page"
            disabled={!canPrev}
            onClick={() => canPrev && onPageChange(currentPage - 1)}
            className={cn(
              'inline-flex h-8 items-center justify-center rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors gap-1',
              !canPrev && 'opacity-40 cursor-not-allowed hover:bg-white dark:hover:bg-slate-900'
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            {!compact && <span>Prev</span>}
          </button>

          {!compact && (
            <div className="hidden sm:flex items-center gap-1">
              {pageNumbers.map((item, idx) => {
                if (typeof item === 'string') {
                  return (
                    <span
                      key={`${item}-${idx}`}
                      className="inline-flex h-8 w-8 items-center justify-center text-slate-400"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </span>
                  );
                }

                const isActive = item === currentPage;

                return (
                  <button
                    key={item}
                    type="button"
                    aria-label={`Page ${item}`}
                    aria-current={isActive ? 'page' : undefined}
                    disabled={disabled}
                    onClick={() => !disabled && onPageChange(item)}
                    className={cn(
                      'inline-flex h-8 min-w-8 px-2 items-center justify-center rounded-md text-xs font-medium transition-colors',
                      isActive
                        ? 'bg-brand-600 text-white font-semibold shadow-xs'
                        : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800',
                      disabled && 'opacity-40 cursor-not-allowed'
                    )}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          )}

          {compact && (
            <span className="px-2 text-xs font-medium text-slate-700 dark:text-slate-300 tabular-nums">
              {currentPage} / {totalPages}
            </span>
          )}

          <button
            type="button"
            aria-label="Go to next page"
            disabled={!canNext}
            onClick={() => canNext && onPageChange(currentPage + 1)}
            className={cn(
              'inline-flex h-8 items-center justify-center rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors gap-1',
              !canNext && 'opacity-40 cursor-not-allowed hover:bg-white dark:hover:bg-slate-900'
            )}
          >
            {!compact && <span>Next</span>}
            <ChevronRight className="h-4 w-4" />
          </button>

          {showFirstLast && (
            <button
              type="button"
              aria-label="Go to last page"
              disabled={!canNext}
              onClick={() => canNext && onPageChange(totalPages)}
              className={cn(
                'inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors',
                !canNext && 'opacity-40 cursor-not-allowed hover:bg-white dark:hover:bg-slate-900'
              )}
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </nav>
    );
  }
);
Pagination.displayName = 'Pagination';
