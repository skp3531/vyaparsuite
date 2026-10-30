'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  User,
  Settings,
  Moon,
  Sun,
  LogOut,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import type { UserSession } from '@/modules/auth/types/session';
import { logoutAction } from '@/modules/auth/actions/auth-actions';
import { useTheme } from './theme-provider';
import { cn } from '@/lib/utils/cn';

interface UserMenuProps {
  user: UserSession;
  className?: string;
}

export function UserMenu({ user, className }: UserMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoggingOut, startTransition] = React.useTransition();
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const { resolvedTheme, toggleTheme } = useTheme();

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

  const handleSignOut = () => {
    setIsOpen(false);
    startTransition(async () => {
      await logoutAction();
    });
  };

  return (
    <div ref={dropdownRef} className={cn('relative inline-block text-left', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-full md:rounded-md border border-transparent transition-all duration-150',
          'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200',
          'focus:outline-none focus:ring-2 focus:ring-brand-500/30'
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="h-7 w-7 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-semibold shadow-xs ring-1 ring-white dark:ring-slate-900">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="h-full w-full object-cover rounded-full"
            />
          ) : (
            user.initials || 'VS'
          )}
        </div>
        <div className="hidden lg:flex flex-col text-left leading-tight">
          <span className="text-xs font-medium truncate max-w-[120px]">{user.name}</span>
          <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{user.role}</span>
        </div>
        <ChevronDown className="hidden sm:block h-3.5 w-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-64 origin-top-right rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl ring-1 ring-black/5 z-50 animate-in-fade divide-y divide-slate-100 dark:divide-slate-800">
          {/* User Profile Summary */}
          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-semibold shrink-0">
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="h-full w-full object-cover rounded-full"
                  />
                ) : (
                  user.initials || 'VS'
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {user.name}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {user.email}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="h-3 w-3 text-emerald-500" />
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    {user.role}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="py-1">
            <Link
              href="/settings/users"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
            >
              <User className="h-4 w-4 text-slate-400" />
              <span>My Profile</span>
            </Link>
            <Link
              href="/settings/company"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
            >
              <Settings className="h-4 w-4 text-slate-400" />
              <span>My Settings</span>
            </Link>
          </div>

          {/* Theme Switcher Toggle */}
          <div className="py-1">
            <button
              type="button"
              onClick={toggleTheme}
              className="w-full flex items-center justify-between px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                {resolvedTheme === 'dark' ? (
                  <Moon className="h-4 w-4 text-brand-400" />
                ) : (
                  <Sun className="h-4 w-4 text-amber-500" />
                )}
                <span>Theme</span>
              </div>
              <span className="text-[11px] font-medium text-slate-400 capitalize">
                {resolvedTheme} mode
              </span>
            </button>
          </div>

          {/* Sign Out */}
          <div className="py-1">
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isLoggingOut}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              <span>{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
