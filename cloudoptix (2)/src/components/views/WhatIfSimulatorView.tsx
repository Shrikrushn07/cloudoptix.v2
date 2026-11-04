import React, { useState } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import {
  Sliders,
  Play,
  RotateCcw,
  Sparkles,
  TrendingDown,
  Activity,
  ArrowRight,
  Server,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';

export const WhatIfSimulatorView: React.FC = () => {
  const { clouds, workloads } = useSimulation();

  const [scenario, setScenario] = useState<'gcp_price_drop' | 'aws_outage' | 'traffic_3x' | 'eu_sovereignty'>('gcp_price_drop');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationRan, setSimulationRan] = useState(false);

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      setSimulationRan(true);
    }, 800);
  };

  const getScenarioResults = () => {
    switch (scenario) {
      case 'gcp_price_drop':
        return {
          title: 'GCP 20% Compute Price Reduction',
          costDelta: '-$2,450 / month (-13.3%)',
          slaDelta: '+0.02% (99.96%)',
          migrationsRecommended: 4,
          summary:
            'AI recommends migrating Video Processing (WL-103), FinOps Batch Aggregator (WL-105), and ML Training (WL-107) from AWS to GCP for maximal arbitrage.',
          recommendedMoves: [
            { workload: 'WL-103 Video Processing', from: 'AWS', to: 'GCP', savings: '-$620/mo' },
            { workload: 'WL-105 FinOps Batch', from: 'AWS', to: 'GCP', savings: '-$440/mo' },
            { workload: 'WL-107 ML Model Training', from: 'AWS', to: 'GCP', savings: '-$890/mo' },
          ],
        };
      case 'aws_outage':
        return {
          title: 'Complete AWS us-east-1 Outage Simulation',
          costDelta: '+$480 / month (+2.6%)',
          slaDelta: 'Preserved at 99.92% (Zero total downtime)',
          migrationsRecommended: 6,
          summary:
            'CloudOptiX would autonomously drain all 6 AWS workloads and distribute them dynamically across Azure eastus2 (4 workloads) and GCP us-central1 (2 workloads) within 45 seconds.',
          recommendedMoves: [
            { workload: 'WL-101 Payment Gateway', from: 'AWS', to: 'Azure', savings: '+$120/mo' },
            { workload: 'WL-103 Video Processing', from: 'AWS', to: 'GCP', savings: '-$80/mo' },
            { workload: 'WL-105 FinOps Batch', from: 'AWS', to: 'Azure', savings: '+$60/mo' },
          ],
        };
      case 'traffic_3x':
        return {
          title: 'Global 300% Traffic Surge',
          costDelta: '+$12,400 / month (+67%)',
          slaDelta: 'Maintained at 99.91% via dynamic horizontal scaling',
          migrationsRecommended: 8,
          summary:
            'Autonomous orchestrator provisions 24 additional node pools across all 3 clouds to prevent saturation in any single provider.',
          recommendedMoves: [
            { workload: 'WL-102 Checkout API', from: 'GCP', to: 'Azure + AWS (Multi-Region)', savings: 'Capacity x3' },
            { workload: 'WL-104 Recommendation Engine', from: 'GCP', to: 'Azure', savings: 'Capacity x3' },
          ],
        };
      case 'eu_sovereignty':
        return {
          title: 'Enforce Strict EU Data Residency on all PII Workloads',
          costDelta: '+$340 / month (+1.8%)',
          slaDelta: '99.95%',
          migrationsRecommended: 3,
          summary:
            'Payment Gateway and User Profile Graph locked strictly to EU Sovereign clusters in Azure Frankfurt and AWS Ireland.',
          recommendedMoves: [
            { workload: 'WL-101 Payment Gateway', from: 'AWS us-east', to: 'AWS eu-west-1', savings: 'Compliant' },
            { workload: 'WL-106 User Profile Graph', from: 'GCP us-central', to: 'Azure westeurope', savings: 'Compliant' },
          ],
        };
    }
  };

  const results = getScenarioResults();

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">What-If Multi-Cloud Simulator</h1>
            <span className="text-xs font-mono font-bold bg-purple-950 text-purple-300 px-2.5 py-1 rounded-md border border-purple-800/40">
              Predictive Sandbox
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulate market price drops, regional outages, traffic explosions, and compliance constraints before executing
          </p>
        </div>
      </div>

      {/* Scenario Selection Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { id: 'gcp_price_drop', title: 'GCP Price Drop (-20%)', desc: 'Simulate aggressive compute discount on Google Cloud' },
          { id: 'aws_outage', title: 'AWS us-east-1 Outage', desc: 'Simulate total regional failure and emergency failover' },
          { id: 'traffic_3x', title: '3x Global Traffic Surge', desc: 'Simulate massive Black Friday traffic event' },
          { id: 'eu_sovereignty', title: 'Strict EU Sovereignty', desc: 'Lock all sensitive workloads to European data borders' },
        ].map((item) => (
          <div
            key={item.id}
            onClick={() => {
              setScenario(item.id as any);
              setSimulationRan(false);
            }}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              scenario === item.id
                ? 'bg-purple-950/40 border-purple-500 shadow-lg shadow-purple-900/20 ring-1 ring-purple-500'
                : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
            }`}
          >
            <h3 className="font-bold text-xs text-slate-200">{item.title}</h3>
            <p className="text-[11px] text-slate-400 mt-1">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Run Simulation Controller */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-purple-400 font-mono font-bold uppercase tracking-wider block">
            Selected Scenario
          </span>
          <h2 className="text-lg font-bold text-slate-100 mt-0.5">{results.title}</h2>
          <p className="text-xs text-slate-400 mt-1">
            Run multi-objective Pareto solver across 12 active workloads and 3 cloud providers
          </p>
        </div>

        <button
          disabled={isSimulating}
          onClick={handleRunSimulation}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Play className={`w-4 h-4 ${isSimulating ? 'animate-spin' : 'fill-current'}`} />
          <span>{isSimulating ? 'Calculating Solver Matrix...' : 'Run Simulation'}</span>
        </button>
      </div>

      {/* Simulation Results (if ran or default preview) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wide">
              Predicted Impact & Optimization Plan
            </h3>
          </div>
          {simulationRan && (
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded border border-emerald-800/40">
              Simulation Complete (100% Feasible)
            </span>
          )}
        </div>

        {/* Impact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Cost Impact</span>
            <span className="text-base font-bold font-mono text-emerald-400 mt-1 block">{results.costDelta}</span>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Predicted SLA Delta</span>
            <span className="text-base font-bold font-mono text-sky-400 mt-1 block">{results.slaDelta}</span>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Recommended Migrations</span>
            <span className="text-base font-bold font-mono text-purple-400 mt-1 block">
              {results.migrationsRecommended} Workloads
            </span>
          </div>
        </div>

        {/* Narrative Summary */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans">
          <strong className="text-purple-300 block mb-1 uppercase font-mono text-[11px]">AI Synthesis:</strong>
          {results.summary}
        </div>

        {/* Recommended Moves */}
        <div>
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-3">
            Recommended Action Plan
          </h4>
          <div className="space-y-2">
            {results.recommendedMoves.map((m, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-200">{m.workload}</span>
                  <div className="flex items-center gap-2 font-mono text-slate-400">
                    <span className="uppercase">{m.from}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
                    <span className="uppercase text-purple-300 font-bold">{m.to}</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-emerald-400">{m.savings}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
