'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Menu,
  LayoutGrid,
  Search,
  Plus,
  Calendar,
  FileText,
  Users,
  ShoppingCart,
  Boxes,
  Landmark,
  UserPlus,
  ChevronDown,
} from 'lucide-react';
import type { ERPSession } from '@/modules/auth/types/session';
import { Breadcrumbs } from './breadcrumbs';
import { CompanySelector, BranchSelector } from './company-selector';
import { NotificationCentre } from './notification-centre';
import { UserMenu } from './user-menu';
import { ModuleSwitcher } from './module-switcher';
import { cn } from '@/lib/utils/cn';

interface TopbarProps {
  session: ERPSession;
  onOpenMobileSidebar: () => void;
  onOpenCommandPalette: () => void;
  className?: string;
}

export function Topbar({
  session,
  onOpenMobileSidebar,
  onOpenCommandPalette,
  className,
}: TopbarProps) {
  const [isModuleSwitcherOpen, setIsModuleSwitcherOpen] = React.useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = React.useState(false);
  const quickCreateRef = React.useRef<HTMLDivElement>(null);

  // Close quick create dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (quickCreateRef.current && !quickCreateRef.current.contains(event.target as Node)) {
        setIsQuickCreateOpen(false);
      }
    }
    if (isQuickCreateOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isQuickCreateOpen]);

  const quickCreateActions = [
    { label: 'Sales Invoice', icon: FileText, href: '/sales', category: 'Sales' },
    { label: 'Sales Quotation', icon: FileText, href: '/sales', category: 'Sales' },
    { label: 'Purchase Order', icon: ShoppingCart, href: '/purchase', category: 'Purchase' },
    { label: 'Payment Voucher', icon: Landmark, href: '/accounting', category: 'Accounting' },
    { label: 'Journal Entry', icon: Landmark, href: '/accounting', category: 'Accounting' },
    { label: 'Inventory Item', icon: Boxes, href: '/inventory', category: 'Stock' },
    { label: 'New Customer', icon: Users, href: '/sales', category: 'Masters' },
    { label: 'New Lead', icon: UserPlus, href: '/crm', category: 'CRM' },
  ];

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-30 h-14 w-full flex items-center justify-between px-3 sm:px-4',
          'bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors',
          className
        )}
      >
        {/* Left Side: Mobile Menu, App Launcher, Breadcrumbs */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* 9-Dot App Launcher */}
          <button
            type="button"
            onClick={() => setIsModuleSwitcherOpen(true)}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-brand-600 dark:hover:text-brand-400 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            title="App Launcher (All 22 Modules)"
            aria-label="Open App Launcher"
          >
            <LayoutGrid className="h-5 w-5" />
          </button>

          <div className="hidden sm:block h-4 w-px bg-slate-200 dark:bg-slate-800" />

          {/* Dynamic Breadcrumbs */}
          <div className="min-w-0">
            <Breadcrumbs />
          </div>
        </div>

        {/* Right Side: Entity Switcher, FY Badge, Search, Quick Create, Notifications, User */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Company & Branch Switcher (desktop & tablet) */}
          <div className="hidden md:flex items-center gap-1.5">
            <CompanySelector
              currentCompany={session.company}
              companies={session.companies}
            />
            <BranchSelector
              currentBranch={session.branch}
              branches={session.branches}
            />
          </div>

          {/* Financial Year Pill Badge */}
          <div
            className="hidden lg:flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs"
            title={`Active Financial Year: FY ${session.financialYear}`}
          >
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-[11px]">FY {session.financialYear}</span>
          </div>

          {/* Cmd + K Global Search Trigger Button */}
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className={cn(
              'flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150',
              'bg-slate-100/90 hover:bg-slate-200/70 text-slate-500 hover:text-slate-800',
              'dark:bg-slate-800/80 dark:hover:bg-slate-700/80 dark:text-slate-400 dark:hover:text-slate-200',
              'border border-slate-200/80 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-brand-500/30'
            )}
            title="Search DocTypes, Actions, and Records (Cmd + K)"
            aria-label="Open Command Palette"
          >
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <span className="hidden xl:inline text-slate-500 dark:text-slate-400 font-normal">
              Search or jump to...
            </span>
            <kbd className="inline-flex items-center gap-0.5 px-1 py-0.2 text-[10px] font-mono font-semibold rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 shadow-2xs">
              ⌘K
            </kbd>
          </button>

          {/* Quick Create (+) Dropdown */}
          <div ref={quickCreateRef} className="relative inline-block text-left">
            <button
              type="button"
              onClick={() => setIsQuickCreateOpen(!isQuickCreateOpen)}
              className={cn(
                'flex items-center justify-center h-8 w-8 rounded-md transition-all',
                'bg-brand-600 hover:bg-brand-700 text-white shadow-xs',
                'focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:ring-offset-1'
              )}
              title="Quick Create Document"
              aria-label="Quick Create New Document"
              aria-expanded={isQuickCreateOpen}
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
            </button>

            {isQuickCreateOpen && (
              <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl ring-1 ring-black/5 z-50 animate-in-fade py-1">
                <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Quick Create Document
                  </p>
                </div>
                <div className="py-1">
                  {quickCreateActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <Link
                        key={action.label}
                        href={action.href}
                        onClick={() => setIsQuickCreateOpen(false)}
                        className="flex items-center justify-between px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-brand-50/70 dark:hover:bg-slate-800/80 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="h-3.5 w-3.5 text-slate-400" />
                          <span>{action.label}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {action.category}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Notification Centre */}
          <NotificationCentre />

          {/* User Profile Menu */}
          <UserMenu user={session.user} />
        </div>
      </header>

      {/* Module Switcher Modal */}
      <ModuleSwitcher
        isOpen={isModuleSwitcherOpen}
        onClose={() => setIsModuleSwitcherOpen(false)}
      />
    </>
  );
}
