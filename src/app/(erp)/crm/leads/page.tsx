'use client';

import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Building,
  Mail,
  Phone,
  ArrowRight,
  TrendingUp,
  UserCheck,
  Award,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { Pagination } from '@/components/ui/pagination';

interface LeadItem {
  id: string;
  lead_name: string;
  company_name: string;
  email: string;
  phone: string;
  lead_source: string;
  status: 'Open' | 'Contacted' | 'Qualified' | 'Unqualified' | 'Converted' | 'Lost';
  lead_score: number;
  assigned_to: string;
  created_at: string;
}

const INITIAL_LEADS: LeadItem[] = [
  {
    id: 'lead-01',
    lead_name: 'Rajesh Sharma',
    company_name: 'Sharma Precision Engineering Pvt Ltd',
    email: 'rajesh@sharmaprecision.com',
    phone: '+91 98200 12345',
    lead_source: 'Website Inbound',
    status: 'Qualified',
    lead_score: 90,
    assigned_to: 'Vikram Mehta (Sales Lead)',
    created_at: '2026-05-12',
  },
  {
    id: 'lead-02',
    lead_name: 'Suresh Patel',
    company_name: 'Gujarat Agro Tools',
    email: 'suresh@gujaratagro.in',
    phone: '+91 94260 54321',
    lead_source: 'Trade Show / Expo',
    status: 'Contacted',
    lead_score: 65,
    assigned_to: 'Vikram Mehta (Sales Lead)',
    created_at: '2026-05-14',
  },
  {
    id: 'lead-03',
    lead_name: 'Anita Roy',
    company_name: 'Bengal Polychem Ltd',
    email: 'anita@bengalpolychem.com',
    phone: '+91 98310 98765',
    lead_source: 'Cold Call',
    status: 'Open',
    lead_score: 45,
    assigned_to: 'Pooja Iyer (BDR)',
    created_at: '2026-05-15',
  },
  {
    id: 'lead-04',
    lead_name: 'Harpreet Singh',
    company_name: 'Punjab Hydraulics & Pumps',
    email: 'harpreet@punjabhydraulics.com',
    phone: '+91 98140 11223',
    lead_source: 'Referral',
    status: 'Converted',
    lead_score: 95,
    assigned_to: 'Vikram Mehta (Sales Lead)',
    created_at: '2026-05-08',
  },
  {
    id: 'lead-05',
    lead_name: 'Manoj Pillai',
    company_name: 'Cochin Valves & Fittings',
    email: 'manoj@cochinvalves.com',
    phone: '+91 94470 33445',
    lead_source: 'Channel Partner',
    status: 'Open',
    lead_score: 50,
    assigned_to: 'Pooja Iyer (BDR)',
    created_at: '2026-05-16',
  },
];

