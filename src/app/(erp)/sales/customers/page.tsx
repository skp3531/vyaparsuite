'use client';

import * as React from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  CreditCard,
  Building2,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpDown,
  Download,
  Copy,
  Check,
  Eye,
  FileText,
  ShieldAlert,
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

export interface Customer {
  id: string;
  customer_code: string;
  customer_name: string;
  customer_type: 'company' | 'individual';
  customer_group: 'Commercial' | 'Retail' | 'Government' | 'Export' | 'Distributor';
  territory: 'West Zone' | 'North Zone' | 'South Zone' | 'East Zone' | 'Export';
  gstin: string;
  pan: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  credit_limit: number;
  outstanding_balance: number;
  status: 'active' | 'inactive' | 'on_hold';
  payment_terms: string;
  created_at: string;
}

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    customer_code: 'CUST-2026-001',
    customer_name: 'Reliance Retail Industries Ltd',
    customer_type: 'company',
    customer_group: 'Commercial',
    territory: 'West Zone',
    gstin: '27AAACR5055K1Z8',
    pan: 'AAACR5055K',
    email: 'accounts@relianceretail.example.in',
    phone: '+91 22 4477 2000',
    city: 'Mumbai',
    state: 'Maharashtra',
    credit_limit: 2500000,
    outstanding_balance: 1845000,
    status: 'active',
    payment_terms: 'Net 30',
    created_at: '2026-01-15',
  },
  {
    id: 'cust-2',
    customer_code: 'CUST-2026-002',
    customer_name: 'Tata Consultancy Systems Infotech',
    customer_type: 'company',
    customer_group: 'Commercial',
    territory: 'West Zone',
    gstin: '27AAACT2727Q1ZW',
    pan: 'AAACT2727Q',
    email: 'procurement@tcsinfotech.example.in',
    phone: '+91 22 6778 9999',
    city: 'Pune',
    state: 'Maharashtra',
    credit_limit: 5000000,
    outstanding_balance: 1220000,
    status: 'active',
    payment_terms: 'Net 45',
    created_at: '2026-01-20',
  },
  {
    id: 'cust-3',
    customer_code: 'CUST-2026-003',
    customer_name: 'Bharat Heavy Electricals Unit',
    customer_type: 'company',
    customer_group: 'Government',
    territory: 'North Zone',
    gstin: '07AAACB1234F1Z2',
    pan: 'AAACB1234F',
    email: 'materials@bhelunit.example.gov.in',
    phone: '+91 11 2336 5500',
    city: 'New Delhi',
    state: 'Delhi',
    credit_limit: 10000000,
    outstanding_balance: 9400000,
    status: 'on_hold',
    payment_terms: 'Net 60',
    created_at: '2026-02-01',
  },
  {
    id: 'cust-4',
    customer_code: 'CUST-2026-004',
    customer_name: 'Infosys BPM Logistics Hub',
    customer_type: 'company',
    customer_group: 'Commercial',
    territory: 'South Zone',
    gstin: '29AAACI4915K1ZU',
    pan: 'AAACI4915K',
    email: 'finance@infosyslogistics.example.in',
    phone: '+91 80 2852 0261',
    city: 'Bengaluru',
    state: 'Karnataka',
    credit_limit: 3500000,
    outstanding_balance: 2950000,
    status: 'active',
    payment_terms: 'Net 30',
    created_at: '2026-02-10',
  },
  {
    id: 'cust-5',
    customer_code: 'CUST-2026-005',
    customer_name: 'Adani Logistics & Port Terminal',
    customer_type: 'company',
    customer_group: 'Commercial',
    territory: 'West Zone',
    gstin: '24AAACA1290C1ZB',
    pan: 'AAACA1290C',
    email: 'ap@adanilogistics.example.in',
    phone: '+91 79 2555 5555',
    city: 'Ahmedabad',
    state: 'Gujarat',
    credit_limit: 8000000,
    outstanding_balance: 3100000,
    status: 'active',
    payment_terms: 'Net 30',
    created_at: '2026-02-18',
  },
  {
    id: 'cust-6',
    customer_code: 'CUST-2026-006',
    customer_name: 'Mahindra Auto Dealership Network',
    customer_type: 'company',
    customer_group: 'Distributor',
    territory: 'North Zone',
    gstin: '06AAACM6677K1Z4',
    pan: 'AAACM6677K',
    email: 'vendor-cell@mahindranet.example.in',
    phone: '+91 124 456 7890',
    city: 'Gurugram',
    state: 'Haryana',
    credit_limit: 1500000,
    outstanding_balance: 1450000,
    status: 'on_hold',
    payment_terms: 'Net 15',
    created_at: '2026-03-01',
  },
  {
    id: 'cust-7',
    customer_code: 'CUST-2026-007',
    customer_name: 'Sun Pharma Distribution Hub',
    customer_type: 'company',
    customer_group: 'Distributor',
    territory: 'West Zone',
    gstin: '24AAACS3344D1ZA',
    pan: 'AAACS3344D',
    email: 'supply@sunpharmadist.example.in',
    phone: '+91 265 233 4455',
    city: 'Vadodara',
    state: 'Gujarat',
    credit_limit: 4000000,
    outstanding_balance: 850000,
    status: 'active',
    payment_terms: 'Net 30',
    created_at: '2026-03-12',
  },
  {
    id: 'cust-8',
    customer_code: 'CUST-2026-008',
    customer_name: 'Wipro Technologies Bangalore',
    customer_type: 'company',
    customer_group: 'Commercial',
    territory: 'South Zone',
    gstin: '29AAACW1234A1Z9',
    pan: 'AAACW1234A',
    email: 'ap@wiprotech.example.in',
    phone: '+91 80 2844 0011',
    city: 'Bengaluru',
    state: 'Karnataka',
    credit_limit: 6000000,
    outstanding_balance: 0,
    status: 'active',
    payment_terms: 'Net 45',
    created_at: '2026-03-25',
  },
  {
    id: 'cust-9',
    customer_code: 'CUST-2026-009',
    customer_name: 'Metro Cash & Carry India Retail',
    customer_type: 'company',
    customer_group: 'Retail',
    territory: 'North Zone',
    gstin: '07AAACM4455E1Z7',
    pan: 'AAACM4455E',
    email: 'purchase@metrocash.example.in',
    phone: '+91 11 4050 6070',
    city: 'New Delhi',
    state: 'Delhi',
    credit_limit: 2000000,
    outstanding_balance: 1980000,
    status: 'inactive',
    payment_terms: 'Immediate',
    created_at: '2026-04-02',
  },
  {
    id: 'cust-10',
    customer_code: 'CUST-2026-010',
    customer_name: 'Rajesh Sharma Traders',
    customer_type: 'individual',
    customer_group: 'Retail',
    territory: 'East Zone',
    gstin: '19AAPPS9876Q1Z3',
    pan: 'AAPPS9876Q',
    email: 'rajesh.traders@example.in',
    phone: '+91 98300 12345',
    city: 'Kolkata',
    state: 'West Bengal',
    credit_limit: 500000,
    outstanding_balance: 180000,
    status: 'active',
    payment_terms: 'Net 15',
    created_at: '2026-04-10',
  },
  {
    id: 'cust-11',
    customer_code: 'CUST-2026-011',
    customer_name: 'Apex Global Middle East FZE',
    customer_type: 'company',
    customer_group: 'Export',
    territory: 'Export',
    gstin: 'N/A (Export)',
    pan: 'AABCA9012E',
    email: 'orders@apexglobalfze.example.com',
    phone: '+971 4 330 9000',
    city: 'Dubai',
    state: 'International',
    credit_limit: 12000000,
    outstanding_balance: 4500000,
    status: 'active',
    payment_terms: 'Net 60',
    created_at: '2026-04-15',
  },
];

