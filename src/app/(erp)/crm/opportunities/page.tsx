'use client';

import React, { useState } from 'react';
import {
  Kanban,
  Plus,
  TrendingUp,
  DollarSign,
  CheckCircle,
  Calendar,
  Building,
  ArrowRight,
  ChevronRight,
  XCircle,
  Award,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';

interface Deal {
  id: string;
  name: string;
  party_name: string;
  expected_revenue: number;
  stage: 'Prospecting' | 'Qualification' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost';
  probability: number;
  closing_date: string;
  assigned_to: string;
}

const STAGES: Array<{ id: Deal['stage']; label: string; prob: number; color: string }> = [
  { id: 'Prospecting', label: 'Prospecting', prob: 10, color: 'border-t-slate-400' },
  { id: 'Qualification', label: 'Qualification', prob: 25, color: 'border-t-blue-500' },
  { id: 'Proposal', label: 'Proposal / Quote', prob: 50, color: 'border-t-amber-500' },
  { id: 'Negotiation', label: 'Negotiation', prob: 75, color: 'border-t-indigo-500' },
  { id: 'Closed Won', label: 'Closed Won', prob: 100, color: 'border-t-emerald-500' },
];

const INITIAL_DEALS: Deal[] = [
  {
    id: 'opp-01',
    name: '500kVA Transformer Substation',
    party_name: 'Tata Heavy Motors Ltd',
    expected_revenue: 3500000,
    stage: 'Negotiation',
    probability: 75,
    closing_date: '2026-06-30',
    assigned_to: 'Vikram Mehta',
  },
  {
    id: 'opp-02',
    name: 'High-Pressure Industrial Compressors (5 Units)',
    party_name: 'Jindal Steels & Power',
    expected_revenue: 1800000,
    stage: 'Proposal',
    probability: 50,
    closing_date: '2026-07-15',
    assigned_to: 'Vikram Mehta',
  },
  {
    id: 'opp-03',
    name: 'CNC Milling Spare Parts Annual Contract',
    party_name: 'Larsen Engineering Works',
    expected_revenue: 950000,
    stage: 'Qualification',
    probability: 25,
    closing_date: '2026-08-10',
    assigned_to: 'Pooja Iyer',
  },
  {
    id: 'opp-04',
    name: 'Automated Packaging Conveyor Setup',
    party_name: 'Parle Agro Industries',
    expected_revenue: 4200000,
    stage: 'Prospecting',
    probability: 10,
    closing_date: '2026-09-01',
    assigned_to: 'Vikram Mehta',
  },
  {
    id: 'opp-05',
    name: 'Industrial Valve Lot Delivery',
    party_name: 'Mahindra Heavy Auto',
    expected_revenue: 1250000,
    stage: 'Closed Won',
    probability: 100,
    closing_date: '2026-05-20',
    assigned_to: 'Vikram Mehta',
  },
];

export default function OpportunitiesPage() {
  const { addToast } = useToast();
  const [deals, setDeals] = useState<Deal[]>(INITIAL_DEALS);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newDeal, setNewDeal] = useState({
    name: '',
    party_name: '',
    expected_revenue: '',
    stage: 'Prospecting' as Deal['stage'],
    closing_date: '',
  });

  const totalPipeline = deals
    .filter((d) => d.stage !== 'Closed Lost')
    .reduce((sum, d) => sum + d.expected_revenue, 0);

  const weightedForecast = deals
    .filter((d) => d.stage !== 'Closed Lost')
    .reduce((sum, d) => sum + (d.expected_revenue * d.probability) / 100, 0);

  const wonTotal = deals
    .filter((d) => d.stage === 'Closed Won')
    .reduce((sum, d) => sum + d.expected_revenue, 0);

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleAdvanceStage = (dealId: string) => {
    setDeals((prev) =>
      prev.map((deal) => {
        if (deal.id !== dealId) return deal;
        const currentIdx = STAGES.findIndex((s) => s.id === deal.stage);
        if (currentIdx < STAGES.length - 1) {
          const nextStage = STAGES[currentIdx + 1];
          addToast({
            title: 'Deal Advanced',
            description: `"${deal.name}" moved to ${nextStage.label} (${nextStage.prob}% probability)`,
            variant: 'success',
          });
          return {
            ...deal,
            stage: nextStage.id,
            probability: nextStage.prob,
          };
        }
        return deal;
      })
    );
  };

  const handleCreateDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeal.name.trim() || !newDeal.expected_revenue) return;

    const stageObj = STAGES.find((s) => s.id === newDeal.stage) || STAGES[0];
    const created: Deal = {
      id: `opp-${Date.now()}`,
      name: newDeal.name,
      party_name: newDeal.party_name || 'Prospective Client',
      expected_revenue: parseFloat(newDeal.expected_revenue),
      stage: newDeal.stage,
      probability: stageObj.prob,
      closing_date: newDeal.closing_date || new Date().toISOString().slice(0, 10),
      assigned_to: 'Vikram Mehta (Sales Lead)',
    };

    setDeals([created, ...deals]);
    setIsCreateOpen(false);
    setNewDeal({
      name: '',
      party_name: '',
      expected_revenue: '',
      stage: 'Prospecting',
      closing_date: '',
    });

    addToast({
      title: 'Opportunity Created',
      description: `Opportunity added to ${stageObj.label} pipeline.`,
      variant: 'success',
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Kanban className="w-6 h-6 text-brand-600" />
            CRM Deals Pipeline & Forecasting
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Interactive Kanban deal flow tracking, weighted pipeline forecast, and milestone velocity.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Opportunity
        </Button>
      </div>

      {/* KPI Forecast Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Pipeline Value</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatINR(totalPipeline)}</h3>
          <p className="text-xs text-slate-400 mt-1">{deals.length} active opportunities</p>
        </Card>

        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Weighted Forecast</p>
          <h3 className="text-2xl font-bold text-brand-600 mt-1">{formatINR(weightedForecast)}</h3>
          <p className="text-xs text-slate-400 mt-1">Probability-adjusted revenue</p>
        </Card>

        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Closed Won Revenue</p>
          <h3 className="text-2xl font-bold text-emerald-600 mt-1">{formatINR(wonTotal)}</h3>
          <p className="text-xs text-slate-400 mt-1">Fully realized contracts</p>
        </Card>

        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Average Deal Size</p>
          <h3 className="text-2xl font-bold text-indigo-600 mt-1">
            {formatINR(totalPipeline / (deals.length || 1))}
          </h3>
          <p className="text-xs text-slate-400 mt-1">Contract benchmark</p>
        </Card>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage.id);
          const stageValue = stageDeals.reduce((sum, d) => sum + d.expected_revenue, 0);

          return (
            <div
              key={stage.id}
              className={`bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3 border-t-4 border border-slate-200 dark:border-slate-800 ${stage.color} flex flex-col min-h-[500px]`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    {stage.label}
                  </h4>
                  <span className="text-xxs font-semibold text-slate-400">
                    {stage.prob}% prob • {formatINR(stageValue)}
                  </span>
                </div>
                <span className="w-5 h-5 flex items-center justify-center text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-slate-700 dark:text-slate-300">
                  {stageDeals.length}
                </span>
              </div>

              <div className="space-y-3 pt-3 flex-1">
                {stageDeals.length === 0 ? (
                  <div className="py-8 text-center text-xxs text-slate-400">No deals in this stage</div>
                ) : (
                  stageDeals.map((deal) => (
                    <div
                      key={deal.id}
                      className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm space-y-2.5 hover:shadow-md transition-shadow"
                    >
                      <div>
                        <h5 className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2">
                          {deal.name}
                        </h5>
                        <p className="text-xxs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3 text-slate-400" />
                          {deal.party_name}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-700/60">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatINR(deal.expected_revenue)}
                        </span>
                        <span className="text-xxs text-slate-400 font-medium flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {deal.closing_date}
                        </span>
                      </div>

                      {stage.id !== 'Closed Won' && (
                        <div className="pt-1 flex justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAdvanceStage(deal.id)}
                            className="text-xxs h-7 px-2 border-brand-200 text-brand-600 hover:bg-brand-50"
                          >
                            Advance
                            <ChevronRight className="w-3 h-3 ml-0.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Opportunity Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Deal Opportunity"
      >
        <form onSubmit={handleCreateDeal} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Opportunity / Deal Title *
            </label>
            <Input
              required
              placeholder="e.g. 500kVA Transformer Substation Order"
              value={newDeal.name}
              onChange={(e) => setNewDeal({ ...newDeal, name: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Customer / Lead Organization *
            </label>
            <Input
              required
              placeholder="e.g. Tata Heavy Motors Ltd"
              value={newDeal.party_name}
              onChange={(e) => setNewDeal({ ...newDeal, party_name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Expected Revenue (INR) *
              </label>
              <Input
                required
                placeholder="e.g. 2500000"
                value={newDeal.expected_revenue}
                onChange={(e) => setNewDeal({ ...newDeal, expected_revenue: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Target Close Date</label>
              <Input
                type="date"
                value={newDeal.closing_date}
                onChange={(e) => setNewDeal({ ...newDeal, closing_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Initial Pipeline Stage</label>
            <select
              value={newDeal.stage}
              onChange={(e) => setNewDeal({ ...newDeal, stage: e.target.value as Deal['stage'] })}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none"
            >
              <option value="Prospecting">Prospecting (10%)</option>
              <option value="Qualification">Qualification (25%)</option>
              <option value="Proposal">Proposal / Quote (50%)</option>
              <option value="Negotiation">Negotiation (75%)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Opportunity</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
