'use client';

import * as React from 'react';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  Download,
  Eye,
  SlidersHorizontal,
  Package,
  Layers,
  TrendingUp,
  Tag,
  Warehouse,
  IndianRupee,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalClose,
  Input,
  NativeSelect,
  Pagination,
  EmptyState,
  useToast,
} from '@/components/ui';
import { Decimal } from '@/lib/utils/decimal';

export type ItemGroup =
  | 'Raw Material'
  | 'Finished Goods'
  | 'Consumables'
  | 'Sub-assembly'
  | 'Services'
  | 'Packaging';

export type ValuationMethod = 'FIFO' | 'Moving Average' | 'Standard Costing';

export type StockUOM = 'Nos' | 'Kg' | 'Litre' | 'Meter' | 'Box' | 'Set' | 'Pack';

export interface Item {
  id: string;
  item_code: string;
  item_name: string;
  item_group: ItemGroup;
  description: string;
  stock_uom: StockUOM;
  valuation_method: ValuationMethod;
  standard_rate: number; // Selling rate in INR
  valuation_rate: number; // Cost rate in INR
  current_stock: number;
  reorder_level: number;
  hsn_code: string;
  gst_rate: number; // Percentage (e.g. 18)
  default_warehouse: string;
  is_stock_item: boolean;
  created_at: string;
}

