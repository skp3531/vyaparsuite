'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  FileText,
  PlusCircle,
  Clock,
  LayoutGrid,
  Settings,
  Settings2,
  ArrowRight,
  TrendingUp,
  ShoppingCart,
  Boxes,
  Landmark,
  Scale,
  Users,
  Store,
  Factory,
  UserCheck,
  LifeBuoy,
  Briefcase,
  Building2,
  X,
  CornerDownLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'DocTypes' | 'Actions' | 'Modules' | 'Recent Records';
  icon: React.ElementType;
  route: string;
  keywords?: string[];
  shortcut?: string;
}

const COMMAND_ITEMS: CommandItem[] = [
  // Quick Actions
  {
    id: 'act-new-invoice',
    title: 'Create Sales Invoice',
    subtitle: 'Generate tax invoice with GST breakdown',
    category: 'Actions',
    icon: PlusCircle,
    route: '/sales',
    keywords: ['new', 'invoice', 'sales', 'billing', 'bill'],
    shortcut: 'N I',
  },
  {
    id: 'act-new-po',
    title: 'Create Purchase Order',
    subtitle: 'Issue formal order to vendor',
    category: 'Actions',
    icon: PlusCircle,
    route: '/purchase',
    keywords: ['new', 'purchase', 'po', 'order', 'procurement'],
    shortcut: 'N P',
  },
  {
    id: 'act-new-payment',
    title: 'New Payment Entry',
    subtitle: 'Record inward customer receipt or supplier voucher',
    category: 'Actions',
    icon: PlusCircle,
    route: '/accounting',
    keywords: ['new', 'payment', 'receipt', 'bank', 'cash'],
  },
  {
    id: 'act-new-item',
    title: 'Add New Item / Product',
    subtitle: 'Stock catalog, pricing, and HSN/SAC setup',
    category: 'Actions',
    icon: PlusCircle,
    route: '/inventory',
    keywords: ['item', 'product', 'sku', 'stock', 'catalog'],
  },
  {
    id: 'act-open-pos',
    title: 'Launch POS Terminal',
    subtitle: 'Open high-speed cashier checkout terminal',
    category: 'Actions',
    icon: Store,
    route: '/pos',
    keywords: ['pos', 'checkout', 'counter', 'retail', 'cashier'],
  },

  // DocTypes
  {
    id: 'dt-sales-invoice',
    title: 'Sales Invoices',
    subtitle: 'Accounts receivable billing register',
    category: 'DocTypes',
    icon: FileText,
    route: '/sales',
    keywords: ['sales', 'invoice', 'ar', 'receivables', 'tax invoice'],
  },
  {
    id: 'dt-sales-order',
    title: 'Sales Orders',
    subtitle: 'Confirmed client purchase commitments',
    category: 'DocTypes',
    icon: FileText,
    route: '/sales/orders',
    keywords: ['so', 'order', 'commitment', 'sales order'],
  },
  {
    id: 'dt-quotation',
    title: 'Quotations / Proforma',
    subtitle: 'Price proposals and commercial estimates',
    category: 'DocTypes',
    icon: FileText,
    route: '/sales/quotations',
    keywords: ['quote', 'estimate', 'proforma', 'offer'],
  },
  {
    id: 'dt-purchase-order',
    title: 'Purchase Orders',
    subtitle: 'Committed procurement contracts',
    category: 'DocTypes',
    icon: FileText,
    route: '/purchase/orders',
    keywords: ['po', 'purchase', 'procurement', 'vendor order'],
  },
  {
    id: 'dt-purchase-receipt',
    title: 'Purchase Receipts (GRN)',
    subtitle: 'Goods receipt note & warehouse inward',
    category: 'DocTypes',
    icon: FileText,
    route: '/purchase/purchase-receipts',
    keywords: ['grn', 'goods receipt', 'inward', 'receiving'],
  },
  {
    id: 'dt-stock-entry',
    title: 'Stock Entries',
    subtitle: 'Material transfer, manufacturing issue, receipt',
    category: 'DocTypes',
    icon: FileText,
    route: '/inventory/stock-entries',
    keywords: ['stock transfer', 'inventory movement', 'issue'],
  },
  {
    id: 'dt-general-ledger',
    title: 'General Ledger',
    subtitle: 'Audit-ready double entry transaction book',
    category: 'DocTypes',
    icon: Landmark,
    route: '/accounting',
    keywords: ['gl', 'ledger', 'accounting', 'journal', 'audit'],
  },
  {
    id: 'dt-customer',
    title: 'Customers Directory',
    subtitle: 'Client accounts, credit limits & GSTINs',
    category: 'DocTypes',
    icon: Users,
    route: '/sales/customers',
    keywords: ['clients', 'buyers', 'customers', 'debtors'],
  },
  {
    id: 'dt-supplier',
    title: 'Suppliers Directory',
    subtitle: 'Vendor registry, bank details & ratings',
    category: 'DocTypes',
    icon: ShoppingCart,
    route: '/purchase/suppliers',
    keywords: ['vendors', 'suppliers', 'creditors', 'parties'],
  },
  {
    id: 'dt-item',
    title: 'Item Catalog & Master Data',
    subtitle: 'SKU registry, UOMs, valuation methods & standard rates',
    category: 'DocTypes',
    icon: Boxes,
    route: '/inventory/items',
    keywords: ['items', 'products', 'inventory', 'sku', 'stock', 'uom', 'valuation'],
  },
  {
    id: 'dt-chart-of-accounts',
    title: 'Chart of Accounts',
    subtitle: 'General Ledger tree, assets, liabilities, equity, revenue & expenses',
    category: 'DocTypes',
    icon: Landmark,
    route: '/accounting/chart-of-accounts',
    keywords: ['coa', 'chart of accounts', 'ledger', 'balance', 'equity', 'accounts', 'tree'],
  },
  {
    id: 'dt-company-setup',
    title: 'Company Setup & Configuration',
    subtitle: 'Organization profile, GSTIN, fiscal calendar & branches',
    category: 'DocTypes',
    icon: Settings2,
    route: '/setup/company',
    keywords: ['company', 'setup', 'gstin', 'fiscal year', 'branches', 'addresses', 'settings'],
  },
  {
    id: 'dt-gst-returns',
    title: 'GSTR-1 & 3B Returns',
    subtitle: 'Statutory monthly tax filings and summaries',
    category: 'DocTypes',
    icon: Scale,
    route: '/india',
    keywords: ['gst', 'gstr1', 'gstr3b', 'returns', 'tax compliance'],
  },

  // Modules / Workspaces
  {
    id: 'mod-accounting',
    title: 'Accounting Workspace',
    subtitle: 'Financial statements, vouchers, and reconciliations',
    category: 'Modules',
    icon: Landmark,
    route: '/accounting',
    keywords: ['finance', 'books', 'balance sheet', 'pnl'],
  },
  {
    id: 'mod-sales',
    title: 'Sales Workspace',
    subtitle: 'Order-to-cash pipeline and fulfillment',
    category: 'Modules',
    icon: TrendingUp,
    route: '/sales',
    keywords: ['sales', 'orders', 'dispatch', 'invoicing'],
  },
  {
    id: 'mod-purchase',
    title: 'Procurement Workspace',
    subtitle: 'Procure-to-pay workflow and vendor management',
    category: 'Modules',
    icon: ShoppingCart,
    route: '/purchase',
    keywords: ['purchasing', 'vendors', 'buying'],
  },
  {
    id: 'mod-inventory',
    title: 'Inventory Workspace',
    subtitle: 'Stock tracking, valuations, and bins',
    category: 'Modules',
    icon: Boxes,
    route: '/inventory',
    keywords: ['warehouse', 'stock', 'items'],
  },
  {
    id: 'mod-crm',
    title: 'CRM Workspace',
    subtitle: 'Leads, deals, and opportunity pipelines',
    category: 'Modules',
    icon: Users,
    route: '/crm',
    keywords: ['leads', 'funnel', 'pipeline'],
  },
  {
    id: 'mod-manufacturing',
    title: 'Manufacturing Workspace',
    subtitle: 'BOMs, production orders, and job cards',
    category: 'Modules',
    icon: Factory,
    route: '/manufacturing',
    keywords: ['production', 'assembly', 'routing'],
  },
  {
    id: 'mod-hrms',
    title: 'HRMS Workspace',
    subtitle: 'Employees, biometric attendance, and leave',
    category: 'Modules',
    icon: UserCheck,
    route: '/hrms',
    keywords: ['payroll', 'employees', 'leaves', 'attendance'],
  },
  {
    id: 'mod-support',
    title: 'Support Workspace',
    subtitle: 'Customer tickets, SLAs, and knowledge base',
    category: 'Modules',
    icon: LifeBuoy,
    route: '/support',
    keywords: ['helpdesk', 'tickets', 'issues'],
  },

  // Recent Records (Mock persistent history)
  {
    id: 'rec-1',
    title: 'INV-2024-00421 — Tata Motors Ltd',
    subtitle: '₹845,000 • Posted • GST E-Invoice IRN Done',
    category: 'Recent Records',
    icon: Clock,
    route: '/sales',
    keywords: ['tata', '00421', 'recent'],
  },
  {
    id: 'rec-2',
    title: 'PO-2024-00120 — Reliance Industries',
    subtitle: '₹1,240,000 • Pending Approval',
    category: 'Recent Records',
    icon: Clock,
    route: '/purchase',
    keywords: ['reliance', '00120', 'recent'],
  },
  {
    id: 'rec-3',
    title: 'ITEM-1042 — Stainless Steel Fastener M8',
    subtitle: 'Pune Plant • 450 units on hand',
    category: 'Recent Records',
    icon: Clock,
    route: '/inventory',
    keywords: ['fastener', '1042', 'item'],
  },
];

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = React.useState('');
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Filter items based on query
  const filteredItems = React.useMemo(() => {
    if (!query.trim()) {
      return COMMAND_ITEMS;
    }
    const q = query.toLowerCase().trim();
    return COMMAND_ITEMS.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSub = item.subtitle?.toLowerCase().includes(q);
      const matchKeywords = item.keywords?.some((k) => k.toLowerCase().includes(q));
      const matchCat = item.category.toLowerCase().includes(q);
      return matchTitle || matchSub || matchKeywords || matchCat;
    });
  }, [query]);

  // Group filtered items by category
  const groupedItems = React.useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    const categories: ('Actions' | 'DocTypes' | 'Modules' | 'Recent Records')[] = [
      'Actions',
      'DocTypes',
      'Modules',
      'Recent Records',
    ];

    categories.forEach((cat) => {
      const items = filteredItems.filter((i) => i.category === cat);
      if (items.length > 0) {
        groups[cat] = items;
      }
    });

    return groups;
  }, [filteredItems]);

  // Reset focus on query change or open
  React.useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard navigation
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filteredItems.length > 0 ? (prev + 1) % filteredItems.length : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filteredItems.length > 0
            ? prev === 0
              ? filteredItems.length - 1
              : prev - 1
            : 0
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredItems[selectedIndex];
        if (selected) {
          router.push(selected.route);
          onClose();
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose, router]);

  // Scroll active item into view
  React.useEffect(() => {
    if (!listRef.current) return;
    const activeElement = listRef.current.querySelector('[data-selected="true"]');
    if (activeElement) {
      activeElement.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  let currentGlobalIndex = -1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-24 px-4 bg-slate-900/60 backdrop-blur-xs animate-in-fade"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh] animate-in-scale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
          <Search className="h-4.5 w-4.5 text-slate-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-autocomplete="list"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, DocType, or search records (e.g., 'invoice', 'PO', 'Tata')..."
            className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-200/60 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div ref={listRef} className="overflow-y-auto p-2 divide-y divide-transparent flex-1">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center">
              <Search className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                No matching results found
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Try searching with different keywords like &apos;Sales&apos;, &apos;PO&apos;, or &apos;GL&apos;
              </p>
            </div>
          ) : (
            Object.entries(groupedItems).map(([category, items]) => (
              <div key={category} className="py-1">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {category}
                </div>
                <div className="space-y-0.5">
                  {items.map((item) => {
                    currentGlobalIndex += 1;
                    const itemGlobalIndex = currentGlobalIndex;
                    const isSelected = itemGlobalIndex === selectedIndex;
                    const IconComponent = item.icon;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        data-selected={isSelected}
                        onClick={() => {
                          router.push(item.route);
                          onClose();
                        }}
                        onMouseEnter={() => setSelectedIndex(itemGlobalIndex)}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors text-xs',
                          isSelected
                            ? 'bg-brand-600 text-white shadow-xs'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={cn(
                              'h-7 w-7 rounded-md flex items-center justify-center shrink-0',
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                            )}
                          >
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold truncate leading-tight">
                              {item.title}
                            </div>
                            {item.subtitle && (
                              <div
                                className={cn(
                                  'text-[11px] truncate leading-tight mt-0.5',
                                  isSelected ? 'text-white/80' : 'text-slate-400'
                                )}
                              >
                                {item.subtitle}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          {item.shortcut && (
                            <kbd
                              className={cn(
                                'px-1.5 py-0.5 font-mono text-[10px] rounded',
                                isSelected
                                  ? 'bg-white/20 text-white'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                              )}
                            >
                              {item.shortcut}
                            </kbd>
                          )}
                          <CornerDownLeft
                            className={cn(
                              'h-3.5 w-3.5 transition-opacity',
                              isSelected ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 font-mono text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded">
                ↑↓
              </kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 font-mono text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded">
                ↵
              </kbd>
              <span>to select</span>
            </span>
          </div>
          <span className="hidden sm:inline text-slate-400">
            VyaparSuite Global Search
          </span>
        </div>
      </div>
    </div>
  );
}
