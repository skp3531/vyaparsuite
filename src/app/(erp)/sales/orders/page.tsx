'use client';

import React, { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  CheckCircle,
  Truck,
  Receipt,
  Clock,
  AlertCircle,
  Calendar,
  Building,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { Pagination } from '@/components/ui/pagination';

interface OrderRow {
  id: string;
  order_number: string;
  customer_name: string;
  transaction_date: string;
  delivery_date: string;
  grand_total: number;
  delivered_percent: number;
  billed_percent: number;
  status:
    | 'Draft'
    | 'Pending Approval'
    | 'Approved'
    | 'To Deliver and Bill'
    | 'To Deliver'
    | 'To Bill'
    | 'Completed'
    | 'Cancelled';
  customer_po_no?: string;
}

const INITIAL_ORDERS: OrderRow[] = [
  {
    id: 'so-01',
    order_number: 'SO-26-27-00001',
    customer_name: 'Mahindra Heavy Auto Ltd',
    transaction_date: '2026-05-10',
    delivery_date: '2026-06-01',
    grand_total: 1003000,
    delivered_percent: 50,
    billed_percent: 50,
    status: 'To Deliver and Bill',
    customer_po_no: 'PO/MHA/2026/054',
  },
  {
    id: 'so-02',
    order_number: 'SO-26-27-00002',
    customer_name: 'Bharat Tech Industries',
    transaction_date: '2026-05-12',
    delivery_date: '2026-06-15',
    grand_total: 354000,
    delivered_percent: 100,
    billed_percent: 0,
    status: 'To Bill',
    customer_po_no: 'PO/BTI/9812',
  },
  {
    id: 'so-03',
    order_number: 'SO-26-27-00003',
    customer_name: 'Larsen Engineering Works',
    transaction_date: '2026-05-14',
    delivery_date: '2026-06-20',
    grand_total: 820000,
    delivered_percent: 0,
    billed_percent: 0,
    status: 'Pending Approval',
    customer_po_no: 'PO/LEW/5501',
  },
  {
    id: 'so-04',
    order_number: 'SO-26-27-00004',
    customer_name: 'Tata Heavy Motors Ltd',
    transaction_date: '2026-05-02',
    delivery_date: '2026-05-15',
    grand_total: 2450000,
    delivered_percent: 100,
    billed_percent: 100,
    status: 'Completed',
    customer_po_no: 'PO/THM/1102',
  },
  {
    id: 'so-05',
    order_number: 'SO-26-27-00005',
    customer_name: 'Gujarat Agro Tools',
    transaction_date: '2026-05-15',
    delivery_date: '2026-06-10',
    grand_total: 195000,
    delivered_percent: 0,
    billed_percent: 0,
    status: 'Draft',
  },
];

export default function SalesOrdersPage() {
  const { addToast } = useToast();
  const [orders, setOrders] = useState<OrderRow[]>(INITIAL_ORDERS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // New Order Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newOrder, setNewOrder] = useState({
    customer_name: '',
    delivery_date: '2026-06-15',
    customer_po_no: '',
    grand_total: '',
  });

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleApprove = (orderId: string) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        addToast({
          title: 'Sales Order Approved',
          description: `${order.order_number} released for dispatch and billing.`,
          variant: 'success',
        });
        return {
          ...order,
          status: 'To Deliver and Bill',
        };
      })
    );
  };

  const handleDispatch = (orderId: string) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        const newDelivered = Math.min(order.delivered_percent + 25, 100);
        const newStatus =
          newDelivered === 100 && order.billed_percent === 100
            ? 'Completed'
            : newDelivered === 100
            ? 'To Bill'
            : 'To Deliver and Bill';

        addToast({
          title: 'Delivery Note Recorded',
          description: `${order.order_number} delivery progress updated to ${newDelivered}%.`,
          variant: 'success',
        });

        return {
          ...order,
          delivered_percent: newDelivered,
          status: newStatus,
        };
      })
    );
  };

  const handleInvoice = (orderId: string) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        const newBilled = Math.min(order.billed_percent + 25, 100);
        const newStatus =
          order.delivered_percent === 100 && newBilled === 100
            ? 'Completed'
            : newBilled === 100
            ? 'To Deliver'
            : 'To Deliver and Bill';

        addToast({
          title: 'Sales Invoice Posted',
          description: `${order.order_number} billing progress updated to ${newBilled}%.`,
          variant: 'success',
        });

        return {
          ...order,
          billed_percent: newBilled,
          status: newStatus,
        };
      })
    );
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrder.customer_name.trim() || !newOrder.grand_total) return;

    const created: OrderRow = {
      id: `so-${Date.now()}`,
      order_number: `SO-26-27-${String(orders.length + 1).padStart(5, '0')}`,
      customer_name: newOrder.customer_name,
      transaction_date: new Date().toISOString().slice(0, 10),
      delivery_date: newOrder.delivery_date,
      grand_total: parseFloat(newOrder.grand_total),
      delivered_percent: 0,
      billed_percent: 0,
      status: 'Draft',
      customer_po_no: newOrder.customer_po_no,
    };

    setOrders([created, ...orders]);
    setIsCreateOpen(false);
    setNewOrder({
      customer_name: '',
      delivery_date: '2026-06-15',
      customer_po_no: '',
      grand_total: '',
    });

    addToast({
      title: 'Sales Order Booked',
      description: `${created.order_number} created in Draft status.`,
      variant: 'success',
    });
  };

  const filtered = orders.filter((o) => {
    const matchesSearch =
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      (o.customer_po_no && o.customer_po_no.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getStatusBadge = (status: OrderRow['status']) => {
    switch (status) {
      case 'Completed':
        return <Badge variant="success">Completed</Badge>;
      case 'To Deliver and Bill':
        return <Badge variant="primary">To Deliver & Bill</Badge>;
      case 'To Deliver':
        return <Badge variant="warning">To Deliver</Badge>;
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
            <ShoppingCart className="w-6 h-6 text-brand-600" />
            Sales Orders & Backlog Execution
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Confirmed customer order commitments, credit exposure controls, and delivery/invoicing tracking.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Book Sales Order
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Booked Orders</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{orders.length}</h3>
          <p className="text-xs text-slate-400 mt-1">Total active bookings</p>
        </Card>

        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Open Backlog (INR)</p>
          <h3 className="text-2xl font-bold text-brand-600 mt-1">
            {formatINR(
              orders
                .filter((o) => o.status !== 'Completed' && o.status !== 'Cancelled')
                .reduce((sum, o) => sum + o.grand_total, 0)
            )}
          </h3>
          <p className="text-xs text-slate-400 mt-1">Pending delivery and billing</p>
        </Card>

        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Avg Delivery Progress</p>
          <h3 className="text-2xl font-bold text-indigo-600 mt-1">
            {Math.round(
              orders.reduce((sum, o) => sum + o.delivered_percent, 0) / (orders.length || 1)
            )}
            %
          </h3>
          <p className="text-xs text-slate-400 mt-1">Warehouse dispatch fulfillment</p>
        </Card>

        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Completed Orders</p>
          <h3 className="text-2xl font-bold text-emerald-600 mt-1">
            {orders.filter((o) => o.status === 'Completed').length}
          </h3>
          <p className="text-xs text-slate-400 mt-1">100% delivered & invoiced</p>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="p-4 border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              placeholder="Search by SO number, customer name, PO reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            {['All', 'Draft', 'Pending Approval', 'To Deliver and Bill', 'Completed'].map((st) => (
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

        {/* Sales Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Sales Order #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Order Date</th>
                <th className="py-3 px-4">Delivery Due</th>
                <th className="py-3 px-4 text-right">Order Value (INR)</th>
                <th className="py-3 px-4">Delivery Progress</th>
                <th className="py-3 px-4">Billing Progress</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Fulfillment Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No sales orders found matching filter.
                  </td>
                </tr>
              ) : (
                paginated.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900 dark:text-white">
                      {order.order_number}
                      {order.customer_po_no && (
                        <span className="block text-xxs font-sans text-slate-400 font-normal">
                          PO: {order.customer_po_no}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {order.customer_name}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">{order.transaction_date}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 font-medium">{order.delivery_date}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatINR(order.grand_total)}
                    </td>
                    <td className="py-3.5 px-4 min-w-[140px]">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xxs font-medium text-slate-600 dark:text-slate-400">
                          <span>Delivered</span>
                          <span>{order.delivered_percent}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full ${
                              order.delivered_percent === 100
                                ? 'bg-emerald-500'
                                : order.delivered_percent > 0
                                ? 'bg-indigo-500'
                                : 'bg-transparent'
                            }`}
                            style={{ width: `${order.delivered_percent}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 min-w-[140px]">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xxs font-medium text-slate-600 dark:text-slate-400">
                          <span>Invoiced</span>
                          <span>{order.billed_percent}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full ${
                              order.billed_percent === 100
                                ? 'bg-emerald-500'
                                : order.billed_percent > 0
                                ? 'bg-brand-500'
                                : 'bg-transparent'
                            }`}
                            style={{ width: `${order.billed_percent}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">{getStatusBadge(order.status)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {order.status === 'Pending Approval' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApprove(order.id)}
                            className="text-xs h-7 px-2 border-emerald-200 text-emerald-600 hover:bg-emerald-50 flex items-center gap-1"
                          >
                            <ShieldCheck className="w-3 h-3" />
                            Approve
                          </Button>
                        )}
                        {order.status !== 'Draft' &&
                          order.status !== 'Pending Approval' &&
                          order.status !== 'Completed' && (
                            <>
                              {order.delivered_percent < 100 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDispatch(order.id)}
                                  className="text-xxs h-7 px-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                                >
                                  <Truck className="w-3 h-3 mr-1" />
                                  Dispatch
                                </Button>
                              )}
                              {order.billed_percent < 100 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleInvoice(order.id)}
                                  className="text-xxs h-7 px-2 border-brand-200 text-brand-600 hover:bg-brand-50"
                                >
                                  <Receipt className="w-3 h-3 mr-1" />
                                  Invoice
                                </Button>
                              )}
                            </>
                          )}
                        {order.status === 'Completed' && (
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

      {/* Book Sales Order Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Book Confirmed Sales Order"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Customer Name *
            </label>
            <Input
              required
              placeholder="e.g. Bharat Tech Industries"
              value={newOrder.customer_name}
              onChange={(e) => setNewOrder({ ...newOrder, customer_name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Delivery Schedule Date *
              </label>
              <Input
                type="date"
                required
                value={newOrder.delivery_date}
                onChange={(e) => setNewOrder({ ...newOrder, delivery_date: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Customer PO Reference
              </label>
              <Input
                placeholder="e.g. PO/BTI/2026/01"
                value={newOrder.customer_po_no}
                onChange={(e) => setNewOrder({ ...newOrder, customer_po_no: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Order Value in INR (incl. GST) *
            </label>
            <Input
              required
              placeholder="e.g. 350000"
              value={newOrder.grand_total}
              onChange={(e) => setNewOrder({ ...newOrder, grand_total: e.target.value })}
            />
          </div>

          <p className="text-xs text-slate-500">
            Booking this order allocates stock ATP reservations, initiates four-eyes managerial approval workflow, and checks customer credit limit exposure.
          </p>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Book Sales Order</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
