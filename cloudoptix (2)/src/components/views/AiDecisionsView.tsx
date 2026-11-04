import React, { useState } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { AIDecision } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { ExplainDecisionModal } from '../modals/ExplainDecisionModal';
import {
  Compass,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  ShieldCheck,
  TrendingDown,
  Cpu,
  ArrowRight,
} from 'lucide-react';

export const AiDecisionsView: React.FC = () => {
  const { decisions, clouds, migrateWorkload, setActiveView } = useSimulation();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDecision, setSelectedDecision] = useState<AIDecision | null>(null);

  const filteredDecisions = decisions.filter(
    (d) =>
      d.workloadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.recommendedCloud.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">AI Decision Engine</h1>
            <span className="text-xs font-mono font-bold bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700">
              Baseline 1 — Existing Weighted Scoring (Preserved)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Legacy heuristic scoring based on polynomial weights across resource headroom, latency, cost, and uptime
          </p>
        </div>

        <button
          onClick={() => setActiveView('gnn-recommendations')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all shadow-md self-start sm:self-auto"
        >
          <span>GNN Placement Framework</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Decision Engine Architecture Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Scoring Pipeline</span>
          <h4 className="text-sm font-bold text-slate-200 mt-1">Pareto Multi-Objective</h4>
          <p className="text-xs text-slate-400 mt-1">Balancing resource headroom, latency, cost, and SLA targets</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Policy Gate</span>
          <h4 className="text-sm font-bold text-slate-200 mt-1">Zero-Trust Audit</h4>
          <p className="text-xs text-slate-400 mt-1">Every decision validated against sovereign and security constraints</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Explainability</span>
          <h4 className="text-sm font-bold text-slate-200 mt-1">100% Transparent</h4>
          <p className="text-xs text-slate-400 mt-1">Deconstructed weights with natural language justification</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Autonomous Readiness</span>
          <h4 className="text-sm font-bold text-emerald-400 mt-1">Self-Executing</h4>
          <p className="text-xs text-slate-400 mt-1">High-confidence decisions fire warm migrations automatically</p>
        </div>
      </div>

      {/* Decisions List */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search decisions by workload or cloud..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
            />
          </div>
          <span className="text-xs font-mono text-slate-400">
            {filteredDecisions.length} Decisions Recorded
          </span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {filteredDecisions.map((dec) => {
            const bestCandidate = dec.candidateScores[0];
            return (
              <div
                key={dec.id}
                className="p-5 hover:bg-slate-850/60 transition-colors space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                      <Compass className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-slate-100">{dec.workloadName}</h3>
                        <span className="text-[10px] font-mono text-purple-400 bg-purple-950 px-1.5 py-0.5 rounded border border-purple-800/50">
                          {dec.id}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Current: <strong className="uppercase text-slate-300">{dec.currentCloud}</strong> → Recommended:{' '}
                        <strong className="uppercase text-purple-300">{dec.recommendedCloud}</strong> • {dec.timestamp}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <span className="text-[10px] text-slate-400 uppercase block">Confidence Score</span>
                      <span className="text-sm font-bold font-mono text-purple-300">{dec.confidence}%</span>
                    </div>
                    <StatusBadge status={dec.status} size="sm" />
                    <button
                      onClick={() => setSelectedDecision(dec)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> Explain
                    </button>
                  </div>
                </div>

                {/* Summary Reason Box */}
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 text-xs text-slate-300 font-sans">
                  &ldquo;{dec.summaryReason}&rdquo;
                </div>

                {/* Mini Candidate Comparative Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {dec.candidateScores.map((c) => (
                    <div
                      key={c.cloud}
                      className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                        c.cloud === dec.recommendedCloud
                          ? 'bg-purple-950/30 border-purple-500/50 text-purple-200'
                          : 'bg-slate-950/50 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span className="font-bold uppercase">{c.cloud}</span>
                      <span className="font-mono font-semibold">{c.totalScore}/100</span>
                      <span className="font-mono text-slate-400">${c.estimatedCostPerHour}/hr</span>
                      <span className="font-mono text-slate-400">{c.estimatedLatencyMs}ms</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Deep Explainability Modal */}
      <ExplainDecisionModal
        decision={selectedDecision}
        isOpen={!!selectedDecision}
        onClose={() => setSelectedDecision(null)}
      />
    </div>
  );
};
