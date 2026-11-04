import React, { useState } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { AutonomousAction } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import {
  Zap,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Cpu,
  ArrowRight,
  Filter,
  Search,
  RotateCw,
  TrendingDown,
  Activity,
  Layers,
  UserCheck,
  Fingerprint,
} from 'lucide-react';

export const AutonomousActionsView: React.FC = () => {
  const { actions, executeAutonomousRemediation, isSimulatingAction, activeSimulatedStep, currentUser } = useSimulation();
  const [selectedAction, setSelectedAction] = useState<AutonomousAction | null>(actions[0] || null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredActions = actions.filter(
    (a) =>
      a.workloadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.triggerReason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.actor && a.actor.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Autonomous Operations Audit Trail</h1>
            <span className="text-xs font-mono font-bold bg-emerald-950/60 text-emerald-400 px-2.5 py-1 rounded-md border border-emerald-800/40 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Continuous Loop Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete cryptographic audit log of automated self-healing events, cross-cloud cutovers, and RBAC authorization traces
          </p>
        </div>

        <button
          disabled={isSimulatingAction}
          onClick={() => executeAutonomousRemediation('gcp')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Trigger Remediation Loop</span>
        </button>
      </div>

      {/* Grid: Action List + Step-by-Step Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Actions Timeline List (5 cols) */}
        <div className="lg:col-span-5 bg-[#0b1120] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-3.5 bg-[#020617] border-b border-slate-800 flex items-center gap-3">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search event logs, actors, IDs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
            />
          </div>

          <div className="divide-y divide-slate-800/60 max-h-[700px] overflow-y-auto">
            {filteredActions.map((action) => {
              const isSelected = selectedAction?.id === action.id;
              return (
                <div
                  key={action.id}
                  onClick={() => setSelectedAction(action)}
                  className={`p-4 cursor-pointer transition-all ${
                    isSelected ? 'bg-indigo-950/30 border-l-4 border-indigo-500' : 'hover:bg-slate-850/60'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-mono text-[10px] text-indigo-400 font-bold">{action.id}</span>
                    <span className="font-mono text-slate-400 text-[10px]">{action.timestamp}</span>
                  </div>

                  <h4 className="font-bold text-xs text-slate-100">{action.workloadName}</h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 font-mono">
                    <span className="uppercase text-slate-300 font-bold">{action.sourceCloud}</span>
                    <span>→</span>
                    <span className="uppercase text-indigo-300 font-bold">{action.destinationCloud}</span>
                    <span className="ml-auto text-emerald-400">{action.executionDurationSec}s</span>
                  </div>

                  {action.actor && (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800 w-fit">
                      <UserCheck className="w-3 h-3 text-indigo-400" />
                      <span>{action.actor}</span>
                    </div>
                  )}

                  <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2">{action.triggerReason}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Detail Audit Inspector (7 cols) */}
        {selectedAction ? (
          <div className="lg:col-span-7 bg-[#0b1120] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-100">{selectedAction.workloadName}</h3>
                  <span className="text-xs font-mono bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800/40">
                    {selectedAction.id}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  Migration route: <strong className="uppercase text-slate-200">{selectedAction.sourceCloud}</strong> →{' '}
                  <strong className="uppercase text-indigo-300">{selectedAction.destinationCloud}</strong> • Executed at {selectedAction.timestamp}
                </p>
              </div>
              <StatusBadge status={selectedAction.resultStatus} size="sm" />
            </div>

            {/* Actor / Authorization Audit Card */}
            <div className="bg-[#020617] p-3.5 rounded-xl border border-slate-800 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                  <Fingerprint className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
                    Execution Authority & Audit Trail
                  </span>
                  <span className="text-xs font-bold text-slate-200">
                    {selectedAction.actor || 'Autonomous Orchestration Engine'}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-900 text-indigo-300 border border-slate-700">
                {selectedAction.actorRole || 'System Supervised'}
              </span>
            </div>

            {/* Impact Metric Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-[#020617] p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Execution Duration</span>
                <span className="text-base font-bold font-mono text-slate-100">
                  {selectedAction.executionDurationSec}s
                </span>
              </div>
              <div className="bg-[#020617] p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Post-Remediation SLA</span>
                <span className="text-base font-bold font-mono text-emerald-400">
                  {selectedAction.postMigrationSla}%
                </span>
              </div>
              <div className="bg-[#020617] p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Monthly Cost Delta</span>
                <span className="text-base font-bold font-mono text-emerald-400">
                  {selectedAction.costDeltaMonthly < 0 ? `-$${Math.abs(selectedAction.costDeltaMonthly)}` : `+$${selectedAction.costDeltaMonthly}`}
                </span>
              </div>
              <div className="bg-[#020617] p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Latency Impact</span>
                <span className="text-base font-bold font-mono text-sky-400">
                  {selectedAction.latencyDeltaMs <= 0 ? `${selectedAction.latencyDeltaMs}ms` : `+${selectedAction.latencyDeltaMs}ms`}
                </span>
              </div>
            </div>

            {/* Trigger Reason & Policy Box */}
            <div className="bg-[#020617] p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between font-semibold">
                <span className="text-slate-400 uppercase">Trigger Event:</span>
                <span className="text-indigo-400 font-mono">{selectedAction.policyApplied}</span>
              </div>
              <p className="text-slate-300 leading-relaxed font-sans">{selectedAction.triggerReason}</p>
            </div>

            {/* Step-by-Step 8-Stage Execution Timeline */}
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                Step-by-Step Autonomous Execution Trace
              </h4>

              <div className="space-y-3 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
                {selectedAction.steps.map((step, index) => (
                  <div key={index} className="relative flex items-start gap-3 text-xs pl-1">
                    <div className="w-6 h-6 rounded-full bg-[#0b1120] border border-indigo-500/50 flex items-center justify-center text-indigo-300 font-mono text-[10px] shrink-0 z-10">
                      {index + 1}
                    </div>
                    <div className="flex-1 bg-[#020617] p-3 rounded-xl border border-slate-800/80">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">{step.title}</span>
                        <span className="font-mono text-[10px] text-indigo-400 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/40">
                          {step.stage}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-7 bg-[#0b1120] border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
            Select an autonomous action to inspect the detailed execution timeline.
          </div>
        )}
      </div>
    </div>
  );
};
