'use client';

import * as React from 'react';
import {
  FileText,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  Scale,
  Trash2,
  Calendar,
  Building2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { Modal, ModalContent, ModalHeader, ModalFooter, ModalTitle } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { formatCurrency } from '@/lib/utils/formatters';

interface JournalEntryItemView {
  account_id: string;
  account_name: string;
  debit: number;
  credit: number;
  user_remark?: string;
}

interface JournalEntryView {
  id: string;
  entry_number: string;
  posting_date: string;
  entry_type: string;
  total_debit: number;
  total_credit: number;
  difference: number;
  status: 'Draft' | 'Submitted' | 'Cancelled';
  user_remark?: string;
  items_count: number;
}

const INITIAL_JOURNAL_ENTRIES: JournalEntryView[] = [
  {
    id: 'je-001',
    entry_number: 'JV-26-00012',
    posting_date: '2026-10-30',
    entry_type: 'Bank Entry',
    total_debit: 50000.0,
    total_credit: 50000.0,
    difference: 0.0,
    status: 'Submitted',
    user_remark: 'Cheque deposit from HDFC Current to SBI Branch',
    items_count: 2,
  },
  {
    id: 'je-002',
    entry_number: 'JV-26-00013',
    posting_date: '2026-10-30',
    entry_type: 'Journal Entry',
    total_debit: 12500.0,
    total_credit: 12500.0,
    difference: 0.0,
    status: 'Draft',
    user_remark: 'Monthly office internet & telephone expense accrual',
    items_count: 2,
  },
  {
    id: 'je-003',
    entry_number: 'JV-26-00011',
    posting_date: '2026-10-25',
    entry_type: 'Contra Entry',
    total_debit: 20000.0,
    total_credit: 20000.0,
    difference: 0.0,
    status: 'Submitted',
    user_remark: 'Cash withdrawal for petty cash float',
    items_count: 2,
  },
  {
    id: 'je-004',
    entry_number: 'JV-26-00010',
    posting_date: '2026-10-20',
    entry_type: 'Credit Card Entry',
    total_debit: 8400.0,
    total_credit: 8400.0,
    difference: 0.0,
    status: 'Cancelled',
    user_remark: 'Cancelled due to double swipe',
    items_count: 2,
  },
];

const AVAILABLE_ACCOUNTS = [
  { id: '10000000-0000-4000-a000-000000000001', code: '1100', name: 'Debtors (Accounts Receivable)' },
  { id: '10000000-0000-4000-a000-000000000005', code: '1310', name: 'HDFC Bank - Current A/c' },
  { id: '10000000-0000-4000-a000-000000000006', code: '1320', name: 'Main Petty Cash' },
  { id: '20000000-0000-4000-a000-000000000005', code: '2200', name: 'Creditors (Accounts Payable)' },
  { id: '30000000-0000-4000-a000-000000000001', code: '3100', name: 'Share Capital' },
  { id: '40000000-0000-4000-a000-000000000001', code: '4100', name: 'Sales Income' },
  { id: '50000000-0000-4000-a000-000000000001', code: '5100', name: 'Office Rent & Maintenance' },
  { id: '50000000-0000-4000-a000-000000000002', code: '5200', name: 'Telephone & Internet Expense' },
];

export default function JournalEntriesPage() {
  const { addToast } = useToast();
  const [entries, setEntries] = React.useState<JournalEntryView[]>(INITIAL_JOURNAL_ENTRIES);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('ALL');
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 8;

  // Create Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [entryType, setEntryType] = React.useState('Journal Entry');
  const [postingDate, setPostingDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [userRemark, setUserRemark] = React.useState('');
  const [lines, setLines] = React.useState<JournalEntryItemView[]>([
    { account_id: AVAILABLE_ACCOUNTS[6].id, account_name: AVAILABLE_ACCOUNTS[6].name, debit: 0, credit: 0 },
    { account_id: AVAILABLE_ACCOUNTS[1].id, account_name: AVAILABLE_ACCOUNTS[1].name, debit: 0, credit: 0 },
  ]);

  const totalDebit = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const diff = Math.abs(totalDebit - totalCredit);
  const isBalanced = diff < 0.001 && totalDebit > 0;

  const filteredEntries = React.useMemo(() => {
    return entries.filter((e) => {
      const matchesSearch =
        e.entry_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.user_remark && e.user_remark.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'ALL' || e.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [entries, searchTerm, statusFilter]);

  const handleAddLine = () => {
    setLines([
      ...lines,
      { account_id: AVAILABLE_ACCOUNTS[0].id, account_name: AVAILABLE_ACCOUNTS[0].name, debit: 0, credit: 0 },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 2) {
      addToast({ title: 'Minimum 2 Lines Required', description: 'Double entry vouchers must have at least 2 accounts.', type: 'error' });
      return;
    }
    setLines(lines.filter((_, idx) => idx !== index));
  };

  const handleLineChange = (index: number, field: keyof JournalEntryItemView, value: any) => {
    const updated = [...lines];
    if (field === 'account_id') {
      const acc = AVAILABLE_ACCOUNTS.find((a) => a.id === value);
      updated[index] = { ...updated[index], account_id: value, account_name: acc?.name || '' };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setLines(updated);
  };

  const handleCreateVoucher = (shouldSubmit: boolean) => {
    if (!isBalanced && shouldSubmit) {
      addToast({
        title: 'Unbalanced Journal Voucher',
        description: `Debit (₹${totalDebit.toFixed(2)}) must equal Credit (₹${totalCredit.toFixed(2)}). Discrepancy: ₹${diff.toFixed(2)}.`,
        type: 'error',
      });
      return;
    }

    const newNumber = `JV-26-000${entries.length + 14}`;
    const newEntry: JournalEntryView = {
      id: `je-00${Date.now()}`,
      entry_number: newNumber,
      posting_date: postingDate,
      entry_type: entryType,
      total_debit: totalDebit,
      total_credit: totalCredit,
      difference: diff,
      status: shouldSubmit ? 'Submitted' : 'Draft',
      user_remark: userRemark || 'General Journal adjustment',
      items_count: lines.length,
    };

    setEntries([newEntry, ...entries]);
    setIsModalOpen(false);

    addToast({
      title: shouldSubmit ? 'Journal Voucher Posted to GL' : 'Journal Voucher Saved as Draft',
      description: `${newNumber} (${entryType}) for ${formatCurrency(totalDebit)} successfully ${shouldSubmit ? 'posted to General Ledger' : 'saved'}.`,
      type: 'success',
    });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Journal Entries (Vouchers)</h1>
          <p className="text-sm text-gray-500">
            Multi-account adjustment vouchers, bank transfers, accruals, and manual double-entry postings.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Journal Voucher
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-gray-500">Total Vouchers</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900">{entries.length}</div>
            <p className="text-xs text-gray-500 mt-1">In FY 2026-27</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-gray-500">Posted (GL Active)</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-emerald-700">
              {entries.filter((e) => e.status === 'Submitted').length} Vouchers
            </div>
            <p className="text-xs text-emerald-600 mt-1">Immutable ledger entries</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-gray-500">Draft Vouchers</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-amber-700">
              {entries.filter((e) => e.status === 'Draft').length} Vouchers
            </div>
            <p className="text-xs text-amber-600 mt-1">Awaiting verification</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-gray-500">Total Turnover</CardTitle>
            <Scale className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900">
              {formatCurrency(entries.reduce((sum, e) => sum + e.total_debit, 0))}
            </div>
            <p className="text-xs text-gray-500 mt-1">Balanced double entry</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by entry number or remark..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="w-48">
              <select
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Submitted">Submitted (Posted)</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/75">
                <TableHead className="w-[120px]">Date</TableHead>
                <TableHead className="w-[160px]">Voucher #</TableHead>
                <TableHead className="w-[160px]">Entry Type</TableHead>
                <TableHead>Remarks / Narration</TableHead>
                <TableHead className="text-right w-[140px]">Total Amount</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="text-right w-[100px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-xs text-gray-600">{row.posting_date}</TableCell>
                  <TableCell className="font-bold text-xs text-gray-900">{row.entry_number}</TableCell>
                  <TableCell>
                    <span className="inline-block px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                      {row.entry_type}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-gray-600 max-w-xs truncate" title={row.user_remark}>
                    {row.user_remark || '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-bold text-gray-900">
                    {formatCurrency(row.total_debit)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        row.status === 'Submitted'
                          ? 'outline'
                          : row.status === 'Draft'
                          ? 'secondary'
                          : 'destructive'
                      }
                      className={
                        row.status === 'Submitted'
                          ? 'border-emerald-500 text-emerald-700 bg-emerald-50'
                          : ''
                      }
                    >
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Journal Voucher Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalContent className="max-w-4xl">
          <ModalHeader>
            <ModalTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-blue-600" />
              Create Double-Entry Journal Voucher
            </ModalTitle>
          </ModalHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700">Entry Type</label>
                <select
                  value={entryType}
                  onChange={(e) => setEntryType(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm"
                >
                  <option value="Journal Entry">Journal Entry</option>
                  <option value="Bank Entry">Bank Entry</option>
                  <option value="Cash Entry">Cash Entry</option>
                  <option value="Contra Entry">Contra Entry</option>
                  <option value="Credit Card Entry">Credit Card Entry</option>
                  <option value="Write Off Entry">Write Off Entry</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700">Posting Date</label>
                <Input
                  type="date"
                  value={postingDate}
                  onChange={(e) => setPostingDate(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700">Narration / Remark</label>
                <Input
                  placeholder="Reason for journal adjustment..."
                  value={userRemark}
                  onChange={(e) => setUserRemark(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Dynamic Line Items */}
            <div className="rounded-md border p-3 bg-gray-50/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase text-gray-600">Accounting Ledger Lines</span>
                <Button variant="outline" size="sm" onClick={handleAddLine} className="h-7 text-xs gap-1">
                  <Plus className="h-3 w-3" /> Add Account Line
                </Button>
              </div>

              <div className="space-y-2">
                {lines.map((line, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded border">
                    <div className="flex-1">
                      <select
                        value={line.account_id}
                        onChange={(e) => handleLineChange(idx, 'account_id', e.target.value)}
                        className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs"
                      >
                        {AVAILABLE_ACCOUNTS.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.code} - {a.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-32">
                      <Input
                        type="number"
                        placeholder="Debit (₹)"
                        value={line.debit || ''}
                        onChange={(e) => {
                          handleLineChange(idx, 'debit', Number(e.target.value) || 0);
                          if (Number(e.target.value) > 0) handleLineChange(idx, 'credit', 0);
                        }}
                        className="text-right text-xs"
                      />
                    </div>

                    <div className="w-32">
                      <Input
                        type="number"
                        placeholder="Credit (₹)"
                        value={line.credit || ''}
                        onChange={(e) => {
                          handleLineChange(idx, 'credit', Number(e.target.value) || 0);
                          if (Number(e.target.value) > 0) handleLineChange(idx, 'debit', 0);
                        }}
                        className="text-right text-xs"
                      />
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveLine(idx)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Total & Balancing Alert */}
              <div className="mt-3 flex items-center justify-between border-t pt-2 text-xs">
                <div className="flex items-center gap-2">
                  {isBalanced ? (
                    <Badge variant="outline" className="border-emerald-500 text-emerald-700 bg-emerald-50">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Balanced: Debits = Credits
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Unbalanced: Diff ₹{diff.toFixed(2)}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-4 font-mono font-bold">
                  <span>Total Debit: ₹{totalDebit.toFixed(2)}</span>
                  <span>Total Credit: ₹{totalCredit.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <ModalFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={() => handleCreateVoucher(false)}>
              Save as Draft
            </Button>
            <Button onClick={() => handleCreateVoucher(true)} disabled={!isBalanced}>
              Submit & Post to GL
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
