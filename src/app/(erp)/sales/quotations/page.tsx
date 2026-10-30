'use client';

import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Trash2,
  Calendar,
  Building,
  Percent,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { Pagination } from '@/components/ui/pagination';

interface QuotationLineItem {
  id: string;
  item_code: string;
  item_name: string;
  qty: number;
  rate: number;
  discount_percentage: number;
  tax_rate: number;
}

interface QuotationRow {
  id: string;
  quotation_number: string;
  customer_name: string;
  transaction_date: string;
  valid_upto: string;
  net_total: number;
  tax_total: number;
  grand_total: number;
  status: 'Draft' | 'Submitted' | 'Ordered' | 'Lost' | 'Cancelled';
  items_count: number;
}

const INITIAL_QUOTATIONS: QuotationRow[] = [
  {
    id: 'qtn-01',
    quotation_number: 'QTN-26-27-00001',
    customer_name: 'Mahindra Heavy Auto Ltd',
    transaction_date: '2026-05-10',
    valid_upto: '2026-06-10',
    net_total: 850000,
    tax_total: 153000,
    grand_total: 1003000,
    status: 'Submitted',
    items_count: 3,
  },
  {
    id: 'qtn-02',
    quotation_number: 'QTN-26-27-00002',
    customer_name: 'Larsen Engineering Works',
    transaction_date: '2026-05-12',
    valid_upto: '2026-06-12',
    net_total: 420000,
    tax_total: 75600,
    grand_total: 495600,
    status: 'Draft',
    items_count: 2,
  },
  {
    id: 'qtn-03',
    quotation_number: 'QTN-26-27-00003',
    customer_name: 'Bharat Tech Industries',
    transaction_date: '2026-05-08',
    valid_upto: '2026-06-08',
    net_total: 1200000,
    tax_total: 216000,
    grand_total: 1416000,
    status: 'Ordered',
    items_count: 4,
  },
  {
    id: 'qtn-04',
    quotation_number: 'QTN-26-27-00004',
    customer_name: 'Gujarat Agro Tools',
    transaction_date: '2026-05-14',
    valid_upto: '2026-06-14',
    net_total: 180000,
    tax_total: 32400,
    grand_total: 212400,
    status: 'Submitted',
    items_count: 1,
  },
];

