'use client';

import * as React from 'react';
import {
  Building2,
  Save,
  CheckCircle2,
  MapPin,
  GitBranch,
  Calendar,
  CreditCard,
  Scale,
  ShieldCheck,
  Plus,
  Trash2,
  Edit,
  ExternalLink,
  Globe,
  Mail,
  Phone,
  FileText,
  Landmark,
  Upload,
  Check,
  AlertCircle,
  Copy,
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Badge,
  Input,
  NativeSelect,
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  useToast,
} from '@/components/ui';

export interface CompanyProfile {
  legal_name: string;
  trade_name: string;
  company_code: string;
  cin: string;
  incorporation_date: string;
  pan: string;
  tan: string;
  industry: string;
  email: string;
  phone: string;
  website: string;
}

export interface StatutorySettings {
  primary_gstin: string;
  gst_state: string;
  registration_type: string;
  einvoice_enabled: boolean;
  eway_bill_threshold: number;
  msme_registered: boolean;
  msme_udyam_no: string;
  msme_category: string;
  caro_compliance_locked: boolean;
}

export interface FinancialSettings {
  base_currency: string;
  currency_symbol: string;
  number_format: 'lakhs' | 'millions';
  rounding_precision: number;
  valuation_method: 'FIFO' | 'Moving Average' | 'Standard Costing';
  default_bank_account: string;
  coa_template: string;
}

export interface FiscalYear {
  id: string;
  year_name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_closed: boolean;
}

export interface CompanyAddress {
  id: string;
  title: string;
  address_type: 'Registered HQ' | 'Corporate Office' | 'Factory Plant' | 'Warehouse';
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  gstin: string;
  is_default_billing: boolean;
  is_default_shipping: boolean;
}

export interface CompanyBranch {
  id: string;
  branch_code: string;
  branch_name: string;
  state: string;
  manager_name: string;
  phone: string;
  cost_center: string;
  is_active: boolean;
}

