'use client';

import * as React from 'react';
import {
  Receipt,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Building2,
  Calendar,
  DollarSign,
  ArrowRight,
  ShieldCheck,
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

interface SalesInvoiceViewItem {
  id: string;
  invoice_number: string;
  customer_name: string;
  posting_date: string;
  due_date: string;
  net_total: number;
  tax_total: number;
  grand_total: number;
  paid_amount: number;
  outstanding_amount: number;
  status: 'Draft' | 'Submitted' | 'Paid' | 'Partially Paid' | 'Overdue' | 'Cancelled';
}

const INITIAL_INVOICES: SalesInvoiceViewItem[] = [
  {
    id: 'sinv-001',
    invoice_number: 'SINV-26-00189',
    customer_name: 'Bharat Retailers Ltd',
    posting_date: '2026-10-30',
    due_date: '2026-11-15',
    net_total: 100000.0,
    tax_total: 18000.0,
    grand_total: 118000.0,
    paid_amount: 118000.0,
    outstanding_amount: 0.0,
    status: 'Paid',
  },
  {
    id: 'sinv-002',
    invoice_number: 'SINV-26-00190',
    customer_name: 'Apex Industrial Systems Ltd',
    posting_date: '2026-10-29',
    due_date: '2026-11-14',
    net_total: 43500.0,
    tax_total: 7830.0,
    grand_total: 51330.0,
    paid_amount: 0.0,
    outstanding_amount: 51330.0,
    status: 'Submitted',
  },
  {
    id: 'sinv-003',
    invoice_number: 'SINV-26-00191',
    customer_name: 'Godrej Precision Tooling Division',
    posting_date: '2026-10-25',
    due_date: '2026-11-10',
    net_total: 82000.0,
    tax_total: 14760.0,
    grand_total: 96760.0,
    paid_amount: 40000.0,
    outstanding_amount: 56760.0,
    status: 'Partially Paid',
  },
  {
    id: 'sinv-004',
    invoice_number: 'SINV-26-00192',
    customer_name: 'Tata Advanced Systems',
    posting_date: '2026-10-10',
    due_date: '2026-10-25',
    net_total: 35000.0,
    tax_total: 6300.0,
    grand_total: 41300.0,
    paid_amount: 0.0,
    outstanding_amount: 41300.0,
    status: 'Overdue',
  },
  {
    id: 'sinv-005',
    invoice_number: 'SINV-26-00193',
    customer_name: 'Mahindra Heavy Auto Division',
    posting_date: '2026-10-30',
    due_date: '2026-11-20',
    net_total: 65000.0,
    tax_total: 11700.0,
    grand_total: 76700.0,
    paid_amount: 0.0,
    outstanding_amount: 76700.0,
    status: 'Draft',
  },
];

export default function SalesInvoicesPage() {
  const { addToast } = useToast();
  const [invoices, setInvoices] = React.useState<SalesInvoiceViewItem[]>(INITIAL_INVOICES);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('ALL');
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 8;

  // New Invoice Modal
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [customerName, setCustomerName] = React.useState('');
  const [dueDate, setDueDate] = React.useState('2026-11-20');
  const [netAmount, setNetAmount] = React.useState(50000);

  const taxAmount = netAmount * 0.18;
  const grandTotal = netAmount + taxAmount;

  const filteredInvoices = React.useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  const totalOutstanding = invoices.reduce((sum, i) => sum + i.outstanding_amount, 0);
  const totalBilled = invoices.reduce((sum, i) => sum + i.grand_total, 0);
  const overdueAmount = invoices
    .filter((i) => i.status === 'Overdue')
    .reduce((sum, i) => sum + i.outstanding_amount, 0);

  const handleSubmitInvoice = (id: string) => {
    setInvoices(
      invoices.map((inv) =>
        inv.id === id ? { ...inv, status: 'Submitted' } : inv
      )
    );
    addToast({
      title: 'Invoice Submitted to General Ledger',
      description: `Double-entry posting generated: Accounts Receivable debited, Sales Revenue & Output GST credited.`,
      type: 'success',
    });
  };

  const handleCreateInvoice = (shouldSubmit: boolean) => {
    if (!customerName.trim()) {
      addToast({ title: 'Customer Required', description: 'Please enter a customer name.', type: 'error' });
      return;
    }

    const newNumber = `SINV-26-001${invoices.length + 94}`;
    const newInvoice: SalesInvoiceViewItem = {
      id: `sinv-00${Date.now()}`,
      invoice_number: newNumber,
      customer_name: customerName,
      posting_date: new Date().toISOString().slice(0, 10),
      due_date: dueDate,
      net_total: netAmount,
      tax_total: taxAmount,
      grand_total: grandTotal,
      paid_amount: 0,
      outstanding_amount: grandTotal,
      status: shouldSubmit ? 'Submitted' : 'Draft',
    };

    setInvoices([newInvoice, ...invoices]);
    setIsModalOpen(false);
    setCustomerName('');

    addToast({
      title: shouldSubmit ? 'Sales Invoice Submitted & Posted' : 'Sales Invoice Saved as Draft',
      description: `${newNumber} for ${formatCurrency(grandTotal)} ${shouldSubmit ? 'posted to GL' : 'created'}.`,
      type: 'success',
    });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Sales Invoices (Billing)</h1>
          <p className="text-sm text-gray-500">
            GST compliant sales tax invoices, customer receivables, automated revenue recognition, and payment status tracking.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Sales Invoice
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-gray-500">Total Outstanding AR</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900">{formatCurrency(totalOutstanding)}</div>
            <p className="text-xs text-gray-500 mt-1">Total unpaid customer balance</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-gray-500">Overdue AR</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-red-600">{formatCurrency(overdueAmount)}</div>
            <p className="text-xs text-red-500 mt-1">Exceeded payment terms</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-gray-500">Total Billed Revenue</CardTitle>
            <Receipt className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900">{formatCurrency(totalBilled)}</div>
            <p className="text-xs text-gray-500 mt-1">Cumulative invoices this fiscal year</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-gray-500">Fully Paid</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-emerald-700">
              {invoices.filter((i) => i.status === 'Paid').length} Invoices
            </div>
            <p className="text-xs text-emerald-600 mt-1">Zero balance remaining</p>
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
                placeholder="Search by invoice number or customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="w-56">
              <select
                aria-label="Filter by invoice status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Submitted">Submitted (Unpaid)</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Paid">Fully Paid</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/75">
                <TableHead className="w-[150px]">Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="w-[100px]">Date</TableHead>
                <TableHead className="w-[100px]">Due Date</TableHead>
                <TableHead className="text-right w-[110px]">Net Total</TableHead>
                <TableHead className="text-right w-[110px]">GST (18%)</TableHead>
                <TableHead className="text-right w-[120px]">Grand Total</TableHead>
                <TableHead className="text-right w-[120px]">Outstanding</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="text-right w-[110px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-bold text-xs text-gray-900">{inv.invoice_number}</TableCell>
                  <TableCell className="font-medium text-xs text-gray-900">{inv.customer_name}</TableCell>
                  <TableCell className="font-mono text-xs text-gray-600">{inv.posting_date}</TableCell>
                  <TableCell className="font-mono text-xs text-gray-600">{inv.due_date}</TableCell>
                  <TableCell className="text-right font-mono text-xs text-gray-600">{formatCurrency(inv.net_total)}</TableCell>
                  <TableCell className="text-right font-mono text-xs text-gray-600">{formatCurrency(inv.tax_total)}</TableCell>
                  <TableCell className="text-right font-mono text-xs font-bold text-gray-900">{formatCurrency(inv.grand_total)}</TableCell>
                  <TableCell className="text-right font-mono text-xs font-bold text-red-600">
                    {inv.outstanding_amount > 0 ? formatCurrency(inv.outstanding_amount) : '₹0.00'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        inv.status === 'Paid'
                          ? 'outline'
                          : inv.status === 'Submitted'
                          ? 'default'
                          : inv.status === 'Partially Paid'
                          ? 'secondary'
                          : inv.status === 'Overdue'
                          ? 'destructive'
                          : 'secondary'
                      }
                      className={
                        inv.status === 'Paid'
                          ? 'border-emerald-500 text-emerald-700 bg-emerald-50'
                          : ''
                      }
                    >
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {inv.status === 'Draft' ? (
                      <Button
                        size="sm"
                        onClick={() => handleSubmitInvoice(inv.id)}
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
              <Receipt className="h-5 w-5 text-blue-600" />
              Create Tax Invoice (Sales)
            </ModalTitle>
          </ModalHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-gray-700">Customer Name</label>
              <Input
                placeholder="e.g. Apex Industrial Systems Ltd"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700">Due Date</label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700">Taxable Net Amount (₹)</label>
                <Input
                  type="number"
                  value={netAmount}
                  onChange={(e) => setNetAmount(Number(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 p-4 border text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Taxable Subtotal:</span>
                <span className="font-mono font-semibold">{formatCurrency(netAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">CGST (9%) + SGST (9%):</span>
                <span className="font-mono font-semibold">{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-sm font-bold text-gray-900">
                <span>Invoice Total:</span>
                <span className="font-mono text-blue-600">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>

          <ModalFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={() => handleCreateInvoice(false)}>
              Save Draft
            </Button>
            <Button onClick={() => handleCreateInvoice(true)}>
              Submit & Post to GL
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
