'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
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
  Megaphone,
  ShoppingBag,
  UserCheck,
  BadgePercent,
  Briefcase,
  LifeBuoy,
  GitFork,
  BarChart3,
  Code2,
  Plug,
  ShieldAlert,
  Settings2,
  LayoutGrid,
  Search,
  X,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface ModuleApp {
  id: string;
  name: string;
  category: 'Finance' | 'Operations' | 'Supply Chain' | 'People & Service' | 'Platform';
  description: string;
  icon: React.ElementType;
  route: string;
  color: string;
  badge?: string;
}

export const ERP_22_MODULES: ModuleApp[] = [
  {
    id: 'accounting',
    name: 'Financial Accounting',
    category: 'Finance',
    description: 'Double-entry general ledger, vouchers, financial statements, and AR/AP.',
    icon: Landmark,
    route: '/accounting',
    color: 'from-emerald-500 to-teal-700 text-white',
  },
  {
    id: 'tax-compliance',
    name: 'India GST & Tax',
    category: 'Finance',
    description: 'Direct e-Invoice, e-Way bill, GSTR-1/3B filing, and statutory TDS/TCS.',
    icon: Scale,
    route: '/india',
    color: 'from-indigo-600 to-violet-700 text-white',
    badge: 'Statutory',
  },
  {
    id: 'sales',
    name: 'Sales & Invoicing',
    category: 'Operations',
    description: 'Quotations, sales orders, customer delivery notes, and receivables.',
    icon: TrendingUp,
    route: '/sales',
    color: 'from-blue-500 to-sky-600 text-white',
  },
  {
    id: 'procurement',
    name: 'Procurement & AP',
    category: 'Supply Chain',
    description: 'Requisitions, RFQs, vendor comparisons, purchase orders, and 3-way match.',
    icon: ShoppingCart,
    route: '/purchase',
    color: 'from-amber-500 to-orange-600 text-white',
  },
  {
    id: 'inventory',
    name: 'Stock & Warehouse',
    category: 'Supply Chain',
    description: 'Multi-warehouse tracking, serialized stock, batch-expiry, and bin cards.',
    icon: Boxes,
    route: '/inventory',
    color: 'from-violet-500 to-purple-700 text-white',
  },
  {
    id: 'pos',
    name: 'Point of Sale',
    category: 'Operations',
    description: 'Offline-first high-speed retail checkout, thermal receipts, and cash drawer.',
    icon: Store,
    route: '/pos',
    color: 'from-rose-500 to-pink-600 text-white',
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing & BOM',
    category: 'Supply Chain',
    description: 'Multi-level BOMs, work stations, routing, job cards, and scrap accounting.',
    icon: Factory,
    route: '/manufacturing',
    color: 'from-orange-500 to-red-600 text-white',
  },
  {
    id: 'quality',
    name: 'Quality Assurance',
    category: 'Supply Chain',
    description: 'Inward raw material inspection, shop-floor checks, and CAPA logs.',
    icon: ClipboardCheck,
    route: '/quality',
    color: 'from-teal-500 to-emerald-600 text-white',
  },
  {
    id: 'assets',
    name: 'Asset Management',
    category: 'Finance',
    description: 'Fixed asset registers, depreciation engines (SLM/WDV), and maintenance.',
    icon: Building2,
    route: '/assets',
    color: 'from-slate-600 to-slate-800 text-white',
  },
  {
    id: 'crm',
    name: 'CRM & Pipelines',
    category: 'Operations',
    description: 'Omnichannel lead capture, deal Kanban stages, and opportunity funnels.',
    icon: Users,
    route: '/crm',
    color: 'from-cyan-500 to-blue-600 text-white',
  },
  {
    id: 'marketing',
    name: 'Marketing Campaigns',
    category: 'Operations',
    description: 'Customer segmentation, bulk WhatsApp/Email broadcasts, and ROI tracking.',
    icon: Megaphone,
    route: '/marketing',
    color: 'from-fuchsia-500 to-pink-700 text-white',
  },
  {
    id: 'ecommerce',
    name: 'E-Commerce Store',
    category: 'Operations',
    description: 'Headless catalog sync, B2B wholesale portal, and payment gateway webhooks.',
    icon: ShoppingBag,
    route: '/website',
    color: 'from-sky-500 to-blue-700 text-white',
  },
  {
    id: 'hrms',
    name: 'HR & Personnel',
    category: 'People & Service',
    description: 'Employee lifecycle, biometric attendance, shift rosters, and leave approvals.',
    icon: UserCheck,
    route: '/hrms',
    color: 'from-emerald-600 to-green-700 text-white',
  },
  {
    id: 'payroll',
    name: 'Payroll & Benefits',
    category: 'People & Service',
    description: 'Indian statutory payroll (PF, ESIC, PT), payslips, and bank payout files.',
    icon: BadgePercent,
    route: '/hrms',
    color: 'from-lime-600 to-emerald-700 text-white',
  },
  {
    id: 'projects',
    name: 'Projects & Costing',
    category: 'Operations',
    description: 'Work breakdown structures, Gantt milestones, timesheets, and job profitability.',
    icon: Briefcase,
    route: '/projects',
    color: 'from-yellow-500 to-amber-600 text-white',
  },
  {
    id: 'support',
    name: 'Helpdesk & Support',
    category: 'People & Service',
    description: 'Support tickets, SLA breach alerts, customer portal, and knowledge base.',
    icon: LifeBuoy,
    route: '/support',
    color: 'from-red-500 to-rose-700 text-white',
  },
  {
    id: 'workflows',
    name: 'Workflow & Approvals',
    category: 'Platform',
    description: 'Visual state machines, delegation rules, multi-tier approval chains, and SLAs.',
    icon: GitFork,
    route: '/settings',
    color: 'from-purple-500 to-indigo-700 text-white',
  },
  {
    id: 'analytics',
    name: 'BI & Reporting',
    category: 'Platform',
    description: 'Consolidated financial dashboards, drill-down pivot grids, and exports.',
    icon: BarChart3,
    route: '/reports',
    color: 'from-blue-600 to-indigo-800 text-white',
  },
  {
    id: 'studio',
    name: 'Low-Code Studio',
    category: 'Platform',
    description: 'Custom doctypes, dynamic form fields, client scripting, and print formats.',
    icon: Code2,
    route: '/settings',
    color: 'from-zinc-600 to-zinc-800 text-white',
  },
  {
    id: 'integrations',
    name: 'API & Integrations',
    category: 'Platform',
    description: 'Webhooks, REST/GraphQL keys, logistics aggregators, and bank connectors.',
    icon: Plug,
    route: '/settings',
    color: 'from-stone-600 to-stone-800 text-white',
  },
  {
    id: 'security',
    name: 'Identity & Security',
    category: 'Platform',
    description: 'Role assignments, RLS policies, audit logs, and session management.',
    icon: ShieldAlert,
    route: '/settings',
    color: 'from-rose-600 to-red-800 text-white',
  },
  {
    id: 'setup',
    name: 'Masters & Setup',
    category: 'Platform',
    description: 'Company entities, branch registries, currencies, UOMs, and fiscal years.',
    icon: Settings2,
    route: '/setup',
    color: 'from-slate-600 to-slate-900 text-white',
  },
];

