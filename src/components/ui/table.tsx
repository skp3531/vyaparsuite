'use client';

import * as React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type TableDensity = 'dense' | 'normal' | 'relaxed';

interface TableContextValue {
  density: TableDensity;
  striped: boolean;
}

const TableContext = React.createContext<TableContextValue>({
  density: 'normal',
  striped: false,
});

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  density?: TableDensity;
  striped?: boolean;
  bordered?: boolean;
  wrapperClassName?: string;
}

export const Table = React.forwardRef<HTMLTableElement, TableProps>(
  (
    {
      className,
      wrapperClassName,
      density = 'normal',
      striped = false,
      bordered = false,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <TableContext.Provider value={{ density, striped }}>
        <div
          className={cn(
            'relative w-full overflow-x-auto rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs',
            wrapperClassName
          )}
        >
          <table
            ref={ref}
            className={cn(
              'w-full caption-bottom text-xs sm:text-sm border-collapse text-slate-800 dark:text-slate-200',
              bordered && 'border-slate-200 dark:border-slate-800',
              className
            )}
            {...props}
          >
            {children}
          </table>
        </div>
      </TableContext.Provider>
    );
  }
);
Table.displayName = 'Table';

export interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  sticky?: boolean;
}

export const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, sticky = false, ...props }, ref) => {
    return (
      <thead
        ref={ref}
        className={cn(
          'border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/60 font-semibold text-slate-700 dark:text-slate-200',
          sticky && 'sticky top-0 z-10 backdrop-blur-xs',
          className
        )}
        {...props}
      />
    );
  }
);
TableHeader.displayName = 'TableHeader';

export interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

export const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className, ...props }, ref) => {
    return (
      <tbody
        ref={ref}
        className={cn('divide-y divide-slate-200/70 dark:divide-slate-800/70', className)}
        {...props}
      />
    );
  }
);
TableBody.displayName = 'TableBody';

export interface TableFooterProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

export const TableFooter = React.forwardRef<HTMLTableSectionElement, TableFooterProps>(
  ({ className, ...props }, ref) => {
    return (
      <tfoot
        ref={ref}
        className={cn(
          'border-t-2 border-slate-300 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 font-semibold text-slate-900 dark:text-slate-100',
          className
        )}
        {...props}
      />
    );
  }
);
TableFooter.displayName = 'TableFooter';

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  selected?: boolean;
  clickable?: boolean;
}

export const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, selected = false, clickable = false, ...props }, ref) => {
    const { striped } = React.useContext(TableContext);

    return (
      <tr
        ref={ref}
        aria-selected={selected}
        className={cn(
          'transition-colors duration-100',
          'hover:bg-slate-50/90 dark:hover:bg-slate-800/50',
          striped && 'even:bg-slate-50/50 dark:even:bg-slate-800/20',
          selected && 'bg-brand-50/80 dark:bg-brand-950/40 hover:bg-brand-100/80 dark:hover:bg-brand-950/60',
          clickable && 'cursor-pointer',
          className
        )}
        {...props}
      />
    );
  }
);
TableRow.displayName = 'TableRow';

export type TableAlign = 'left' | 'center' | 'right';

const alignStyles: Record<TableAlign, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

const headDensityPadding: Record<TableDensity, string> = {
  dense: 'h-8 px-2 py-1 text-xs',
  normal: 'h-10 px-3 py-2 text-xs sm:text-sm',
  relaxed: 'h-12 px-4 py-3 text-sm',
};

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  align?: TableAlign;
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc' | false;
  onSort?: () => void;
}

export const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  (
    {
      className,
      align = 'left',
      sortable = false,
      sortDirection = false,
      onSort,
      children,
      ...props
    },
    ref
  ) => {
    const { density } = React.useContext(TableContext);

    const content = (
      <span className={cn('inline-flex items-center gap-1.5', align === 'right' && 'flex-row-reverse')}>
        <span>{children}</span>
        {sortable && (
          <span className="shrink-0 text-slate-400 dark:text-slate-500">
            {sortDirection === 'asc' ? (
              <ChevronUp className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
            ) : sortDirection === 'desc' ? (
              <ChevronDown className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
            ) : (
              <ChevronsUpDown className="h-3.5 w-3.5 opacity-60" />
            )}
          </span>
        )}
      </span>
    );

    return (
      <th
        ref={ref}
        aria-sort={
          sortDirection === 'asc'
            ? 'ascending'
            : sortDirection === 'desc'
            ? 'descending'
            : undefined
        }
        className={cn(
          'font-semibold text-slate-700 dark:text-slate-300 align-middle select-none whitespace-nowrap',
          headDensityPadding[density],
          alignStyles[align],
          sortable && 'cursor-pointer hover:text-slate-900 dark:hover:text-white',
          className
        )}
        onClick={sortable ? onSort : undefined}
        {...props}
      >
        {content}
      </th>
    );
  }
);
TableHead.displayName = 'TableHead';

const cellDensityPadding: Record<TableDensity, string> = {
  dense: 'px-2 py-1 text-xs',
  normal: 'px-3 py-2 text-xs sm:text-sm',
  relaxed: 'px-4 py-3 text-sm',
};

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  align?: TableAlign;
  tabular?: boolean; // Tabular numeric figures for currency/quantities
}

export const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, align = 'left', tabular = false, ...props }, ref) => {
    const { density } = React.useContext(TableContext);

    return (
      <td
        ref={ref}
        className={cn(
          'align-middle text-slate-800 dark:text-slate-200',
          cellDensityPadding[density],
          alignStyles[align],
          (tabular || align === 'right') && 'tabular-nums font-mono text-[13px]',
          className
        )}
        {...props}
      />
    );
  }
);
TableCell.displayName = 'TableCell';

export interface TableCaptionProps extends React.HTMLAttributes<HTMLTableCaptionElement> {}

export const TableCaption = React.forwardRef<HTMLTableCaptionElement, TableCaptionProps>(
  ({ className, ...props }, ref) => {
    return (
      <caption
        ref={ref}
        className={cn('mt-3 text-xs text-slate-500 dark:text-slate-400 text-left px-2', className)}
        {...props}
      />
    );
  }
);
TableCaption.displayName = 'TableCaption';
