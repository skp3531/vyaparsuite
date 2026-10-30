'use client';

import React, { useState } from 'react';
import {
  PackageCheck,
  Plus,
  Search,
  CheckCircle,
  Truck,
  Receipt,
  Clock,
  Calendar,
  Building,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { Pagination } from '@/components/ui/pagination';

interface PurchaseOrderRow {
  id: string;
  purchase_order_number: string;
  supplier_name: string;
  is_msme: boolean;
  transaction_date: string;
  schedule_date: string;
  grand_total: number;
  received_percent: number;
  billed_percent: number;
  status:
    | 'Draft'
    | 'Pending Approval'
    | 'Approved'
    | 'To Receive and Bill'
    | 'To Receive'
    | 'To Bill'
    | 'Completed'
    | 'Cancelled';
}

const INITIAL_POS: PurchaseOrderRow[] = [
  {
    id: 'po-01',
    purchase_order_number: 'PO-26-27-00001',
    supplier_name: 'Gujarat Alloys & Steel Ltd',
    is_msme: true,
    transaction_date: '2026-05-10',
    schedule_date: '2026-06-15',
    grand_total: 2360000,
    received_percent: 50,
    billed_percent: 50,
    status: 'To Receive and Bill',
  },
  {
    id: 'po-02',
    purchase_order_number: 'PO-26-27-00002',
    supplier_name: 'Precision Castings Mumbai',
    is_msme: false,
    transaction_date: '2026-05-12',
    schedule_date: '2026-06-20',
    grand_total: 850000,
    received_percent: 100,
    billed_percent: 0,
    status: 'To Bill',
  },
  {
    id: 'po-03',
    purchase_order_number: 'PO-26-27-00003',
    supplier_name: 'Super Polymer Packaging',
    is_msme: true,
    transaction_date: '2026-05-14',
    schedule_date: '2026-06-05',
    grand_total: 145000,
    received_percent: 0,
    billed_percent: 0,
    status: 'Pending Approval',
  },
  {
    id: 'po-04',
    purchase_order_number: 'PO-26-27-00004',
    supplier_name: 'Hind Heavy Bearings Ltd',
    is_msme: false,
    transaction_date: '2026-05-01',
    schedule_date: '2026-05-20',
    grand_total: 1200000,
    received_percent: 100,
    billed_percent: 100,
    status: 'Completed',
  },
];

export default function PurchaseOrdersPage() {
  const { addToast } = useToast();
  const [orders, setOrders] = useState<PurchaseOrderRow[]>(INITIAL_POS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // New PO Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPO, setNewPO] = useState({
    supplier_name: '',
    schedule_date: '2026-06-25',
    grand_total: '',
    is_msme: false,
  });

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleApprove = (poId: string) => {
    setOrders((prev) =>
      prev.map((po) => {
        if (po.id !== poId) return po;
        addToast({
          title: 'Purchase Order Approved',
          description: `${po.purchase_order_number} approved and released to ${po.supplier_name}.`,
          variant: 'success',
        });
        return {
          ...po,
          status: 'To Receive and Bill',
        };
      })
    );
  };

  const handleRecordReceipt = (poId: string) => {
    setOrders((prev) =>
      prev.map((po) => {
        if (po.id !== poId) return po;
        const newRec = Math.min(po.received_percent + 25, 100);
        const newStatus =
          newRec === 100 && po.billed_percent === 100
            ? 'Completed'
            : newRec === 100
            ? 'To Bill'
            : 'To Receive and Bill';

        addToast({
          title: 'Goods Receipt Note (GRN) Recorded',
          description: `${po.purchase_order_number} receipt progress updated to ${newRec}%.`,
          variant: 'success',
        });

        return {
          ...po,
          received_percent: newRec,
          status: newStatus,
        };
      })
    );
  };

  const handleRecordBill = (poId: string) => {
    setOrders((prev) =>
      prev.map((po) => {
        if (po.id !== poId) return po;
        const newBill = Math.min(po.billed_percent + 25, 100);
        const newStatus =
          po.received_percent === 100 && newBill === 100
            ? 'Completed'
            : newBill === 100
            ? 'To Receive'
            : 'To Receive and Bill';

        addToast({
          title: 'Purchase Invoice Booked',
          description: `${po.purchase_order_number} vendor billing progress updated to ${newBill}%.`,
          variant: 'success',
        });

        return {
          ...po,
          billed_percent: newBill,
          status: newStatus,
        };
      })
    );
  };

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPO.supplier_name.trim() || !newPO.grand_total) return;

    const created: PurchaseOrderRow = {
      id: `po-${Date.now()}`,
      purchase_order_number: `PO-26-27-${String(orders.length + 1).padStart(5, '0')}`,
      supplier_name: newPO.supplier_name,
      is_msme: newPO.is_msme,
      transaction_date: new Date().toISOString().slice(0, 10),
      schedule_date: newPO.schedule_date,
      grand_total: parseFloat(newPO.grand_total),
      received_percent: 0,
      billed_percent: 0,
      status: 'Draft',
    };

    setOrders([created, ...orders]);
    setIsCreateOpen(false);
    setNewPO({
      supplier_name: '',
      schedule_date: '2026-06-25',
      grand_total: '',
      is_msme: false,
    });

    addToast({
      title: 'Purchase Order Created',
      description: `${created.purchase_order_number} created in Draft status.`,
      variant: 'success',
    });
  };

  const filtered = orders.filter((o) => {
    const matchesSearch =
      o.purchase_order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.supplier_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getStatusBadge = (status: PurchaseOrderRow['status']) => {
    switch (status) {
      case 'Completed':
        return <Badge variant="success">Completed</Badge>;
      case 'To Receive and Bill':
        return <Badge variant="primary">To Receive & Bill</Badge>;
      case 'To Receive':
        return <Badge variant="warning">To Receive</Badge>;
      case 'To Bill':
        return <Badge variant="secondary">To Bill</Badge>;
      case 'Pending Approval':
        return <Badge variant="warning">Pending Approval</Badge>;
      case 'Approved':
        return <Badge variant="primary">Approved</Badge>;
      case 'Draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'Cancelled':
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <PackageCheck className="w-6 h-6 text-brand-600" />
            Purchase Orders & Procurement Backlog
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Vendor commitments, goods receipts (GRN), MSME Section 43B(h) compliance, and vendor bill tracking.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Purchase Order
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Purchase Orders</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{orders.length}</h3>
          <p className="text-xs text-slate-400 mt-1">Total procurement commitments</p>
        </Card>

        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Committed Spend (INR)</p>
          <h3 className="text-2xl font-bold text-brand-600 mt-1">
            {formatINR(
              orders
                .filter((o) => o.status !== 'Completed' && o.status !== 'Cancelled')
                .reduce((sum, o) => sum + o.grand_total, 0)
            )}
          </h3>
          <p className="text-xs text-slate-400 mt-1">Open AP order commitments</p>
        </Card>

        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">MSME Registered Spend</p>
          <h3 className="text-2xl font-bold text-amber-600 mt-1">
            {formatINR(
              orders
                .filter((o) => o.is_msme)
                .reduce((sum, o) => sum + o.grand_total, 0)
            )}
          </h3>
          <p className="text-xs text-slate-400 mt-1">MSME Section 43B(h) priority</p>
        </Card>

        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Completed Deliveries</p>
          <h3 className="text-2xl font-bold text-emerald-600 mt-1">
            {orders.filter((o) => o.status === 'Completed').length}
          </h3>
          <p className="text-xs text-slate-400 mt-1">100% received & invoiced</p>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="p-4 border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              placeholder="Search by PO number, supplier name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            {['All', 'Draft', 'Pending Approval', 'To Receive and Bill', 'Completed'].map((st) => (
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

        {/* PO Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">PO Number</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Order Date</th>
                <th className="py-3 px-4">Expected Date</th>
                <th className="py-3 px-4 text-right">Total Cost (INR)</th>
                <th className="py-3 px-4">Goods Receipt (GRN)</th>
                <th className="py-3 px-4">Vendor Bill Status</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No purchase orders found matching filter.
                  </td>
                </tr>
              ) : (
                paginated.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900 dark:text-white">
                      {po.purchase_order_number}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {po.supplier_name}
                      </div>
                      {po.is_msme && (
                        <span className="inline-block mt-0.5 text-xxs font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          MSME Vendor
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">{po.transaction_date}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 font-medium">{po.schedule_date}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatINR(po.grand_total)}
                    </td>
                    <td className="py-3.5 px-4 min-w-[140px]">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xxs font-medium text-slate-600 dark:text-slate-400">
                          <span>Received</span>
                          <span>{po.received_percent}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full ${
                              po.received_percent === 100
                                ? 'bg-emerald-500'
                                : po.received_percent > 0
                                ? 'bg-indigo-500'
                                : 'bg-transparent'
                            }`}
                            style={{ width: `${po.received_percent}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 min-w-[140px]">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xxs font-medium text-slate-600 dark:text-slate-400">
                          <span>Invoiced</span>
                          <span>{po.billed_percent}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full ${
                              po.billed_percent === 100
                                ? 'bg-emerald-500'
                                : po.billed_percent > 0
                                ? 'bg-brand-500'
                                : 'bg-transparent'
                            }`}
                            style={{ width: `${po.billed_percent}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">{getStatusBadge(po.status)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {po.status === 'Pending Approval' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApprove(po.id)}
                            className="text-xs h-7 px-2 border-emerald-200 text-emerald-600 hover:bg-emerald-50 flex items-center gap-1"
                          >
                            <ShieldCheck className="w-3 h-3" />
                            Approve
                          </Button>
                        )}
                        {po.status !== 'Draft' &&
                          po.status !== 'Pending Approval' &&
                          po.status !== 'Completed' && (
                            <>
                              {po.received_percent < 100 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRecordReceipt(po.id)}
                                  className="text-xxs h-7 px-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                                >
                                  <Truck className="w-3 h-3 mr-1" />
                                  +GRN
                                </Button>
                              )}
                              {po.billed_percent < 100 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRecordBill(po.id)}
                                  className="text-xxs h-7 px-2 border-brand-200 text-brand-600 hover:bg-brand-50"
                                >
                                  <Receipt className="w-3 h-3 mr-1" />
                                  +Bill
                                </Button>
                              )}
                            </>
                          )}
                        {po.status === 'Completed' && (
                          <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Fulfilled
                          </span>
                        )}
                      </div>
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

      {/* Create Purchase Order Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Purchase Order"
      >
        <form onSubmit={handleCreatePO} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Supplier Name *
            </label>
            <Input
              required
              placeholder="e.g. Gujarat Alloys & Steel Ltd"
              value={newPO.supplier_name}
              onChange={(e) => setNewPO({ ...newPO, supplier_name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Expected Delivery Date *
              </label>
              <Input
                type="date"
                required
                value={newPO.schedule_date}
                onChange={(e) => setNewPO({ ...newPO, schedule_date: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Total PO Value in INR (incl. GST) *
              </label>
              <Input
                required
                placeholder="e.g. 500000"
                value={newPO.grand_total}
                onChange={(e) => setNewPO({ ...newPO, grand_total: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="msmeCheck"
              checked={newPO.is_msme}
              onChange={(e) => setNewPO({ ...newPO, is_msme: e.target.checked })}
              className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
            />
            <label htmlFor="msmeCheck" className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Supplier is MSME Registered (Section 43B(h) 45-day payment statutory priority)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Generate Draft PO</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
