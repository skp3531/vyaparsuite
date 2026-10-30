'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  CreditCard,
  Wallet,
  Building,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  ShoppingCart,
  Boxes,
  Landmark,
  Scale,
  Store,
  Users,
  ChevronRight,
  Plus,
  RefreshCw,
  Download,
  AlertCircle,
  FileCheck2,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface PendingApproval {
  id: string;
  docNumber: string;
  doctype: string;
  requestor: string;
  partyName: string;
  amount: string;
  date: string;
  priority: 'high' | 'medium' | 'normal';
}

const INITIAL_APPROVALS: PendingApproval[] = [
  {
    id: 'appr-1',
    docNumber: 'PO-2024-0089',
    doctype: 'Purchase Order',
    requestor: 'Ramesh Patel',
    partyName: 'Tata Steel Long Products Ltd',
    amount: '₹ 1,45,000',
    date: 'Today, 11:30 AM',
    priority: 'high',
  },
  {
    id: 'appr-2',
    docNumber: 'SO-2024-00341',
    doctype: 'Sales Order',
    requestor: 'Priya Sharma',
    partyName: 'Reliance Retail Ventures',
    amount: '₹ 4,20,000',
    date: 'Today, 09:15 AM',
    priority: 'high',
  },
  {
    id: 'appr-3',
    docNumber: 'JV-2024-00012',
    doctype: 'Journal Entry',
    requestor: 'Finance Team',
    partyName: 'Asset Depreciation Run - Nov 2024',
    amount: '₹ 85,400',
    date: 'Yesterday',
    priority: 'medium',
  },
  {
    id: 'appr-4',
    docNumber: 'MR-2024-00045',
    doctype: 'Material Request',
    requestor: 'Deepak Joshi',
    partyName: 'Bhiwandi Central Depot to Pune Mfg',
    amount: '50 Units',
    date: 'Yesterday',
    priority: 'normal',
  },
  {
    id: 'appr-5',
    docNumber: 'EXP-2024-00088',
    doctype: 'Expense Claim',
    requestor: 'Amit Deshmukh',
    partyName: 'Sales Client Travel - Delhi NCR',
    amount: '₹ 24,650',
    date: '2 days ago',
    priority: 'medium',
  },
];

interface ActivityItem {
  id: string;
  type: 'invoice' | 'payment' | 'stock' | 'gst' | 'po';
  title: string;
  description: string;
  time: string;
  user: string;
}

const RECENT_ACTIVITIES: ActivityItem[] = [
  {
    id: 'act-1',
    type: 'gst',
    title: 'GSTR-1 Outward Supply Return Generated',
    description: 'Monthly payload compiled with 342 B2B invoices and HSN summary.',
    time: '14 minutes ago',
    user: 'Compliance Bot',
  },
  {
    id: 'act-2',
    type: 'invoice',
    title: 'Sales Invoice INV-2024-00421 Posted',
    description: 'Generated for Tata Motors Ltd • NIC IRN: 94a7e8... verified.',
    time: '38 minutes ago',
    user: 'Priya Sharma',
  },
  {
    id: 'act-3',
    type: 'payment',
    title: 'Customer Receipt Voucher REC-00912 Reconciled',
    description: 'Received ₹420,000 from Reliance Retail via HDFC RTGS.',
    time: '2 hours ago',
    user: 'Vikram Mehta',
  },
  {
    id: 'act-4',
    type: 'stock',
    title: 'Stock Transfer ST-2024-00120 Completed',
    description: 'Transferred 250 units of Steel Bar 16mm to Bhiwandi WH.',
    time: '3 hours ago',
    user: 'Warehouse Ops',
  },
  {
    id: 'act-5',
    type: 'po',
    title: 'Goods Receipt Note GRN-2024-0082 Cleared',
    description: 'Raw Material inspection passed 100% parameter criteria.',
    time: '5 hours ago',
    user: 'Quality QA',
  },
];

