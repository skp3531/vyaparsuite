'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import type { ERPSession } from '@/modules/auth/types/session';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { CommandPalette } from './command-palette';
import { ToastProvider } from '@/components/ui';
import { cn } from '@/lib/utils/cn';

const SIDEBAR_COLLAPSE_STORAGE_KEY = 'vyapar_sidebar_collapsed';

interface ERPShellProps {
  session: ERPSession;
  children: React.ReactNode;
}

export function ERPShell({ session, children }: ERPShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = React.useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = React.useState(false);
  const pathname = usePathname();

  // Load saved sidebar state from localStorage on mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_COLLAPSE_STORAGE_KEY);
      if (saved !== null) {
        setIsSidebarCollapsed(saved === 'true');
      }
    } catch {
      // Ignore localStorage errors in SSR or restricted iframe
    }
  }, []);

  // Close mobile drawer whenever route changes
  React.useEffect(() => {
    setIsMobileDrawerOpen(false);
  }, [pathname]);

  // Global keyboard shortcuts (Cmd+K for search, [ for sidebar toggle)
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Toggle Command Palette (Cmd+K or Ctrl+K)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      // Don't intercept single-key shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // [ key toggles sidebar collapse
      if (e.key === '[') {
        e.preventDefault();
        toggleSidebarCollapse();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSE_STORAGE_KEY, String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 font-sans antialiased text-slate-900 dark:text-slate-100">
      {/* Desktop Sticky Collapsible Sidebar */}
      <div className="hidden md:flex shrink-0 h-full">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
        />
      </div>

      {/* Mobile Drawer (Slide-over Sheet) */}
      {isMobileDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Menu"
          className="fixed inset-0 z-50 md:hidden flex"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs animate-in-fade"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative flex flex-col w-72 max-w-[85vw] h-full bg-slate-900 shadow-2xl z-10 animate-slide-in">
            {/* Close button inside mobile header */}
            <div className="absolute right-3 top-3 z-30">
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Close Navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Render full-width non-collapsed sidebar in mobile drawer */}
            <Sidebar
              isCollapsed={false}
              onToggleCollapse={() => setIsMobileDrawerOpen(false)}
              className="w-full h-full border-r-0"
            />
          </div>
        </div>
      )}

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Navigation Bar */}
        <Topbar
          session={session}
          onOpenMobileSidebar={() => setIsMobileDrawerOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />

        {/* Dynamic Page Viewport */}
        <ToastProvider position="top-right">
          <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-slate-950">
            {children}
          </main>
        </ToastProvider>
      </div>

      {/* Omnipresent Cmd+K Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </div>
  );
}
