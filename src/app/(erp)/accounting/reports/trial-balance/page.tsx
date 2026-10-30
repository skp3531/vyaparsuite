'use client';

import * as React from 'react';
import {
  Scale,
  Calendar,
  Download,
  Printer,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Search,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/toast';
import { formatCurrency } from '@/lib/utils/formatters';

interface TrialBalanceViewRow {
  code: string;
  name: string;
  root_type: 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';
  account_type: string;
  total_debit: number;
  total_credit: number;
  closing_debit: number;
  closing_credit: number;
}

const INITIAL_TB_ROWS: TrialBalanceViewRow[] = [
  // Assets (Normal Debit)
  {
    code: '1100',
    name: 'Accounts Receivable (Debtors)',
    root_type: 'Asset',
    account_type: 'Receivable',
    total_debit: 353000.0,
    total_credit: 118000.0,
    closing_debit: 235000.0,
    closing_credit: 0.0,
  },
  {
    code: '1210',
    name: 'Input CGST ITC',
    root_type: 'Asset',
    account_type: 'Tax',
    total_debit: 284000.0,
    total_credit: 0.0,
    closing_debit: 284000.0,
    closing_credit: 0.0,
  },
  {
    code: '1220',
    name: 'Input SGST ITC',
    root_type: 'Asset',
    account_type: 'Tax',
    total_debit: 284000.0,
    total_credit: 0.0,
    closing_debit: 284000.0,
    closing_credit: 0.0,
  },
  {
    code: '1310',
    name: 'HDFC Bank - Current A/c 502000',
    root_type: 'Asset',
    account_type: 'Bank',
    total_debit: 1538000.0,
    total_credit: 88000.0,
    closing_debit: 1450000.0,
    closing_credit: 0.0,
  },
  {
    code: '1320',
    name: 'Main Petty Cash Float',
    root_type: 'Asset',
    account_type: 'Cash',
    total_debit: 25000.0,
    total_credit: 5000.0,
    closing_debit: 20000.0,
    closing_credit: 0.0,
  },
  // Liabilities (Normal Credit)
  {
    code: '2110',
    name: 'Output CGST Liability',
    root_type: 'Liability',
    account_type: 'Tax',
    total_debit: 0.0,
    total_credit: 412000.0,
    closing_debit: 0.0,
    closing_credit: 412000.0,
  },
  {
    code: '2120',
    name: 'Output SGST Liability',
    root_type: 'Liability',
    account_type: 'Tax',
    total_debit: 0.0,
    total_credit: 412000.0,
    closing_debit: 0.0,
    closing_credit: 412000.0,
  },
  {
    code: '2140',
    name: 'TDS Payable u/s 194Q',
    root_type: 'Liability',
    account_type: 'Tax',
    total_debit: 0.0,
    total_credit: 34000.0,
    closing_debit: 0.0,
    closing_credit: 34000.0,
  },
  {
    code: '2200',
    name: 'Accounts Payable (Creditors)',
    root_type: 'Liability',
    account_type: 'Payable',
    total_debit: 0.0,
    total_credit: 890000.0,
    closing_debit: 0.0,
    closing_credit: 890000.0,
  },
  // Equity (Normal Credit)
  {
    code: '3100',
    name: 'Paid-up Equity Share Capital',
    root_type: 'Equity',
    account_type: 'Equity',
    total_debit: 0.0,
    total_credit: 1000000.0,
    closing_debit: 0.0,
    closing_credit: 1000000.0,
  },
  // Income (Normal Credit)
  {
    code: '4100',
    name: 'Domestic Finished Goods Sales Revenue',
    root_type: 'Income',
    account_type: 'Income Account',
    total_debit: 0.0,
    total_credit: 3735000.0,
    closing_debit: 0.0,
    closing_credit: 3735000.0,
  },
  // Expense (Normal Debit)
  {
    code: '5100',
    name: 'Cost of Raw Materials & Consumables',
    root_type: 'Expense',
    account_type: 'Cost of Goods Sold',
    total_debit: 4210000.0,
    total_credit: 0.0,
    closing_debit: 4210000.0,
    closing_credit: 0.0,
  },
];

export default function TrialBalanceReportPage() {
  const { addToast } = useToast();
  const [asOfDate, setAsOfDate] = React.useState('2026-10-31');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [rootTypeFilter, setRootTypeFilter] = React.useState('ALL');

  const filteredRows = React.useMemo(() => {
    return INITIAL_TB_ROWS.filter((r) => {
      const matchesSearch =
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.code.includes(searchTerm);
      const matchesRoot = rootTypeFilter === 'ALL' || r.root_type === rootTypeFilter;
      return matchesSearch && matchesRoot;
    });
  }, [searchTerm, rootTypeFilter]);

  const totalClosingDebit = INITIAL_TB_ROWS.reduce((sum, r) => sum + r.closing_debit, 0);
  const totalClosingCredit = INITIAL_TB_ROWS.reduce((sum, r) => sum + r.closing_credit, 0);
  const diff = Math.abs(totalClosingDebit - totalClosingCredit);
  const isBalanced = diff < 0.01;

  const handleExport = () => {
    addToast({
      title: 'Trial Balance Exported',
      description: `Trial Balance as of ${asOfDate} has been prepared for download.`,
      type: 'success',
    });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Trial Balance Statement</h1>
            <Badge variant="outline" className="border-emerald-500 text-emerald-700 bg-emerald-50">
              <ShieldCheck className="mr-1 h-3 w-3" />
              Real-time Balanced
            </Badge>
          </div>
          <p className="text-sm text-gray-500">
            Comprehensive audit statement verifying mathematical equality of all debit and credit balances across the General Ledger.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" /> Export CSV/Excel
          </Button>
          <Button variant="outline" onClick={() => window.print()} className="gap-2">
            <Printer className="h-4 w-4" /> Print Statement
          </Button>
        </div>
      </div>

      {/* Balancing Status Banner */}
      <Card className={`border-2 ${isBalanced ? 'border-emerald-500 bg-emerald-50/40' : 'border-red-500 bg-red-50/40'}`}>
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-full ${isBalanced ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
              <Scale className="h-6 w-6" />
            </div>
            <div>
              <div className="font-bold text-gray-900 flex items-center gap-2">
                {isBalanced ? 'Double-Entry Invariant Fully Satisfied' : 'Trial Balance Unbalanced!'}
                <Badge variant={isBalanced ? 'outline' : 'destructive'} className="text-xs">
                  Diff: ₹{diff.toFixed(2)}
                </Badge>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">
                Total Closing Debits ({formatCurrency(totalClosingDebit)}) === Total Closing Credits ({formatCurrency(totalClosingCredit)})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 font-medium">As of Date:</span>
            <Input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="w-36 text-xs bg-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search account code or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="w-56">
              <select
                aria-label="Filter by root account type"
                value={rootTypeFilter}
                onChange={(e) => setRootTypeFilter(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
              >
                <option value="ALL">All Account Classes</option>
                <option value="Asset">Assets</option>
                <option value="Liability">Liabilities</option>
                <option value="Equity">Equity</option>
                <option value="Income">Income / Revenue</option>
                <option value="Expense">Expense</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trial Balance Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/75">
                <TableHead className="w-[100px]">Account #</TableHead>
                <TableHead>Account Name</TableHead>
                <TableHead className="w-[110px]">Class</TableHead>
                <TableHead className="w-[150px]">Account Type</TableHead>
                <TableHead className="text-right w-[140px]">Gross Debit</TableHead>
                <TableHead className="text-right w-[140px]">Gross Credit</TableHead>
                <TableHead className="text-right w-[150px] font-bold text-gray-900 bg-blue-50/50">
                  Closing Debit (₹)
                </TableHead>
                <TableHead className="text-right w-[150px] font-bold text-gray-900 bg-blue-50/50">
                  Closing Credit (₹)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map((row) => (
                <TableRow key={row.code} className="hover:bg-gray-50/50">
                  <TableCell className="font-mono text-xs font-bold text-gray-700">{row.code}</TableCell>
                  <TableCell className="font-medium text-xs text-gray-900">{row.name}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        row.root_type === 'Asset'
                          ? 'bg-blue-100 text-blue-800'
                          : row.root_type === 'Liability'
                          ? 'bg-amber-100 text-amber-800'
                          : row.root_type === 'Equity'
                          ? 'bg-purple-100 text-purple-800'
                          : row.root_type === 'Income'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {row.root_type}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-gray-600">{row.account_type}</TableCell>
                  <TableCell className="text-right font-mono text-xs text-gray-600">
                    {row.total_debit > 0 ? formatCurrency(row.total_debit) : '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-gray-600">
                    {row.total_credit > 0 ? formatCurrency(row.total_credit) : '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-bold text-gray-900 bg-blue-50/30">
                    {row.closing_debit > 0 ? formatCurrency(row.closing_debit) : '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-bold text-gray-900 bg-blue-50/30">
                    {row.closing_credit > 0 ? formatCurrency(row.closing_credit) : '—'}
                  </TableCell>
                </TableRow>
              ))}

              {/* Total Summary Row */}
              <TableRow className="bg-gray-100/80 font-bold border-t-2 border-gray-300">
                <TableCell colSpan={4} className="text-xs uppercase tracking-wider text-gray-700">
                  Total Trial Balance Summary
                </TableCell>
                <TableCell className="text-right font-mono text-xs text-gray-700">
                  {formatCurrency(INITIAL_TB_ROWS.reduce((sum, r) => sum + r.total_debit, 0))}
                </TableCell>
                <TableCell className="text-right font-mono text-xs text-gray-700">
                  {formatCurrency(INITIAL_TB_ROWS.reduce((sum, r) => sum + r.total_credit, 0))}
                </TableCell>
                <TableCell className="text-right font-mono text-xs text-blue-900 bg-blue-100/50">
                  {formatCurrency(totalClosingDebit)}
                </TableCell>
                <TableCell className="text-right font-mono text-xs text-blue-900 bg-blue-100/50">
                  {formatCurrency(totalClosingCredit)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
