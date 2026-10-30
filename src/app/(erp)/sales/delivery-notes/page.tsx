'use client';

import * as React from 'react';
import {
  Truck,
  Search,
  Filter,
  Plus,
  FileText,
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  Navigation,
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

interface DeliveryNoteViewItem {
  id: string;
  delivery_note_number: string;
  customer_name: string;
  posting_date: string;
  status: 'Draft' | 'Submitted' | 'Closed' | 'Cancelled';
  transporter_name: string;
  vehicle_no: string;
  eway_bill_no?: string;
  lr_no?: string;
  grand_total: number;
  item_summary: string;
}

const INITIAL_DELIVERY_NOTES: DeliveryNoteViewItem[] = [
  {
    id: 'dn-001',
    delivery_note_number: 'DN-26-27-00089',
    customer_name: 'Apex Industrial Systems Ltd',
    posting_date: '2026-10-30',
    status: 'Submitted',
    transporter_name: 'SafeX Logistics Express',
    vehicle_no: 'DL-01-AB-1234',
    eway_bill_no: '241199887766',
    lr_no: 'LR-SFX-8891',
    grand_total: 43500.0,
    item_summary: 'Industrial Ball Valve 50mm Flanged (x30 Nos)',
  },
  {
    id: 'dn-002',
    delivery_note_number: 'DN-26-27-00090',
    customer_name: 'Hindustan Heavy Machining Works',
    posting_date: '2026-10-30',
    status: 'Draft',
    transporter_name: 'V-Trans Express',
    vehicle_no: 'MH-12-CD-5678',
    eway_bill_no: '241199887767',
    grand_total: 82500.0,
    item_summary: 'Stainless Steel Sheet 304 2mm (x150 Kgs)',
  },
  {
    id: 'dn-003',
    delivery_note_number: 'DN-26-27-00088',
    customer_name: 'Godrej Precision Tooling Division',
    posting_date: '2026-10-28',
    status: 'Submitted',
    transporter_name: 'Gati KWE Surface',
    vehicle_no: 'KA-04-EF-9012',
    eway_bill_no: '241199887755',
    lr_no: 'LR-GATI-4512',
    grand_total: 48000.0,
    item_summary: 'Aluminium Billet 6061 Grade (x15 Nos)',
  },
];

export default function DeliveryNotesPage() {
  const { toast } = useToast();
  const [deliveryNotes, setDeliveryNotes] = React.useState<DeliveryNoteViewItem[]>(INITIAL_DELIVERY_NOTES);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('ALL');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

  // New DN form state
  const [customerName, setCustomerName] = React.useState('');
  const [transporter, setTransporter] = React.useState('');
  const [vehicleNo, setVehicleNo] = React.useState('');
  const [ewayBillNo, setEwayBillNo] = React.useState('');
  const [itemSummary, setItemSummary] = React.useState('');
  const [grandTotal, setGrandTotal] = React.useState('');

  const filteredNotes = React.useMemo(() => {
    return deliveryNotes.filter((dn) => {
      const matchesSearch =
        dn.delivery_note_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dn.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (dn.eway_bill_no && dn.eway_bill_no.includes(searchQuery)) ||
        (dn.vehicle_no && dn.vehicle_no.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'ALL' || dn.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [deliveryNotes, searchQuery, statusFilter]);

  const handleCreateDN = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !itemSummary || !grandTotal) {
      toast.error('Please enter all required delivery note details');
      return;
    }

    const nextIndex = deliveryNotes.length + 91;
    const newDN: DeliveryNoteViewItem = {
      id: `dn-${Date.now()}`,
      delivery_note_number: `DN-26-27-000${nextIndex}`,
      customer_name: customerName,
      posting_date: new Date().toISOString().split('T')[0],
      status: 'Draft',
      transporter_name: transporter || 'Direct Dispatch',
      vehicle_no: vehicleNo || 'Self Pick',
      eway_bill_no: ewayBillNo || undefined,
      grand_total: parseFloat(grandTotal),
      item_summary: itemSummary,
    };

    setDeliveryNotes((prev) => [newDN, ...prev]);
    setIsCreateOpen(false);
    setCustomerName('');
    setTransporter('');
    setVehicleNo('');
    setEwayBillNo('');
    setItemSummary('');
    setGrandTotal('');

    toast.success(`Delivery Note ${newDN.delivery_note_number} generated in Draft status`);
  };

  const handleSubmitDN = (dn: DeliveryNoteViewItem) => {
    setDeliveryNotes((prev) =>
      prev.map((item) => (item.id === dn.id ? { ...item, status: 'Submitted' } : item))
    );
    toast.success(`Delivery Note ${dn.delivery_note_number} submitted! Stock deducted from warehouse.`);
  };

  const handleCancelDN = (dn: DeliveryNoteViewItem) => {
    setDeliveryNotes((prev) =>
      prev.map((item) => (item.id === dn.id ? { ...item, status: 'Cancelled' } : item))
    );
    toast.warning(`Delivery Note ${dn.delivery_note_number} cancelled! Reversing stock entry posted.`);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Outward Delivery Challans (DN)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Dispatch documentation, E-Way Bill tracking, and inventory issue verification
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="bg-brand-600 hover:bg-brand-700 text-white"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Delivery Challan
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Dispatches
            </CardTitle>
            <Truck className="h-4 w-4 text-brand-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {deliveryNotes.length} Shipments
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Draft Challans
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {deliveryNotes.filter((d) => d.status === 'Draft').length} Awaiting Dispatch
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Dispatched Value
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(
                deliveryNotes
                  .filter((d) => d.status === 'Submitted')
                  .reduce((sum, d) => sum + d.grand_total, 0),
                'INR'
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by DN number, customer, vehicle, or E-Way Bill..."
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
                <option value="Submitted">Submitted (Dispatched)</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Notes Table */}
      <Card className="border-slate-200 dark:border-slate-800">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                <TableHead className="font-semibold">DN Number</TableHead>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Customer</TableHead>
                <TableHead className="font-semibold">Logistics & Vehicle</TableHead>
                <TableHead className="font-semibold">E-Way Bill</TableHead>
                <TableHead className="font-semibold">Items Dispatched</TableHead>
                <TableHead className="text-right font-semibold">Grand Total</TableHead>
                <TableHead className="text-center font-semibold">Status</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-slate-500">
                    No delivery notes found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredNotes.map((dn) => (
                  <TableRow key={dn.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                    <TableCell className="font-mono text-xs font-semibold text-brand-600 dark:text-brand-400">
                      {dn.delivery_note_number}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                      {dn.posting_date}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-medium text-slate-900 dark:text-slate-100">
                        {dn.customer_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-slate-800 dark:text-slate-200">
                        {dn.transporter_name}
                      </div>
                      <div className="font-mono text-xxs text-slate-500">{dn.vehicle_no}</div>
                    </TableCell>
                    <TableCell>
                      {dn.eway_bill_no ? (
                        <div className="inline-flex items-center gap-1 font-mono text-xs text-blue-600 dark:text-blue-400">
                          <Navigation className="h-3 w-3" />
                          {dn.eway_bill_no}
                        </div>
                      ) : (
                        <span className="text-xxs text-slate-400">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 dark:text-slate-400 max-w-xs truncate">
                      {dn.item_summary}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-medium text-slate-900 dark:text-slate-100">
                      {formatCurrency(dn.grand_total, 'INR')}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          dn.status === 'Submitted'
                            ? 'success'
                            : dn.status === 'Draft'
                            ? 'warning'
                            : 'destructive'
                        }
                        className="text-xxs"
                      >
                        {dn.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {dn.status === 'Draft' && (
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => handleSubmitDN(dn)}
                          >
                            Dispatch
                          </Button>
                        )}
                        {dn.status === 'Submitted' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 text-xs"
                            onClick={() => handleCancelDN(dn)}
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
            totalPages={Math.ceil(filteredNotes.length / pageSize) || 1}
            totalItems={filteredNotes.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </Card>

      {/* Create Delivery Note Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="New Delivery Challan">
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Create Outward Delivery Challan</ModalTitle>
          </ModalHeader>
          <form onSubmit={handleCreateDN} className="space-y-4 py-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Customer Name *
              </label>
              <Input
                placeholder="e.g. Larsen & Toubro Heavy Engineering"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Transporter Name
                </label>
                <Input
                  placeholder="e.g. V-Trans Logistics"
                  value={transporter}
                  onChange={(e) => setTransporter(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Vehicle Number
                </label>
                <Input
                  placeholder="e.g. MH-04-AZ-4411"
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                E-Way Bill Number (if &gt; ₹50,000)
              </label>
              <Input
                placeholder="12-digit E-Way Bill Number"
                value={ewayBillNo}
                onChange={(e) => setEwayBillNo(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Items Summary *
              </label>
              <Input
                placeholder="e.g. Precision CNC Turned Components (x500 Nos)"
                value={itemSummary}
                onChange={(e) => setItemSummary(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Estimated Value (₹) *
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g. 125000.00"
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
                Save Draft Challan
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
}