export default function DashboardPage() {
  const [approvals, setApprovals] = React.useState<PendingApproval[]>(INITIAL_APPROVALS);
  const [actionNotice, setActionNotice] = React.useState<string | null>(null);

  const handleApprove = (id: string, docNumber: string) => {
    setApprovals((prev) => prev.filter((a) => a.id !== id));
    setActionNotice(`Approved ${docNumber} successfully.`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleReject = (id: string, docNumber: string) => {
    setApprovals((prev) => prev.filter((a) => a.id !== id));
    setActionNotice(`Rejected ${docNumber}.`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Toast Alert Notice */}
      {actionNotice && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2 animate-toast-bottom">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 dark:text-emerald-600" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Executive Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Executive Command Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time financial status, operational throughput, and pending authorizations.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
            onClick={() => {
              setActionNotice('Synchronized live ledger balances.');
              setTimeout(() => setActionNotice(null), 2500);
            }}
          >
            Sync Ledgers
          </Button>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download className="h-3.5 w-3.5" />}
          >
            Export Pack
          </Button>
        </div>
      </div>

      {/* KPI Cards (4 Top Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Revenue */}
        <div className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Net Revenue (MTD)
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-slate-100">
              ₹ 1,42,85,420
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-semibold">
                <ArrowUpRight className="h-3.5 w-3.5" /> +14.2%
              </span>
              <span className="text-slate-400">vs target (₹1.25 Cr)</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Accounts Receivable */}
        <div className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Receivables (AR)
            </span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <CreditCard className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-slate-100">
              ₹ 38,40,150
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              <span className="text-slate-600 dark:text-slate-300 font-medium">DSO: 28 Days</span>
              <span className="text-slate-400">•</span>
              <span className="text-amber-600 dark:text-amber-400 font-medium">₹4.2L &gt;60d</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Accounts Payable */}
        <div className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Payables (AP)
            </span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Wallet className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-slate-100">
              ₹ 24,15,800
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              <span className="text-slate-600 dark:text-slate-300 font-medium">Due &lt;7d: ₹8.4L</span>
              <span className="text-slate-400">•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">0 Overdue</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Cash & Bank Liquidity */}
        <div className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Cash & Liquidity
            </span>
            <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Building className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-slate-100">
              ₹ 84,62,900
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">HDFC + ICICI</span>
              <span className="text-slate-400">• Reconciled today</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Operational Shortcuts Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Link
          href="/sales"
          className="group flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand-500/50 hover:shadow-xs transition-all text-center"
        >
          <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
            <FileText className="h-4 w-4" />
          </div>
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400">
            Sales & Invoicing
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">38 Invoices</span>
        </Link>

        <Link
          href="/purchase"
          className="group flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand-500/50 hover:shadow-xs transition-all text-center"
        >
          <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
            <ShoppingCart className="h-4 w-4" />
          </div>
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400">
            Procurement
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">14 Open POs</span>
        </Link>

        <Link
          href="/inventory"
          className="group flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand-500/50 hover:shadow-xs transition-all text-center"
        >
          <div className="h-8 w-8 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
            <Boxes className="h-4 w-4" />
          </div>
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400">
            Stock & Warehouses
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">3 Locations</span>
        </Link>

        <Link
          href="/accounting"
          className="group flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand-500/50 hover:shadow-xs transition-all text-center"
        >
          <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
            <Landmark className="h-4 w-4" />
          </div>
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400">
            General Ledger
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">Trial Balance</span>
        </Link>

        <Link
          href="/india"
          className="group flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand-500/50 hover:shadow-xs transition-all text-center"
        >
          <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
            <Scale className="h-4 w-4" />
          </div>
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400">
            India GST
          </span>
          <span className="text-[10px] text-emerald-600 font-medium mt-0.5">NIC Online</span>
        </Link>

        <Link
          href="/pos"
          className="group flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand-500/50 hover:shadow-xs transition-all text-center"
        >
          <div className="h-8 w-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
            <Store className="h-4 w-4" />
          </div>
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400">
            POS Terminal
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">Shift Open</span>
        </Link>
      </div>

      {/* Main Content Grid: Pending Approvals & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Pending Approvals Widget */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/30">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <FileCheck2 className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Pending Approvals Queue
                </h2>
                <p className="text-[11px] text-slate-400">
                  {approvals.length} transaction documents require executive authorization
                </p>
              </div>
            </div>

            <Link
              href="/settings"
              className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium inline-flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 flex-1 overflow-x-auto">
            {approvals.length === 0 ? (
              <div className="py-12 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  No Pending Approvals
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  All transaction documents and requisitions are fully authorized.
                </p>
              </div>
            ) : (
              approvals.map((appr) => (
                <div
                  key={appr.id}
                  className="p-3.5 sm:p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {appr.docNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-full font-medium text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {appr.doctype}
                      </span>
                      {appr.priority === 'high' && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                          Priority
                        </span>
                      )}
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 font-medium truncate">
                      {appr.partyName}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span>Submitted by {appr.requestor}</span>
                      <span>•</span>
                      <span>{appr.date}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    <div className="text-right">
                      <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {appr.amount}
                      </div>
                      <div className="text-[10px] text-slate-400">Total Value</div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        size="xs"
                        variant="success"
                        leftIcon={<CheckCircle2 className="h-3 w-3" />}
                        onClick={() => handleApprove(appr.id, appr.docNumber)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 dark:text-red-400"
                        onClick={() => handleReject(appr.id, appr.docNumber)}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right 1 Col: Live Activity Feed */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/30">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-brand-600 dark:text-brand-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Live Audit Trail
              </h2>
            </div>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              MCA Rule 3
            </span>
          </div>

          <div className="p-4 divide-y divide-slate-100 dark:divide-slate-800 flex-1 overflow-y-auto max-h-[420px]">
            {RECENT_ACTIVITIES.map((activity) => (
              <div key={activity.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                    {activity.title}
                  </span>
                  <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                    {activity.time}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  {activity.description}
                </p>
                <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                  <span>Actor:</span>
                  <span className="font-medium text-slate-600 dark:text-slate-300">
                    {activity.user}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 text-center">
            <Link
              href="/settings"
              className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              Inspect Complete Forensic Audit Log →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