export default function CustomersPage() {
  const { toast } = useToast();

  const [customers, setCustomers] = React.useState<Customer[]>(INITIAL_CUSTOMERS);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [groupFilter, setGroupFilter] = React.useState<string>('all');
  const [territoryFilter, setTerritoryFilter] = React.useState<string>('all');
  const [sortField, setSortField] = React.useState<keyof Customer>('customer_name');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');

  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  // Quick Create Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [newCustomer, setNewCustomer] = React.useState<Partial<Customer>>({
    customer_type: 'company',
    customer_group: 'Commercial',
    territory: 'West Zone',
    status: 'active',
    payment_terms: 'Net 30',
    credit_limit: 1000000,
    outstanding_balance: 0,
    state: 'Maharashtra',
  });

  // Selected customer for quick view detail drawer
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);

  // Copied indicator state for GSTIN
  const [copiedGstin, setCopiedGstin] = React.useState<string | null>(null);

  // Filter and sort logic
  const filteredCustomers = React.useMemo(() => {
    return customers
      .filter((c) => {
        const matchesSearch =
          c.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.customer_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.gstin.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.phone.includes(searchTerm) ||
          c.email.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
        const matchesGroup = groupFilter === 'all' || c.customer_group === groupFilter;
        const matchesTerritory = territoryFilter === 'all' || c.territory === territoryFilter;

        return matchesSearch && matchesStatus && matchesGroup && matchesTerritory;
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
  }, [customers, searchTerm, statusFilter, groupFilter, territoryFilter, sortField, sortOrder]);

  // Paginated records
  const paginatedCustomers = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, currentPage, pageSize]);

  // Overall KPI metrics
  const totalReceivables = React.useMemo(() => {
    return customers.reduce((sum, c) => sum + c.outstanding_balance, 0);
  }, [customers]);

  const totalCreditLimit = React.useMemo(() => {
    return customers.reduce((sum, c) => sum + c.credit_limit, 0);
  }, [customers]);

  const onHoldCount = React.useMemo(() => {
    return customers.filter((c) => c.status === 'on_hold').length;
  }, [customers]);

  const activeCount = React.useMemo(() => {
    return customers.filter((c) => c.status === 'active').length;
  }, [customers]);

  // Handlers
  const handleSort = (field: keyof Customer) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleCopyGstin = (e: React.MouseEvent, gstin: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(gstin);
    setCopiedGstin(gstin);
    toast.success('GSTIN copied to clipboard', { duration: 2000 });
    setTimeout(() => setCopiedGstin(null), 2000);
  };

  const handleToggleHold = (e: React.MouseEvent, customer: Customer) => {
    e.stopPropagation();
    const nextStatus = customer.status === 'on_hold' ? 'active' : 'on_hold';
    setCustomers((prev) =>
      prev.map((c) => (c.id === customer.id ? { ...c, status: nextStatus } : c))
    );
    toast.info(
      `${customer.customer_name} status updated to ${nextStatus === 'on_hold' ? 'On Hold' : 'Active'}`
    );
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.customer_name?.trim()) {
      toast.error('Customer name is required');
      return;
    }

    const autoCode = `CUST-2026-${String(customers.length + 1).padStart(3, '0')}`;
    const created: Customer = {
      id: `cust-${Date.now()}`,
      customer_code: newCustomer.customer_code?.trim() || autoCode,
      customer_name: newCustomer.customer_name.trim(),
      customer_type: (newCustomer.customer_type as 'company' | 'individual') || 'company',
      customer_group: (newCustomer.customer_group as Customer['customer_group']) || 'Commercial',
      territory: (newCustomer.territory as Customer['territory']) || 'West Zone',
      gstin: newCustomer.gstin?.trim().toUpperCase() || 'URP (Unregistered)',
      pan: newCustomer.pan?.trim().toUpperCase() || (newCustomer.gstin ? newCustomer.gstin.slice(2, 12) : ''),
      email: newCustomer.email?.trim() || '',
      phone: newCustomer.phone?.trim() || '',
      city: newCustomer.city?.trim() || 'Mumbai',
      state: newCustomer.state?.trim() || 'Maharashtra',
      credit_limit: Number(newCustomer.credit_limit) || 1000000,
      outstanding_balance: Number(newCustomer.outstanding_balance) || 0,
      status: (newCustomer.status as Customer['status']) || 'active',
      payment_terms: newCustomer.payment_terms || 'Net 30',
      created_at: new Date().toISOString().split('T')[0],
    };

    setCustomers((prev) => [created, ...prev]);
    setIsCreateModalOpen(false);
    setNewCustomer({
      customer_type: 'company',
      customer_group: 'Commercial',
      territory: 'West Zone',
      status: 'active',
      payment_terms: 'Net 30',
      credit_limit: 1000000,
      outstanding_balance: 0,
      state: 'Maharashtra',
    });

    toast.success(`Customer ${created.customer_code} created successfully!`, {
      description: `${created.customer_name} added to ledger`,
    });
  };

  // Helper for Credit Limit Badge rendering
  const renderCreditBadge = (outstanding: number, limit: number) => {
    if (limit <= 0) {
      return (
        <span className="text-xs text-slate-400 font-mono">No Credit</span>
      );
    }
    const percent = Math.min(100, Math.round((outstanding / limit) * 100));
    const isExceeded = outstanding > limit;
    const isHigh = percent >= 80;

    let badgeVariant: 'success' | 'warning' | 'danger' = 'success';
    if (isExceeded || percent >= 90) {
      badgeVariant = 'danger';
    } else if (isHigh) {
      badgeVariant = 'warning';
    }

    return (
      <div className="flex flex-col gap-1 w-36">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-500 dark:text-slate-400 font-mono">
            {Decimal.from(limit).format({ currency: 'INR', places: 0 })}
          </span>
          <Badge variant={badgeVariant} size="xs">
            {percent}% used
          </Badge>
        </div>
        {/* Progress meter */}
        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              badgeVariant === 'danger'
                ? 'bg-red-500'
                : badgeVariant === 'warning'
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 rounded-lg border border-brand-200/60 dark:border-brand-800">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Customers Directory
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Manage debtor profiles, statutory GSTIN credentials, credit control policies, and receivables.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="h-3.5 w-3.5" />}
            onClick={() => toast.info('Exporting customer master data as CSV/XLSX...')}
          >
            Export
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<UserPlus className="h-3.5 w-3.5" />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            New Customer
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="default">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Accounts</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {customers.length}
              </h3>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> {activeCount} Active commercial debtors
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card variant="default">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Receivables</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {Decimal.from(totalReceivables).format({ currency: 'INR', places: 0 })}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Outstanding ledger balance
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CreditCard className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card variant="default">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Credit Exposure</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {Decimal.from(totalCreditLimit).format({ currency: 'INR', places: 0 })}
              </h3>
              <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5">
                {Math.round((totalReceivables / totalCreditLimit) * 100)}% overall utilization
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Building2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card variant="default">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Credit On Hold</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {onHoldCount}
              </h3>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1">
                <ShieldAlert className="h-3 w-3" /> Requires credit approval
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5" />
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
                placeholder="Search by customer name, code, GSTIN, city, phone..."
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
              <div className="w-36">
                <NativeSelect
                  size="sm"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="inactive">Inactive</option>
                </NativeSelect>
              </div>

              <div className="w-40">
                <NativeSelect
                  size="sm"
                  value={groupFilter}
                  onChange={(e) => {
                    setGroupFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">All Groups</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Distributor">Distributor</option>
                  <option value="Retail">Retail</option>
                  <option value="Government">Government</option>
                  <option value="Export">Export</option>
                </NativeSelect>
              </div>

              <div className="w-36">
                <NativeSelect
                  size="sm"
                  value={territoryFilter}
                  onChange={(e) => {
                    setTerritoryFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">All Territories</option>
                  <option value="West Zone">West Zone</option>
                  <option value="North Zone">North Zone</option>
                  <option value="South Zone">South Zone</option>
                  <option value="East Zone">East Zone</option>
                  <option value="Export">Export</option>
                </NativeSelect>
              </div>

              {(searchTerm || statusFilter !== 'all' || groupFilter !== 'all' || territoryFilter !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setGroupFilter('all');
                    setTerritoryFilter('all');
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

      {/* Customers Data Table */}
      {filteredCustomers.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8 text-slate-400" />}
          title="No customers match your criteria"
          description="Try modifying search keywords, resetting status or group filters, or register a new customer account."
          action={
            <Button
              variant="primary"
              size="sm"
              leftIcon={<UserPlus className="h-3.5 w-3.5" />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              Add New Customer
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          <Table density="dense" striped>
            <TableHeader sticky>
              <TableRow>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('customer_name')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Customer Details</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </TableHead>
                <TableHead>GSTIN & Identity</TableHead>
                <TableHead>Group & Territory</TableHead>
                <TableHead
                  className="cursor-pointer select-none text-right"
                  onClick={() => handleSort('outstanding_balance')}
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Outstanding (₹)</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </TableHead>
                <TableHead>Credit Limit & Usage</TableHead>
                <TableHead>Terms</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCustomers.map((customer) => {
                const isOverdue = customer.status === 'on_hold';
                return (
                  <TableRow
                    key={customer.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer"
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    {/* Customer Code & Name */}
                    <TableCell className="py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-semibold text-xs flex items-center justify-center shrink-0 border border-brand-200 dark:border-brand-800">
                          {customer.customer_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[220px]">
                            {customer.customer_name}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            <span className="font-mono text-slate-600 dark:text-slate-300">
                              {customer.customer_code}
                            </span>
                            <span>•</span>
                            <span>{customer.city}, {customer.state}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* GSTIN & PAN */}
                    <TableCell className="py-2.5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-slate-800 dark:text-slate-200">
                          <span>{customer.gstin}</span>
                          {customer.gstin !== 'N/A (Export)' && (
                            <button
                              type="button"
                              onClick={(e) => handleCopyGstin(e, customer.gstin)}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded transition-colors"
                              title="Copy GSTIN"
                            >
                              {copiedGstin === customer.gstin ? (
                                <Check className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          PAN: {customer.pan}
                        </div>
                      </div>
                    </TableCell>

                    {/* Group & Territory */}
                    <TableCell className="py-2.5">
                      <div className="space-y-0.5">
                        <Badge variant="outline" size="xs">
                          {customer.customer_group}
                        </Badge>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {customer.territory}
                        </div>
                      </div>
                    </TableCell>

                    {/* Outstanding Balance */}
                    <TableCell className="py-2.5 text-right font-mono font-semibold text-slate-900 dark:text-slate-100">
                      {Decimal.from(customer.outstanding_balance).format({ currency: 'INR' })}
                    </TableCell>

                    {/* Credit Limit Badge & Meter */}
                    <TableCell className="py-2.5">
                      {renderCreditBadge(customer.outstanding_balance, customer.credit_limit)}
                    </TableCell>

                    {/* Payment Terms */}
                    <TableCell className="py-2.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                      {customer.payment_terms}
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell className="py-2.5">
                      <Badge
                        variant={
                          customer.status === 'active'
                            ? 'success'
                            : customer.status === 'on_hold'
                            ? 'warning'
                            : 'draft'
                        }
                        size="xs"
                        dot
                      >
                        {customer.status === 'active'
                          ? 'Active'
                          : customer.status === 'on_hold'
                          ? 'On Hold'
                          : 'Inactive'}
                      </Badge>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setSelectedCustomer(customer)}
                          title="Quick View"
                        >
                          <Eye className="h-3.5 w-3.5 text-slate-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={(e) => handleToggleHold(e, customer)}
                          className={customer.status === 'on_hold' ? 'text-emerald-600' : 'text-amber-600'}
                          title={customer.status === 'on_hold' ? 'Release Hold' : 'Put On Hold'}
                        >
                          <ShieldAlert className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Pagination Component */}
          <div className="pt-2">
            <Pagination
              page={currentPage}
              totalRecords={filteredCustomers.length}
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
      )}

      {/* ============================================================== */}
      {/* QUICK CREATE CUSTOMER MODAL */}
      {/* ============================================================== */}
      <Modal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <ModalContent size="lg">
          <ModalHeader>
            <ModalTitle>Register New Customer</ModalTitle>
            <ModalDescription>
              Create customer record with statutory GSTIN, credit limits, and billing details.
            </ModalDescription>
          </ModalHeader>

          <form onSubmit={handleCreateCustomer} className="space-y-4">
            {/* Row 1: Name and Code */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <Input
                  label="Customer / Entity Legal Name *"
                  placeholder="e.g. Acme Engineering Works Pvt Ltd"
                  value={newCustomer.customer_name || ''}
                  onChange={(e) =>
                    setNewCustomer((prev) => ({ ...prev, customer_name: e.target.value }))
                  }
                  required
                  size="sm"
                />
              </div>
              <div>
                <Input
                  label="Customer Code"
                  placeholder="e.g. CUST-2026-012"
                  value={newCustomer.customer_code || ''}
                  onChange={(e) =>
                    setNewCustomer((prev) => ({ ...prev, customer_code: e.target.value }))
                  }
                  helperText="Leave blank to auto-generate"
                  size="sm"
                />
              </div>
            </div>

            {/* Row 2: Customer Group, Territory & Type */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <NativeSelect
                label="Customer Type"
                value={newCustomer.customer_type || 'company'}
                onChange={(e) =>
                  setNewCustomer((prev) => ({
                    ...prev,
                    customer_type: e.target.value as 'company' | 'individual',
                  }))
                }
                size="sm"
              >
                <option value="company">Corporate / Company</option>
                <option value="individual">Individual / Proprietor</option>
              </NativeSelect>

              <NativeSelect
                label="Customer Group"
                value={newCustomer.customer_group || 'Commercial'}
                onChange={(e) =>
                  setNewCustomer((prev) => ({
                    ...prev,
                    customer_group: e.target.value as Customer['customer_group'],
                  }))
                }
                size="sm"
              >
                <option value="Commercial">Commercial / B2B</option>
                <option value="Distributor">Distributor / Dealer</option>
                <option value="Retail">Retail Consumer</option>
                <option value="Government">Government / PSU</option>
                <option value="Export">Export / Overseas</option>
              </NativeSelect>

              <NativeSelect
                label="Territory / Sales Zone"
                value={newCustomer.territory || 'West Zone'}
                onChange={(e) =>
                  setNewCustomer((prev) => ({
                    ...prev,
                    territory: e.target.value as Customer['territory'],
                  }))
                }
                size="sm"
              >
                <option value="West Zone">West Zone</option>
                <option value="North Zone">North Zone</option>
                <option value="South Zone">South Zone</option>
                <option value="East Zone">East Zone</option>
                <option value="Export">International / Export</option>
              </NativeSelect>
            </div>

            {/* Row 3: GSTIN & PAN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="GSTIN (15 characters)"
                placeholder="27AAACR5055K1Z8"
                value={newCustomer.gstin || ''}
                onChange={(e) => {
                  const gstin = e.target.value.toUpperCase();
                  const pan = gstin.length >= 12 ? gstin.slice(2, 12) : newCustomer.pan;
                  setNewCustomer((prev) => ({ ...prev, gstin, pan }));
                }}
                maxLength={15}
                size="sm"
              />
              <Input
                label="Permanent Account Number (PAN)"
                placeholder="AAACR5055K"
                value={newCustomer.pan || ''}
                onChange={(e) =>
                  setNewCustomer((prev) => ({ ...prev, pan: e.target.value.toUpperCase() }))
                }
                maxLength={10}
                size="sm"
              />
            </div>

            {/* Row 4: Contact & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Official Contact Email"
                type="email"
                placeholder="accounts@customer.com"
                value={newCustomer.email || ''}
                onChange={(e) => setNewCustomer((prev) => ({ ...prev, email: e.target.value }))}
                size="sm"
              />
              <Input
                label="Mobile / Phone Number"
                placeholder="+91 98200 12345"
                value={newCustomer.phone || ''}
                onChange={(e) => setNewCustomer((prev) => ({ ...prev, phone: e.target.value }))}
                size="sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="City / District"
                placeholder="Mumbai"
                value={newCustomer.city || ''}
                onChange={(e) => setNewCustomer((prev) => ({ ...prev, city: e.target.value }))}
                size="sm"
              />
              <NativeSelect
                label="State / Province"
                value={newCustomer.state || 'Maharashtra'}
                onChange={(e) => setNewCustomer((prev) => ({ ...prev, state: e.target.value }))}
                size="sm"
              >
                <option value="Maharashtra">Maharashtra (27)</option>
                <option value="Gujarat">Gujarat (24)</option>
                <option value="Karnataka">Karnataka (29)</option>
                <option value="Delhi">Delhi (07)</option>
                <option value="Haryana">Haryana (06)</option>
                <option value="Tamil Nadu">Tamil Nadu (33)</option>
                <option value="West Bengal">West Bengal (19)</option>
                <option value="Telangana">Telangana (36)</option>
                <option value="Uttar Pradesh">Uttar Pradesh (09)</option>
                <option value="International">International (Overseas)</option>
              </NativeSelect>
            </div>

            {/* Row 5: Credit Limit & Terms */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
              <Input
                label="Credit Limit (INR ₹)"
                type="number"
                placeholder="1000000"
                value={newCustomer.credit_limit || ''}
                onChange={(e) =>
                  setNewCustomer((prev) => ({ ...prev, credit_limit: Number(e.target.value) }))
                }
                prefix="₹"
                size="sm"
              />
              <NativeSelect
                label="Default Payment Terms"
                value={newCustomer.payment_terms || 'Net 30'}
                onChange={(e) =>
                  setNewCustomer((prev) => ({ ...prev, payment_terms: e.target.value }))
                }
                size="sm"
              >
                <option value="Immediate">Immediate / Advance</option>
                <option value="Net 15">Net 15 Days</option>
                <option value="Net 30">Net 30 Days</option>
                <option value="Net 45">Net 45 Days</option>
                <option value="Net 60">Net 60 Days</option>
              </NativeSelect>
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
                Save & Register Customer
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* ============================================================== */}
      {/* QUICK VIEW DETAILS MODAL */}
      {/* ============================================================== */}
      {selectedCustomer && (
        <Modal open={Boolean(selectedCustomer)} onOpenChange={() => setSelectedCustomer(null)}>
          <ModalContent size="md">
            <ModalHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-bold text-sm flex items-center justify-center border border-brand-200 dark:border-brand-800">
                    {selectedCustomer.customer_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <ModalTitle>{selectedCustomer.customer_name}</ModalTitle>
                    <ModalDescription>{selectedCustomer.customer_code}</ModalDescription>
                  </div>
                </div>
                <Badge
                  variant={
                    selectedCustomer.status === 'active'
                      ? 'success'
                      : selectedCustomer.status === 'on_hold'
                      ? 'warning'
                      : 'draft'
                  }
                  size="sm"
                  dot
                >
                  {selectedCustomer.status.toUpperCase()}
                </Badge>
              </div>
            </ModalHeader>

            <div className="space-y-4 py-2 text-xs text-slate-700 dark:text-slate-300">
              {/* Financial Snapshot */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/60 dark:border-slate-800">
                <div>
                  <div className="text-slate-400 font-medium">Outstanding Receivables</div>
                  <div className="text-base font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">
                    {Decimal.from(selectedCustomer.outstanding_balance).format({ currency: 'INR' })}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 font-medium">Approved Credit Limit</div>
                  <div className="text-base font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">
                    {Decimal.from(selectedCustomer.credit_limit).format({ currency: 'INR' })}
                  </div>
                </div>
              </div>

              {/* Statutory details */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block">GSTIN:</span>
                  <span className="font-mono font-medium">{selectedCustomer.gstin}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">PAN:</span>
                  <span className="font-mono font-medium">{selectedCustomer.pan}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Customer Group:</span>
                  <span className="font-medium">{selectedCustomer.customer_group}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Territory:</span>
                  <span className="font-medium">{selectedCustomer.territory}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Payment Terms:</span>
                  <span className="font-medium">{selectedCustomer.payment_terms}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Registered Location:</span>
                  <span className="font-medium">{selectedCustomer.city}, {selectedCustomer.state}</span>
                </div>
              </div>

              {/* Contact Information */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span>{selectedCustomer.email || 'No email provided'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span>{selectedCustomer.phone || 'No phone provided'}</span>
                </div>
              </div>
            </div>

            <ModalFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCustomer(null)}
              >
                Close
              </Button>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<FileText className="h-3.5 w-3.5" />}
                onClick={() => {
                  toast.info(`Generating customer statement for ${selectedCustomer.customer_name}...`);
                  setSelectedCustomer(null);
                }}
              >
                View Statement
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
}