interface ModuleSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ModuleSwitcher({ isOpen, onClose }: ModuleSwitcherProps) {
  const [query, setQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('All');
  const [focusedIndex, setFocusedIndex] = React.useState<number>(0);
  const router = useRouter();
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const categories = ['All', 'Finance', 'Operations', 'Supply Chain', 'People & Service', 'Platform'];

  const filteredModules = React.useMemo(() => {
    return ERP_22_MODULES.filter((mod) => {
      const matchesCategory =
        selectedCategory === 'All' || mod.category === selectedCategory;
      const matchesQuery =
        !query ||
        mod.name.toLowerCase().includes(query.toLowerCase()) ||
        mod.description.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [query, selectedCategory]);

  // Focus input when opened
  React.useEffect(() => {
    if (isOpen) {
      setQuery('');
      setFocusedIndex(0);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard navigation
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => (filteredModules.length > 0 ? (prev + 1) % filteredModules.length : 0));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) =>
          filteredModules.length > 0
            ? prev === 0
              ? filteredModules.length - 1
              : prev - 1
            : 0
        );
      } else if (e.key === 'Enter' && filteredModules[focusedIndex]) {
        e.preventDefault();
        router.push(filteredModules[focusedIndex].route);
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredModules, focusedIndex, onClose, router]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="App Launcher"
      className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-14 px-4 bg-slate-900/60 backdrop-blur-xs animate-in-fade"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh] animate-in-scale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Search */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/70 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-xs">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  VyaparSuite Applications
                </h2>
                <span className="text-[10px] font-semibold bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 px-1.5 py-0.5 rounded-full">
                  22 Modules
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Switch workspaces and operational ERP modules
              </p>
            </div>
          </div>

          <div className="flex-1 max-w-sm relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setFocusedIndex(0);
              }}
              placeholder="Search all 22 modules..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 px-5 py-2.5 border-b border-slate-100 dark:border-slate-800 overflow-x-auto text-xs bg-white dark:bg-slate-900">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setSelectedCategory(cat);
                setFocusedIndex(0);
              }}
              className={cn(
                'px-3 py-1 rounded-full font-medium transition-all shrink-0',
                selectedCategory === cat
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Modules Grid */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          {filteredModules.length === 0 ? (
            <div className="py-12 text-center">
              <Search className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                No matching applications found
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Try searching for keywords like &apos;invoice&apos;, &apos;stock&apos;, &apos;GST&apos;, or &apos;journal&apos;
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredModules.map((mod, index) => {
                const IconComponent = mod.icon;
                const isFocused = index === focusedIndex;

                return (
                  <Link
                    key={mod.id}
                    href={mod.route}
                    onClick={onClose}
                    onMouseEnter={() => setFocusedIndex(index)}
                    className={cn(
                      'group relative flex items-start gap-3.5 p-3.5 rounded-xl border transition-all duration-150 text-left',
                      'hover:shadow-md hover:border-brand-500/50 dark:hover:border-brand-500/50',
                      isFocused
                        ? 'border-brand-500 bg-brand-50/40 dark:bg-brand-950/20 ring-1 ring-brand-500/30'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60'
                    )}
                  >
                    <div
                      className={cn(
                        'h-10 w-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover:scale-105',
                        mod.color
                      )}
                    >
                      <IconComponent className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate">
                          {mod.name}
                        </span>
                        {mod.badge && (
                          <span className="text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                            {mod.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">
                        {mod.description}
                      </p>
                    </div>

                    <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-brand-500 dark:text-slate-600 dark:group-hover:text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity self-center shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span>Tip: Press</span>
            <kbd className="px-1.5 py-0.5 font-mono text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-300 dark:border-slate-700">
              Esc
            </kbd>
            <span>to close</span>
          </div>
          <span className="font-medium text-slate-500 dark:text-slate-400">
            VyaparSuite ERP Platform v1.0 • Multi-Entity Architecture
          </span>
        </div>
      </div>
    </div>
  );
}