export default function CompanySetupPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState('profile');
  const [isSaving, setIsSaving] = React.useState(false);

  // 1. Profile State
  const [profile, setProfile] = React.useState<CompanyProfile>({
    legal_name: 'VyaparSuite Enterprise Technologies Private Limited',
    trade_name: 'VyaparSuite ERP',
    company_code: 'VS-CORP',
    cin: 'U72900MH2024PTC123456',
    incorporation_date: '2024-01-15',
    pan: 'AAACR5055K',
    tan: 'MUMA12345B',
    industry: 'Enterprise Software & Manufacturing Technology',
    email: 'compliance@vyaparsuite.example.in',
    phone: '+91 22 4477 2000',
    website: 'https://vyaparsuite.example.in',
  });

  // 2. Statutory State
  const [statutory, setStatutory] = React.useState<StatutorySettings>({
    primary_gstin: '27AAACR5055K1Z8',
    gst_state: 'Maharashtra (27)',
    registration_type: 'Regular Taxpayer',
    einvoice_enabled: true,
    eway_bill_threshold: 50000,
    msme_registered: true,
    msme_udyam_no: 'UDYAM-MH-01-0089234',
    msme_category: 'Medium Enterprise',
    caro_compliance_locked: true,
  });

  // 3. Financial Settings
  const [financials, setFinancials] = React.useState<FinancialSettings>({
    base_currency: 'INR',
    currency_symbol: '₹',
    number_format: 'lakhs',
    rounding_precision: 2,
    valuation_method: 'FIFO',
    default_bank_account: 'HDFC Bank Current A/c #502000',
    coa_template: 'Indian Standard Corporate CoA (Ind AS)',
  });

  // 4. Fiscal Years
  const [fiscalYears, setFiscalYears] = React.useState<FiscalYear[]>([
    {
      id: 'fy-2026',
      year_name: 'FY 2026-2027',
      start_date: '2026-04-01',
      end_date: '2027-03-31',
      is_active: true,
      is_closed: false,
    },
    {
      id: 'fy-2025',
      year_name: 'FY 2025-2026',
      start_date: '2025-04-01',
      end_date: '2026-03-31',
      is_active: false,
      is_closed: true,
    },
    {
      id: 'fy-2024',
      year_name: 'FY 2024-2025',
      start_date: '2024-04-01',
      end_date: '2025-03-31',
      is_active: false,
      is_closed: true,
    },
  ]);

  // 5. Addresses
  const [addresses, setAddresses] = React.useState<CompanyAddress[]>([
    {
      id: 'addr-1',
      title: 'Registered Corporate Headquarters',
      address_type: 'Registered HQ',
      line1: 'Maker Chamber V, 14th Floor, Nariman Point',
      line2: 'Free Press Journal Marg',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400021',
      gstin: '27AAACR5055K1Z8',
      is_default_billing: true,
      is_default_shipping: false,
    },
    {
      id: 'addr-2',
      title: 'Central Logistics & Assembly Warehouse',
      address_type: 'Warehouse',
      line1: 'Bhiwandi Industrial Logistics Park, Unit 4B',
      line2: 'Mumbai-Nashik Highway',
      city: 'Thane',
      state: 'Maharashtra',
      pincode: '421302',
      gstin: '27AAACR5055K1Z8',
      is_default_billing: false,
      is_default_shipping: true,
    },
    {
      id: 'addr-3',
      title: 'Bengaluru Technology Campus',
      address_type: 'Corporate Office',
      line1: 'EPIP Zone, Whitefield Technology Park',
      line2: 'Phase II, Ground Floor',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560066',
      gstin: '29AAACR5055K1ZU',
      is_default_billing: false,
      is_default_shipping: false,
    },
  ]);

  // 6. Branches
  const [branches, setBranches] = React.useState<CompanyBranch[]>([
    {
      id: 'br-1',
      branch_code: 'BR-MUM-HQ',
      branch_name: 'Mumbai Central Headquarters',
      state: 'Maharashtra',
      manager_name: 'Rajesh Kulkarni',
      phone: '+91 22 4477 2100',
      cost_center: 'CC-MUM-EXEC',
      is_active: true,
    },
    {
      id: 'br-2',
      branch_code: 'BR-BLR-DEV',
      branch_name: 'Bengaluru Technology Centre',
      state: 'Karnataka',
      manager_name: 'Ananya Rao',
      phone: '+91 80 2852 3000',
      cost_center: 'CC-BLR-RND',
      is_active: true,
    },
    {
      id: 'br-3',
      branch_code: 'BR-DEL-SALES',
      branch_name: 'Delhi NCR Regional Hub',
      state: 'Haryana',
      manager_name: 'Vikram Batra',
      phone: '+91 124 456 7000',
      cost_center: 'CC-DEL-SLS',
      is_active: true,
    },
    {
      id: 'br-4',
      branch_code: 'BR-CHN-DEPOT',
      branch_name: 'Chennai Logistics Depot',
      state: 'Tamil Nadu',
      manager_name: 'Senthil Nathan',
      phone: '+91 44 2490 8000',
      cost_center: 'CC-CHN-LOG',
      is_active: true,
    },
  ]);

  // Modal States
  const [isAddAddressModalOpen, setIsAddAddressModalOpen] = React.useState(false);
  const [newAddress, setNewAddress] = React.useState<Partial<CompanyAddress>>({
    address_type: 'Warehouse',
    state: 'Maharashtra',
    is_default_billing: false,
    is_default_shipping: false,
  });

  const [isAddBranchModalOpen, setIsAddBranchModalOpen] = React.useState(false);
  const [newBranch, setNewBranch] = React.useState<Partial<CompanyBranch>>({
    state: 'Maharashtra',
    is_active: true,
  });

  const [isAddFiscalYearModalOpen, setIsAddFiscalYearModalOpen] = React.useState(false);
  const [newFiscalYear, setNewFiscalYear] = React.useState<Partial<FiscalYear>>({
    is_active: false,
    is_closed: false,
  });

  // Save handler with realistic spinner simulation
  const handleSaveAll = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Company Configuration Saved Successfully', {
        description: 'Organizational master settings and statutory parameters synchronized.',
      });
    }, 700);
  };

  // Add Address Handler
  const handleCreateAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.title || !newAddress.line1 || !newAddress.city) {
      toast.error('Address Title, Line 1, and City are required');
      return;
    }

    const created: CompanyAddress = {
      id: `addr-${Date.now()}`,
      title: newAddress.title,
      address_type: (newAddress.address_type as CompanyAddress['address_type']) || 'Warehouse',
      line1: newAddress.line1,
      line2: newAddress.line2 || '',
      city: newAddress.city,
      state: newAddress.state || 'Maharashtra',
      pincode: newAddress.pincode || '',
      gstin: newAddress.gstin || statutory.primary_gstin,
      is_default_billing: Boolean(newAddress.is_default_billing),
      is_default_shipping: Boolean(newAddress.is_default_shipping),
    };

    setAddresses((prev) => [...prev, created]);
    setIsAddAddressModalOpen(false);
    setNewAddress({
      address_type: 'Warehouse',
      state: 'Maharashtra',
      is_default_billing: false,
      is_default_shipping: false,
    });
    toast.success(`Address "${created.title}" added successfully!`);
  };

  // Add Branch Handler
  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranch.branch_name || !newBranch.branch_code) {
      toast.error('Branch Name and Code are required');
      return;
    }

    const created: CompanyBranch = {
      id: `br-${Date.now()}`,
      branch_code: newBranch.branch_code.toUpperCase(),
      branch_name: newBranch.branch_name,
      state: newBranch.state || 'Maharashtra',
      manager_name: newBranch.manager_name || '',
      phone: newBranch.phone || '',
      cost_center: newBranch.cost_center || `CC-${newBranch.branch_code.toUpperCase()}`,
      is_active: newBranch.is_active !== undefined ? newBranch.is_active : true,
    };

    setBranches((prev) => [...prev, created]);
    setIsAddBranchModalOpen(false);
    setNewBranch({
      state: 'Maharashtra',
      is_active: true,
    });
    toast.success(`Branch "${created.branch_name}" registered successfully!`);
  };

  // Add Fiscal Year Handler
  const handleCreateFiscalYear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFiscalYear.year_name || !newFiscalYear.start_date || !newFiscalYear.end_date) {
      toast.error('Year Name, Start Date, and End Date are required');
      return;
    }

    const created: FiscalYear = {
      id: `fy-${Date.now()}`,
      year_name: newFiscalYear.year_name,
      start_date: newFiscalYear.start_date,
      end_date: newFiscalYear.end_date,
      is_active: Boolean(newFiscalYear.is_active),
      is_closed: false,
    };

    setFiscalYears((prev) => [created, ...prev]);
    setIsAddFiscalYearModalOpen(false);
    setNewFiscalYear({ is_active: false, is_closed: false });
    toast.success(`Fiscal Year "${created.year_name}" created!`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 rounded-lg border border-brand-200/60 dark:border-brand-800">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Company Setup & Enterprise Profile
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Manage organization profile, statutory GSTIN, default currency, fiscal calendar, addresses, and branches.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            isLoading={isSaving}
            leftIcon={<Save className="h-3.5 w-3.5" />}
            onClick={handleSaveAll}
          >
            Save All Changes
          </Button>
        </div>
      </div>

      {/* Guided Setup Progress Card */}
      <Card variant="default" className="bg-gradient-to-r from-brand-50/50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border-brand-200/60 dark:border-slate-800">
        <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
                Setup Progress: 92% Completed
              </span>
              <Badge variant="success" size="xs">
                CARO 2020 Compliant
              </Badge>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {profile.legal_name} ({profile.company_code})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Corporate CIN: <span className="font-mono text-slate-700 dark:text-slate-300">{profile.cin}</span> • PAN: <span className="font-mono text-slate-700 dark:text-slate-300">{profile.pan}</span>
            </p>
          </div>

          {/* Progress meter */}
          <div className="w-full md:w-64 space-y-1.5 shrink-0">
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
              <span>Configuration Health</span>
              <span>11 / 12 Verified</span>
            </div>
            <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-brand-600 rounded-full transition-all duration-500" style={{ width: '92%' }} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Navigation Structure */}
      <Tabs value={activeTab} onValueChange={setActiveTab} variant="pills">
        <TabsList className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl flex-wrap">
          <TabsTrigger value="profile" className="text-xs gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            <span>Profile & Legal</span>
          </TabsTrigger>
          <TabsTrigger value="gstin" className="text-xs gap-1.5">
            <Scale className="h-3.5 w-3.5" />
            <span>GSTIN & Statutory</span>
          </TabsTrigger>
          <TabsTrigger value="financials" className="text-xs gap-1.5">
            <CreditCard className="h-3.5 w-3.5" />
            <span>Currency & Valuation</span>
          </TabsTrigger>
          <TabsTrigger value="fiscal" className="text-xs gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>Fiscal Years ({fiscalYears.length})</span>
          </TabsTrigger>
          <TabsTrigger value="addresses" className="text-xs gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            <span>Addresses ({addresses.length})</span>
          </TabsTrigger>
          <TabsTrigger value="branches" className="text-xs gap-1.5">
            <GitBranch className="h-3.5 w-3.5" />
            <span>Branches ({branches.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* ============================================================== */}
        {/* TAB 1: COMPANY PROFILE */}
        {/* ============================================================== */}
        <TabsContent value="profile" className="space-y-4 pt-2">
          <Card variant="default">
            <CardHeader bordered>
              <CardTitle className="text-sm font-bold">Legal Corporate Entity Identity</CardTitle>
              <CardDescription className="text-xs">
                Official company registration information per Ministry of Corporate Affairs (MCA).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <Input
                    label="Legal Entity Registered Name *"
                    value={profile.legal_name}
                    onChange={(e) => setProfile((p) => ({ ...p, legal_name: e.target.value }))}
                    size="sm"
                  />
                </div>
                <div>
                  <Input
                    label="Company Code / Prefix *"
                    value={profile.company_code}
                    onChange={(e) => setProfile((p) => ({ ...p, company_code: e.target.value }))}
                    size="sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Input
                    label="Trade / Brand Name"
                    value={profile.trade_name}
                    onChange={(e) => setProfile((p) => ({ ...p, trade_name: e.target.value }))}
                    size="sm"
                  />
                </div>
                <div>
                  <Input
                    label="Corporate Identification Number (CIN) *"
                    value={profile.cin}
                    onChange={(e) => setProfile((p) => ({ ...p, cin: e.target.value.toUpperCase() }))}
                    size="sm"
                  />
                </div>
                <div>
                  <Input
                    label="Date of Incorporation"
                    type="date"
                    value={profile.incorporation_date}
                    onChange={(e) => setProfile((p) => ({ ...p, incorporation_date: e.target.value }))}
                    size="sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Input
                    label="Permanent Account Number (PAN) *"
                    value={profile.pan}
                    onChange={(e) => setProfile((p) => ({ ...p, pan: e.target.value.toUpperCase() }))}
                    maxLength={10}
                    size="sm"
                  />
                </div>
                <div>
                  <Input
                    label="Tax Deduction Account (TAN)"
                    value={profile.tan}
                    onChange={(e) => setProfile((p) => ({ ...p, tan: e.target.value.toUpperCase() }))}
                    maxLength={10}
                    size="sm"
                  />
                </div>
                <div>
                  <Input
                    label="Industry Sector"
                    value={profile.industry}
                    onChange={(e) => setProfile((p) => ({ ...p, industry: e.target.value }))}
                    size="sm"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Input
                    label="Official Corporate Email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                    prefix={<Mail className="h-3.5 w-3.5 text-slate-400" />}
                    size="sm"
                  />
                </div>
                <div>
                  <Input
                    label="Telephone / EPABX"
                    value={profile.phone}
                    onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                    prefix={<Phone className="h-3.5 w-3.5 text-slate-400" />}
                    size="sm"
                  />
                </div>
                <div>
                  <Input
                    label="Website URL"
                    value={profile.website}
                    onChange={(e) => setProfile((p) => ({ ...p, website: e.target.value }))}
                    prefix={<Globe className="h-3.5 w-3.5 text-slate-400" />}
                    size="sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB 2: GSTIN & STATUTORY TAX */}
        {/* ============================================================== */}
        <TabsContent value="gstin" className="space-y-4 pt-2">
          <Card variant="default">
            <CardHeader bordered>
              <CardTitle className="text-sm font-bold">Goods & Services Tax (GST) Configuration</CardTitle>
              <CardDescription className="text-xs">
                Statutory GSTIN credentials for e-Invoicing, E-Way bills, and MCA CARO 2020 compliance.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Input
                    label="Primary Principal GSTIN *"
                    value={statutory.primary_gstin}
                    onChange={(e) =>
                      setStatutory((s) => ({ ...s, primary_gstin: e.target.value.toUpperCase() }))
                    }
                    maxLength={15}
                    size="sm"
                  />
                </div>
                <div>
                  <NativeSelect
                    label="Home State Jurisdiction"
                    value={statutory.gst_state}
                    onChange={(e) => setStatutory((s) => ({ ...s, gst_state: e.target.value }))}
                    size="sm"
                  >
                    <option value="Maharashtra (27)">Maharashtra (27)</option>
                    <option value="Gujarat (24)">Gujarat (24)</option>
                    <option value="Karnataka (29)">Karnataka (29)</option>
                    <option value="Delhi (07)">Delhi (07)</option>
                    <option value="Haryana (06)">Haryana (06)</option>
                    <option value="Tamil Nadu (33)">Tamil Nadu (33)</option>
                  </NativeSelect>
                </div>
                <div>
                  <NativeSelect
                    label="Taxpayer Registration Category"
                    value={statutory.registration_type}
                    onChange={(e) =>
                      setStatutory((s) => ({ ...s, registration_type: e.target.value }))
                    }
                    size="sm"
                  >
                    <option value="Regular Taxpayer">Regular Taxpayer (Monthly / Quarterly)</option>
                    <option value="Composition Scheme">Composition Taxpayer</option>
                    <option value="SEZ Unit">SEZ Unit (Special Economic Zone)</option>
                  </NativeSelect>
                </div>
              </div>

              {/* E-Invoicing and E-Way Bill Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200/60 dark:border-slate-800">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="einvoice-check"
                      checked={statutory.einvoice_enabled}
                      onChange={(e) =>
                        setStatutory((s) => ({ ...s, einvoice_enabled: e.target.checked }))
                      }
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
                    />
                    <label htmlFor="einvoice-check" className="text-xs font-bold text-slate-900 dark:text-slate-100 cursor-pointer">
                      E-Invoicing Direct API Enabled (NIC / IRP Portal)
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-6">
                    Automatically generate 64-character IRN and signed QR code upon invoice submission.
                  </p>
                </div>

                <div>
                  <Input
                    label="E-Way Bill Generation Threshold (INR ₹)"
                    type="number"
                    value={statutory.eway_bill_threshold}
                    onChange={(e) =>
                      setStatutory((s) => ({
                        ...s,
                        eway_bill_threshold: Number(e.target.value),
                      }))
                    }
                    prefix="₹"
                    size="sm"
                  />
                </div>
              </div>

              {/* MSME Udyam Credentials */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-purple-50/40 dark:bg-purple-950/20 rounded-lg border border-purple-200/50 dark:border-purple-900/40">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      id="msme-stat-check"
                      checked={statutory.msme_registered}
                      onChange={(e) =>
                        setStatutory((s) => ({ ...s, msme_registered: e.target.checked }))
                      }
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
                    />
                    <label htmlFor="msme-stat-check" className="text-xs font-bold text-slate-900 dark:text-slate-100 cursor-pointer">
                      Registered MSME Enterprise
                    </label>
                  </div>
                </div>

                <div>
                  <Input
                    label="Udyam Registration Number"
                    value={statutory.msme_udyam_no}
                    onChange={(e) =>
                      setStatutory((s) => ({ ...s, msme_udyam_no: e.target.value }))
                    }
                    disabled={!statutory.msme_registered}
                    size="sm"
                  />
                </div>

                <div>
                  <NativeSelect
                    label="Enterprise Category"
                    value={statutory.msme_category}
                    onChange={(e) =>
                      setStatutory((s) => ({ ...s, msme_category: e.target.value }))
                    }
                    disabled={!statutory.msme_registered}
                    size="sm"
                  >
                    <option value="Micro Enterprise">Micro Enterprise (&lt; ₹1 Cr)</option>
                    <option value="Small Enterprise">Small Enterprise (&lt; ₹10 Cr)</option>
                    <option value="Medium Enterprise">Medium Enterprise (&lt; ₹50 Cr)</option>
                  </NativeSelect>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB 3: CURRENCY & VALUATION */}
        {/* ============================================================== */}
        <TabsContent value="financials" className="space-y-4 pt-2">
          <Card variant="default">
            <CardHeader bordered>
              <CardTitle className="text-sm font-bold">Financial Base Currency & Valuation Rules</CardTitle>
              <CardDescription className="text-xs">
                Standard accounting defaults applied to all vouchers, General Ledger, and stock valuations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <NativeSelect
                    label="Base Functional Currency *"
                    value={financials.base_currency}
                    onChange={(e) =>
                      setFinancials((f) => ({ ...f, base_currency: e.target.value }))
                    }
                    size="sm"
                  >
                    <option value="INR">INR — Indian Rupee (₹)</option>
                    <option value="USD">USD — US Dollar ($)</option>
                    <option value="EUR">EUR — Euro (€)</option>
                    <option value="AED">AED — UAE Dirham</option>
                  </NativeSelect>
                </div>

                <div>
                  <Input
                    label="Currency Symbol"
                    value={financials.currency_symbol}
                    onChange={(e) =>
                      setFinancials((f) => ({ ...f, currency_symbol: e.target.value }))
                    }
                    size="sm"
                  />
                </div>

                <div>
                  <NativeSelect
                    label="Number Format Notation"
                    value={financials.number_format}
                    onChange={(e) =>
                      setFinancials((f) => ({
                        ...f,
                        number_format: e.target.value as 'lakhs' | 'millions',
                      }))
                    }
                    size="sm"
                  >
                    <option value="lakhs">Lakhs & Crores (12,34,567.00)</option>
                    <option value="millions">International Millions (1,234,567.00)</option>
                  </NativeSelect>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <NativeSelect
                    label="Default Inventory Valuation Method *"
                    value={financials.valuation_method}
                    onChange={(e) =>
                      setFinancials((f) => ({
                        ...f,
                        valuation_method: e.target.value as FinancialSettings['valuation_method'],
                      }))
                    }
                    size="sm"
                  >
                    <option value="FIFO">FIFO (First In, First Out)</option>
                    <option value="Moving Average">Moving Average</option>
                    <option value="Standard Costing">Standard Costing</option>
                  </NativeSelect>
                </div>

                <div>
                  <Input
                    label="Default Primary Bank Account"
                    value={financials.default_bank_account}
                    onChange={(e) =>
                      setFinancials((f) => ({ ...f, default_bank_account: e.target.value }))
                    }
                    size="sm"
                  />
                </div>

                <div>
                  <Input
                    label="Chart of Accounts Standard Template"
                    value={financials.coa_template}
                    onChange={(e) =>
                      setFinancials((f) => ({ ...f, coa_template: e.target.value }))
                    }
                    size="sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB 4: FISCAL YEARS */}
        {/* ============================================================== */}
        <TabsContent value="fiscal" className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Fiscal Years & Financial Calendars
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Standard Indian April 1 - March 31 financial year cycles with statutory audit lock state.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => setIsAddFiscalYearModalOpen(true)}
            >
              Add Fiscal Year
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {fiscalYears.map((fy) => (
              <Card
                key={fy.id}
                variant="default"
                className={fy.is_active ? 'border-brand-500/80 shadow-xs' : ''}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {fy.year_name}
                    </span>
                    {fy.is_active ? (
                      <Badge variant="success" size="xs" dot>
                        Current / Active
                      </Badge>
                    ) : fy.is_closed ? (
                      <Badge variant="draft" size="xs">
                        Audited & Closed
                      </Badge>
                    ) : (
                      <Badge variant="secondary" size="xs">
                        Draft
                      </Badge>
                    )}
                  </div>

                  <div className="text-xs space-y-1 font-mono text-slate-600 dark:text-slate-400">
                    <div>Start: {fy.start_date}</div>
                    <div>End: {fy.end_date}</div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">
                      {fy.is_closed ? 'Locked by CARO 2020' : 'Posting Allowed'}
                    </span>
                    {!fy.is_active && !fy.is_closed && (
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => {
                          setFiscalYears((prev) =>
                            prev.map((item) => ({ ...item, is_active: item.id === fy.id }))
                          );
                          toast.success(`${fy.year_name} set as current active fiscal year!`);
                        }}
                      >
                        Set Active
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB 5: ADDRESSES */}
        {/* ============================================================== */}
        <TabsContent value="addresses" className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Registered Addresses & Facility Locations
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Multi-location billing, shipping, warehouse, and factory plant addresses mapped to state GSTINs.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => setIsAddAddressModalOpen(true)}
            >
              Add Address
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {addresses.map((addr) => (
              <Card key={addr.id} variant="default" className="flex flex-col justify-between">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" size="xs">
                      {addr.address_type}
                    </Badge>
                    <div className="flex items-center gap-1">
                      {addr.is_default_billing && (
                        <Badge variant="primary" size="xs">
                          Default Billing
                        </Badge>
                      )}
                      {addr.is_default_shipping && (
                        <Badge variant="success" size="xs">
                          Default Shipping
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {addr.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {addr.line1}
                      {addr.line2 && <>, {addr.line2}</>}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {addr.city}, {addr.state} — {addr.pincode}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>GSTIN: {addr.gstin}</span>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => {
                        setAddresses((prev) => prev.filter((a) => a.id !== addr.id));
                        toast.info(`Address removed`);
                      }}
                      className="text-red-600 h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB 6: BRANCHES */}
        {/* ============================================================== */}
        <TabsContent value="branches" className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Operating Branches & Cost Centres
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Multi-branch roster for decentralized sales invoicing, inventory routing, and cost allocation.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => setIsAddBranchModalOpen(true)}
            >
              Add Branch
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {branches.map((br) => (
              <Card key={br.id} variant="default">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-brand-600 dark:text-brand-400">
                      {br.branch_code}
                    </span>
                    <Badge variant={br.is_active ? 'success' : 'draft'} size="xs" dot>
                      {br.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {br.branch_name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      State: {br.state}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs space-y-1">
                    <div className="text-slate-700 dark:text-slate-300 font-medium">
                      Manager: {br.manager_name}
                    </div>
                    <div className="text-slate-500 text-[11px] font-mono">
                      Cost Center: {br.cost_center}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* ============================================================== */}
      {/* ADD ADDRESS MODAL */}
      {/* ============================================================== */}
      <Modal open={isAddAddressModalOpen} onOpenChange={setIsAddAddressModalOpen}>
        <ModalContent size="md">
          <ModalHeader>
            <ModalTitle>Add Facility Address</ModalTitle>
            <ModalDescription>Register a new delivery, warehouse, or billing location.</ModalDescription>
          </ModalHeader>

          <form onSubmit={handleCreateAddress} className="space-y-3">
            <Input
              label="Address Title / Landmark *"
              placeholder="e.g. Pune Regional Spares Depot"
              value={newAddress.title || ''}
              onChange={(e) => setNewAddress((prev) => ({ ...prev, title: e.target.value }))}
              required
              size="sm"
            />

            <div className="grid grid-cols-2 gap-3">
              <NativeSelect
                label="Location Type"
                value={newAddress.address_type || 'Warehouse'}
                onChange={(e) =>
                  setNewAddress((prev) => ({
                    ...prev,
                    address_type: e.target.value as CompanyAddress['address_type'],
                  }))
                }
                size="sm"
              >
                <option value="Registered HQ">Registered Head Office</option>
                <option value="Corporate Office">Corporate Office</option>
                <option value="Factory Plant">Manufacturing Factory</option>
                <option value="Warehouse">Warehouse / Logistics Depot</option>
              </NativeSelect>

              <Input
                label="Applicable GSTIN"
                placeholder="27AAACR5055K1Z8"
                value={newAddress.gstin || ''}
                onChange={(e) =>
                  setNewAddress((prev) => ({ ...prev, gstin: e.target.value.toUpperCase() }))
                }
                size="sm"
              />
            </div>

            <Input
              label="Address Line 1 *"
              placeholder="Plot No. 45, MIDC Industrial Area"
              value={newAddress.line1 || ''}
              onChange={(e) => setNewAddress((prev) => ({ ...prev, line1: e.target.value }))}
              required
              size="sm"
            />

            <div className="grid grid-cols-3 gap-3">
              <Input
                label="City *"
                placeholder="Pune"
                value={newAddress.city || ''}
                onChange={(e) => setNewAddress((prev) => ({ ...prev, city: e.target.value }))}
                required
                size="sm"
              />
              <NativeSelect
                label="State"
                value={newAddress.state || 'Maharashtra'}
                onChange={(e) => setNewAddress((prev) => ({ ...prev, state: e.target.value }))}
                size="sm"
              >
                <option value="Maharashtra">Maharashtra</option>
                <option value="Gujarat">Gujarat</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Delhi">Delhi</option>
                <option value="Haryana">Haryana</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
              </NativeSelect>
              <Input
                label="PIN Code"
                placeholder="411019"
                value={newAddress.pincode || ''}
                onChange={(e) => setNewAddress((prev) => ({ ...prev, pincode: e.target.value }))}
                maxLength={6}
                size="sm"
              />
            </div>

            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(newAddress.is_default_billing)}
                  onChange={(e) =>
                    setNewAddress((prev) => ({ ...prev, is_default_billing: e.target.checked }))
                  }
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
                />
                <span>Default Billing Address</span>
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(newAddress.is_default_shipping)}
                  onChange={(e) =>
                    setNewAddress((prev) => ({ ...prev, is_default_shipping: e.target.checked }))
                  }
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
                />
                <span>Default Shipping Address</span>
              </label>
            </div>

            <ModalFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddAddressModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save Address
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* ============================================================== */}
      {/* ADD BRANCH MODAL */}
      {/* ============================================================== */}
      <Modal open={isAddBranchModalOpen} onOpenChange={setIsAddBranchModalOpen}>
        <ModalContent size="md">
          <ModalHeader>
            <ModalTitle>Add Operational Branch</ModalTitle>
            <ModalDescription>Configure a new multi-entity operating branch.</ModalDescription>
          </ModalHeader>

          <form onSubmit={handleCreateBranch} className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Input
                  label="Branch Code *"
                  placeholder="BR-HYD-01"
                  value={newBranch.branch_code || ''}
                  onChange={(e) =>
                    setNewBranch((prev) => ({ ...prev, branch_code: e.target.value.toUpperCase() }))
                  }
                  required
                  size="sm"
                />
              </div>
              <div className="col-span-2">
                <Input
                  label="Branch Name *"
                  placeholder="Hyderabad Regional Tech Hub"
                  value={newBranch.branch_name || ''}
                  onChange={(e) =>
                    setNewBranch((prev) => ({ ...prev, branch_name: e.target.value }))
                  }
                  required
                  size="sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Branch Manager"
                placeholder="Ravi Kumar"
                value={newBranch.manager_name || ''}
                onChange={(e) =>
                  setNewBranch((prev) => ({ ...prev, manager_name: e.target.value }))
                }
                size="sm"
              />
              <Input
                label="Phone Number"
                placeholder="+91 40 2345 6789"
                value={newBranch.phone || ''}
                onChange={(e) => setNewBranch((prev) => ({ ...prev, phone: e.target.value }))}
                size="sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Associated Cost Center"
                placeholder="CC-HYD-OPS"
                value={newBranch.cost_center || ''}
                onChange={(e) =>
                  setNewBranch((prev) => ({ ...prev, cost_center: e.target.value.toUpperCase() }))
                }
                size="sm"
              />
              <NativeSelect
                label="State"
                value={newBranch.state || 'Maharashtra'}
                onChange={(e) => setNewBranch((prev) => ({ ...prev, state: e.target.value }))}
                size="sm"
              >
                <option value="Maharashtra">Maharashtra</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Telangana">Telangana</option>
                <option value="Haryana">Haryana</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Gujarat">Gujarat</option>
              </NativeSelect>
            </div>

            <ModalFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddBranchModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Register Branch
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* ============================================================== */}
      {/* ADD FISCAL YEAR MODAL */}
      {/* ============================================================== */}
      <Modal open={isAddFiscalYearModalOpen} onOpenChange={setIsAddFiscalYearModalOpen}>
        <ModalContent size="sm">
          <ModalHeader>
            <ModalTitle>Add Fiscal Year</ModalTitle>
            <ModalDescription>Define a new accounting cycle period.</ModalDescription>
          </ModalHeader>

          <form onSubmit={handleCreateFiscalYear} className="space-y-3">
            <Input
              label="Fiscal Year Name *"
              placeholder="FY 2027-2028"
              value={newFiscalYear.year_name || ''}
              onChange={(e) =>
                setNewFiscalYear((prev) => ({ ...prev, year_name: e.target.value }))
              }
              required
              size="sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Start Date *"
                type="date"
                value={newFiscalYear.start_date || ''}
                onChange={(e) =>
                  setNewFiscalYear((prev) => ({ ...prev, start_date: e.target.value }))
                }
                required
                size="sm"
              />
              <Input
                label="End Date *"
                type="date"
                value={newFiscalYear.end_date || ''}
                onChange={(e) =>
                  setNewFiscalYear((prev) => ({ ...prev, end_date: e.target.value }))
                }
                required
                size="sm"
              />
            </div>

            <ModalFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddFiscalYearModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Create Period
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
}
