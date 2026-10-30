'use client';

import * as React from 'react';
import {
  FileCheck,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  Calendar,
  CreditCard,
  Scale,
  Send,
  ShieldAlert,
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

interface PurchaseInvoiceViewItem {
  id: string;
  invoice_number: string;
  bill_number: string;
  supplier_name: string;
  posting_date: string;
  due_date: string;
  net_total: number;
  tax_total: number;
  tds_amount: number;
  grand_total: number;
  net_payable: number;
  paid_amount: number;
  outstanding_amount: number;
  status: 'Draft' | 'Submitted' | 'Paid' | 'Partially Paid' | 'Cancelled';
  is_msme?: boolean;
}

const INITIAL_PURCHASE_INVOICES: PurchaseInvoiceViewItem[] = [
  {
    id: 'pinv-001',
    invoice_number: 'PINV-26-00084',
    bill_number: 'NS-2026-118',
    supplier_name: 'National Steel & Alloy Suppliers',
    posting_date: '2026-10-28',
    due_date: '2026-11-28',
    net_total: 75000.0,
    tax_total: 13500.0,
    tds_amount: 750.0,
    grand_total: 88500.0,
    net_payable: 87750.0,
    paid_amount: 0.0,
    outstanding_amount: 87750.0,
    status: 'Submitted',
    is_msme: true,
  },
  {
    id: 'pinv-002',
    invoice_number: 'PINV-26-00085',
    bill_number: 'GTI-9081',
    supplier_name: 'Gujarat Tech Instruments Pvt Ltd',
    posting_date: '2026-10-25',
    due_date: '2026-11-10',
    net_total: 40000.0,
    tax_total: 7200.0,
    tds_amount: 400.0,
    grand_total: 47200.0,
    net_payable: 46800.0,
    paid_amount: 46800.0,
    outstanding_amount: 0.0,
    status: 'Paid',
    is_msme: false,
  },
  {
    id: 'pinv-003',
    invoice_number: 'PINV-26-00086',
    bill_number: 'ELEC-4421',
    supplier_name: 'Bharat Fasteners & Industrial Hardware',
    posting_date: '2026-10-30',
    due_date: '2026-11-20',
    net_total: 25000.0,
    tax_total: 4500.0,
    tds_amount: 0.0,
    grand_total: 29500.0,
    net_payable: 29500.0,
    paid_amount: 0.0,
    outstanding_amount: 29500.0,
    status: 'Draft',
    is_msme: true,
  },
];

export default function PurchaseInvoicesPage() {
  const { addToast } = useToast();
  const [bills, setBills] = React.useState<PurchaseInvoiceViewItem[]>(INITIAL_PURCHASE_INVOICES);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('ALL');
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 8;

  // New Vendor Bill Modal
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [supplierName, setSupplierName] = React.useState('');
  const [vendorBillNumber, setVendorBillNumber] = React.useState('');
  const [dueDate, setDueDate] = React.useState('2026-11-30');
  const [netAmount, setNetAmount] = React.useState(30000);
  const [applyTds, setApplyTds] = React.useState(true);

  const taxAmount = netAmount * 0.18;
  const grandTotal = netAmount + taxAmount;
  const tdsAmount = applyTds ? netAmount * 0.01 : 0; // 1% Section 194Q
  const netPayable = grandTotal - tdsAmount;

  const filteredBills = React.useMemo(() => {
    return bills.filter((b) => {
      const matchesSearch =
        b.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.bill_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.supplier_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [bills, searchTerm, statusFilter]);

  const totalOutstanding = bills.reduce((sum, b) => sum + b.outstanding_amount, 0);
  const totalTds = bills.reduce((sum, b) => sum + b.tds_amount, 0);
  const totalItc = bills.reduce((sum, b) => sum + b.tax_total, 0);

  const handleSubmitBill = (id: string) => {
    setBills(
      bills.map((b) => (b.id === id ? { ...b, status: 'Submitted' } : b))
    );
    addToast({
      title: 'Vendor Bill Submitted & Posted to GL',
      description: 'Debit: Purchase Expense + Input GST ITC | Credit: Creditors + TDS Payable.',
      type: 'success',
    });
  };

  const handleCreateBill = (shouldSubmit: boolean) => {
    if (!supplierName.trim()) {
      addToast({ title: 'Supplier Required', description: 'Please enter a vendor name.', type: 'error' });
      return;
    }

    const newNumber = `PINV-26-000${bills.length + 87}`;
    const newBill: PurchaseInvoiceViewItem = {
      id: `pinv-00${Date.now()}`,
      invoice_number: newNumber,
      bill_number: vendorBillNumber || `BILL-${Date.now().toString().slice(-4)}`,
      supplier_name: supplierName,
      posting_date: new Date().toISOString().slice(0, 10),
      due_date: dueDate,
      net_total: netAmount,
      tax_total: taxAmount,
      tds_amount: tdsAmount,
      grand_total: grandTotal,
      net_payable: netPayable,
      paid_amount: 0,
      outstanding_amount: netPayable,
      status: shouldSubmit ? 'Submitted' : 'Draft',
      is_msme: true,
    };

    setBills([newBill, ...bills]);
    setIsModalOpen(false);
    setSupplierName('');
    setVendorBillNumber('');

    addToast({
      title: shouldSubmit ? 'Purchase Bill Posted to GL' : 'Purchase Bill Saved as Draft',
      description: `${newNumber} for ${formatCurrency(netPayable)} net payable successfully ${shouldSubmit ? 'posted' : 'saved'}.`,
      type: 'success',
    });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Purchase Invoices (Vendor Bills)</h1>
          <p className="text-sm text-gray-500">
            Procure-to-pay vendor billing, Input Tax Credit (ITC) reconciliation, TDS deductions, and MSME Sec 43B(h) compliance.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Enter Vendor Bill
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-gray-500">Accounts Payable (AP)</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900">{formatCurrency(totalOutstanding)}</div>
            <p className="text-xs text-gray-500 mt-1">Net pending vendor payables</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-gray-500">Input GST ITC Available</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-emerald-700">{formatCurrency(totalItc)}</div>
            <p className="text-xs text-emerald-600 mt-1">Claimable in GSTR-3B</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-gray-500">TDS Deducted</CardTitle>
            <Scale className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900">{formatCurrency(totalTds)}</div>
            <p className="text-xs text-gray-500 mt-1">Sec 194Q / 194C Government Liability</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-gray-500">MSME Active Bills</CardTitle>
            <ShieldAlert className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-purple-700">
              {bills.filter((b) => b.is_msme && b.outstanding_amount > 0).length} Bills
            </div>
            <p className="text-xs text-purple-600 mt-1">Strict 45-day clearance window</p>
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
                placeholder="Search by invoice #, vendor bill #, or supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="w-56">
              <select
                aria-label="Filter by purchase invoice status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Submitted">Submitted (Unpaid)</option>
                <option value="Paid">Fully Paid</option>
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
                <TableHead className="w-[140px]">System PINV #</TableHead>
                <TableHead className="w-[130px]">Vendor Bill #</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="w-[95px]">Date</TableHead>
                <TableHead className="w-[95px]">Due Date</TableHead>
                <TableHead className="text-right w-[105px]">Net Total</TableHead>
                <TableHead className="text-right w-[95px]">ITC (18%)</TableHead>
                <TableHead className="text-right w-[90px]">TDS</TableHead>
                <TableHead className="text-right w-[110px]">Net Payable</TableHead>
                <TableHead className="w-[110px]">Status</TableHead>
                <TableHead className="text-right w-[100px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBills.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-bold text-xs text-gray-900">{b.invoice_number}</TableCell>
                  <TableCell className="font-mono text-xs text-gray-700">{b.bill_number}</TableCell>
                  <TableCell>
                    <div className="font-medium text-xs text-gray-900 flex items-center gap-1.5">
                      {b.supplier_name}
                      {b.is_msme && (
                        <span className="px-1 py-0.2 rounded text-[9px] bg-purple-100 text-purple-700 font-bold">
                          MSME
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-gray-600">{b.posting_date}</TableCell>
                  <TableCell className="font-mono text-xs text-gray-600">{b.due_date}</TableCell>
                  <TableCell className="text-right font-mono text-xs text-gray-600">{formatCurrency(b.net_total)}</TableCell>
                  <TableCell className="text-right font-mono text-xs text-emerald-600">+{formatCurrency(b.tax_total)}</TableCell>
                  <TableCell className="text-right font-mono text-xs text-amber-600">
                    {b.tds_amount > 0 ? `-${formatCurrency(b.tds_amount)}` : '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-bold text-gray-900">{formatCurrency(b.net_payable)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        b.status === 'Paid'
                          ? 'outline'
                          : b.status === 'Submitted'
                          ? 'default'
                          : 'secondary'
                      }
                      className={
                        b.status === 'Paid'
                          ? 'border-emerald-500 text-emerald-700 bg-emerald-50'
                          : ''
                      }
                    >
                      {b.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {b.status === 'Draft' ? (
                      <Button
                        size="sm"
                        onClick={() => handleSubmitBill(b.id)}
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
              <FileCheck className="h-5 w-5 text-blue-600" />
              Enter Purchase Bill (Vendor Invoice)
            </ModalTitle>
          </ModalHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700">Vendor / Supplier Name</label>
                <Input
                  placeholder="e.g. National Steel Suppliers"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700">Vendor Invoice / Bill #</label>
                <Input
                  placeholder="e.g. NS-2026-99"
                  value={vendorBillNumber}
                  onChange={(e) => setVendorBillNumber(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700">Payment Due Date</label>
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

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="applyTds"
                checked={applyTds}
                onChange={(e) => setApplyTds(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="applyTds" className="text-xs text-gray-700">
                Deduct TDS @ 1% under Section 194Q (Purchase of Goods &gt; ₹50 Lakhs)
              </label>
            </div>

            <div className="rounded-lg bg-gray-50 p-4 border text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Taxable Purchase Value:</span>
                <span className="font-mono font-semibold">{formatCurrency(netAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Input GST ITC (CGST 9% + SGST 9%):</span>
                <span className="font-mono font-semibold text-emerald-600">+{formatCurrency(taxAmount)}</span>
              </div>
              {applyTds && (
                <div className="flex justify-between">
                  <span className="text-gray-500">TDS Deduction (1%):</span>
                  <span className="font-mono font-semibold text-amber-600">-{formatCurrency(tdsAmount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 text-sm font-bold text-gray-900">
                <span>Net Payable to Vendor:</span>
                <span className="font-mono text-blue-600">{formatCurrency(netPayable)}</span>
              </div>
            </div>
          </div>

          <ModalFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={() => handleCreateBill(false)}>
              Save Draft
            </Button>
            <Button onClick={() => handleCreateBill(true)}>
              Submit & Post to GL
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
