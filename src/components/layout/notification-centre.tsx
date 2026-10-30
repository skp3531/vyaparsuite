'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Bell,
  Check,
  CheckCheck,
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileCheck2,
  X,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'approval';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: NotificationType;
  read: boolean;
  link?: string;
  actionRequired?: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Purchase Order Approval Needed',
    message: 'PO-2024-0089 for ₹145,000 from Tata Steel requires your sign-off.',
    timestamp: '10m ago',
    type: 'approval',
    read: false,
    link: '/purchase/orders',
    actionRequired: true,
  },
  {
    id: 'notif-2',
    title: 'Payment Received',
    message: 'HDFC Bank cleared ₹420,000 for Invoice INV-2024-0312 (Reliance Retail).',
    timestamp: '35m ago',
    type: 'success',
    read: false,
    link: '/accounting/payment-entry',
  },
  {
    id: 'notif-3',
    title: 'Low Stock Alert',
    message: 'Raw Material "Copper Rod 12mm" reached minimum reorder point (14 units remaining).',
    timestamp: '2h ago',
    type: 'warning',
    read: false,
    link: '/inventory/items',
  },
  {
    id: 'notif-4',
    title: 'GST E-Invoice IRN Generated',
    message: 'Invoice INV-2024-0315 successfully registered with NIC Portal.',
    timestamp: '4h ago',
    type: 'info',
    read: false,
    link: '/india/e-invoice',
  },
  {
    id: 'notif-5',
    title: 'Bank Reconciliation Sync',
    message: 'Automated statement sync for ICICI Current A/c failed. Check credentials.',
    timestamp: '1d ago',
    type: 'error',
    read: true,
    link: '/accounting/bank-reconciliation',
  },
];

export function NotificationCentre({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = React.useState<'all' | 'unread' | 'approvals'>('all');
  const panelRef = React.useRef<HTMLDivElement>(null);

  const unreadCount = React.useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  // Close panel on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
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

  const markAsRead = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const filteredNotifications = React.useMemo(() => {
    if (filter === 'unread') return notifications.filter((n) => !n.read);
    if (filter === 'approvals') return notifications.filter((n) => n.type === 'approval');
    return notifications;
  }, [notifications, filter]);

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'approval':
        return <FileCheck2 className="h-4 w-4 text-indigo-500 shrink-0" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-blue-500 shrink-0" />;
    }
  };

  return (
    <div ref={panelRef} className={cn('relative inline-block text-left', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative p-2 rounded-md text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100',
          'hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/30'
        )}
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold text-white bg-red-600 rounded-full ring-2 ring-white dark:ring-slate-900 animate-in-scale">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 origin-top-right rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl ring-1 ring-black/5 z-50 animate-in-fade flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1 font-medium hover:underline focus:outline-none"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 text-xs">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={cn(
                'px-2.5 py-1 rounded-md font-medium transition-colors',
                filter === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-950 dark:hover:text-slate-200'
              )}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={cn(
                'px-2.5 py-1 rounded-md font-medium transition-colors',
                filter === 'unread'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-950 dark:hover:text-slate-200'
              )}
            >
              Unread ({unreadCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('approvals')}
              className={cn(
                'px-2.5 py-1 rounded-md font-medium transition-colors',
                filter === 'approvals'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-950 dark:hover:text-slate-200'
              )}
            >
              Approvals
            </button>
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 flex-1">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Bell className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-2 stroke-1" />
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  No notifications to show
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  You are all caught up on pending tasks and system events.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const ItemContent = (
                  <div
                    key={notif.id}
                    onClick={() => markAsRead(notif.id)}
                    className={cn(
                      'flex items-start gap-3 p-3 transition-colors cursor-pointer group',
                      notif.read
                        ? 'bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-300'
                        : 'bg-brand-50/30 dark:bg-brand-950/20 hover:bg-brand-50/50 dark:hover:bg-brand-950/40 text-slate-900 dark:text-slate-100'
                    )}
                  >
                    <div className="mt-0.5 shrink-0">{getTypeIcon(notif.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-xs font-semibold truncate">{notif.title}</span>
                        <span className="text-[10px] text-slate-400 shrink-0">{notif.timestamp}</span>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-2">
                        {notif.message}
                      </p>
                      {notif.actionRequired && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                            Action Required
                          </span>
                        </div>
                      )}
                    </div>
                    {!notif.read && (
                      <button
                        type="button"
                        onClick={(e) => markAsRead(notif.id, e)}
                        title="Mark as read"
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-opacity"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );

                if (notif.link) {
                  return (
                    <Link
                      key={notif.id}
                      href={notif.link}
                      onClick={() => {
                        markAsRead(notif.id);
                        setIsOpen(false);
                      }}
                      className="block"
                    >
                      {ItemContent}
                    </Link>
                  );
                }

                return ItemContent;
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-center rounded-b-xl">
            <Link
              href="/settings/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 inline-flex items-center gap-1"
            >
              <span>Notification Settings & Preferences</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
