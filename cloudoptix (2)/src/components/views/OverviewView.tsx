import React, { useState } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { MetricCard } from '../common/MetricCard';
import { CloudCard } from '../common/CloudCard';
import { TimeSeriesChart } from '../common/TimeSeriesChart';
import { AutonomousLoopIndicator } from '../common/AutonomousLoopIndicator';
import { StatusBadge } from '../common/StatusBadge';
import { ExplainDecisionModal } from '../modals/ExplainDecisionModal';
import { AIDecision } from '../../types';
import {
  Cpu,
  DollarSign,
  TrendingDown,
  Activity,
  Zap,
  Sparkles,
  Server,
  Compass,
  ArrowRight,
  ShieldCheck,
  Flame,
  CheckCircle2,
  Sliders,
  RotateCcw,
} from 'lucide-react';

interface OverviewViewProps {
  onOpenCreateWorkload: () => void;
  onOpenSimulator: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ onOpenCreateWorkload, onOpenSimulator }) => {
  const {
    clouds,
    workloads,
    decisions,
    actions,
    timeSeries,
    stressCloud,
    activeStress,
    totalWorkloadsCount,
    totalMonthlyCost,
    totalPotentialSavings,
    systemSlaHealth,
    overallResourceUtilization,
    actionsTodayCount,
    isSimulatingAction,
    activeSimulatedStep,
    setActiveView,
    migrateWorkload,
  } = useSimulation();

  const [selectedDecisionForModal, setSelectedDecisionForModal] = useState<AIDecision | null>(null);

  const featuredDecision = decisions[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Autonomous Action In-Flight Banner if active */}
      {isSimulatingAction && (
        <div className="p-4 rounded-xl bg-indigo-950/90 border border-indigo-500/60 shadow-xl shadow-indigo-950/50 animate-pulse flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping shrink-0" />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                Autonomous Self-Healing Operation In Progress
              </span>
              <p className="text-xs text-indigo-300 font-mono mt-0.5">{activeSimulatedStep}</p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold bg-indigo-900 px-2.5 py-1 rounded text-indigo-200 border border-indigo-700">
            AUTO-HEALING
          </span>
        </div>
      )}

      {/* 8-Step Autonomous Loop Indicator */}
      <AutonomousLoopIndicator
        activeStepIndex={
          isSimulatingAction
            ? activeSimulatedStep.includes('1.')
              ? 0
              : activeSimulatedStep.includes('2.')
              ? 1
              : activeSimulatedStep.includes('3.')
              ? 2
              : activeSimulatedStep.includes('4.')
              ? 3
              : activeSimulatedStep.includes('5.')
              ? 4
              : activeSimulatedStep.includes('6.')
              ? 5
              : activeSimulatedStep.includes('7.')
              ? 6
              : 7
            : -1
        }
      />

      {/* Top 5 KPI Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Workloads */}
        <div
          onClick={() => setActiveView('workloads')}
          className="bg-[#10172a] p-4 rounded-xl border border-slate-800 shadow-xl hover:bg-[#131d35] cursor-pointer transition-all"
        >
          <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
            Total Workloads
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold text-white">{totalWorkloadsCount + 136}</div>
            <div className="text-[11px] text-emerald-400 font-medium">+12.4%</div>
          </div>
        </div>

        {/* Total Monthly Cost */}
        <div
          onClick={() => setActiveView('cost-intelligence')}
          className="bg-[#10172a] p-4 rounded-xl border border-slate-800 shadow-xl hover:bg-[#131d35] cursor-pointer transition-all"
        >
          <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
            Total Monthly Cost
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold text-white">${totalMonthlyCost.toLocaleString()}</div>
            <div className="text-[11px] text-rose-400 font-medium">+$1.2k</div>
          </div>
        </div>

        {/* Potential Savings (Highlighted with border-l-2 indigo) */}
        <div
          onClick={() => setActiveView('cost-intelligence')}
          className="bg-[#10172a] p-4 rounded-xl border border-slate-800 border-l-2 border-l-indigo-500 shadow-xl hover:bg-[#131d35] cursor-pointer transition-all"
        >
          <div className="text-indigo-400/90 text-[10px] font-bold uppercase tracking-wider mb-1">
            Potential Savings
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold text-indigo-100">${(totalPotentialSavings + 3840).toLocaleString()}</div>
            <div className="text-[10px] bg-indigo-500/20 px-1.5 py-0.5 rounded text-indigo-300 font-bold font-mono">
              AI OPTIMIZED
            </div>
          </div>
        </div>

        {/* Global SLA Health */}
        <div
          onClick={() => setActiveView('performance')}
          className="bg-[#10172a] p-4 rounded-xl border border-slate-800 shadow-xl hover:bg-[#131d35] cursor-pointer transition-all"
        >
          <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
            Global SLA Health
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold text-emerald-400">99.94%</div>
            <div className="text-[10px] text-slate-500 font-mono">Target: 99.9%</div>
          </div>
        </div>

        {/* Auto Actions Today */}
        <div
          onClick={() => setActiveView('autonomous-actions')}
          className="bg-[#10172a] p-4 rounded-xl border border-slate-800 shadow-xl hover:bg-[#131d35] cursor-pointer transition-all col-span-2 sm:col-span-1"
        >
          <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
            Auto Actions Today
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold text-white">{actionsTodayCount}</div>
            <div className="text-[11px] text-slate-400 font-medium">Remediated</div>
          </div>
        </div>
      </div>

      {/* 3 Cloud Provider Cards (AWS, Azure, GCP) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CloudCard
          cloud={clouds.aws}
          isStressed={activeStress.aws}
          onStress={() => stressCloud('aws', 92)}
          onInspect={() => setActiveView('infrastructure')}
        />
        <CloudCard
          cloud={clouds.azure}
          isStressed={activeStress.azure}
          onStress={() => stressCloud('azure', 91)}
          onInspect={() => setActiveView('infrastructure')}
        />
        <CloudCard
          cloud={clouds.gcp}
          isStressed={activeStress.gcp}
          onStress={() => stressCloud('gcp', 93)}
          onInspect={() => setActiveView('infrastructure')}
        />
      </div>

      {/* Time-Series Resource Utilization Graph */}
      <TimeSeriesChart data={timeSeries} />

      {/* 12-Column Section: Sleek AI Decision Engine (8 cols) & Live Event Log / Tip (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Featured AI Decision Engine Panel (8 cols) */}
        {featuredDecision && (
          <div className="lg:col-span-8 bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />

            <div className="flex justify-between items-center mb-6 pl-2">
              <div>
                <h3 className="text-lg font-bold text-white">AI Decision Engine</h3>
                <p className="text-xs text-slate-400 italic">
                  Active Prediction Flow • {featuredDecision.workloadName} Optimization
                </p>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">
                  Confidence Score
                </div>
                <div className="text-2xl font-mono text-indigo-400 font-bold">{featuredDecision.confidence}%</div>
              </div>
            </div>

            <div className="space-y-6 pl-2">
              {/* Placement Recommendation Box */}
              <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 flex flex-col md:flex-row gap-4 md:gap-6 md:items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-semibold text-slate-300 mb-1.5">
                    Placement Recommendation:{' '}
                    <span className="text-blue-400 uppercase ml-2 font-bold font-mono">
                      {featuredDecision.recommendedCloud === 'azure'
                        ? 'Microsoft Azure'
                        : featuredDecision.recommendedCloud === 'aws'
                        ? 'Amazon Web Services'
                        : 'Google Cloud Platform'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    &ldquo;{featuredDecision.summaryReason}&rdquo;
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() =>
                      migrateWorkload(featuredDecision.workloadId, featuredDecision.recommendedCloud, 'AI Decision Approved')
                    }
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-md shadow-indigo-600/30"
                  >
                    Deploy Action
                  </button>
                  <button
                    onClick={() => setSelectedDecisionForModal(featuredDecision)}
                    className="px-4 py-2 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-bold rounded-lg cursor-pointer transition-all"
                  >
                    Simulate
                  </button>
                </div>
              </div>

              {/* Decision Weights & Risk Analysis Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-3 tracking-wider">
                    Decision Weights
                  </div>
                  <div className="space-y-3">
                    {featuredDecision.factors.slice(0, 3).map((factor, idx) => (
                      <div key={factor.factorName} className="relative">
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-slate-400">{factor.factorName}</span>
                          <span className="text-slate-200 font-mono font-semibold">{factor.weight}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              idx === 0
                                ? 'bg-indigo-500'
                                : idx === 1
                                ? 'bg-blue-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${factor.impactScore}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-8">
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-3 tracking-wider">
                    Risk & Policy Analysis
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-emerald-900/20 text-emerald-400 border border-emerald-800/50 rounded text-[10px] font-medium font-mono">
                      ✓ No Predicted Failures
                    </span>
                    <span className="px-2 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded text-[10px] font-medium font-mono">
                      Cold Start: 200ms
                    </span>
                    <span className="px-2 py-1 bg-indigo-900/30 text-indigo-300 border border-indigo-700/50 rounded text-[10px] font-medium font-mono">
                      PCI-DSS Sovereign Compliant
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live Event Log & Optimization Tip (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Live Event Log */}
          <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest">
                Live Event Log
              </h4>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div className="space-y-3 font-mono text-[10px]">
              {actions.slice(0, 4).map((act, index) => (
                <div key={act.id} className="flex gap-2.5 items-start">
                  <span className="text-slate-500 shrink-0">{act.timestamp.split(' ')[0]}</span>
                  <span
                    className={`font-bold shrink-0 ${
                      index === 0
                        ? 'text-indigo-400'
                        : index === 1
                        ? 'text-blue-400'
                        : index === 2
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {index === 0 ? 'EXEC' : index === 1 ? 'AI' : index === 2 ? 'WARN' : 'POL'}
                  </span>
                  <span className="text-slate-300 truncate">
                    {act.workloadName}: {act.sourceCloud.toUpperCase()} → {act.destinationCloud.toUpperCase()}
                  </span>
                </div>
              ))}
              <div className="flex gap-2.5 items-start">
                <span className="text-slate-500 shrink-0">09:42:16</span>
                <span className="text-indigo-400 font-bold shrink-0">AI</span>
                <span className="text-slate-300">Continuous 8-step policy loop active</span>
              </div>
            </div>
          </div>

          {/* Optimization Tip Card */}
          <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/30 rounded-xl p-4 shadow-xl">
            <div className="text-xs font-bold text-indigo-300 uppercase mb-1 tracking-wider">
              Optimization Tip
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              8 microservices are currently over-provisioned in AWS Cluster 04. Switching to Azure Spot saves ~$1,420/mo.
            </p>
            <button
              onClick={() => setActiveView('cost-intelligence')}
              className="w-full py-2 bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 hover:text-white hover:bg-indigo-500/30 text-[10px] font-bold rounded-lg uppercase tracking-widest transition-colors cursor-pointer"
            >
              Review AI Plan
            </button>
          </div>
        </div>
      </div>

      {/* Decision Deep Explainability Modal */}
      <ExplainDecisionModal
        decision={selectedDecisionForModal}
        isOpen={!!selectedDecisionForModal}
        onClose={() => setSelectedDecisionForModal(null)}
      />
    </div>
  );
};
