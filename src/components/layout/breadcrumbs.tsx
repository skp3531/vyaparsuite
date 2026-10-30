'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

// Map of slug to human-friendly display label
const SLUG_LABEL_MAP: Record<string, string> = {
  dashboard: 'Dashboard',
  crm: 'CRM',
  leads: 'Leads',
  opportunities: 'Opportunities',
  contacts: 'Contacts',
  organizations: 'Organizations',
  activities: 'Activities',
  sales: 'Sales',
  customers: 'Customers',
  quotations: 'Quotations',
  orders: 'Sales Orders',
  'delivery-notes': 'Delivery Notes',
  invoices: 'Sales Invoices',
  'payment-requests': 'Payment Requests',
  returns: 'Returns',
  purchase: 'Purchase',
  suppliers: 'Suppliers',
  'material-requests': 'Material Requests',
  receipts: 'Purchase Receipts',
  inventory: 'Inventory',
  items: 'Items',
  warehouses: 'Warehouses',
  'stock-entries': 'Stock Entries',
  'stock-ledger': 'Stock Ledger',
  'stock-balance': 'Stock Balance',
  reconciliation: 'Stock Reconciliation',
  accounting: 'Accounting',
  'chart-of-accounts': 'Chart of Accounts',
  'journal-entry': 'Journal Entry',
  'payment-entry': 'Payment Entry',
  'bank-reconciliation': 'Bank Reconciliation',
  'general-ledger': 'General Ledger',
  'trial-balance': 'Trial Balance',
  'profit-loss': 'Profit & Loss',
  'balance-sheet': 'Balance Sheet',
  'cash-flow': 'Cash Flow',
  india: 'India Compliance',
  'gst-settings': 'GST Settings',
  'gst-invoices': 'GST Invoices',
  'gstr-1': 'GSTR-1',
  'gstr-3b': 'GSTR-3B',
  'e-invoice': 'E-Invoice',
  pos: 'Point of Sale',
  'new-sale': 'New Sale',
  'open-shift': 'Open Shift',
  'close-shift': 'Close Shift',
  manufacturing: 'Manufacturing',
  bom: 'Bill of Materials',
  'work-orders': 'Work Orders',
  'job-cards': 'Job Cards',
  'production-plan': 'Production Plan',
  quality: 'Quality',
  inspections: 'Inspections',
  'non-conformance': 'Non-Conformance',
  capa: 'CAPA',
  assets: 'Assets',
  list: 'List',
  depreciation: 'Depreciation',
  maintenance: 'Maintenance',
  projects: 'Projects',
  tasks: 'Tasks',
  timesheets: 'Timesheets',
  hrms: 'HR',
  employees: 'Employees',
  attendance: 'Attendance',
  leaves: 'Leaves',
  payroll: 'Payroll',
  expenses: 'Expenses',
  support: 'Support',
  tickets: 'Tickets',
  'knowledge-base': 'Knowledge Base',
  'service-orders': 'Service Orders',
  settings: 'Settings',
  company: 'Company Setup',
  users: 'Users & Roles',
  workflows: 'Workflows',
  notifications: 'Notifications',
  customization: 'Customization',
  new: 'New Document',
  edit: 'Edit',
};

function formatSegment(segment: string): string {
  if (SLUG_LABEL_MAP[segment.toLowerCase()]) {
    return SLUG_LABEL_MAP[segment.toLowerCase()];
  }
  // If it matches an ID format like INV-2024-001 or UUID
  if (segment.includes('-') && (segment.length > 15 || /[0-9]/.test(segment))) {
    return segment.length > 18 ? `${segment.slice(0, 15)}...` : segment;
  }
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function Breadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname();

  const segments = React.useMemo(() => {
    if (!pathname) return [];
    return pathname
      .split('/')
      .filter((s) => Boolean(s) && s !== '(erp)' && s !== 'app');
  }, [pathname]);

  if (segments.length === 0 || (segments.length === 1 && segments[0] === 'dashboard')) {
    return (
      <nav aria-label="Breadcrumb" className={cn('flex items-center text-xs font-medium text-slate-600 dark:text-slate-300', className)}>
        <div className="flex items-center gap-1.5 px-1 py-0.5 rounded text-slate-800 dark:text-slate-100">
          <Home className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
          <span>Dashboard</span>
        </div>
      </nav>
    );
  }

  // Generate breadcrumb items with accumulated paths
  const items = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const isLast = index === segments.length - 1;
    const label = formatSegment(segment);
    return { href, label, isLast };
  });

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center space-x-1 text-xs overflow-hidden max-w-md md:max-w-xl truncate', className)}
    >
      <Link
        href="/dashboard"
        className="flex items-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
        title="Dashboard"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>

      {items.map((item, index) => (
        <React.Fragment key={item.href}>
          <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600 shrink-0" />
          {item.isLast ? (
            <span
              aria-current="page"
              className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-[140px] sm:max-w-[200px]"
              title={item.label}
            >
              {item.label}
            </span>
          ) : (
            <Link
              href={item.href}
              className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors truncate max-w-[100px] sm:max-w-[140px]"
              title={item.label}
            >
              {item.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
