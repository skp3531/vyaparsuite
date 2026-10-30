'use client';

import * as React from 'react';
import {
  ShoppingCart,
  UserPlus,
  Search,
  Filter,
  CreditCard,
  Building,
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
  ShieldCheck,
  Star,
  Banknote,
  Landmark,
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

export interface Supplier {
  id: string;
  supplier_code: string;
  supplier_name: string;
  supplier_group: 'Raw Material' | 'Packaging' | 'Services' | 'OEM & Components' | 'Logistics' | 'Capital Goods';
  gstin: string;
  pan: string;
  msme_registered: boolean;
  msme_reg_no?: string;
  msme_category?: 'Micro' | 'Small' | 'Medium';
  contact_person: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  payment_terms: string;
  outstanding_payables: number;
  rating: number;
  status: 'active' | 'inactive' | 'blacklisted' | 'pending_kyc';
  bank_name: string;
  bank_account_no: string;
  ifsc_code: string;
  created_at: string;
}

const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-1',
    supplier_code: 'SUP-2026-001',
    supplier_name: 'Jindal Steel & Alloys Corp',
    supplier_group: 'Raw Material',
    gstin: '27AAACJ8888P1ZZ',
    pan: 'AAACJ8888P',
    msme_registered: false,
    contact_person: 'Vikram Jindal',
    email: 'sales@jindalalloys.example.in',
    phone: '+91 22 6600 4400',
    city: 'Navi Mumbai',
    state: 'Maharashtra',
    payment_terms: 'Net 30',
    outstanding_payables: 3450000,
    rating: 4.8,
    status: 'active',
    bank_name: 'State Bank of India',
    bank_account_no: '30291827364',
    ifsc_code: 'SBIN0000300',
    created_at: '2026-01-10',
  },
  {
    id: 'sup-2',
    supplier_code: 'SUP-2026-002',
    supplier_name: 'Packwell Corrugated Containers Pvt Ltd',
    supplier_group: 'Packaging',
    gstin: '24AAACP4411K1Z2',
    pan: 'AAACP4411K',
    msme_registered: true,
    msme_reg_no: 'UDYAM-GJ-01-0045123',
    msme_category: 'Small',
    contact_person: 'Dharmesh Patel',
    email: 'orders@packwellbox.example.in',
    phone: '+91 265 244 5566',
    city: 'Vadodara',
    state: 'Gujarat',
    payment_terms: 'Net 45',
    outstanding_payables: 620000,
    rating: 4.5,
    status: 'active',
    bank_name: 'HDFC Bank',
    bank_account_no: '50200045678912',
    ifsc_code: 'HDFC0000123',
    created_at: '2026-01-18',
  },
  {
    id: 'sup-3',
    supplier_code: 'SUP-2026-003',
    supplier_name: 'Precision Micro Parts & Fasteners',
    supplier_group: 'OEM & Components',
    gstin: '29AAACP9900L1Z5',
    pan: 'AAACP9900L',
    msme_registered: true,
    msme_reg_no: 'UDYAM-KR-03-0089124',
    msme_category: 'Micro',
    contact_person: 'Ganesh Rao',
    email: 'precision.fasteners@example.in',
    phone: '+91 80 2797 1234',
    city: 'Peenya, Bengaluru',
    state: 'Karnataka',
    payment_terms: 'Net 15',
    outstanding_payables: 280000,
    rating: 4.9,
    status: 'active',
    bank_name: 'Canara Bank',
    bank_account_no: '0129201004512',
    ifsc_code: 'CNRB0000129',
    created_at: '2026-02-05',
  },
  {
    id: 'sup-4',
    supplier_code: 'SUP-2026-004',
    supplier_name: 'Gati-KWE Supply Chain Logistics',
    supplier_group: 'Logistics',
    gstin: '36AAACG1234M1ZX',
    pan: 'AAACG1234M',
    msme_registered: false,
    contact_person: 'Srinivas Reddy',
    email: 'corporate.billing@gatikwe.example.in',
    phone: '+91 40 2784 4401',
    city: 'Hyderabad',
    state: 'Telangana',
    payment_terms: 'Net 30',
    outstanding_payables: 890000,
    rating: 4.2,
    status: 'active',
    bank_name: 'ICICI Bank',
    bank_account_no: '000405012345',
    ifsc_code: 'ICIC0000004',
    created_at: '2026-02-12',
  },
  {
    id: 'sup-5',
    supplier_code: 'SUP-2026-005',
    supplier_name: 'Schneider Electric Automation India',
    supplier_group: 'Capital Goods',
    gstin: '07AAACS7788P1Z0',
    pan: 'AAACS7788P',
    msme_registered: false,
    contact_person: 'Ananya Roy',
    email: 'india.orders@se-automation.example.in',
    phone: '+91 11 4151 7000',
    city: 'New Delhi',
    state: 'Delhi',
    payment_terms: 'Net 60',
    outstanding_payables: 5200000,
    rating: 4.7,
    status: 'active',
    bank_name: 'Citibank N.A.',
    bank_account_no: '0012345678',
    ifsc_code: 'CITI0000002',
    created_at: '2026-02-20',
  },
  {
    id: 'sup-6',
    supplier_code: 'SUP-2026-006',
    supplier_name: 'Apex Industrial Chemicals & Solvents',
    supplier_group: 'Raw Material',
    gstin: '27AAACA9922K1Z9',
    pan: 'AAACA9922K',
    msme_registered: true,
    msme_reg_no: 'UDYAM-MH-12-0099881',
    msme_category: 'Medium',
    contact_person: 'Manish Joshi',
    email: 'supply@apexchemicals.example.in',
    phone: '+91 22 2580 9090',
    city: 'Thane',
    state: 'Maharashtra',
    payment_terms: 'Net 30',
    outstanding_payables: 1450000,
    rating: 3.8,
    status: 'pending_kyc',
    bank_name: 'Axis Bank',
    bank_account_no: '918020034567812',
    ifsc_code: 'UTIB0000045',
    created_at: '2026-03-04',
  },
  {
    id: 'sup-7',
    supplier_code: 'SUP-2026-007',
    supplier_name: 'Kirloskar Heavy Tooling & Dies',
    supplier_group: 'OEM & Components',
    gstin: '27AAACK1122D1Z1',
    pan: 'AAACK1122D',
    msme_registered: false,
    contact_person: 'Santosh Shinde',
    email: 'tooling@kirloskarworks.example.in',
    phone: '+91 20 2747 4411',
    city: 'Pune',
    state: 'Maharashtra',
    payment_terms: 'Net 45',
    outstanding_payables: 1850000,
    rating: 4.6,
    status: 'active',
    bank_name: 'Bank of Baroda',
    bank_account_no: '04210200001234',
    ifsc_code: 'BARB0POONAX',
    created_at: '2026-03-15',
  },
  {
    id: 'sup-8',
    supplier_code: 'SUP-2026-008',
    supplier_name: 'Falcon Security & Facility Management',
    supplier_group: 'Services',
    gstin: '06AAACF5566L1Z4',
    pan: 'AAACF5566L',
    msme_registered: true,
    msme_reg_no: 'UDYAM-HR-05-0012984',
    msme_category: 'Small',
    contact_person: 'Rajiv Chawla',
    email: 'admin@falconservices.example.in',
    phone: '+91 124 400 1122',
    city: 'Gurugram',
    state: 'Haryana',
    payment_terms: 'Net 15',
    outstanding_payables: 310000,
    rating: 4.1,
    status: 'active',
    bank_name: 'Punjab National Bank',
    bank_account_no: '1234002100056789',
    ifsc_code: 'PUNB0123400',
    created_at: '2026-03-22',
  },
  {
    id: 'sup-9',
    supplier_code: 'SUP-2026-009',
    supplier_name: 'Shree Balaji Polymers & Resins',
    supplier_group: 'Raw Material',
    gstin: '24AAAPS1234E1Z3',
    pan: 'AAAPS1234E',
    msme_registered: true,
    msme_reg_no: 'UDYAM-GJ-02-0055412',
    msme_category: 'Micro',
    contact_person: 'Ramesh Shah',
    email: 'balajipolymers@example.in',
    phone: '+91 260 244 7788',
    city: 'Vapi',
    state: 'Gujarat',
    payment_terms: 'Immediate',
    outstanding_payables: 0,
    rating: 2.5,
    status: 'blacklisted',
    bank_name: 'Union Bank of India',
    bank_account_no: '315201010045678',
    ifsc_code: 'UBIN0531529',
    created_at: '2026-04-01',
  },
  {
    id: 'sup-10',
    supplier_code: 'SUP-2026-010',
    supplier_name: 'Tata Consultancy Cloud & IT Services',
    supplier_group: 'Services',
    gstin: '27AAACT2727Q1ZW',
    pan: 'AAACT2727Q',
    msme_registered: false,
    contact_person: 'Karthik Raman',
    email: 'cloud.billing@tatait.example.in',
    phone: '+91 22 6778 2000',
    city: 'Mumbai',
    state: 'Maharashtra',
    payment_terms: 'Net 30',
    outstanding_payables: 1100000,
    rating: 4.9,
    status: 'active',
    bank_name: 'HDFC Bank',
    bank_account_no: '50200099887766',
    ifsc_code: 'HDFC0000060',
    created_at: '2026-04-12',
  },
];

