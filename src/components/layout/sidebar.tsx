'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Landmark,
  Scale,
  TrendingUp,
  ShoppingCart,
  Boxes,
  Store,
  Factory,
  ClipboardCheck,
  Building2,
  Users,
  Briefcase,
  UserCheck,
  LifeBuoy,
  Settings2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  badgeVariant?: 'brand' | 'warning' | 'statutory' | 'neutral';
  subItems?: { label: string; href: string }[];
}

export const ERP_NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'accounting',
    label: 'Accounting',
    href: '/accounting',
    icon: Landmark,
    badge: 'GL',
    badgeVariant: 'brand',
    subItems: [
      { label: 'General Ledger', href: '/accounting/general-ledger' },
      { label: 'Journal Entry', href: '/accounting/journal-entry' },
      { label: 'Payment Entry', href: '/accounting/payment-entry' },
      { label: 'Bank Reconciliation', href: '/accounting/bank-reconciliation' },
      { label: 'Chart of Accounts', href: '/accounting/chart-of-accounts' },
    ],
  },
  {
    id: 'india',
    label: 'India GST & Tax',
    href: '/india',
    icon: Scale,
    badge: 'Statutory',
    badgeVariant: 'statutory',
    subItems: [
      { label: 'E-Invoice Portal', href: '/india/e-invoice' },
      { label: 'E-Way Bills', href: '/india/e-way-bill' },
      { label: 'GSTR-1 Returns', href: '/india/gstr-1' },
      { label: 'GSTR-3B Summary', href: '/india/gstr-3b' },
      { label: 'TDS & TCS Vouchers', href: '/india/tds' },
    ],
  },
  {
    id: 'sales',
    label: 'Sales & CRM',
    href: '/sales/orders',
    icon: TrendingUp,
    subItems: [
      { label: 'Sales Invoices', href: '/sales/invoices' },
      { label: 'Sales Orders', href: '/sales/orders' },
      { label: 'Quotations', href: '/sales/quotations' },
      { label: 'Customers', href: '/sales/customers' },
      { label: 'Delivery Notes', href: '/sales/delivery-notes' },
    ],
  },
  {
    id: 'crm',
    label: 'CRM & Pipeline',
    href: '/crm/opportunities',
    icon: Users,
    subItems: [
      { label: 'Lead Funnel', href: '/crm/leads' },
      { label: 'Deal Kanban', href: '/crm/opportunities' },
      { label: 'Opportunities', href: '/crm/opportunities' },
      { label: 'Contacts', href: '/crm/contacts' },
    ],
  },
  {
    id: 'purchase',
    label: 'Procurement & AP',
    href: '/purchase/orders',
    icon: ShoppingCart,
    subItems: [
      { label: 'Purchase Orders', href: '/purchase/orders' },
      { label: 'Purchase Invoices', href: '/purchase/invoices' },
      { label: 'Material Requests', href: '/purchase/material-requests' },
      { label: 'Suppliers Directory', href: '/purchase/suppliers' },
      { label: 'Goods Receipts (GRN)', href: '/purchase/purchase-receipts' },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory & Stock',
    href: '/inventory/stock-balance',
    icon: Boxes,
    badge: 'Live',
    badgeVariant: 'warning',
    subItems: [
      { label: 'Stock Balances', href: '/inventory/stock-balance' },
      { label: 'Stock Ledger (Audit)', href: '/inventory/stock-ledger' },
      { label: 'Stock Entries', href: '/inventory/stock-entries' },
      { label: 'Item Catalog', href: '/inventory/items' },
      { label: 'Stock Reconciliation', href: '/inventory/reconciliation' },
    ],
  },
  {
    id: 'pos',
    label: 'Point of Sale',
    href: '/pos',
    icon: Store,
    subItems: [
      { label: 'Cashier Terminal', href: '/pos/terminal' },
      { label: 'Opening/Closing Shifts', href: '/pos/shift' },
      { label: 'POS Invoices', href: '/pos/invoice' },
      { label: 'Cash Register', href: '/pos/cash-drawer' },
    ],
  },
  {
    id: 'manufacturing',
    label: 'Manufacturing',
    href: '/manufacturing',
    icon: Factory,
    subItems: [
      { label: 'Work Orders', href: '/manufacturing/work-order' },
      { label: 'Bill of Materials', href: '/manufacturing/bom' },
      { label: 'Workstations', href: '/manufacturing/workstation' },
      { label: 'Job Cards', href: '/manufacturing/job-card' },
    ],
  },
  {
    id: 'quality',
    label: 'Quality Assurance',
    href: '/quality',
    icon: ClipboardCheck,
    subItems: [
      { label: 'Inspections', href: '/quality/inspection' },
      { label: 'Inspection Templates', href: '/quality/template' },
      { label: 'Non-Conformance (NCR)', href: '/quality/ncr' },
      { label: 'CAPA Log', href: '/quality/capa' },
    ],
  },
  {
    id: 'assets',
    label: 'Fixed Assets',
    href: '/assets',
    icon: Building2,
    subItems: [
      { label: 'Asset Register', href: '/assets/asset' },
      { label: 'Depreciation Postings', href: '/assets/depreciation' },
      { label: 'Maintenance Log', href: '/assets/maintenance' },
    ],
  },
  {
    id: 'projects',
    label: 'Projects & Tasks',
    href: '/projects',
    icon: Briefcase,
    subItems: [
      { label: 'Active Projects', href: '/projects/project' },
      { label: 'Task Boards', href: '/projects/task' },
      { label: 'Timesheets', href: '/projects/timesheet' },
      { label: 'Job Costing', href: '/projects/costing' },
    ],
  },
  {
    id: 'hrms',
    label: 'HRMS & Payroll',
    href: '/hrms',
    icon: UserCheck,
    subItems: [
      { label: 'Employees Directory', href: '/hrms/employee' },
      { label: 'Biometric Attendance', href: '/hrms/attendance' },
      { label: 'Leave Applications', href: '/hrms/leave' },
      { label: 'Monthly Payroll', href: '/hrms/payroll' },
    ],
  },
  {
    id: 'support',
    label: 'Customer Support',
    href: '/support',
    icon: LifeBuoy,
    subItems: [
      { label: 'Support Tickets', href: '/support/ticket' },
      { label: 'My Assigned Tickets', href: '/support/my-tickets' },
      { label: 'Knowledge Base', href: '/support/kb' },
      { label: 'SLA Policies', href: '/support/sla' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings & Setup',
    href: '/settings',
    icon: Settings2,
    subItems: [
      { label: 'Company Setup', href: '/setup/company' },
      { label: 'Users & Roles', href: '/settings/users' },
      { label: 'Workflows & Approvals', href: '/settings/workflows' },
      { label: 'Audit Trail', href: '/settings/security' },
    ],
  },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  className?: string;
}

export function Sidebar({
  isCollapsed,
  onToggleCollapse,
  className,
}: SidebarProps) {
  const pathname = usePathname();

  // Helper to check if a route is active
  const isItemActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        'relative flex flex-col h-full bg-slate-900 text-slate-200 border-r border-slate-800 transition-all duration-300 ease-in-out select-none z-20 shrink-0',
        isCollapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-14 px-3 border-b border-slate-800/80 bg-slate-950/40">
        <Link
          href="/dashboard"
          className={cn(
            'flex items-center gap-2.5 overflow-hidden transition-all',
            isCollapsed && 'justify-center w-full'
          )}
          title="VyaparSuite ERP"
        >
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center font-black text-sm shadow-md shrink-0 ring-1 ring-white/10">
            VS
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 leading-tight">
              <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1">
                <span>Vyapar</span>
                <span className="text-brand-400">Suite</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
                Enterprise ERP
              </span>
            </div>
          )}
        </Link>

        {/* Desktop Collapse Button */}
        {!isCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors focus:outline-none focus:ring-1 focus:ring-brand-500/50"
            title="Collapse Sidebar"
            aria-label="Collapse Sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation Links Scroll Container */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-1">
        {ERP_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = isItemActive(item.href);

          return (
            <div key={item.id} className="relative group">
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60',
                  isCollapsed && 'justify-center px-0'
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={cn(
                    'h-4.5 w-4.5 shrink-0 transition-colors',
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  )}
                />

                {!isCollapsed && (
                  <>
                    <span className="truncate flex-1">{item.label}</span>
                    {item.badge && (
                      <span
                        className={cn(
                          'text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0',
                          isActive
                            ? 'bg-white/20 text-white'
                            : item.badgeVariant === 'statutory'
                            ? 'bg-indigo-900/60 text-indigo-300 border border-indigo-700/50'
                            : item.badgeVariant === 'warning'
                            ? 'bg-amber-900/60 text-amber-300 border border-amber-700/50'
                            : 'bg-slate-800 text-slate-300'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>

              {/* Collapsed Tooltip Flyout */}
              {isCollapsed && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 hidden group-hover:flex flex-col z-50 min-w-[160px] bg-slate-900 text-white border border-slate-700/80 rounded-lg shadow-xl px-2.5 py-2 pointer-events-none animate-in-fade">
                  <div className="font-semibold text-xs text-white">{item.label}</div>
                  {item.subItems && (
                    <div className="mt-1 space-y-0.5 border-t border-slate-800 pt-1 text-[11px] text-slate-400">
                      {item.subItems.slice(0, 3).map((sub) => (
                        <div key={sub.label} className="truncate">
                          • {sub.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sidebar Footer */}
      <div className="p-2 border-t border-slate-800/80 bg-slate-950/40 shrink-0">
        {isCollapsed ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            title="Expand Sidebar"
            aria-label="Expand Sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <div className="flex items-center justify-between px-2 py-1.5 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-medium text-slate-300">Live Production</span>
            </div>
            <span className="font-mono text-[10px] text-slate-500">v0.1.0</span>
          </div>
        )}
      </div>
    </aside>
  );
}