export default function QuotationsPage() {
  const { addToast } = useToast();
  const [quotations, setQuotations] = useState<QuotationRow[]>(INITIAL_QUOTATIONS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Convert to Order Modal state
  const [convertingQtn, setConvertingQtn] = useState<QuotationRow | null>(null);
  const [deliveryDate, setDeliveryDate] = useState('2026-06-15');
  const [customerPoNo, setCustomerPoNo] = useState('');

  // Create Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [validUpto, setValidUpto] = useState('2026-06-30');
  const [lineItems, setLineItems] = useState<QuotationLineItem[]>([
    {
      id: 'item-1',
      item_code: 'VALVE-SS-50',
      item_name: 'Stainless Steel Industrial Valve 50mm',
      qty: 10,
      rate: 4500,
      discount_percentage: 5,
      tax_rate: 18,
    },
  ]);

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const calculateLineSubtotal = (item: QuotationLineItem) => {
    const gross = item.qty * item.rate;
    const discount = (gross * item.discount_percentage) / 100;
    const net = gross - discount;
    const tax = (net * item.tax_rate) / 100;
    return net + tax;
  };

  const modalNetTotal = lineItems.reduce((acc, item) => {
    const gross = item.qty * item.rate;
    const disc = (gross * item.discount_percentage) / 100;
    return acc + (gross - disc);
  }, 0);

  const modalTaxTotal = lineItems.reduce((acc, item) => {
    const gross = item.qty * item.rate;
    const disc = (gross * item.discount_percentage) / 100;
    const net = gross - disc;
    return acc + (net * item.tax_rate) / 100;
  }, 0);

  const modalGrandTotal = modalNetTotal + modalTaxTotal;

  const handleAddLine = () => {
    setLineItems([
      ...lineItems,
      {
        id: `item-${Date.now()}`,
        item_code: 'COMP-IND-01',
        item_name: 'Pneumatic Actuator Component',
        qty: 1,
        rate: 2500,
        discount_percentage: 0,
        tax_rate: 18,
      },
    ]);
  };

  const handleRemoveLine = (id: string) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((i) => i.id !== id));
  };

  const handleCreateQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) return;

    const newQtn: QuotationRow = {
      id: `qtn-${Date.now()}`,
      quotation_number: `QTN-26-27-${String(quotations.length + 1).padStart(5, '0')}`,
      customer_name: customerName,
      transaction_date: new Date().toISOString().slice(0, 10),
      valid_upto: validUpto,
      net_total: modalNetTotal,
      tax_total: modalTaxTotal,
      grand_total: modalGrandTotal,
      status: 'Draft',
      items_count: lineItems.length,
    };

    setQuotations([newQtn, ...quotations]);
    setIsCreateOpen(false);
    setCustomerName('');
    addToast({
      title: 'Quotation Generated',
      description: `${newQtn.quotation_number} created in Draft status. Total: ${formatINR(newQtn.grand_total)}.`,
      variant: 'success',
    });
  };

  const handleConvertConfirmed = () => {
    if (!convertingQtn) return;

    setQuotations((prev) =>
      prev.map((q) => (q.id === convertingQtn.id ? { ...q, status: 'Ordered' } : q))
    );

    addToast({
      title: 'Sales Order Generated',
      description: `Sales Order booked from ${convertingQtn.quotation_number}. Scheduled for delivery on ${deliveryDate}.`,
      variant: 'success',
    });
    setConvertingQtn(null);
  };

  const filtered = quotations.filter((q) => {
    const matchesSearch =
      q.quotation_number.toLowerCase().includes(search.toLowerCase()) ||
      q.customer_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getStatusBadge = (status: QuotationRow['status']) => {
    switch (status) {
      case 'Submitted':
        return <Badge variant="warning">Submitted</Badge>;
      case 'Ordered':
        return <Badge variant="success">Ordered</Badge>;
      case 'Draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'Lost':
      case 'Cancelled':
        return <Badge variant="danger">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-brand-600" />
            Commercial Quotations & Proposals
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Multi-line pricing proposals with GST breakdowns and 1-click Quote-to-Order conversion.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Quotation
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Quotations</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{quotations.length}</h3>
          <p className="text-xs text-slate-400 mt-1">Total commercial proposals</p>
        </Card>

        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Quoted Pipeline</p>
          <h3 className="text-2xl font-bold text-brand-600 mt-1">
            {formatINR(quotations.reduce((sum, q) => sum + q.grand_total, 0))}
          </h3>
          <p className="text-xs text-slate-400 mt-1">Gross proposed revenue</p>
        </Card>

        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Converted to Orders</p>
          <h3 className="text-2xl font-bold text-emerald-600 mt-1">
            {quotations.filter((q) => q.status === 'Ordered').length}
          </h3>
          <p className="text-xs text-slate-400 mt-1">Confirmed bookings</p>
        </Card>

        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Conversion Ratio</p>
          <h3 className="text-2xl font-bold text-indigo-600 mt-1">
            {Math.round(
              (quotations.filter((q) => q.status === 'Ordered').length / (quotations.length || 1)) * 100
            )}
            %
          </h3>
          <p className="text-xs text-slate-400 mt-1">Quote-to-Order success rate</p>
        </Card>
      </div>

      {/* Table & Filter Card */}
      <Card className="p-4 border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              placeholder="Search by quote number, customer name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            {['All', 'Draft', 'Submitted', 'Ordered', 'Lost'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Quotations Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Quote Number</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Transaction Date</th>
                <th className="py-3 px-4">Valid Upto</th>
                <th className="py-3 px-4 text-right">Taxable Net</th>
                <th className="py-3 px-4 text-right">GST Total</th>
                <th className="py-3 px-4 text-right">Grand Total (INR)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No quotations found matching filter.
                  </td>
                </tr>
              ) : (
                paginated.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900 dark:text-white">
                      {q.quotation_number}
                      <span className="block text-xxs font-sans text-slate-400 font-normal">
                        {q.items_count} line items
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {q.customer_name}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">{q.transaction_date}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">{q.valid_upto}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                      {formatINR(q.net_total)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-500">
                      {formatINR(q.tax_total)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatINR(q.grand_total)}
                    </td>
                    <td className="py-3.5 px-4 text-center">{getStatusBadge(q.status)}</td>
                    <td className="py-3.5 px-4 text-right">
                      {q.status !== 'Ordered' && q.status !== 'Cancelled' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConvertingQtn(q)}
                          className="text-xs h-8 border-brand-200 text-brand-600 hover:bg-brand-50"
                        >
                          Convert to SO
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      ) : (
                        <span className="text-xs text-emerald-600 font-medium">Order Booked</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filtered.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </Card>

      {/* Convert to Sales Order Modal */}
      <Modal
        isOpen={!!convertingQtn}
        onClose={() => setConvertingQtn(null)}
        title="Convert Quotation to Confirmed Sales Order"
      >
        {convertingQtn && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {convertingQtn.quotation_number} • {convertingQtn.customer_name}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Order Value: <span className="font-bold text-slate-900 dark:text-white">{formatINR(convertingQtn.grand_total)}</span> (incl. GST)
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Promised Delivery Date *
              </label>
              <Input
                type="date"
                required
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Customer PO Reference Number
              </label>
              <Input
                placeholder="e.g. PO/MHA/2026/054"
                value={customerPoNo}
                onChange={(e) => setCustomerPoNo(e.target.value)}
              />
            </div>

            <p className="text-xs text-slate-500">
              This will allocate a sequential Sales Order number (`SO-26-27-XXXXX`), verify customer credit limit, and transition the proposal to Ordered.
            </p>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setConvertingQtn(null)}>
                Cancel
              </Button>
              <Button onClick={handleConvertConfirmed}>Generate Confirmed Sales Order</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Quotation Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Generate Commercial Proposal / Quotation"
      >
        <form onSubmit={handleCreateQuotation} className="space-y-4 max-w-2xl">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Customer Name *
              </label>
              <Input
                required
                placeholder="e.g. Tata Heavy Motors Ltd"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Valid Upto *
              </label>
              <Input
                type="date"
                required
                value={validUpto}
                onChange={(e) => setValidUpto(e.target.value)}
              />
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Quotation Items
              </h4>
              <Button type="button" size="sm" variant="outline" onClick={handleAddLine} className="h-7 text-xs">
                <Plus className="w-3 h-3 mr-1" />
                Add Line Item
              </Button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {lineItems.map((item, index) => (
                <div
                  key={item.id}
                  className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Input
                      placeholder="Item name / description"
                      value={item.item_name}
                      onChange={(e) => {
                        const updated = [...lineItems];
                        updated[index].item_name = e.target.value;
                        setLineItems(updated);
                      }}
                      className="text-xs flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(item.id)}
                      className="text-slate-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <span className="text-xxs text-slate-400">Qty</span>
                      <Input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => {
                          const updated = [...lineItems];
                          updated[index].qty = parseFloat(e.target.value) || 1;
                          setLineItems(updated);
                        }}
                        className="text-xs h-8"
                      />
                    </div>
                    <div>
                      <span className="text-xxs text-slate-400">Rate (INR)</span>
                      <Input
                        type="number"
                        value={item.rate}
                        onChange={(e) => {
                          const updated = [...lineItems];
                          updated[index].rate = parseFloat(e.target.value) || 0;
                          setLineItems(updated);
                        }}
                        className="text-xs h-8"
                      />
                    </div>
                    <div>
                      <span className="text-xxs text-slate-400">Disc %</span>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={item.discount_percentage}
                        onChange={(e) => {
                          const updated = [...lineItems];
                          updated[index].discount_percentage = parseFloat(e.target.value) || 0;
                          setLineItems(updated);
                        }}
                        className="text-xs h-8"
                      />
                    </div>
                    <div>
                      <span className="text-xxs text-slate-400">GST Rate %</span>
                      <select
                        value={item.tax_rate}
                        onChange={(e) => {
                          const updated = [...lineItems];
                          updated[index].tax_rate = parseFloat(e.target.value);
                          setLineItems(updated);
                        }}
                        className="w-full px-2 text-xs h-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none"
                      >
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                      </select>
                    </div>
                  </div>

                  <div className="text-right font-mono font-semibold text-slate-700 dark:text-slate-300">
                    Line Total: {formatINR(calculateLineSubtotal(item))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-lg space-y-1.5 text-xs font-medium">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Taxable Net Total:</span>
              <span className="font-mono">{formatINR(modalNetTotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Total GST (CGST + SGST / IGST):</span>
              <span className="font-mono">{formatINR(modalTaxTotal)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
              <span>Grand Total:</span>
              <span className="font-mono text-brand-600">{formatINR(modalGrandTotal)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Draft Quotation</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
