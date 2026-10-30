'use client';

import * as React from 'react';
import {
  FileSpreadsheet,
  Search,
  Filter,
  Download,
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { useToast } from '@/components/ui/toast';
import { formatCurrency, formatQuantity } from '@/lib/utils/formatters';

interface StockLedgerEntryView {
  id: string;
  posting_date: string;
  posting_time: string;
  voucher_type: string;
  voucher_no: string;
  item_code: string;
  item_name: string;
  warehouse_name: string;
  actual_qty: number;
  qty_after_transaction: number;
  valuation_rate: number;
  stock_value_difference: number;
  stock_value: number;
  is_cancelled: boolean;
}

const INITIAL_LEDGER_ENTRIES: StockLedgerEntryView[] = [
  {
    id: 'sle-001',
    posting_date: '2026-10-30',
    posting_time: '14:32:10',
    voucher_type: 'Purchase Receipt',
    voucher_no: 'PR-26-27-00045',
    item_code: 'RM-STL-304-01',
    item_name: 'Stainless Steel Sheet 304 (2mm)',
    warehouse_name: 'Raw Material Stores - Plant 1',
    actual_qty: 200,
    qty_after_transaction: 450,
    valuation_rate: 285.5,
    stock_value_difference: 57100.0,
    stock_value: 128475.0,
    is_cancelled: false,
  },
  {
    id: 'sle-002',
    posting_date: '2026-10-30',
    posting_time: '11:15:00',
    voucher_type: 'Delivery Note',
    voucher_no: 'DN-26-27-00089',
    item_code: 'FG-VALVE-50MM',
    item_name: 'Industrial Ball Valve 50mm Flanged',
    warehouse_name: 'Finished Goods Warehouse',
    actual_qty: -30,
    qty_after_transaction: 120,
    valuation_rate: 1450.0,
    stock_value_difference: -43500.0,
    stock_value: 174000.0,
    is_cancelled: false,
  },
  {
    id: 'sle-003',
    posting_date: '2026-10-29',
    posting_time: '16:45:22',
    voucher_type: 'Stock Transfer',
    voucher_no: 'ST-26-27-00012',
    item_code: 'HW-BOLT-M12',
    item_name: 'High Tensile Hex Bolt M12 x 50mm',
    warehouse_name: 'General Consumables Rack',
    actual_qty: 500,
    qty_after_transaction: 2500,
    valuation_rate: 12.8,
    stock_value_difference: 6400.0,
    stock_value: 32000.0,
    is_cancelled: false,
  },
  {
    id: 'sle-004',
    posting_date: '2026-10-29',
    posting_time: '09:20:15',
    voucher_type: 'Stock Reconciliation',
    voucher_no: 'SR-26-27-00003',
    item_code: 'SUB-ELECT-PCB-01',
    item_name: 'Main Controller PCB Assembly v2.1',
    warehouse_name: 'Electronics Clean Room Bin',
    actual_qty: 5,
    qty_after_transaction: 85,
    valuation_rate: 2850.0,
    stock_value_difference: 14250.0,
    stock_value: 242250.0,
    is_cancelled: false,
  },
  {
    id: 'sle-005',
    posting_date: '2026-10-28',
    posting_time: '17:05:40',
    voucher_type: 'Delivery Note',
    voucher_no: 'DN-26-27-00088',
    item_code: 'RM-ALUM-6061',
    item_name: 'Aluminium Billet 6061 Grade',
    warehouse_name: 'Raw Material Stores - Plant 1',
    actual_qty: -15,
    qty_after_transaction: 35,
    valuation_rate: 3200.0,
    stock_value_difference: -48000.0,
    stock_value: 112000.0,
    is_cancelled: false,
  },
];

export default function StockLedgerPage() {
  const { toast } = useToast();
  const [entries] = React.useState<StockLedgerEntryView[]>(INITIAL_LEDGER_ENTRIES);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedVoucherType, setSelectedVoucherType] = React.useState('ALL');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const voucherTypes = ['ALL', 'Delivery Note', 'Purchase Receipt', 'Stock Transfer', 'Stock Reconciliation'];

  const filteredEntries = React.useMemo(() => {
    return entries.filter((entry) => {
      const matchesSearch =
        entry.item_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.voucher_no.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedVoucherType === 'ALL' || entry.voucher_type === selectedVoucherType;
      return matchesSearch && matchesType;
    });
  }, [entries, searchQuery, selectedVoucherType]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Immutable Stock Ledger
            </h1>
            <Badge variant="success" className="gap-1 text-xxs font-mono">
              <ShieldCheck className="h-3 w-3" />
              MCA Rule 3 Audit Sealed
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Append-only physical inventory transaction audit trail with cryptographic immutability
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info('Exporting stock audit trail CSV...')}
          >
            <Download className="mr-2 h-4 w-4" />
            Audit Export
          </Button>
        </div>
      </div>

      {/* Filter and Search */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by voucher number (DN/PR/ST), SKU code, or item..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                className="h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                value={selectedVoucherType}
                onChange={(e) => setSelectedVoucherType(e.target.value)}
              >
                {voucherTypes.map((vt) => (
                  <option key={vt} value={vt}>
                    {vt === 'ALL' ? 'All Voucher Types' : vt}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Ledger Entries Table */}
      <Card className="border-slate-200 dark:border-slate-800">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                <TableHead className="font-semibold">Date & Time</TableHead>
                <TableHead className="font-semibold">Voucher Details</TableHead>
                <TableHead className="font-semibold">Item & SKU</TableHead>
                <TableHead className="font-semibold">Warehouse</TableHead>
                <TableHead className="text-right font-semibold">Qty Change</TableHead>
                <TableHead className="text-right font-semibold">Running Balance</TableHead>
                <TableHead className="text-right font-semibold">Valuation Rate</TableHead>
                <TableHead className="text-right font-semibold">Value Difference</TableHead>
                <TableHead className="text-right font-semibold">Total Stock Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-slate-500">
                    No stock ledger entries found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredEntries.map((row) => {
                  const isInward = row.actual_qty > 0;
                  return (
                    <TableRow key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                      <TableCell className="whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {row.posting_date}
                        </div>
                        <div className="font-mono text-xxs text-slate-400">{row.posting_time}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono font-medium text-brand-600 dark:text-brand-400 text-xs">
                          {row.voucher_no}
                        </div>
                        <div className="text-xxs text-slate-500">{row.voucher_type}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-900 dark:text-slate-100 text-xs">
                          {row.item_code}
                        </div>
                        <div className="text-xxs text-slate-500 line-clamp-1">{row.item_name}</div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-700 dark:text-slate-300">
                        {row.warehouse_name}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-xs">
                        <span
                          className={`inline-flex items-center gap-0.5 ${
                            isInward
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {isInward ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3" />
                          )}
                          {isInward ? `+${formatQuantity(row.actual_qty)}` : formatQuantity(row.actual_qty)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium text-xs text-slate-900 dark:text-slate-100">
                        {formatQuantity(row.qty_after_transaction)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-slate-700 dark:text-slate-300">
                        {formatCurrency(row.valuation_rate, 'INR')}
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono text-xs ${
                          row.stock_value_difference >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {formatCurrency(row.stock_value_difference, 'INR')}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-xs text-slate-900 dark:text-slate-100">
                        {formatCurrency(row.stock_value, 'INR')}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredEntries.length / pageSize) || 1}
            totalItems={filteredEntries.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </Card>
    </div>
  );
}
