'use client';

import * as React from 'react';
import { Building2, Check, ChevronDown, MapPin } from 'lucide-react';
import type { CompanyOption, BranchOption } from '@/modules/auth/types/session';
import { switchCompanyAction, switchBranchAction } from '@/modules/auth/actions/auth-actions';
import { cn } from '@/lib/utils/cn';

interface CompanySelectorProps {
  currentCompany: CompanyOption;
  companies: CompanyOption[];
  className?: string;
}

export function CompanySelector({
  currentCompany,
  companies = [],
  className,
}: CompanySelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectCompany = (companyId: string) => {
    if (companyId === currentCompany.id) {
      setIsOpen(false);
      return;
    }
    setIsOpen(false);
    startTransition(async () => {
      await switchCompanyAction(companyId);
    });
  };

  const getCompanyInitials = (name: string) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div ref={dropdownRef} className={cn('relative inline-block text-left', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className={cn(
          'flex items-center gap-2 px-2.5 py-1 text-xs font-medium rounded-md border transition-all duration-150',
          'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200',
          'dark:bg-slate-800/80 dark:hover:bg-slate-700/80 dark:text-slate-100 dark:border-slate-700',
          'focus:outline-none focus:ring-2 focus:ring-brand-500/30',
          isPending && 'opacity-60 cursor-wait'
        )}
        title={`Active Legal Entity: ${currentCompany.name}`}
      >
        <div className="flex items-center justify-center h-4.5 w-4.5 rounded bg-brand-600 text-white text-[10px] font-bold shrink-0">
          {getCompanyInitials(currentCompany.name)}
        </div>
        <span className="truncate max-w-[110px] sm:max-w-[150px] font-semibold">
          {currentCompany.name}
        </span>
        <ChevronDown className={cn('h-3.5 w-3.5 text-slate-400 transition-transform duration-150', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-64 origin-top-left rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl ring-1 ring-black/5 z-50 animate-in-fade py-1">
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Legal Entities
            </p>
          </div>
          <div className="py-1 max-h-60 overflow-y-auto">
            {companies.map((company) => {
              const isSelected = company.id === currentCompany.id;
              return (
                <button
                  key={company.id}
                  type="button"
                  onClick={() => handleSelectCompany(company.id)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors',
                    isSelected
                      ? 'bg-brand-50/70 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-medium'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={cn(
                        'flex items-center justify-center h-6 w-6 rounded text-xs font-bold shrink-0',
                        isSelected
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      )}
                    >
                      {getCompanyInitials(company.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-medium">{company.name}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                        <span>{company.code}</span>
                        {company.gstin && (
                          <>
                            <span>•</span>
                            <span className="font-mono">{company.gstin}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-brand-600 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface BranchSelectorProps {
  currentBranch: BranchOption;
  branches: BranchOption[];
  className?: string;
}

export function BranchSelector({
  currentBranch,
  branches = [],
  className,
}: BranchSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectBranch = (branchId: string) => {
    if (branchId === currentBranch.id) {
      setIsOpen(false);
      return;
    }
    setIsOpen(false);
    startTransition(async () => {
      await switchBranchAction(branchId);
    });
  };

  return (
    <div ref={dropdownRef} className={cn('relative inline-block text-left', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border transition-all duration-150',
          'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200',
          'dark:bg-slate-800/80 dark:hover:bg-slate-700/80 dark:text-slate-200 dark:border-slate-700',
          'focus:outline-none focus:ring-2 focus:ring-brand-500/30',
          isPending && 'opacity-60 cursor-wait'
        )}
        title={`Operating Branch: ${currentBranch.name}`}
      >
        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        <span className="truncate max-w-[90px] sm:max-w-[130px]">
          {currentBranch.name}
        </span>
        <ChevronDown className={cn('h-3 w-3 text-slate-400 transition-transform duration-150', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-56 origin-top-left rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl ring-1 ring-black/5 z-50 animate-in-fade py-1">
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Operating Branches
            </p>
          </div>
          <div className="py-1 max-h-52 overflow-y-auto">
            {branches.map((branch) => {
              const isSelected = branch.id === currentBranch.id;
              return (
                <button
                  key={branch.id}
                  type="button"
                  onClick={() => handleSelectBranch(branch.id)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors',
                    isSelected
                      ? 'bg-brand-50/70 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-medium'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  )}
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{branch.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{branch.code}</div>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-brand-600 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