export default function LeadsPage() {
  const { addToast } = useToast();
  const [leads, setLeads] = useState<LeadItem[]>(INITIAL_LEADS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newLead, setNewLead] = useState({
    lead_name: '',
    company_name: '',
    email: '',
    phone: '',
    lead_source: 'Website Inbound',
    annual_revenue: '',
    no_of_employees: '',
  });

  // Convert Modal
  const [convertingLead, setConvertingLead] = useState<LeadItem | null>(null);
  const [customerGroup, setCustomerGroup] = useState('Commercial');
  const [gstCategory, setGstCategory] = useState('Registered Regular');
  const [gstin, setGstin] = useState('');

  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      l.lead_name.toLowerCase().includes(search.toLowerCase()) ||
      l.company_name.toLowerCase().includes(search.toLowerCase()) ||
      l.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredLeads.length / pageSize) || 1;
  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.lead_name.trim()) return;

    let score = 20;
    if (newLead.company_name) score += 25;
    if (newLead.email) score += 20;
    if (newLead.phone) score += 15;
    if (newLead.annual_revenue) score += 20;

    const created: LeadItem = {
      id: `lead-${Date.now()}`,
      lead_name: newLead.lead_name,
      company_name: newLead.company_name || 'Independent Prospect',
      email: newLead.email,
      phone: newLead.phone,
      lead_source: newLead.lead_source,
      status: 'Open',
      lead_score: Math.min(score, 100),
      assigned_to: 'Vikram Mehta (Sales Lead)',
      created_at: new Date().toISOString().slice(0, 10),
    };

    setLeads([created, ...leads]);
    setIsCreateOpen(false);
    setNewLead({
      lead_name: '',
      company_name: '',
      email: '',
      phone: '',
      lead_source: 'Website Inbound',
      annual_revenue: '',
      no_of_employees: '',
    });

    addToast({
      title: 'Lead Created',
      description: `${created.lead_name} registered with Lead Score ${created.lead_score}/100.`,
      variant: 'success',
    });
  };

  const handleConvertLead = () => {
    if (!convertingLead) return;

    setLeads((prev) =>
      prev.map((l) =>
        l.id === convertingLead.id
          ? { ...l, status: 'Converted', lead_score: 100 }
          : l
      )
    );

    addToast({
      title: 'Lead Converted to Customer',
      description: `${convertingLead.company_name} is now an active Customer account with commercial credit.`,
      variant: 'success',
    });

    setConvertingLead(null);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200';
    if (score >= 50) return 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200';
    return 'text-slate-600 bg-slate-50 dark:bg-slate-900 border-slate-200';
  };

  const getStatusBadge = (status: LeadItem['status']) => {
    switch (status) {
      case 'Qualified':
        return <Badge variant="success">Qualified</Badge>;
      case 'Converted':
        return <Badge variant="primary">Converted</Badge>;
      case 'Contacted':
        return <Badge variant="warning">Contacted</Badge>;
      case 'Open':
        return <Badge variant="secondary">Open</Badge>;
      case 'Lost':
      case 'Unqualified':
        return <Badge variant="danger">{status}</Badge>;
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
            <Users className="w-6 h-6 text-brand-600" />
            CRM Lead Funnel & Prospects
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Inbound lead qualification, algorithmic scoring, and seamless conversion to Customer accounts.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Capture New Lead
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Leads</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{leads.length}</h3>
            </div>
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 rounded-lg text-blue-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Qualified Prospects</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">
                {leads.filter((l) => l.status === 'Qualified').length}
              </h3>
            </div>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg text-emerald-600">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Converted Accounts</p>
              <h3 className="text-2xl font-bold text-brand-600 mt-1">
                {leads.filter((l) => l.status === 'Converted').length}
              </h3>
            </div>
            <div className="p-2.5 bg-brand-50 dark:bg-brand-950/50 rounded-lg text-brand-600">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Avg Lead Score</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">
                {Math.round(leads.reduce((acc, l) => acc + l.lead_score, 0) / (leads.length || 1))} / 100
              </h3>
            </div>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 rounded-lg text-amber-600">
              <Award className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                placeholder="Search by prospect name, company, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            {['All', 'Open', 'Contacted', 'Qualified', 'Converted', 'Lost'].map((st) => (
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

        {/* Lead Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Lead / Contact</th>
                <th className="py-3 px-4">Company</th>
                <th className="py-3 px-4">Contact Details</th>
                <th className="py-3 px-4">Source Channel</th>
                <th className="py-3 px-4 text-center">Lead Score</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No leads found matching current filter.
                  </td>
                </tr>
              ) : (
                paginatedLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                      {lead.lead_name}
                      <span className="block text-xs text-slate-400 font-normal">Assigned: {lead.assigned_to}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {lead.company_name}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {lead.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {lead.phone}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400">
                      {lead.lead_source}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getScoreColor(
                          lead.lead_score
                        )}`}
                      >
                        {lead.lead_score} / 100
                      </span>
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(lead.status)}</td>
                    <td className="py-3.5 px-4 text-right">
                      {lead.status !== 'Converted' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConvertingLead(lead)}
                          className="text-xs h-8 border-brand-200 text-brand-600 hover:bg-brand-50"
                        >
                          Convert to Customer
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      ) : (
                        <span className="text-xs text-emerald-600 font-medium">Customer Active</span>
                      )}
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
          totalItems={filteredLeads.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </Card>

      {/* Capture Lead Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Capture Prospective Lead"
      >
        <form onSubmit={handleCreateLead} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Lead / Contact Name *
            </label>
            <Input
              required
              placeholder="e.g. Ramesh Kumar"
              value={newLead.lead_name}
              onChange={(e) => setNewLead({ ...newLead, lead_name: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Company / Prospect Organization
            </label>
            <Input
              placeholder="e.g. Kumar Forgings Pvt Ltd"
              value={newLead.company_name}
              onChange={(e) => setNewLead({ ...newLead, company_name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
              <Input
                type="email"
                placeholder="ramesh@kumarforgings.com"
                value={newLead.email}
                onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Mobile / Phone</label>
              <Input
                placeholder="+91 98200 XXXXX"
                value={newLead.phone}
                onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Acquisition Source</label>
              <select
                value={newLead.lead_source}
                onChange={(e) => setNewLead({ ...newLead, lead_source: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="Website Inbound">Website Inbound</option>
                <option value="Trade Show / Expo">Trade Show / Expo</option>
                <option value="Cold Call">Cold Call</option>
                <option value="Referral">Referral</option>
                <option value="Email Campaign">Email Campaign</option>
                <option value="Channel Partner">Channel Partner</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Est. Annual Revenue (INR)</label>
              <Input
                placeholder="e.g. 50000000"
                value={newLead.annual_revenue}
                onChange={(e) => setNewLead({ ...newLead, annual_revenue: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save & Score Lead</Button>
          </div>
        </form>
      </Modal>

      {/* Convert to Customer Modal */}
      <Modal
        isOpen={!!convertingLead}
        onClose={() => setConvertingLead(null)}
        title="Convert Lead to Commercial Customer"
      >
        {convertingLead && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {convertingLead.company_name}
              </p>
              <p className="text-xs text-slate-500">Contact: {convertingLead.lead_name} ({convertingLead.email})</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Customer Group</label>
              <select
                value={customerGroup}
                onChange={(e) => setCustomerGroup(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none"
              >
                <option value="Commercial">Commercial / B2B</option>
                <option value="Distributor">Authorized Distributor</option>
                <option value="Retail">Retail</option>
                <option value="Export">Export / Overseas</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">GST Registration Category</label>
              <select
                value={gstCategory}
                onChange={(e) => setGstCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none"
              >
                <option value="Registered Regular">Registered Regular</option>
                <option value="Registered Composition">Registered Composition</option>
                <option value="Unregistered">Unregistered Consumer</option>
                <option value="SEZ">Special Economic Zone (SEZ)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">15-Digit GSTIN (Optional)</label>
              <Input
                placeholder="27AABCU9603R1ZM"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
              />
            </div>

            <p className="text-xs text-slate-500">
              Converting will allocate a customer code (`CUST-XXXX`), open credit ledger, and mark the lead as Converted.
            </p>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setConvertingLead(null)}>
                Cancel
              </Button>
              <Button onClick={handleConvertLead}>Confirm & Activate Customer</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
