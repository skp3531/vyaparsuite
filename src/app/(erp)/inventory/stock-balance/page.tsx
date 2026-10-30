'use client';

import * as React from 'react';
import {
  Boxes,
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  RefreshCw,
  Building2,
  TrendingUp,
  AlertTriangle,
  Download,
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

interface StockBalanceViewItem {
  id: string;
  item_id: string;
  item_code: string;
  item_name: string;
  category: string;
  warehouse_id: string;
  warehouse_name: string;
  actual_qty: number;
  reserved_qty: number;
  projected_qty: number;
  uom: string;
  valuation_rate: number;
  stock_value: number;
  reorder_level: number;
}

const INITIAL_STOCK_DATA: StockBalanceViewItem[] = [
  {
    id: 'sb-001',
    item_id: 'item-001',
    item_code: 'RM-STL-304-01',
    item_name: 'Stainless Steel Sheet 304 (2mm)',
    category: 'Raw Materials',
    warehouse_id: 'wh-main',
    warehouse_name: 'Raw Material Stores - Plant 1',
    actual_qty: 450,
    reserved_qty: 80,
    projected_qty: 370,
    uom: 'Kgs',
    valuation_rate: 285.5,
    stock_value: 128475.0,
    reorder_level: 200,
  },
  {
    id: 'sb-002',
    item_id: 'item-002',
    item_code: 'FG-VALVE-50MM',
    item_name: 'Industrial Ball Valve 50mm Flanged',
    category: 'Finished Goods',
    warehouse_id: 'wh-fg',
    warehouse_name: 'Finished Goods Warehouse',
    actual_qty: 120,
    reserved_qty: 45,
    projected_qty: 75,
    uom: 'Nos',
    valuation_rate: 1450.0,
    stock_value: 174000.0,
    reorder_level: 50,
  },
  {
    id: 'sb-003',
    item_id: 'item-003',
    item_code: 'RM-ALUM-6061',
    item_name: 'Aluminium Billet 6061 Grade',
    category: 'Raw Materials',
    warehouse_id: 'wh-main',
    warehouse_name: 'Raw Material Stores - Plant 1',
    actual_qty: 35,
    reserved_qty: 20,
    projected_qty: 15,
    uom: 'Nos',
    valuation_rate: 3200.0,
    stock_value: 112000.0,
    reorder_level: 50, // Low stock warning
  },
  {
    id: 'sb-004',
    item_id: 'item-004',
    item_code: 'HW-BOLT-M12',
    item_name: 'High Tensile Hex Bolt M12 x 50mm',
    category: 'Hardware & Consumables',
    warehouse_id: 'wh-cons',
    warehouse_name: 'General Consumables Rack',
    actual_qty: 2500,
    reserved_qty: 400,
    projected_qty: 2100,
    uom: 'Nos',
    valuation_rate: 12.8,
    stock_value: 32000.0,
    reorder_level: 800,
  },
  {
    id: 'sb-005',
    item_id: 'item-005',
    item_code: 'SUB-ELECT-PCB-01',
    item_name: 'Main Controller PCB Assembly v2.1',
    category: 'Sub-Assemblies',
    warehouse_id: 'wh-sub',
    warehouse_name: 'Electronics Clean Room Bin',
    actual_qty: 85,
    reserved_qty: 30,
    projected_qty: 55,
    uom: 'Nos',
    valuation_rate: 2850.0,
    stock_value: 242250.0,
    reorder_level: 40,
  },
];

export default function StockBalancePage() {
  const { toast } = useToast();
  const [data, setData] = React.useState<StockBalanceViewItem[]>(INITIAL_STOCK_DATA);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedWarehouse, setSelectedWarehouse] = React.useState('ALL');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [isAdjustmentOpen, setIsAdjustmentOpen] = React.useState(false);

  // New adjustment form state
  const [adjItemCode, setAdjItemCode] = React.useState('');
  const [adjWarehouse, setAdjWarehouse] = React.useState('wh-main');
  const [adjQty, setAdjQty] = React.useState('');
  const [adjRate, setAdjRate] = React.useState('');

  const warehouses = React.useMemo(() => {
    return Array.from(new Set(data.map((d) => d.warehouse_name)));
  }, [data]);

  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      const matchesSearch =
        item.item_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesWh = selectedWarehouse === 'ALL' || item.warehouse_name === selectedWarehouse;
      return matchesSearch && matchesWh;
    });
  }, [data, searchQuery, selectedWarehouse]);

  // Aggregate KPIs
  const totalStockValue = React.useMemo(() => {
    return filteredData.reduce((sum, item) => sum + item.stock_value, 0);
  }, [filteredData]);

  const totalUnits = React.useMemo(() => {
    return filteredData.reduce((sum, item) => sum + item.actual_qty, 0);
  }, [filteredData]);

  const lowStockCount = React.useMemo(() => {
    return filteredData.filter((item) => item.actual_qty <= item.reorder_level).length;
  }, [filteredData]);

  const handlePostAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjItemCode || !adjQty || !adjRate) {
      toast.error('Please enter all required adjustment fields');
      return;
    }

    const qty = parseFloat(adjQty);
    const rate = parseFloat(adjRate);
    const value = qty * rate;

    const newItem: StockBalanceViewItem = {
      id: `sb-${Date.now()}`,
      item_id: `item-${Date.now()}`,
      item_code: adjItemCode,
      item_name: `Adjusted Material ${adjItemCode}`,
      category: 'Adjustments',
      warehouse_id: adjWarehouse,
      warehouse_name:
        adjWarehouse === 'wh-main'
          ? 'Raw Material Stores - Plant 1'
          : 'Finished Goods Warehouse',
      actual_qty: qty,
      reserved_qty: 0,
      projected_qty: qty,
      uom: 'Nos',
      valuation_rate: rate,
      stock_value: value,
      reorder_level: 25,
    };

    setData((prev) => [newItem, ...prev]);
    setIsAdjustmentOpen(false);
    setAdjItemCode('');
    setAdjQty('');
    setAdjRate('');

    toast.success('Stock adjustment entry posted to Stock Ledger');
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Real-Time Stock Balances
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Current inventory positions, valuation rates, and available-to-promise (ATP) across warehouses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info('Exporting inventory valuation report as CSV...')}
          >
            <Download className="mr-2 h-4 w-4" />
            Export Balances
          </Button>
          <Button
            className="bg-brand-600 hover:bg-brand-700 text-white"
            size="sm"
            onClick={() => setIsAdjustmentOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Quick Inward Entry
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Asset Valuation
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(totalStockValue, 'INR')}
            </div>
            <p className="text-xs text-slate-500 mt-1">Weighted moving average book value</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total SKUs Monitored
            </CardTitle>
            <Boxes className="h-4 w-4 text-brand-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {filteredData.length} Items
            </div>
            <p className="text-xs text-slate-500 mt-1">Across all storage bins & racks</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Physical Units
            </CardTitle>
            <Building2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatQuantity(totalUnits)} Units
            </div>
            <p className="text-xs text-slate-500 mt-1">Current on-hand physical balance</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Below Reorder Level
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {lowStockCount} SKUs
            </div>
            <p className="text-xs text-slate-500 mt-1">Material requisition recommended</p>
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
                placeholder="Search by SKU code, item name, or category..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                className="h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
              >
                <option value="ALL">All Warehouses</option>
                {warehouses.map((wh) => (
                  <option key={wh} value={wh}>
                    {wh}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Balances Table */}
      <Card className="border-slate-200 dark:border-slate-800">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                <TableHead className="font-semibold">Item & SKU</TableHead>
                <TableHead className="font-semibold">Category</TableHead>
                <TableHead className="font-semibold">Warehouse / Location</TableHead>
                <TableHead className="text-right font-semibold">On Hand (Actual)</TableHead>
                <TableHead className="text-right font-semibold">Reserved</TableHead>
                <TableHead className="text-right font-semibold">Available (ATP)</TableHead>
                <TableHead className="text-right font-semibold">Valuation Rate</TableHead>
                <TableHead className="text-right font-semibold">Total Stock Value</TableHead>
                <TableHead className="text-center font-semibold">Stock Health</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-slate-500">
                    No stock balance records found matching filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((row) => {
                  const isLow = row.actual_qty <= row.reorder_level;
                  return (
                    <TableRow key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                      <TableCell>
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {row.item_code}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {row.item_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-slate-600 dark:text-slate-300">
                          {row.category}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                          {row.warehouse_name}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium text-slate-900 dark:text-slate-100">
                        {formatQuantity(row.actual_qty)} {row.uom}
                      </TableCell>
                      <TableCell className="text-right font-mono text-slate-500">
                        {formatQuantity(row.reserved_qty)} {row.uom}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-brand-600 dark:text-brand-400">
                        {formatQuantity(row.projected_qty)} {row.uom}
                      </TableCell>
                      <TableCell className="text-right font-mono text-slate-700 dark:text-slate-300">
                        {formatCurrency(row.valuation_rate, 'INR')}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrency(row.stock_value, 'INR')}
                      </TableCell>
                      <TableCell className="text-center">
                        {isLow ? (
                          <Badge variant="warning" className="text-xxs">
                            Low Stock (Reorder: {row.reorder_level})
                          </Badge>
                        ) : (
                          <Badge variant="success" className="text-xxs">
                            Optimal
                          </Badge>
                        )}
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
            totalPages={Math.ceil(filteredData.length / pageSize) || 1}
            totalItems={filteredData.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </Card>

      {/* Quick Inward Entry Modal */}
      <Modal isOpen={isAdjustmentOpen} onClose={() => setIsAdjustmentOpen(false)} title="Quick Inward Stock Entry">
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Post Inward Stock Receipt</ModalTitle>
          </ModalHeader>
          <form onSubmit={handlePostAdjustment} className="space-y-4 py-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Item SKU Code *
              </label>
              <Input
                placeholder="e.g. RM-COPPER-ROD-01"
                value={adjItemCode}
                onChange={(e) => setAdjItemCode(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Destination Warehouse *
              </label>
              <select
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                value={adjWarehouse}
                onChange={(e) => setAdjWarehouse(e.target.value)}
              >
                <option value="wh-main">Raw Material Stores - Plant 1</option>
                <option value="wh-fg">Finished Goods Warehouse</option>
                <option value="wh-cons">General Consumables Rack</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Quantity *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 50"
                  value={adjQty}
                  onChange={(e) => setAdjQty(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Valuation Rate (₹) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 350.00"
                  value={adjRate}
                  onChange={(e) => setAdjRate(e.target.value)}
                  required
                />
              </div>
            </div>
            <ModalFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setIsAdjustmentOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white">
                Post to Stock Ledger
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
}
