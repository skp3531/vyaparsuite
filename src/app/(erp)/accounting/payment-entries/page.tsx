'use client';

import * as React from 'react';
import {
  CreditCard,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Building2,
  Calendar,
  DollarSign,
  Send,
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

interface PaymentEntryViewItem {
  id: string;
  payment_number: string;
  payment_type: 'Receive' | 'Pay' | 'Internal Transfer';
  party_name?: string;
  party_type?: string;
  posting_date: string;
  mode_of_payment: string;
  paid_amount: number;
  unallocated_amount: number;
  status: 'Draft' | 'Submitted' | 'Cancelled';
  reference_no?: string;
}

const INITIAL_PAYMENTS: PaymentEntryViewItem[] = [
  {
    id: 'pe-001',
    payment_number: 'REC-26-00042',
    payment_type: 'Receive',
    party_name: 'Bharat Retailers Ltd',
    party_type: 'Customer',
    posting_date: '2026-10-30',
    mode_of_payment: 'NEFT/RTGS',
    paid_amount: 118000.0,
    unallocated_amount: 0.0,
    status: 'Submitted',
    reference_no: 'UTR-HDFC-99120',
  },
  {
    id: 'pe-002',
    payment_number: 'PAY-26-00021',
    payment_type: 'Pay',
    party_name: 'National Steel & Alloy Suppliers',
    party_type: 'Supplier',
    posting_date: '2026-10-29',
    mode_of_payment: 'Bank Transfer',
    paid_amount: 87750.0,
    unallocated_amount: 0.0,
    status: 'Submitted',
    reference_no: 'CMS-TXN-44812',
  },
  {
    id: 'pe-003',
    payment_number: 'TRF-26-00008',
    payment_type: 'Internal Transfer',
    posting_date: '2026-10-28',
    mode_of_payment: 'Cheque',
    paid_amount: 25000.0,
    unallocated_amount: 0.0,
    status: 'Submitted',
    reference_no: 'CHQ-881290',
  },
  {
    id: 'pe-004',
    payment_number: 'REC-26-00043',
    payment_type: 'Receive',
    party_name: 'Apex Industrial Systems Ltd',
    party_type: 'Customer',
    posting_date: '2026-10-30',
    mode_of_payment: 'UPI',
    paid_amount: 51330.0,
    unallocated_amount: 0.0,
    status: 'Draft',
    reference_no: 'UPI-2610-88912',
  },
];

export default function PaymentEntriesPage() {
  const { addToast } = useToast();
  const [payments, setPayments] = React.useState<PaymentEntryViewItem[]>(INITIAL_PAYMENTS);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState('ALL');
  const [statusFilter, setStatusFilter] = React.useState('ALL');
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 8;

  // New Payment Modal
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [paymentType, setPaymentType] = React.useState<'Receive' | 'Pay' | 'Internal Transfer'>('Receive');
  const [partyName, setPartyName] = React.useState('');
  const [amount, setAmount] = React.useState(25000);
  const [mode, setMode] = React.useState('NEFT/RTGS');
  const [refNo, setRefNo] = React.useState('');

  const filteredPayments = React.useMemo(() => {
    return payments.filter((p) => {
      const matchesSearch =
        p.payment_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.party_name && p.party_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.reference_no && p.reference_no.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = typeFilter === 'ALL' || p.payment_type === typeFilter;
      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [payments, searchTerm, typeFilter, statusFilter]);

  const totalReceived = payments
    .filter((p) => p.payment_type === 'Receive' && p.status === 'Submitted')
    .reduce((sum, p) => sum + p.paid_amount, 0);

  const totalPaid = payments
    .filter((p) => p.payment_type === 'Pay' && p.status === 'Submitted')
    .reduce((sum, p) => sum + p.paid_amount, 0);

  const handleSubmitPayment = (id: string) => {
    setPayments(
      payments.map((p) => (p.id === id ? { ...p, status: 'Submitted' } : p))
    );
    addToast({
      title: 'Payment Entry Submitted & Posted to GL',
      description: 'Double-entry posted and allocated invoices updated in real time.',
      type: 'success',
    });
  };

  const handleCreatePayment = (shouldSubmit: boolean) => {
    const prefix = paymentType === 'Receive' ? 'REC' : paymentType === 'Pay' ? 'PAY' : 'TRF';
    const newNumber = `${prefix}-26-000${payments.length + 44}`;

    const newPayment: PaymentEntryViewItem = {
      id: `pe-00${Date.now()}`,
      payment_number: newNumber,
      payment_type: paymentType,
      party_name: paymentType === 'Internal Transfer' ? 'Internal Account' : partyName || 'Party',
      party_type: paymentType === 'Receive' ? 'Customer' : paymentType === 'Pay' ? 'Supplier' : undefined,
      posting_date: new Date().toISOString().slice(0, 10),
      mode_of_payment: mode,
      paid_amount: amount,
      unallocated_amount: 0,
      status: shouldSubmit ? 'Submitted' : 'Draft',
      reference_no: refNo || undefined,
    };

    setPayments([newPayment, ...payments]);
    setIsModalOpen(false);
    setPartyName('');
    setRefNo('');

    addToast({
      title: shouldSubmit ? 'Payment Posted to GL' : 'Payment Saved as Draft',
      description: `${newNumber} for ${formatCurrency(amount)} successfully ${shouldSubmit ? 'posted' : 'saved'}.`,
      type: 'success',
    });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Payment Entries</h1>
          <p className="text-sm text-gray-500">
            Inward customer receipts, supplier disbursements, and bank-to-bank contra transfers with automated GL reconciliations.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Payment Entry
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-gray-500">Inward Receipts</CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-emerald-700">{formatCurrency(totalReceived)}</div>
            <p className="text-xs text-emerald-600 mt-1">Cleared customer receivables</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-gray-500">Outward Disbursements</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900">{formatCurrency(totalPaid)}</div>
            <p className="text-xs text-gray-500 mt-1">Supplier payments & vendor clearing</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-gray-500">Net Cash Flow</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900">{formatCurrency(totalReceived - totalPaid)}</div>
            <p className="text-xs text-gray-500 mt-1">Receipts minus Disbursements</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-gray-500">Total Entries</CardTitle>
            <CreditCard className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900">{payments.length} Payments</div>
            <p className="text-xs text-gray-500 mt-1">Processed this period</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by payment #, party name, or UTR/Ref #..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <div>
              <select
                aria-label="Filter by transaction type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
              >
                <option value="ALL">All Transaction Types</option>
                <option value="Receive">Inward Receipt</option>
                <option value="Pay">Outward Payment</option>
                <option value="Internal Transfer">Internal Transfer</option>
              </select>
            </div>

            <div>
              <select
                aria-label="Filter by payment status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Submitted">Submitted (Posted)</option>
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
                <TableHead className="w-[150px]">Payment #</TableHead>
                <TableHead className="w-[140px]">Type</TableHead>
                <TableHead>Party / Account</TableHead>
                <TableHead className="w-[110px]">Date</TableHead>
                <TableHead className="w-[130px]">Mode</TableHead>
                <TableHead className="w-[140px]">Ref / UTR #</TableHead>
                <TableHead className="text-right w-[130px]">Amount (₹)</TableHead>
                <TableHead className="w-[110px]">Status</TableHead>
                <TableHead className="text-right w-[100px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-bold text-xs text-gray-900">{p.payment_number}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        p.payment_type === 'Receive'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.payment_type === 'Pay'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {p.payment_type}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-xs text-gray-900">{p.party_name}</div>
                    {p.party_type && <div className="text-[10px] text-gray-500">{p.party_type}</div>}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-gray-600">{p.posting_date}</TableCell>
                  <TableCell className="text-xs text-gray-700">{p.mode_of_payment}</TableCell>
                  <TableCell className="font-mono text-xs text-gray-600">{p.reference_no || '—'}</TableCell>
                  <TableCell className="text-right font-mono text-xs font-bold text-gray-900">
                    {formatCurrency(p.paid_amount)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={p.status === 'Submitted' ? 'outline' : 'secondary'}
                      className={p.status === 'Submitted' ? 'border-emerald-500 text-emerald-700 bg-emerald-50' : ''}
                    >
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {p.status === 'Draft' ? (
                      <Button
                        size="sm"
                        onClick={() => handleSubmitPayment(p.id)}
                        className="h-7 text-xs gap-1"
                      >
                        <Send className="h-3 w-3" /> Submit
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        View
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalContent className="max-w-xl">
          <ModalHeader>
            <ModalTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              Create Payment Entry
            </ModalTitle>
          </ModalHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700">Payment Type</label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as any)}
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm"
                >
                  <option value="Receive">Inward Receipt (Customer)</option>
                  <option value="Pay">Outward Payment (Supplier / Expense)</option>
                  <option value="Internal Transfer">Internal Transfer (Bank to Bank/Cash)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700">
                  {paymentType === 'Receive' ? 'Customer' : paymentType === 'Pay' ? 'Supplier' : 'Description'}
                </label>
                <Input
                  placeholder={paymentType === 'Receive' ? 'e.g. Bharat Retailers Ltd' : 'e.g. National Steel'}
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700">Amount (₹)</label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700">Mode of Payment</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm"
                >
                  <option value="NEFT/RTGS">NEFT / RTGS</option>
                  <option value="Bank Transfer">Bank Transfer (IMPS)</option>
                  <option value="UPI">UPI</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700">Reference / UTR / Cheque #</label>
              <Input
                placeholder="e.g. UTR-HDFC-99120"
                value={refNo}
                onChange={(e) => setRefNo(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <ModalFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={() => handleCreatePayment(false)}>
              Save Draft
            </Button>
            <Button onClick={() => handleCreatePayment(true)}>
              Submit & Post to GL
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
