'use client';

import * as React from 'react';
import {
  PackageCheck,
  Search,
  Filter,
  Plus,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  AlertOctagon,
  FileText,
  BadgeAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { Modal, ModalContent, ModalHeader, ModalFooter, ModalTitle } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { formatCurrency, formatQuantity } from '@/lib/utils/formatters';

interface PurchaseReceiptViewItem {
  id: string;
  receipt_number: string;
  supplier_name: string;
  posting_date: string;
  status: 'Draft' | 'Submitted' | 'Closed' | 'Cancelled';
  supplier_delivery_note?: string;
  accepted_qty: number;
  rejected_qty: number;
  grand_total: number;
  item_summary: string;
}

const INITIAL_RECEIPTS: PurchaseReceiptViewItem[] = [
  {
    id: 'pr-001',
    receipt_number: 'PR-26-27-00045',
    supplier_name: 'Tata Steel Special Products Ltd',
    posting_date: '2026-10-30',
    status: 'Submitted',
    supplier_delivery_note: 'TATA-DC-8921',
    accepted_qty: 200,
    rejected_qty: 0,
    grand_total: 57100.0,
    item_summary: 'Stainless Steel Sheet 304 (2mm) (x200 Kgs)',
  },
  {
    id: 'pr-002',
    receipt_number: 'PR-26-27-00046',
    supplier_name: 'Precision Fasteners & Screws Pvt Ltd',
    posting_date: '2026-10-30',
    status: 'Draft',
    supplier_delivery_note: 'PFS-INV-4410',
    accepted_qty: 500,
    rejected_qty: 12, // Quality rejection
    grand_total: 6400.0,
    item_summary: 'High Tensile Hex Bolt M12 x 50mm (x500 Nos)',
  },
  {
    id: 'pr-003',
    receipt_number: 'PR-26-27-00044',
    supplier_name: 'Hindalco Industries Alum Division',
    posting_date: '2026-10-28',
    status: 'Submitted',
    supplier_delivery_note: 'HIND-DC-1102',
    accepted_qty: 40,
    rejected_qty: 0,
    grand_total: 128000.0,
    item_summary: 'Aluminium Billet 6061 Grade (x40 Nos)',
  },
];

export default function PurchaseReceiptsPage() {
  const { toast } = useToast();
  const [receipts, setReceipts] = React.useState<PurchaseReceiptViewItem[]>(INITIAL_RECEIPTS);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('ALL');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

  // Form states
  const [supplierName, setSupplierName] = React.useState('');
  const [supplierChallan, setSupplierChallan] = React.useState('');
  const [itemSummary, setItemSummary] = React.useState('');
  const [acceptedQty, setAcceptedQty] = React.useState('');
  const [rejectedQty, setRejectedQty] = React.useState('0');
  const [grandTotal, setGrandTotal] = React.useState('');

  const filteredReceipts = React.useMemo(() => {
    return receipts.filter((pr) => {
      const matchesSearch =
        pr.receipt_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pr.supplier_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (pr.supplier_delivery_note && pr.supplier_delivery_note.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'ALL' || pr.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [receipts, searchQuery, statusFilter]);

  const handleCreateReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName || !itemSummary || !grandTotal || !acceptedQty) {
      toast.error('Please fill all required receipt fields');
      return;
    }

    const nextIndex = receipts.length + 47;
    const newPR: PurchaseReceiptViewItem = {
      id: `pr-${Date.now()}`,
      receipt_number: `PR-26-27-000${nextIndex}`,
      supplier_name: supplierName,
      posting_date: new Date().toISOString().split('T')[0],
      status: 'Draft',
      supplier_delivery_note: supplierChallan || undefined,
      accepted_qty: parseFloat(acceptedQty),
      rejected_qty: parseFloat(rejectedQty || '0'),
      grand_total: parseFloat(grandTotal),
      item_summary: itemSummary,
    };

    setReceipts((prev) => [newPR, ...prev]);
    setIsCreateOpen(false);
    setSupplierName('');
    setSupplierChallan('');
    setItemSummary('');
    setAcceptedQty('');
    setRejectedQty('0');
    setGrandTotal('');

    toast.success(`Purchase Receipt ${newPR.receipt_number} created in Draft status`);
  };

  const handleSubmitReceipt = (pr: PurchaseReceiptViewItem) => {
    setReceipts((prev) =>
      prev.map((item) => (item.id === pr.id ? { ...item, status: 'Submitted' } : item))
    );
    toast.success(`GRN ${pr.receipt_number} accepted and posted to stock ledger! Valuation rate updated.`);
  };

  const handleCancelReceipt = (pr: PurchaseReceiptViewItem) => {
    setReceipts((prev) =>
      prev.map((item) => (item.id === pr.id ? { ...item, status: 'Cancelled' } : item))
    );
    toast.warning(`GRN ${pr.receipt_number} cancelled! Inward stock reversed.`);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Goods Receipt Notes (GRN)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Inward material receiving, QA gate inspections, and automated stock ledger valuation updates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="bg-brand-600 hover:bg-brand-700 text-white"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Goods Receipt (GRN)
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Inward Receipts
            </CardTitle>
            <PackageCheck className="h-4 w-4 text-brand-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {receipts.length} GRNs
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Awaiting Inspection / Gate Entry
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {receipts.filter((r) => r.status === 'Draft').length} Draft Receipts
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Inward Invoiced Value
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(
                receipts
                  .filter((r) => r.status === 'Submitted')
                  .reduce((sum, r) => sum + r.grand_total, 0),
                'INR'
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by GRN number, supplier name, or delivery challan..."
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
                <option value="Submitted">Submitted (Received)</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GRN Table */}
      <Card className="border-slate-200 dark:border-slate-800">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                <TableHead className="font-semibold">Receipt No</TableHead>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Supplier</TableHead>
                <TableHead className="font-semibold">Vendor Challan / Bill</TableHead>
                <TableHead className="font-semibold">Item Details</TableHead>
                <TableHead className="text-right font-semibold">Accepted Qty</TableHead>
                <TableHead className="text-right font-semibold">Rejected Qty</TableHead>
                <TableHead className="text-right font-semibold">Total Value</TableHead>
                <TableHead className="text-center font-semibold">Status</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReceipts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-32 text-center text-slate-500">
                    No purchase receipt records found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredReceipts.map((pr) => (
                  <TableRow key={pr.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                    <TableCell className="font-mono text-xs font-semibold text-brand-600 dark:text-brand-400">
                      {pr.receipt_number}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                      {pr.posting_date}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-medium text-slate-900 dark:text-slate-100">
                        {pr.supplier_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-xs text-slate-700 dark:text-slate-300">
                        {pr.supplier_delivery_note || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 dark:text-slate-400 max-w-xs truncate">
                      {pr.item_summary}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium text-xs text-emerald-600 dark:text-emerald-400">
                      +{formatQuantity(pr.accepted_qty)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-slate-500">
                      {pr.rejected_qty > 0 ? (
                        <span className="text-rose-600 font-semibold">{formatQuantity(pr.rejected_qty)}</span>
                      ) : (
                        '0'
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(pr.grand_total, 'INR')}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          pr.status === 'Submitted'
                            ? 'success'
                            : pr.status === 'Draft'
                            ? 'warning'
                            : 'destructive'
                        }
                        className="text-xxs"
                      >
                        {pr.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {pr.status === 'Draft' && (
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => handleSubmitReceipt(pr)}
                          >
                            Receive Stock
                          </Button>
                        )}
                        {pr.status === 'Submitted' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 text-xs"
                            onClick={() => handleCancelReceipt(pr)}
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
            totalPages={Math.ceil(filteredReceipts.length / pageSize) || 1}
            totalItems={filteredReceipts.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </Card>

      {/* Create Purchase Receipt Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="New Goods Receipt (GRN)">
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Inward Goods Receipt Note (GRN)</ModalTitle>
          </ModalHeader>
          <form onSubmit={handleCreateReceipt} className="space-y-4 py-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Supplier Name *
              </label>
              <Input
                placeholder="e.g. Tata Steel Special Products Ltd"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Supplier Delivery Challan / Invoice No
              </label>
              <Input
                placeholder="e.g. TATA-DC-9012"
                value={supplierChallan}
                onChange={(e) => setSupplierChallan(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Item Description *
              </label>
              <Input
                placeholder="e.g. High Tensile Fasteners Grade 8.8 (x1000 Nos)"
                value={itemSummary}
                onChange={(e) => setItemSummary(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Accepted Quantity *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 1000"
                  value={acceptedQty}
                  onChange={(e) => setAcceptedQty(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Rejected Quantity
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 0"
                  value={rejectedQty}
                  onChange={(e) => setRejectedQty(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Total Valuation Amount (₹) *
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g. 45000.00"
                value={grandTotal}
                onChange={(e) => setGrandTotal(e.target.value)}
                required
              />
            </div>
            <ModalFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white">
                Save Draft GRN
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
}