const INITIAL_ITEMS: Item[] = [
  {
    id: 'itm-1',
    item_code: 'ITM-FG-2026-001',
    item_name: 'Industrial Smart Power Distribution Unit 32A',
    item_group: 'Finished Goods',
    description: '3-phase rack-mount enterprise smart PDU with real-time IoT power telemetry and surge protection.',
    stock_uom: 'Nos',
    valuation_method: 'FIFO',
    standard_rate: 28500,
    valuation_rate: 19200,
    current_stock: 145,
    reorder_level: 30,
    hsn_code: '8537',
    gst_rate: 18,
    default_warehouse: 'Mumbai Central Assembly Depot',
    is_stock_item: true,
    created_at: '2026-01-10',
  },
  {
    id: 'itm-2',
    item_code: 'ITM-RAW-2026-002',
    item_name: 'Cold-Rolled Steel Sheet 2.5mm (Grade SS-304)',
    item_group: 'Raw Material',
    description: 'High-tensile corrosion-resistant stainless steel sheet for chassis fabrication.',
    stock_uom: 'Kg',
    valuation_method: 'Moving Average',
    standard_rate: 340,
    valuation_rate: 265,
    current_stock: 4250,
    reorder_level: 1000,
    hsn_code: '7219',
    gst_rate: 18,
    default_warehouse: 'Bhiwandi Raw Material Hub',
    is_stock_item: true,
    created_at: '2026-01-12',
  },
  {
    id: 'itm-3',
    item_code: 'ITM-SUB-2026-003',
    item_name: 'ARM Cortex Embedded Controller PCB Module',
    item_group: 'Sub-assembly',
    description: 'Dual-core MCU telemetry sub-board with RS485 Modbus and Gigabit Ethernet.',
    stock_uom: 'Nos',
    valuation_method: 'FIFO',
    standard_rate: 6800,
    valuation_rate: 4500,
    current_stock: 18,
    reorder_level: 40,
    hsn_code: '8542',
    gst_rate: 18,
    default_warehouse: 'Bengaluru Tech Spares Depot',
    is_stock_item: true,
    created_at: '2026-01-20',
  },
  {
    id: 'itm-4',
    item_code: 'ITM-CON-2026-004',
    item_name: 'High-Temperature Industrial Thermal Grease 100g',
    item_group: 'Consumables',
    description: 'Silicone-free heat sink compound with 8.5 W/mK thermal conductivity rating.',
    stock_uom: 'Pack',
    valuation_method: 'FIFO',
    standard_rate: 850,
    valuation_rate: 520,
    current_stock: 0,
    reorder_level: 25,
    hsn_code: '3824',
    gst_rate: 18,
    default_warehouse: 'Mumbai Central Assembly Depot',
    is_stock_item: true,
    created_at: '2026-02-01',
  },
  {
    id: 'itm-5',
    item_code: 'ITM-RAW-2026-005',
    item_name: 'Copper Busbar Strip 25mm x 5mm x 3m',
    item_group: 'Raw Material',
    description: 'High-conductivity 99.9% pure electrolytic tough pitch (ETP) copper bar.',
    stock_uom: 'Meter',
    valuation_method: 'Moving Average',
    standard_rate: 1250,
    valuation_rate: 980,
    current_stock: 620,
    reorder_level: 150,
    hsn_code: '7407',
    gst_rate: 18,
    default_warehouse: 'Bhiwandi Raw Material Hub',
    is_stock_item: true,
    created_at: '2026-02-14',
  },
  {
    id: 'itm-6',
    item_code: 'ITM-PKG-2026-006',
    item_name: 'Heavy Duty 7-Ply Corrugated Master Carton',
    item_group: 'Packaging',
    description: 'Double-wall Kraft paper shipping carton with reinforced strapping joints.',
    stock_uom: 'Box',
    valuation_method: 'FIFO',
    standard_rate: 180,
    valuation_rate: 115,
    current_stock: 1200,
    reorder_level: 300,
    hsn_code: '4819',
    gst_rate: 12,
    default_warehouse: 'Bhiwandi Raw Material Hub',
    is_stock_item: true,
    created_at: '2026-02-28',
  },
  {
    id: 'itm-7',
    item_code: 'ITM-FG-2026-007',
    item_name: 'Heavy Industrial Servo Voltage Stabilizer 50kVA',
    item_group: 'Finished Goods',
    description: 'Microcontroller balanced 3-phase oil-cooled automatic voltage stabilizer.',
    stock_uom: 'Nos',
    valuation_method: 'FIFO',
    standard_rate: 145000,
    valuation_rate: 98000,
    current_stock: 8,
    reorder_level: 10,
    hsn_code: '9032',
    gst_rate: 18,
    default_warehouse: 'Mumbai Central Assembly Depot',
    is_stock_item: true,
    created_at: '2026-03-05',
  },
  {
    id: 'itm-8',
    item_code: 'ITM-RAW-2026-008',
    item_name: 'Polyester Powder Coating Paint (Signal White RAL 9003)',
    item_group: 'Raw Material',
    description: 'Thermosetting TGIC-free polyester architectural exterior grade powder.',
    stock_uom: 'Kg',
    valuation_method: 'Standard Costing',
    standard_rate: 420,
    valuation_rate: 310,
    current_stock: 850,
    reorder_level: 200,
    hsn_code: '3907',
    gst_rate: 18,
    default_warehouse: 'Bhiwandi Raw Material Hub',
    is_stock_item: true,
    created_at: '2026-03-12',
  },
  {
    id: 'itm-9',
    item_code: 'ITM-SRV-2026-009',
    item_name: 'Annual Preventive Maintenance Contract (Onsite SLA)',
    item_group: 'Services',
    description: 'Tier-1 enterprise 24x7 electrical switchgear onsite maintenance & calibration.',
    stock_uom: 'Nos',
    valuation_method: 'Standard Costing',
    standard_rate: 55000,
    valuation_rate: 0,
    current_stock: 0,
    reorder_level: 0,
    hsn_code: '9987',
    gst_rate: 18,
    default_warehouse: 'N/A (Service Item)',
    is_stock_item: false,
    created_at: '2026-03-20',
  },
  {
    id: 'itm-10',
    item_code: 'ITM-SUB-2026-010',
    item_name: 'High Precision Shunt Resistor Assembly 200A',
    item_group: 'Sub-assembly',
    description: 'Manganin precision current sensing shunt with 0.1% tolerance.',
    stock_uom: 'Nos',
    valuation_method: 'FIFO',
    standard_rate: 1850,
    valuation_rate: 1200,
    current_stock: 12,
    reorder_level: 25,
    hsn_code: '8533',
    gst_rate: 18,
    default_warehouse: 'Bengaluru Tech Spares Depot',
    is_stock_item: true,
    created_at: '2026-04-02',
  },
];

