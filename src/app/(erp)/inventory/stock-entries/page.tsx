'use client';

import * as React from 'react';
import {
  ArrowLeftRight,
  Search,
  Filter,
  Plus,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { Modal, ModalContent, ModalHeader, ModalFooter, ModalTitle } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { formatQuantity } from '@/lib/utils/formatters';

interface StockTransferViewItem {
  id: string;
  transfer_number: string;
  posting_date: string;
  from_warehouse_name: string;
  to_warehouse_name: string;
  purpose: string;
  status: 'Draft' | 'Submitted' | 'Cancelled';
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  remarks?: string;
}

const INITIAL_TRANSFERS: StockTransferViewItem[] = [
  {
    id: 'st-001',
    transfer_number: 'ST-26-27-00012',
    posting_date: '2026-10-30',
    from_warehouse_name: 'Raw Material Stores - Plant 1',
    to_warehouse_name: 'Shop Floor Assembly Bin',
    purpose: 'Material Transfer for Manufacturing',
    status: 'Submitted',
    item_code: 'RM-STL-304-01',
    item_name: 'Stainless Steel Sheet 304 (2mm)',
    qty: 50,
    uom: 'Kgs',
    remarks: 'Dispatched for Work Order WO-26-0041',
  },
  {
    id: 'st-002',
    transfer_number: 'ST-26-27-00013',
    posting_date: '2026-10-30',
    from_warehouse_name: 'Finished Goods Warehouse',
    to_warehouse_name: 'Bhiwandi Central Hub',
    purpose: 'Inter-Branch Stock Transfer',
    status: 'Draft',
    item_code: 'FG-VALVE-50MM',
    item_name: 'Industrial Ball Valve 50mm Flanged',
    qty: 40,
    uom: 'Nos',
    remarks: 'Transit transfer via SafeX Truck DL-01-AB-1234',
  },
  {
    id: 'st-003',
    transfer_number: 'ST-26-27-00011',
    posting_date: '2026-10-28',
    from_warehouse_name: 'Raw Material Stores - Plant 1',
    to_warehouse_name: 'Quality Quarantine Inspection',
    purpose: 'Quality Re-inspection Hold',
    status: 'Submitted',
    item_code: 'RM-ALUM-6061',
    item_name: 'Aluminium Billet 6061 Grade',
    qty: 15,
    uom: 'Nos',
    remarks: 'Surface finish roughness audit verification',
  },
];

export default function StockEntriesPage() {
  const { toast } = useToast();
  const [transfers, setTransfers] = React.useState<StockTransferViewItem[]>(INITIAL_TRANSFERS);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('ALL');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

  // Form states
  const [itemCode, setItemCode] = React.useState('');
  const [fromWarehouse, setFromWarehouse] = React.useState('Raw Material Stores - Plant 1');
  const [toWarehouse, setToWarehouse] = React.useState('Finished Goods Warehouse');
  const [qty, setQty] = React.useState('');
  const [purpose, setPurpose] = React.useState('Material Transfer');
  const [remarks, setRemarks] = React.useState('');

  const filteredTransfers = React.useMemo(() => {
    return transfers.filter((st) => {
      const matchesSearch =
        st.transfer_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        st.item_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        st.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        st.from_warehouse_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        st.to_warehouse_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || st.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [transfers, searchQuery, statusFilter]);

  const handleCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemCode || !qty || fromWarehouse === toWarehouse) {
      if (fromWarehouse === toWarehouse) {
        toast.error('Source and destination warehouses must be different');
      } else {
        toast.error('Please enter all required transfer details');
      }
      return;
    }

    const nextIndex = transfers.length + 14;
    const newST: StockTransferViewItem = {
      id: `st-${Date.now()}`,
      transfer_number: `ST-26-27-000${nextIndex}`,
      posting_date: new Date().toISOString().split('T')[0],
      from_warehouse_name: fromWarehouse,
      to_warehouse_name: toWarehouse,
      purpose,
      status: 'Draft',
      item_code: itemCode,
      item_name: `Stock SKU ${itemCode}`,
      qty: parseFloat(qty),
      uom: 'Nos',
      remarks: remarks || undefined,
    };

    setTransfers((prev) => [newST, ...prev]);
    setIsCreateOpen(false);
    setItemCode('');
    setQty('');
    setRemarks('');

    toast.success(`Stock Transfer ${newST.transfer_number} created in Draft status`);
  };

  const handleSubmitTransfer = (st: StockTransferViewItem) => {
    setTransfers((prev) =>
      prev.map((item) => (item.id === st.id ? { ...item, status: 'Submitted' } : item))
    );
    toast.success(
      `Stock Transfer ${st.transfer_number} submitted! Dual SLE entries posted to relocate inventory.`
    );
  };

  const handleCancelTransfer = (st: StockTransferViewItem) => {
    setTransfers((prev) =>
      prev.map((item) => (item.id === st.id ? { ...item, status: 'Cancelled' } : item))
    );
    toast.warning(`Stock Transfer ${st.transfer_number} cancelled! Warehouse movements reversed.`);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Internal Stock Movements & Transfers
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Inter-warehouse transfers, manufacturing shop-floor issues, and transit logistics tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="bg-brand-600 hover:bg-brand-700 text-white"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Stock Movement
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Transfers Logged
            </CardTitle>
            <ArrowLeftRight className="h-4 w-4 text-brand-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {transfers.length} Vouchers
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Draft Movements
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {transfers.filter((t) => t.status === 'Draft').length} In Transit / Draft
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Completed Movements
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {transfers.filter((t) => t.status === 'Submitted').length} Relocated
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by transfer number, SKU code, or warehouse..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                className="h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Submitted">Submitted</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transfers Table */}
      <Card className="border-slate-200 dark:border-slate-800">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                <TableHead className="font-semibold">Voucher No</TableHead>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Item & SKU</TableHead>
                <TableHead className="font-semibold">Source &rarr; Target Warehouse</TableHead>
                <TableHead className="font-semibold">Purpose</TableHead>
                <TableHead className="text-right font-semibold">Quantity</TableHead>
                <TableHead className="text-center font-semibold">Status</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransfers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-slate-500">
                    No stock transfer records found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransfers.map((st) => (
                  <TableRow key={st.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                    <TableCell className="font-mono text-xs font-semibold text-brand-600 dark:text-brand-400">
                      {st.transfer_number}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                      {st.posting_date}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-medium text-slate-900 dark:text-slate-100">
                        {st.item_code}
                      </div>
                      <div className="text-xxs text-slate-500">{st.item_name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {st.from_warehouse_name}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-medium text-brand-600 dark:text-brand-400">
                          {st.to_warehouse_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                      {st.purpose}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-xs text-slate-900 dark:text-slate-100">
                      {formatQuantity(st.qty)} {st.uom}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          st.status === 'Submitted'
                            ? 'success'
                            : st.status === 'Draft'
                            ? 'warning'
                            : 'destructive'
                        }
                        className="text-xxs"
                      >
                        {st.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {st.status === 'Draft' && (
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => handleSubmitTransfer(st)}
                          >
                            Relocate
                          </Button>
                        )}
                        {st.status === 'Submitted' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 text-xs"
                            onClick={() => handleCancelTransfer(st)}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredTransfers.length / pageSize) || 1}
            totalItems={filteredTransfers.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </Card>

      {/* Create Stock Transfer Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="New Stock Movement">
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Inter-Warehouse Stock Transfer</ModalTitle>
          </ModalHeader>
          <form onSubmit={handleCreateTransfer} className="space-y-4 py-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Item SKU Code *
              </label>
              <Input
                placeholder="e.g. FG-VALVE-50MM"
                value={itemCode}
                onChange={(e) => setItemCode(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Origin (From Warehouse) *
                </label>
                <select
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  value={fromWarehouse}
                  onChange={(e) => setFromWarehouse(e.target.value)}
                >
                  <option value="Raw Material Stores - Plant 1">Raw Material Stores - Plant 1</option>
                  <option value="Finished Goods Warehouse">Finished Goods Warehouse</option>
                  <option value="General Consumables Rack">General Consumables Rack</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Destination (To Warehouse) *
                </label>
                <select
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  value={toWarehouse}
                  onChange={(e) => setToWarehouse(e.target.value)}
                >
                  <option value="Finished Goods Warehouse">Finished Goods Warehouse</option>
                  <option value="Shop Floor Assembly Bin">Shop Floor Assembly Bin</option>
                  <option value="Bhiwandi Central Hub">Bhiwandi Central Hub</option>
                  <option value="Quality Quarantine Inspection">Quality Quarantine Inspection</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Transfer Quantity *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 25"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Transfer Purpose
                </label>
                <select
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                >
                  <option value="Material Transfer">Material Transfer</option>
                  <option value="Material Transfer for Manufacturing">Material Transfer for Manufacturing</option>
                  <option value="Inter-Branch Stock Transfer">Inter-Branch Stock Transfer</option>
                  <option value="Quality Inspection Hold">Quality Inspection Hold</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Remarks / Vehicle Ref
              </label>
              <Input
                placeholder="e.g. Dispatched via Plant Internal Forklift / Truck"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
            <ModalFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white">
                Save Draft Transfer
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
}
