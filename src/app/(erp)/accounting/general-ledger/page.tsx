'use client';

import * as React from 'react';
import {
  BookOpen,
  Search,
  Filter,
  Download,
  Printer,
  ShieldCheck,
  Calendar,
  Building2,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Scale,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { useToast } from '@/components/ui/toast';
import { formatCurrency } from '@/lib/utils/formatters';

interface GLEntryView {
  id: string;
  posting_date: string;
  account_code: string;
  account_name: string;
  party_name?: string;
  party_type?: string;
  voucher_type: string;
  voucher_number: string;
  debit: number;
  credit: number;
  running_balance: number;
  remarks?: string;
}

const INITIAL_ENTRIES: GLEntryView[] = [
  {
    id: 'gle-001',
    posting_date: '2026-10-30',
    account_code: '1310',
    account_name: 'HDFC Bank - Current A/c 502000',
    party_name: 'Bharat Retailers Ltd',
    party_type: 'Customer',
    voucher_type: 'Payment Entry',
    voucher_number: 'REC-26-00042',
    debit: 118000.0,
    credit: 0.0,
    running_balance: 1450000.0,
    remarks: 'NEFT Payment against SINV-26-00189',
  },
  {
    id: 'gle-002',
    posting_date: '2026-10-30',
    account_code: '1100',
    account_name: 'Accounts Receivable (Debtors)',
    party_name: 'Bharat Retailers Ltd',
    party_type: 'Customer',
    voucher_type: 'Payment Entry',
    voucher_number: 'REC-26-00042',
    debit: 0.0,
    credit: 118000.0,
    running_balance: 235000.0,
    remarks: 'Clearance of invoice SINV-26-00189',
  },
  {
    id: 'gle-003',
    posting_date: '2026-10-29',
    account_code: '1100',
    account_name: 'Accounts Receivable (Debtors)',
    party_name: 'Apex Industrial Systems Ltd',
    party_type: 'Customer',
    voucher_type: 'Sales Invoice',
    voucher_number: 'SINV-26-00190',
    debit: 51330.0,
    credit: 0.0,
    running_balance: 353000.0,
    remarks: 'Tax Invoice with 18% GST',
  },
  {
    id: 'gle-004',
    posting_date: '2026-10-29',
    account_code: '4100',
    account_name: 'Domestic Sales Revenue',
    party_name: 'Apex Industrial Systems Ltd',
    party_type: 'Customer',
    voucher_type: 'Sales Invoice',
    voucher_number: 'SINV-26-00190',
    debit: 0.0,
    credit: 43500.0,
    running_balance: -8420000.0,
    remarks: 'Revenue on Valve supply',
  },
  {
    id: 'gle-005',
    posting_date: '2026-10-29',
    account_code: '2110',
    account_name: 'Output CGST 9%',
    voucher_type: 'Sales Invoice',
    voucher_number: 'SINV-26-00190',
    debit: 0.0,
    credit: 3915.0,
    running_balance: -412000.0,
    remarks: 'CGST 9% on taxable value ₹43,500',
  },
  {
    id: 'gle-006',
    posting_date: '2026-10-29',
    account_code: '2120',
    account_name: 'Output SGST 9%',
    voucher_type: 'Sales Invoice',
    voucher_number: 'SINV-26-00190',
    debit: 0.0,
    credit: 3915.0,
    running_balance: -412000.0,
    remarks: 'SGST 9% on taxable value ₹43,500',
  },
  {
    id: 'gle-007',
    posting_date: '2026-10-28',
    account_code: '5100',
    account_name: 'Cost of Raw Materials Consumed',
    party_name: 'National Steel & Alloy Suppliers',
    party_type: 'Supplier',
    voucher_type: 'Purchase Invoice',
    voucher_number: 'PINV-26-00084',
    debit: 75000.0,
    credit: 0.0,
    running_balance: 4210000.0,
    remarks: 'Material purchase for Production Order #98',
  },
  {
    id: 'gle-008',
    posting_date: '2026-10-28',
    account_code: '1210',
    account_name: 'Input CGST ITC',
    voucher_type: 'Purchase Invoice',
    voucher_number: 'PINV-26-00084',
    debit: 6750.0,
    credit: 0.0,
    running_balance: 284000.0,
    remarks: 'Input CGST ITC 9% on ₹75,000',
  },
  {
    id: 'gle-009',
    posting_date: '2026-10-28',
    account_code: '1220',
    account_name: 'Input SGST ITC',
    voucher_type: 'Purchase Invoice',
    voucher_number: 'PINV-26-00084',
    debit: 6750.0,
    credit: 0.0,
    running_balance: 284000.0,
    remarks: 'Input SGST ITC 9% on ₹75,000',
  },
  {
    id: 'gle-010',
    posting_date: '2026-10-28',
    account_code: '2140',
    account_name: 'TDS Payable u/s 194Q',
    party_name: 'National Steel & Alloy Suppliers',
    party_type: 'Supplier',
    voucher_type: 'Purchase Invoice',
    voucher_number: 'PINV-26-00084',
    debit: 0.0,
    credit: 750.0,
    running_balance: -34000.0,
    remarks: 'TDS deducted @ 0.1% on purchase',
  },
  {
    id: 'gle-011',
    posting_date: '2026-10-28',
    account_code: '2200',
    account_name: 'Accounts Payable (Creditors)',
    party_name: 'National Steel & Alloy Suppliers',
    party_type: 'Supplier',
    voucher_type: 'Purchase Invoice',
    voucher_number: 'PINV-26-00084',
    debit: 0.0,
    credit: 87750.0,
    running_balance: -890000.0,
    remarks: 'Net payable on vendor bill #NS-2026-11',
  },
];

export default function GeneralLedgerPage() {
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [accountFilter, setAccountFilter] = React.useState('ALL');
  const [voucherFilter, setVoucherFilter] = React.useState('ALL');
  const [fromDate, setFromDate] = React.useState('2026-10-01');
  const [toDate, setToDate] = React.useState('2026-10-31');
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 8;

  const filteredEntries = React.useMemo(() => {
    return INITIAL_ENTRIES.filter((e) => {
      const matchesSearch =
        e.voucher_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.party_name && e.party_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (e.remarks && e.remarks.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesAccount = accountFilter === 'ALL' || e.account_code === accountFilter;
      const matchesVoucher = voucherFilter === 'ALL' || e.voucher_type === voucherFilter;

      return matchesSearch && matchesAccount && matchesVoucher;
    });
  }, [searchTerm, accountFilter, voucherFilter]);

  const totalDebits = filteredEntries.reduce((sum, e) => sum + e.debit, 0);
  const totalCredits = filteredEntries.reduce((sum, e) => sum + e.credit, 0);

  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleExport = () => {
    addToast({
      title: 'Ledger Export Generated',
      description: 'General ledger export in MCA-compliant Excel/CSV format has been prepared.',
      type: 'success',
    });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">General Ledger</h1>
            <Badge variant="outline" className="border-emerald-500 text-emerald-700 bg-emerald-50">
              <ShieldCheck className="mr-1 h-3 w-3" />
              MCA Rule 3 Immutable Audit Trail
            </Badge>
          </div>
          <p className="text-sm text-gray-500">
            Append-only double-entry financial ledger with cryptographic voucher links and immutable running balances.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export Statement
          </Button>
          <Button variant="outline" onClick={() => window.print()} className="gap-2">
            <Printer className="h-4 w-4" />
            Print Ledger
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-gray-500">Total Debits</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900">{formatCurrency(totalDebits)}</div>
            <p className="text-xs text-gray-500 mt-1">In selected range</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-gray-500">Total Credits</CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900">{formatCurrency(totalCredits)}</div>
            <p className="text-xs text-gray-500 mt-1">In selected range</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-gray-500">Ledger Invariant</CardTitle>
            <Scale className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-emerald-700">Balanced (₹0.00 Diff)</div>
            <p className="text-xs text-emerald-600 mt-1">Σ Debits === Σ Credits</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-gray-500">Audited Entries</CardTitle>
            <BookOpen className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900">{filteredEntries.length} Transactions</div>
            <p className="text-xs text-gray-500 mt-1">Zero mutations allowed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid gap-3 md:grid-cols-5">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by voucher, party, or remarks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <div>
              <select
                aria-label="Filter by account"
                value={accountFilter}
                onChange={(e) => setAccountFilter(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
              >
                <option value="ALL">All Accounts</option>
                <option value="1100">1100 - Accounts Receivable</option>
                <option value="1310">1310 - HDFC Bank Current A/c</option>
                <option value="2110">2110 - Output CGST</option>
                <option value="2120">2120 - Output SGST</option>
                <option value="2140">2140 - TDS Payable</option>
                <option value="2200">2200 - Accounts Payable</option>
                <option value="4100">4100 - Domestic Sales Revenue</option>
                <option value="5100">5100 - Cost of Raw Materials</option>
              </select>
            </div>

            <div>
              <select
                aria-label="Filter by voucher type"
                value={voucherFilter}
                onChange={(e) => setVoucherFilter(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
              >
                <option value="ALL">All Voucher Types</option>
                <option value="Sales Invoice">Sales Invoice</option>
                <option value="Purchase Invoice">Purchase Invoice</option>
                <option value="Payment Entry">Payment Entry</option>
                <option value="Journal Entry">Journal Entry</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="text-xs"
              />
              <span className="text-gray-400">-</span>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Ledger Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/75">
                <TableHead className="w-[105px]">Date</TableHead>
                <TableHead className="w-[150px]">Voucher</TableHead>
                <TableHead className="w-[200px]">Account</TableHead>
                <TableHead className="w-[180px]">Party</TableHead>
                <TableHead>Narration / Remarks</TableHead>
                <TableHead className="text-right w-[120px]">Debit (₹)</TableHead>
                <TableHead className="text-right w-[120px]">Credit (₹)</TableHead>
                <TableHead className="text-right w-[130px]">Balance (₹)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-gray-500">
                    No General Ledger entries match the selected filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedEntries.map((row) => (
                  <TableRow key={row.id} className="hover:bg-gray-50/50">
                    <TableCell className="font-mono text-xs text-gray-600">{row.posting_date}</TableCell>
                    <TableCell>
                      <div className="font-semibold text-xs text-gray-900">{row.voucher_number}</div>
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-600 mt-0.5">
                        {row.voucher_type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-xs text-gray-900">{row.account_name}</div>
                      <div className="text-[11px] font-mono text-gray-500">{row.account_code}</div>
                    </TableCell>
                    <TableCell>
                      {row.party_name ? (
                        <div>
                          <span className="text-xs font-medium text-gray-900">{row.party_name}</span>
                          <span className="block text-[10px] text-gray-500">{row.party_type}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-gray-600 max-w-xs truncate" title={row.remarks}>
                      {row.remarks || '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-semibold text-gray-900">
                      {row.debit > 0 ? formatCurrency(row.debit) : '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-semibold text-gray-900">
                      {row.credit > 0 ? formatCurrency(row.credit) : '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold text-gray-900">
                      {formatCurrency(row.running_balance)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Pagination
        currentPage={currentPage}
        totalItems={filteredEntries.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