export default function ItemsPage() {
  const { toast } = useToast();

  const [items, setItems] = React.useState<Item[]>(INITIAL_ITEMS);
  const [viewMode, setViewMode] = React.useState<'table' | 'grid'>('table');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [groupFilter, setGroupFilter] = React.useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = React.useState<string>('all');
  const [valuationFilter, setValuationFilter] = React.useState<string>('all');
  const [sortField, setSortField] = React.useState<keyof Item>('item_name');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');

  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  // Quick Create Item Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [newItem, setNewItem] = React.useState<Partial<Item>>({
    item_group: 'Finished Goods',
    stock_uom: 'Nos',
    valuation_method: 'FIFO',
    standard_rate: 1000,
    valuation_rate: 750,
    current_stock: 0,
    reorder_level: 10,
    hsn_code: '8471',
    gst_rate: 18,
    default_warehouse: 'Mumbai Central Assembly Depot',
    is_stock_item: true,
  });

  // Selected item for detail modal
  const [selectedItem, setSelectedItem] = React.useState<Item | null>(null);

  // Compute stock status helper
  const getStockStatus = (item: Item): 'in_stock' | 'low_stock' | 'out_of_stock' => {
    if (!item.is_stock_item) return 'in_stock';
    if (item.current_stock <= 0) return 'out_of_stock';
    if (item.current_stock <= item.reorder_level) return 'low_stock';
    return 'in_stock';
  };

  // Filter and sort items
  const filteredItems = React.useMemo(() => {
    return items
      .filter((item) => {
        const matchesSearch =
          item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.item_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.hsn_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesGroup = groupFilter === 'all' || item.item_group === groupFilter;
        const matchesValuation = valuationFilter === 'all' || item.valuation_method === valuationFilter;

        const status = getStockStatus(item);
        const matchesStatus =
          stockStatusFilter === 'all' ||
          (stockStatusFilter === 'in_stock' && status === 'in_stock') ||
          (stockStatusFilter === 'low_stock' && status === 'low_stock') ||
          (stockStatusFilter === 'out_of_stock' && status === 'out_of_stock');

        return matchesSearch && matchesGroup && matchesValuation && matchesStatus;
      })
      .sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        }
        return 0;
      });
  }, [items, searchTerm, groupFilter, valuationFilter, stockStatusFilter, sortField, sortOrder]);

  // Paginated records
  const paginatedItems = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  // Overall KPI metrics
  const totalStockValue = React.useMemo(() => {
    return items.reduce((sum, item) => {
      if (!item.is_stock_item) return sum;
      return sum + item.current_stock * item.valuation_rate;
    }, 0);
  }, [items]);

  const lowStockCount = React.useMemo(() => {
    return items.filter((item) => getStockStatus(item) === 'low_stock').length;
  }, [items]);

  const outOfStockCount = React.useMemo(() => {
    return items.filter((item) => getStockStatus(item) === 'out_of_stock').length;
  }, [items]);

  // Handlers
  const handleSort = (field: keyof Item) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.item_name?.trim()) {
      toast.error('Item name is required');
      return;
    }

    const autoCode = `ITM-${newItem.item_group?.slice(0, 3).toUpperCase()}-2026-${String(
      items.length + 1
    ).padStart(3, '0')}`;

    const created: Item = {
      id: `itm-${Date.now()}`,
      item_code: newItem.item_code?.trim() || autoCode,
      item_name: newItem.item_name.trim(),
      item_group: (newItem.item_group as ItemGroup) || 'Finished Goods',
      description: newItem.description?.trim() || 'Standard enterprise inventory item.',
      stock_uom: (newItem.stock_uom as StockUOM) || 'Nos',
      valuation_method: (newItem.valuation_method as ValuationMethod) || 'FIFO',
      standard_rate: Number(newItem.standard_rate) || 0,
      valuation_rate: Number(newItem.valuation_rate) || 0,
      current_stock: Number(newItem.current_stock) || 0,
      reorder_level: Number(newItem.reorder_level) || 0,
      hsn_code: newItem.hsn_code?.trim() || '8471',
      gst_rate: Number(newItem.gst_rate) || 18,
      default_warehouse: newItem.default_warehouse || 'Mumbai Central Assembly Depot',
      is_stock_item: newItem.is_stock_item !== undefined ? newItem.is_stock_item : true,
      created_at: new Date().toISOString().split('T')[0],
    };

    setItems((prev) => [created, ...prev]);
    setIsCreateModalOpen(false);
    setNewItem({
      item_group: 'Finished Goods',
      stock_uom: 'Nos',
      valuation_method: 'FIFO',
      standard_rate: 1000,
      valuation_rate: 750,
      current_stock: 0,
      reorder_level: 10,
      hsn_code: '8471',
      gst_rate: 18,
      default_warehouse: 'Mumbai Central Assembly Depot',
      is_stock_item: true,
    });

    toast.success(`Item ${created.item_code} created successfully!`, {
      description: `${created.item_name} added to stock catalog`,
    });
  };

  // Stock status pill component
  const renderStockStatusPill = (item: Item) => {
    if (!item.is_stock_item) {
      return (
        <Badge variant="outline" size="xs">
          Non-Stock Service
        </Badge>
      );
    }

    const status = getStockStatus(item);
    switch (status) {
      case 'in_stock':
        return (
          <Badge variant="success" size="xs" dot>
            In Stock ({item.current_stock} {item.stock_uom})
          </Badge>
        );
      case 'low_stock':
        return (
          <Badge variant="warning" size="xs" dot>
            Low Stock ({item.current_stock} / {item.reorder_level} {item.stock_uom})
          </Badge>
        );
      case 'out_of_stock':
        return (
          <Badge variant="danger" size="xs" dot>
            Out of Stock (0 {item.stock_uom})
          </Badge>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 rounded-lg border border-brand-200/60 dark:border-brand-800">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Item Catalog & Stock Registry
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Configure SKU master data, stock UOMs, valuation methods, INR rates, and inventory thresholds.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle Button */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Table Grid View"
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Catalog Card View"
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Catalog</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="h-3.5 w-3.5" />}
            onClick={() => toast.info('Exporting Item Catalog as CSV...')}
          >
            Export
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            New Item
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="default">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total SKUs</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {items.length}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Across 6 category groups
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Package className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card variant="default">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Inventory Asset Value</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {Decimal.from(totalStockValue).format({ currency: 'INR', places: 0 })}
              </h3>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                Current valuation (FIFO / Moving Avg)
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <IndianRupee className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card variant="default">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Low Stock Warnings</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {lowStockCount}
              </h3>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Reorder threshold reached
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card variant="default">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Out of Stock</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {outOfStockCount}
              </h3>
              <p className="text-[11px] text-red-600 dark:text-red-400 mt-0.5 flex items-center gap-1">
                <XCircle className="h-3 w-3" /> Zero inventory balance
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
              <XCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card variant="default">
        <CardContent className="p-3.5 space-y-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[260px]">
              <Input
                placeholder="Search by item code, name, description, HSN..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                prefix={<Search className="h-4 w-4 text-slate-400" />}
                clearable
                onClear={() => setSearchTerm('')}
                size="sm"
              />
            </div>

            {/* Quick Filter Selects */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-40">
                <NativeSelect
                  size="sm"
                  value={groupFilter}
                  onChange={(e) => {
                    setGroupFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">All Item Groups</option>
                  <option value="Finished Goods">Finished Goods</option>
                  <option value="Raw Material">Raw Material</option>
                  <option value="Sub-assembly">Sub-assembly</option>
                  <option value="Consumables">Consumables</option>
                  <option value="Packaging">Packaging</option>
                  <option value="Services">Services</option>
                </NativeSelect>
              </div>

              <div className="w-40">
                <NativeSelect
                  size="sm"
                  value={stockStatusFilter}
                  onChange={(e) => {
                    setStockStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">All Stock Statuses</option>
                  <option value="in_stock">In Stock</option>
                  <option value="low_stock">Low Stock (Reorder)</option>
                  <option value="out_of_stock">Out of Stock</option>
                </NativeSelect>
              </div>

              <div className="w-36">
                <NativeSelect
                  size="sm"
                  value={valuationFilter}
                  onChange={(e) => {
                    setValuationFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">All Valuations</option>
                  <option value="FIFO">FIFO</option>
                  <option value="Moving Average">Moving Avg</option>
                  <option value="Standard Costing">Std Costing</option>
                </NativeSelect>
              </div>

              {(searchTerm || groupFilter !== 'all' || stockStatusFilter !== 'all' || valuationFilter !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setGroupFilter('all');
                    setStockStatusFilter('all');
                    setValuationFilter('all');
                    setCurrentPage(1);
                  }}
                  className="text-xs text-brand-600 dark:text-brand-400"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main View Content (Table or Grid) */}
      {filteredItems.length === 0 ? (
        <EmptyState
          icon={<Boxes className="h-8 w-8 text-slate-400" />}
          title="No items found"
          description="Adjust your search filters or create a new SKU in your item catalog."
          action={
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              Add New Item
            </Button>
          }
        />
      ) : viewMode === 'table' ? (
        /* ============================================================== */
        /* TABLE VIEW */
        /* ============================================================== */
        <div className="space-y-3">
          <Table density="dense" striped>
            <TableHeader sticky>
              <TableRow>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('item_name')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Item & SKU Code</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </TableHead>
                <TableHead>Group</TableHead>
                <TableHead>HSN / Tax</TableHead>
                <TableHead>Stock UOM</TableHead>
                <TableHead>Valuation</TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('current_stock')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Stock Status</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none text-right"
                  onClick={() => handleSort('standard_rate')}
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Standard Rate (₹)</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </TableHead>
                <TableHead className="text-right">Total Asset Value</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map((item) => {
                const totalValue = item.is_stock_item ? item.current_stock * item.valuation_rate : 0;
                return (
                  <TableRow
                    key={item.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer"
                    onClick={() => setSelectedItem(item)}
                  >
                    {/* Item Name & Code */}
                    <TableCell className="py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 font-semibold text-xs flex items-center justify-center shrink-0 border border-brand-200 dark:border-brand-800">
                          <Package className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[240px]">
                            {item.item_name}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            {item.item_code}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Group */}
                    <TableCell className="py-2.5">
                      <Badge variant="outline" size="xs">
                        {item.item_group}
                      </Badge>
                    </TableCell>

                    {/* HSN & GST */}
                    <TableCell className="py-2.5">
                      <div className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300">
                        HSN {item.hsn_code}
                      </div>
                      <div className="text-[10px] text-slate-400">GST {item.gst_rate}%</div>
                    </TableCell>

                    {/* Stock UOM */}
                    <TableCell className="py-2.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                      {item.stock_uom}
                    </TableCell>

                    {/* Valuation Method */}
                    <TableCell className="py-2.5">
                      <Badge variant="secondary" size="xs">
                        {item.valuation_method}
                      </Badge>
                    </TableCell>

                    {/* Stock Status Pill */}
                    <TableCell className="py-2.5">
                      {renderStockStatusPill(item)}
                    </TableCell>

                    {/* Standard Rate in INR */}
                    <TableCell className="py-2.5 text-right font-mono font-semibold text-slate-900 dark:text-slate-100">
                      {Decimal.from(item.standard_rate).format({ currency: 'INR' })}
                      <span className="text-[10px] text-slate-400 font-normal ml-1">/ {item.stock_uom}</span>
                    </TableCell>

                    {/* Total Value */}
                    <TableCell className="py-2.5 text-right font-mono text-slate-700 dark:text-slate-300">
                      {item.is_stock_item ? Decimal.from(totalValue).format({ currency: 'INR' }) : '—'}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setSelectedItem(item)}
                          title="Quick View"
                        >
                          <Eye className="h-3.5 w-3.5 text-slate-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="pt-2">
            <Pagination
              page={currentPage}
              totalRecords={filteredItems.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
              pageSizeOptions={[5, 10, 25, 50]}
            />
          </div>
        </div>
      ) : (
        /* ============================================================== */
        /* CATALOG GRID VIEW */
        /* ============================================================== */
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedItems.map((item) => {
              const totalValue = item.is_stock_item ? item.current_stock * item.valuation_rate : 0;
              return (
                <Card
                  key={item.id}
                  variant="default"
                  hoverable
                  onClick={() => setSelectedItem(item)}
                  className="flex flex-col justify-between overflow-hidden"
                >
                  <CardContent className="p-4 space-y-3">
                    {/* Top Row: Group and Stock Status */}
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" size="xs">
                        {item.item_group}
                      </Badge>
                      {renderStockStatusPill(item)}
                    </div>

                    {/* Item Name & Code */}
                    <div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {item.item_code}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1 mt-0.5">
                        {item.item_name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                        {item.description}
                      </p>
                    </div>

                    {/* Rates & Stock Breakdown */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase tracking-wider">
                          Standard Selling Rate
                        </span>
                        <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                          {Decimal.from(item.standard_rate).format({ currency: 'INR' })}
                          <span className="text-[10px] text-slate-400 font-normal"> / {item.stock_uom}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase tracking-wider">
                          Valuation Method
                        </span>
                        <div className="font-medium text-slate-700 dark:text-slate-300">
                          {item.valuation_method}
                        </div>
                      </div>
                    </div>

                    {/* Warehouse & Total Asset Value */}
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-md border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <Warehouse className="h-3.5 w-3.5" />
                        <span className="truncate max-w-[140px] text-[11px]">
                          {item.default_warehouse}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Total Asset</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                          {item.is_stock_item ? Decimal.from(totalValue).format({ currency: 'INR' }) : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="pt-2">
            <Pagination
              page={currentPage}
              totalRecords={filteredItems.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
              pageSizeOptions={[6, 12, 24, 48]}
            />
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* QUICK CREATE ITEM MODAL */}
      {/* ============================================================== */}
      <Modal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <ModalContent size="lg">
          <ModalHeader>
            <ModalTitle>Register New Catalog Item / SKU</ModalTitle>
            <ModalDescription>
              Create inventory master record with stock UOM, statutory HSN/GST slab, and valuation parameters.
            </ModalDescription>
          </ModalHeader>

          <form onSubmit={handleCreateItem} className="space-y-4">
            {/* Row 1: Name and Code */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <Input
                  label="Item / SKU Name *"
                  placeholder="e.g. Industrial Sensor Hub V2"
                  value={newItem.item_name || ''}
                  onChange={(e) =>
                    setNewItem((prev) => ({ ...prev, item_name: e.target.value }))
                  }
                  required
                  size="sm"
                />
              </div>
              <div>
                <Input
                  label="Item Code (SKU)"
                  placeholder="e.g. ITM-FG-2026-011"
                  value={newItem.item_code || ''}
                  onChange={(e) =>
                    setNewItem((prev) => ({ ...prev, item_code: e.target.value }))
                  }
                  helperText="Auto-generated if empty"
                  size="sm"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <Input
                label="Item Specification / Description"
                placeholder="Technical specifications, dimensions, grade, and application..."
                value={newItem.description || ''}
                onChange={(e) =>
                  setNewItem((prev) => ({ ...prev, description: e.target.value }))
                }
                size="sm"
              />
            </div>

            {/* Row 2: Group, Stock UOM & Valuation Method */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <NativeSelect
                label="Item Group *"
                value={newItem.item_group || 'Finished Goods'}
                onChange={(e) =>
                  setNewItem((prev) => ({
                    ...prev,
                    item_group: e.target.value as ItemGroup,
                  }))
                }
                size="sm"
              >
                <option value="Finished Goods">Finished Goods</option>
                <option value="Raw Material">Raw Material</option>
                <option value="Sub-assembly">Sub-assembly</option>
                <option value="Consumables">Consumables</option>
                <option value="Packaging">Packaging</option>
                <option value="Services">Services (Non-stock)</option>
              </NativeSelect>

              <NativeSelect
                label="Stock UOM (Unit of Measure) *"
                value={newItem.stock_uom || 'Nos'}
                onChange={(e) =>
                  setNewItem((prev) => ({
                    ...prev,
                    stock_uom: e.target.value as StockUOM,
                  }))
                }
                size="sm"
              >
                <option value="Nos">Nos (Numbers / Pieces)</option>
                <option value="Kg">Kg (Kilograms)</option>
                <option value="Litre">Litre</option>
                <option value="Meter">Meter</option>
                <option value="Box">Box / Carton</option>
                <option value="Set">Set</option>
                <option value="Pack">Pack</option>
              </NativeSelect>

              <NativeSelect
                label="Valuation Method *"
                value={newItem.valuation_method || 'FIFO'}
                onChange={(e) =>
                  setNewItem((prev) => ({
                    ...prev,
                    valuation_method: e.target.value as ValuationMethod,
                  }))
                }
                size="sm"
              >
                <option value="FIFO">FIFO (First In First Out)</option>
                <option value="Moving Average">Moving Average</option>
                <option value="Standard Costing">Standard Costing</option>
              </NativeSelect>
            </div>

            {/* Row 3: Rates in INR */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200/60 dark:border-slate-800">
              <Input
                label="Standard Selling Rate (INR ₹) *"
                type="number"
                placeholder="2500"
                value={newItem.standard_rate || ''}
                onChange={(e) =>
                  setNewItem((prev) => ({ ...prev, standard_rate: Number(e.target.value) }))
                }
                prefix="₹"
                size="sm"
              />
              <Input
                label="Valuation / Purchase Cost Rate (INR ₹) *"
                type="number"
                placeholder="1800"
                value={newItem.valuation_rate || ''}
                onChange={(e) =>
                  setNewItem((prev) => ({ ...prev, valuation_rate: Number(e.target.value) }))
                }
                prefix="₹"
                size="sm"
              />
            </div>

            {/* Row 4: Statutory Tax & HSN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="HSN / SAC Code (4 to 8 digits)"
                placeholder="e.g. 8537"
                value={newItem.hsn_code || ''}
                onChange={(e) =>
                  setNewItem((prev) => ({ ...prev, hsn_code: e.target.value }))
                }
                size="sm"
              />
              <NativeSelect
                label="GST Tax Slab (%)"
                value={String(newItem.gst_rate || 18)}
                onChange={(e) =>
                  setNewItem((prev) => ({ ...prev, gst_rate: Number(e.target.value) }))
                }
                size="sm"
              >
                <option value="0">0% (Nil / Exempted)</option>
                <option value="5">5% GST</option>
                <option value="12">12% GST</option>
                <option value="18">18% GST (Standard)</option>
                <option value="28">28% GST</option>
              </NativeSelect>
            </div>

            {/* Row 5: Stock Controls & Warehouse */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Initial Stock Qty"
                type="number"
                placeholder="0"
                value={newItem.current_stock || ''}
                onChange={(e) =>
                  setNewItem((prev) => ({ ...prev, current_stock: Number(e.target.value) }))
                }
                size="sm"
              />
              <Input
                label="Reorder Alert Threshold"
                type="number"
                placeholder="20"
                value={newItem.reorder_level || ''}
                onChange={(e) =>
                  setNewItem((prev) => ({ ...prev, reorder_level: Number(e.target.value) }))
                }
                size="sm"
              />
              <NativeSelect
                label="Default Warehouse"
                value={newItem.default_warehouse || 'Mumbai Central Assembly Depot'}
                onChange={(e) =>
                  setNewItem((prev) => ({ ...prev, default_warehouse: e.target.value }))
                }
                size="sm"
              >
                <option value="Mumbai Central Assembly Depot">Mumbai Central Assembly Depot</option>
                <option value="Bhiwandi Raw Material Hub">Bhiwandi Raw Material Hub</option>
                <option value="Bengaluru Tech Spares Depot">Bengaluru Tech Spares Depot</option>
                <option value="Delhi NCR Regional Store">Delhi NCR Regional Store</option>
              </NativeSelect>
            </div>

            {/* Stock item checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="stock-item-flag"
                checked={Boolean(newItem.is_stock_item)}
                onChange={(e) =>
                  setNewItem((prev) => ({ ...prev, is_stock_item: e.target.checked }))
                }
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
              />
              <label htmlFor="stock-item-flag" className="text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                Maintain Stock Ledger for this item (Uncheck for services or non-inventory billing)
              </label>
            </div>

            <ModalFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save & Register SKU
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* ============================================================== */}
      {/* QUICK VIEW DETAILS MODAL */}
      {/* ============================================================== */}
      {selectedItem && (
        <Modal open={Boolean(selectedItem)} onOpenChange={() => setSelectedItem(null)}>
          <ModalContent size="md">
            <ModalHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 font-bold text-sm flex items-center justify-center border border-brand-200 dark:border-brand-800">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <ModalTitle>{selectedItem.item_name}</ModalTitle>
                    <ModalDescription>{selectedItem.item_code}</ModalDescription>
                  </div>
                </div>
                {renderStockStatusPill(selectedItem)}
              </div>
            </ModalHeader>

            <div className="space-y-4 py-2 text-xs text-slate-700 dark:text-slate-300">
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {selectedItem.description}
              </p>

              {/* Financial Snapshot */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/60 dark:border-slate-800">
                <div>
                  <div className="text-slate-400 font-medium">Standard Selling Rate</div>
                  <div className="text-base font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">
                    {Decimal.from(selectedItem.standard_rate).format({ currency: 'INR' })} / {selectedItem.stock_uom}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 font-medium">Valuation / Cost Rate</div>
                  <div className="text-base font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">
                    {Decimal.from(selectedItem.valuation_rate).format({ currency: 'INR' })} / {selectedItem.stock_uom}
                  </div>
                </div>
              </div>

              {/* Item Parameters */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block">Category Group:</span>
                  <span className="font-medium">{selectedItem.item_group}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Unit of Measure (UOM):</span>
                  <span className="font-medium">{selectedItem.stock_uom}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">HSN / SAC Code:</span>
                  <span className="font-mono font-medium">{selectedItem.hsn_code} (GST {selectedItem.gst_rate}%)</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Valuation Method:</span>
                  <span className="font-medium">{selectedItem.valuation_method}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Current Stock:</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                    {selectedItem.current_stock} {selectedItem.stock_uom}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Reorder Alert Level:</span>
                  <span className="font-mono font-medium text-amber-600 dark:text-amber-400">
                    {selectedItem.reorder_level} {selectedItem.stock_uom}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block">Primary Warehouse:</span>
                  <span className="font-medium flex items-center gap-1.5 mt-0.5">
                    <Warehouse className="h-3.5 w-3.5 text-slate-400" />
                    <span>{selectedItem.default_warehouse}</span>
                  </span>
                </div>
              </div>
            </div>

            <ModalFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedItem(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                onClick={() => {
                  toast.info(`Opening Stock Movement Entry for ${selectedItem.item_name}...`);
                  setSelectedItem(null);
                }}
              >
                Stock Entry
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
}