export default function SuppliersPage() {
  const { toast } = useToast();

  const [suppliers, setSuppliers] = React.useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [groupFilter, setGroupFilter] = React.useState<string>('all');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [msmeOnly, setMsmeOnly] = React.useState<boolean>(false);
  const [sortField, setSortField] = React.useState<keyof Supplier>('supplier_name');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');

  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  // Quick Create Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [newSupplier, setNewSupplier] = React.useState<Partial<Supplier>>({
    supplier_group: 'Raw Material',
    status: 'active',
    payment_terms: 'Net 30',
    msme_registered: false,
    msme_category: 'Small',
    outstanding_payables: 0,
    rating: 5.0,
    state: 'Maharashtra',
  });

  // Selected supplier for detail modal
  const [selectedSupplier, setSelectedSupplier] = React.useState<Supplier | null>(null);

  // GSTIN copy state
  const [copiedGstin, setCopiedGstin] = React.useState<string | null>(null);

  // Filter and sort logic
  const filteredSuppliers = React.useMemo(() => {
    return suppliers
      .filter((s) => {
        const matchesSearch =
          s.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.supplier_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.gstin.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.email.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesGroup = groupFilter === 'all' || s.supplier_group === groupFilter;
        const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
        const matchesMsme = !msmeOnly || s.msme_registered;

        return matchesSearch && matchesGroup && matchesStatus && matchesMsme;
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
  }, [suppliers, searchTerm, groupFilter, statusFilter, msmeOnly, sortField, sortOrder]);

  // Paginated records
  const paginatedSuppliers = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSuppliers.slice(start, start + pageSize);
  }, [filteredSuppliers, currentPage, pageSize]);

  // KPI Metrics
  const totalPayables = React.useMemo(() => {
    return suppliers.reduce((sum, s) => sum + s.outstanding_payables, 0);
  }, [suppliers]);

  const activeCount = React.useMemo(() => {
    return suppliers.filter((s) => s.status === 'active').length;
  }, [suppliers]);

  const msmeCount = React.useMemo(() => {
    return suppliers.filter((s) => s.msme_registered).length;
  }, [suppliers]);

  const pendingKycCount = React.useMemo(() => {
    return suppliers.filter((s) => s.status === 'pending_kyc').length;
  }, [suppliers]);

  // Handlers
  const handleSort = (field: keyof Supplier) => {
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

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplier.supplier_name?.trim()) {
      toast.error('Supplier name is required');
      return;
    }

    const autoCode = `SUP-2026-${String(suppliers.length + 1).padStart(3, '0')}`;
    const created: Supplier = {
      id: `sup-${Date.now()}`,
      supplier_code: newSupplier.supplier_code?.trim() || autoCode,
      supplier_name: newSupplier.supplier_name.trim(),
      supplier_group: (newSupplier.supplier_group as Supplier['supplier_group']) || 'Raw Material',
      gstin: newSupplier.gstin?.trim().toUpperCase() || 'URP (Unregistered)',
      pan: newSupplier.pan?.trim().toUpperCase() || (newSupplier.gstin ? newSupplier.gstin.slice(2, 12) : ''),
      msme_registered: Boolean(newSupplier.msme_registered),
      msme_reg_no: newSupplier.msme_registered ? newSupplier.msme_reg_no : undefined,
      msme_category: newSupplier.msme_registered ? newSupplier.msme_category : undefined,
      contact_person: newSupplier.contact_person?.trim() || '',
      email: newSupplier.email?.trim() || '',
      phone: newSupplier.phone?.trim() || '',
      city: newSupplier.city?.trim() || 'Mumbai',
      state: newSupplier.state?.trim() || 'Maharashtra',
      payment_terms: newSupplier.payment_terms || 'Net 30',
      outstanding_payables: Number(newSupplier.outstanding_payables) || 0,
      rating: 5.0,
      status: (newSupplier.status as Supplier['status']) || 'active',
      bank_name: newSupplier.bank_name?.trim() || 'HDFC Bank',
      bank_account_no: newSupplier.bank_account_no?.trim() || '',
      ifsc_code: newSupplier.ifsc_code?.trim().toUpperCase() || '',
      created_at: new Date().toISOString().split('T')[0],
    };

    setSuppliers((prev) => [created, ...prev]);
    setIsCreateModalOpen(false);
    setNewSupplier({
      supplier_group: 'Raw Material',
      status: 'active',
      payment_terms: 'Net 30',
      msme_registered: false,
      msme_category: 'Small',
      outstanding_payables: 0,
      rating: 5.0,
      state: 'Maharashtra',
    });

    toast.success(`Supplier ${created.supplier_code} registered!`, {
      description: `${created.supplier_name} added to vendor accounts`,
    });
  };

  const getStatusBadge = (status: Supplier['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" size="xs" dot>Active</Badge>;
      case 'pending_kyc':
        return <Badge variant="warning" size="xs" dot>Pending KYC</Badge>;
      case 'blacklisted':
        return <Badge variant="danger" size="xs" dot>Blacklisted</Badge>;
      case 'inactive':
      default:
        return <Badge variant="draft" size="xs" dot>Inactive</Badge>;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 rounded-lg border border-brand-200/60 dark:border-brand-800">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Suppliers & Vendors Directory
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Manage vendor profiles, MSME Udyam credentials, statutory payment terms, and accounts payable.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="h-3.5 w-3.5" />}
            onClick={() => toast.info('Exporting supplier registry...')}
          >
            Export
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<UserPlus className="h-3.5 w-3.5" />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            New Supplier
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="default">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Suppliers</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {suppliers.length}
              </h3>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> {activeCount} Active procurement vendors
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Building className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card variant="default">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Accounts Payable</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {Decimal.from(totalPayables).format({ currency: 'INR', places: 0 })}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Outstanding dues to vendors
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Banknote className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card variant="default">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">MSME Registered</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {msmeCount}
              </h3>
              <p className="text-[11px] text-purple-600 dark:text-purple-400 mt-0.5 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> 45-day statutory CARO tracking
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card variant="default">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Pending KYC / Review</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {pendingKycCount}
              </h3>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Awaiting bank & tax verification
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center">
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
                placeholder="Search by supplier name, code, GSTIN, contact person..."
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
              <div className="w-44">
                <NativeSelect
                  size="sm"
                  value={groupFilter}
                  onChange={(e) => {
                    setGroupFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">All Vendor Groups</option>
                  <option value="Raw Material">Raw Material</option>
                  <option value="Packaging">Packaging</option>
                  <option value="OEM & Components">OEM & Components</option>
                  <option value="Logistics">Logistics</option>
                  <option value="Capital Goods">Capital Goods</option>
                  <option value="Services">Services & Maintenance</option>
                </NativeSelect>
              </div>

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
                  <option value="pending_kyc">Pending KYC</option>
                  <option value="blacklisted">Blacklisted</option>
                  <option value="inactive">Inactive</option>
                </NativeSelect>
              </div>

              {/* MSME Toggle Button */}
              <Button
                variant={msmeOnly ? 'primary' : 'outline'}
                size="sm"
                leftIcon={<ShieldCheck className="h-3.5 w-3.5" />}
                onClick={() => setMsmeOnly((prev) => !prev)}
              >
                MSME Only
              </Button>

              {(searchTerm || groupFilter !== 'all' || statusFilter !== 'all' || msmeOnly) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setGroupFilter('all');
                    setStatusFilter('all');
                    setMsmeOnly(false);
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

      {/* Suppliers Data Table */}
      {filteredSuppliers.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart className="h-8 w-8 text-slate-400" />}
          title="No suppliers match your search"
          description="Adjust your search keywords or group filter, or add a new supplier profile."
          action={
            <Button
              variant="primary"
              size="sm"
              leftIcon={<UserPlus className="h-3.5 w-3.5" />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              Add New Supplier
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
                  onClick={() => handleSort('supplier_name')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Supplier / Vendor</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </TableHead>
                <TableHead>Group & Category</TableHead>
                <TableHead>GSTIN & MSME Status</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead
                  className="cursor-pointer select-none text-right"
                  onClick={() => handleSort('outstanding_payables')}
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Payables Due (₹)</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </TableHead>
                <TableHead>Terms</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSuppliers.map((supplier) => {
                return (
                  <TableRow
                    key={supplier.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer"
                    onClick={() => setSelectedSupplier(supplier)}
                  >
                    {/* Supplier Code & Name */}
                    <TableCell className="py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                          {supplier.supplier_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[220px]">
                            {supplier.supplier_name}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            <span className="font-mono text-slate-600 dark:text-slate-300">
                              {supplier.supplier_code}
                            </span>
                            <span>•</span>
                            <span>{supplier.city}, {supplier.state}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Group & Classification */}
                    <TableCell className="py-2.5">
                      <Badge variant="outline" size="xs">
                        {supplier.supplier_group}
                      </Badge>
                    </TableCell>

                    {/* GSTIN & MSME Status */}
                    <TableCell className="py-2.5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-slate-800 dark:text-slate-200">
                          <span>{supplier.gstin}</span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyGstin(e, supplier.gstin)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded transition-colors"
                            title="Copy GSTIN"
                          >
                            {copiedGstin === supplier.gstin ? (
                              <Check className="h-3 w-3 text-emerald-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                        <div>
                          {supplier.msme_registered ? (
                            <Badge variant="success" size="xs">
                              MSME ({supplier.msme_category})
                            </Badge>
                          ) : (
                            <span className="text-[10px] text-slate-400">Non-MSME</span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Contact Person */}
                    <TableCell className="py-2.5">
                      <div className="space-y-0.5">
                        <div className="font-medium text-slate-800 dark:text-slate-200 text-xs">
                          {supplier.contact_person}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                          {supplier.email}
                        </div>
                      </div>
                    </TableCell>

                    {/* Outstanding Payables */}
                    <TableCell className="py-2.5 text-right font-mono font-semibold text-slate-900 dark:text-slate-100">
                      {Decimal.from(supplier.outstanding_payables).format({ currency: 'INR' })}
                    </TableCell>

                    {/* Payment Terms */}
                    <TableCell className="py-2.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                      {supplier.payment_terms}
                    </TableCell>

                    {/* Rating */}
                    <TableCell className="py-2.5">
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {supplier.rating.toFixed(1)}
                        </span>
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="py-2.5">
                      {getStatusBadge(supplier.status)}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setSelectedSupplier(supplier)}
                          title="View Details"
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
              totalRecords={filteredSuppliers.length}
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
      {/* QUICK CREATE SUPPLIER MODAL */}
      {/* ============================================================== */}
      <Modal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <ModalContent size="lg">
          <ModalHeader>
            <ModalTitle>Register New Supplier / Vendor</ModalTitle>
            <ModalDescription>
              Create vendor master profile with GSTIN, MSME Udyam credentials, and banking details.
            </ModalDescription>
          </ModalHeader>

          <form onSubmit={handleCreateSupplier} className="space-y-4">
            {/* Row 1: Name and Code */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <Input
                  label="Supplier Legal Entity Name *"
                  placeholder="e.g. Bharat Components Manufacturing Ltd"
                  value={newSupplier.supplier_name || ''}
                  onChange={(e) =>
                    setNewSupplier((prev) => ({ ...prev, supplier_name: e.target.value }))
                  }
                  required
                  size="sm"
                />
              </div>
              <div>
                <Input
                  label="Supplier Code"
                  placeholder="e.g. SUP-2026-011"
                  value={newSupplier.supplier_code || ''}
                  onChange={(e) =>
                    setNewSupplier((prev) => ({ ...prev, supplier_code: e.target.value }))
                  }
                  helperText="Auto-generated if empty"
                  size="sm"
                />
              </div>
            </div>

            {/* Row 2: Group & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <NativeSelect
                label="Supplier Group *"
                value={newSupplier.supplier_group || 'Raw Material'}
                onChange={(e) =>
                  setNewSupplier((prev) => ({
                    ...prev,
                    supplier_group: e.target.value as Supplier['supplier_group'],
                  }))
                }
                size="sm"
              >
                <option value="Raw Material">Raw Material</option>
                <option value="Packaging">Packaging</option>
                <option value="OEM & Components">OEM & Components</option>
                <option value="Logistics">Logistics & Transportation</option>
                <option value="Capital Goods">Capital Goods / Machinery</option>
                <option value="Services">Services & Maintenance</option>
              </NativeSelect>

              <NativeSelect
                label="Initial Account Status"
                value={newSupplier.status || 'active'}
                onChange={(e) =>
                  setNewSupplier((prev) => ({
                    ...prev,
                    status: e.target.value as Supplier['status'],
                  }))
                }
                size="sm"
              >
                <option value="active">Active Vendor</option>
                <option value="pending_kyc">Pending KYC Review</option>
                <option value="inactive">Inactive</option>
              </NativeSelect>

              <NativeSelect
                label="Payment Terms"
                value={newSupplier.payment_terms || 'Net 30'}
                onChange={(e) =>
                  setNewSupplier((prev) => ({ ...prev, payment_terms: e.target.value }))
                }
                size="sm"
              >
                <option value="Immediate">Immediate / Advance</option>
                <option value="Net 15">Net 15 Days</option>
                <option value="Net 30">Net 30 Days</option>
                <option value="Net 45">Net 45 Days (MSME Mandate)</option>
                <option value="Net 60">Net 60 Days</option>
              </NativeSelect>
            </div>

            {/* Row 3: Statutory Tax & MSME */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="GSTIN (15 characters)"
                placeholder="27AAACJ8888P1ZZ"
                value={newSupplier.gstin || ''}
                onChange={(e) => {
                  const gstin = e.target.value.toUpperCase();
                  const pan = gstin.length >= 12 ? gstin.slice(2, 12) : newSupplier.pan;
                  setNewSupplier((prev) => ({ ...prev, gstin, pan }));
                }}
                maxLength={15}
                size="sm"
              />
              <Input
                label="PAN Number"
                placeholder="AAACJ8888P"
                value={newSupplier.pan || ''}
                onChange={(e) =>
                  setNewSupplier((prev) => ({ ...prev, pan: e.target.value.toUpperCase() }))
                }
                maxLength={10}
                size="sm"
              />
            </div>

            {/* MSME Section */}
            <div className="p-3 bg-purple-50/50 dark:bg-purple-950/20 rounded-lg border border-purple-200/50 dark:border-purple-900/50 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="msme-checkbox"
                  checked={Boolean(newSupplier.msme_registered)}
                  onChange={(e) =>
                    setNewSupplier((prev) => ({ ...prev, msme_registered: e.target.checked }))
                  }
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
                />
                <label htmlFor="msme-checkbox" className="text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                  Vendor is Registered under MSMED Act (Udyam Registered)
                </label>
              </div>

              {newSupplier.msme_registered && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in-fade">
                  <Input
                    label="Udyam Registration Number *"
                    placeholder="UDYAM-MH-01-0012345"
                    value={newSupplier.msme_reg_no || ''}
                    onChange={(e) =>
                      setNewSupplier((prev) => ({ ...prev, msme_reg_no: e.target.value }))
                    }
                    size="sm"
                  />
                  <NativeSelect
                    label="MSME Enterprise Classification"
                    value={newSupplier.msme_category || 'Small'}
                    onChange={(e) =>
                      setNewSupplier((prev) => ({
                        ...prev,
                        msme_category: e.target.value as Supplier['msme_category'],
                      }))
                    }
                    size="sm"
                  >
                    <option value="Micro">Micro Enterprise (Invest &lt; ₹1 Cr)</option>
                    <option value="Small">Small Enterprise (Invest &lt; ₹10 Cr)</option>
                    <option value="Medium">Medium Enterprise (Invest &lt; ₹50 Cr)</option>
                  </NativeSelect>
                </div>
              )}
            </div>

            {/* Row 4: Contact & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Contact Person Name"
                placeholder="Mr. Suresh Rao"
                value={newSupplier.contact_person || ''}
                onChange={(e) =>
                  setNewSupplier((prev) => ({ ...prev, contact_person: e.target.value }))
                }
                size="sm"
              />
              <Input
                label="Contact Email"
                type="email"
                placeholder="sales@supplier.com"
                value={newSupplier.email || ''}
                onChange={(e) => setNewSupplier((prev) => ({ ...prev, email: e.target.value }))}
                size="sm"
              />
              <Input
                label="Mobile Phone"
                placeholder="+91 98200 45678"
                value={newSupplier.phone || ''}
                onChange={(e) => setNewSupplier((prev) => ({ ...prev, phone: e.target.value }))}
                size="sm"
              />
            </div>

            {/* Row 5: Bank Details for Remittance */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200/60 dark:border-slate-800 space-y-2">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Landmark className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
                <span>Bank Details (For NEFT / RTGS Remittance)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="Bank Name"
                  placeholder="HDFC Bank"
                  value={newSupplier.bank_name || ''}
                  onChange={(e) =>
                    setNewSupplier((prev) => ({ ...prev, bank_name: e.target.value }))
                  }
                  size="sm"
                />
                <Input
                  label="Account Number"
                  placeholder="50200012345678"
                  value={newSupplier.bank_account_no || ''}
                  onChange={(e) =>
                    setNewSupplier((prev) => ({ ...prev, bank_account_no: e.target.value }))
                  }
                  size="sm"
                />
                <Input
                  label="IFSC Code"
                  placeholder="HDFC0000123"
                  value={newSupplier.ifsc_code || ''}
                  onChange={(e) =>
                    setNewSupplier((prev) => ({ ...prev, ifsc_code: e.target.value.toUpperCase() }))
                  }
                  maxLength={11}
                  size="sm"
                />
              </div>
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
                Save & Register Vendor
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* ============================================================== */}
      {/* QUICK VIEW DETAILS MODAL */}
      {/* ============================================================== */}
      {selectedSupplier && (
        <Modal open={Boolean(selectedSupplier)} onOpenChange={() => setSelectedSupplier(null)}>
          <ModalContent size="md">
            <ModalHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm flex items-center justify-center border border-slate-200 dark:border-slate-700">
                    {selectedSupplier.supplier_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <ModalTitle>{selectedSupplier.supplier_name}</ModalTitle>
                    <ModalDescription>{selectedSupplier.supplier_code}</ModalDescription>
                  </div>
                </div>
                {getStatusBadge(selectedSupplier.status)}
              </div>
            </ModalHeader>

            <div className="space-y-4 py-2 text-xs text-slate-700 dark:text-slate-300">
              {/* Financial Snapshot */}
              <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 rounded-lg border border-amber-200/60 dark:border-amber-900/40">
                <div className="text-amber-800 dark:text-amber-400 font-medium">Outstanding Accounts Payable</div>
                <div className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">
                  {Decimal.from(selectedSupplier.outstanding_payables).format({ currency: 'INR' })}
                </div>
              </div>

              {/* Statutory details */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block">GSTIN:</span>
                  <span className="font-mono font-medium">{selectedSupplier.gstin}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">PAN:</span>
                  <span className="font-mono font-medium">{selectedSupplier.pan}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Vendor Group:</span>
                  <span className="font-medium">{selectedSupplier.supplier_group}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Payment Terms:</span>
                  <span className="font-medium">{selectedSupplier.payment_terms}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">MSME Classification:</span>
                  <span className="font-medium">
                    {selectedSupplier.msme_registered
                      ? `Registered (${selectedSupplier.msme_category}) - ${selectedSupplier.msme_reg_no}`
                      : 'Not Registered'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Location:</span>
                  <span className="font-medium">{selectedSupplier.city}, {selectedSupplier.state}</span>
                </div>
              </div>

              {/* Banking Details */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/60 dark:border-slate-800 space-y-1">
                <div className="text-slate-400 font-semibold flex items-center gap-1.5">
                  <Landmark className="h-3 w-3" />
                  <span>Remittance Banking Info</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Bank:</span>
                    <span>{selectedSupplier.bank_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">IFSC:</span>
                    <span>{selectedSupplier.ifsc_code}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[11px]">Account #:</span>
                    <span>{selectedSupplier.bank_account_no}</span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="font-medium text-slate-800 dark:text-slate-200">
                  {selectedSupplier.contact_person}
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span>{selectedSupplier.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span>{selectedSupplier.phone}</span>
                </div>
              </div>
            </div>

            <ModalFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedSupplier(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<FileText className="h-3.5 w-3.5" />}
                onClick={() => {
                  toast.info(`Opening Purchase Order creator for ${selectedSupplier.supplier_name}...`);
                  setSelectedSupplier(null);
                }}
              >
                Create PO
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
}
