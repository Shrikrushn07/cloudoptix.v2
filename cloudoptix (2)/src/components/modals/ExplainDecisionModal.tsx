import React from 'react';
import { AIDecision, CloudProviderId } from '../../types';
import { useSimulation } from '../../context/SimulationContext';
import { X, Sparkles, CheckCircle2, XCircle, ArrowRight, ShieldCheck, Cpu, DollarSign, Activity, Compass } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

interface ExplainDecisionModalProps {
  decision: AIDecision | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ExplainDecisionModal: React.FC<ExplainDecisionModalProps> = ({ decision, isOpen, onClose }) => {
  const { clouds, migrateWorkload, executeAutonomousRemediation } = useSimulation();

  if (!isOpen || !decision) return null;

  const targetCloudObj = clouds[decision.recommendedCloud];

  const handleApplyDecision = () => {
    migrateWorkload(decision.workloadId, decision.recommendedCloud, `AI Decision ${decision.id} accepted by administrator`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100">Explainable AI Decision Audit</h2>
                <span className="text-xs font-mono text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800/40">
                  {decision.id}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Multi-objective Pareto optimization trace and factor decomposition
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Main Decision Highlight */}
          <div className="bg-slate-950 border border-purple-500/40 rounded-xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">Subject Workload</span>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mt-0.5">
                  {decision.workloadName}
                  <span className="text-xs font-mono text-slate-400">({decision.workloadId})</span>
                </h3>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase block">Selected Destination</span>
                  <span className="text-base font-bold uppercase text-purple-300">
                    {clouds[decision.recommendedCloud]?.name || decision.recommendedCloud}
                  </span>
                </div>
                <div className="bg-purple-950/80 border border-purple-500/40 px-3 py-1.5 rounded-lg text-center">
                  <span className="text-[10px] text-purple-300 block uppercase">Confidence</span>
                  <span className="text-sm font-bold font-mono text-purple-200">{decision.confidence}%</span>
                </div>
              </div>
            </div>

            {/* Why This Cloud? */}
            <div className="mt-4">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wide block mb-1.5">
                Why {clouds[decision.recommendedCloud]?.shortName || decision.recommendedCloud.toUpperCase()}?
              </span>
              <p className="text-sm text-slate-300 bg-slate-900/90 p-3 rounded-lg border border-slate-800 leading-relaxed font-sans">
                &ldquo;{decision.summaryReason}&rdquo;
              </p>
            </div>
          </div>

          {/* Decision Factors Decomposition */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Explainable Decision Factors
            </h4>
            <div className="space-y-3">
              {decision.factors.map((factor) => (
                <div key={factor.factorName} className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80">
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="font-semibold text-slate-200">{factor.factorName}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 text-[11px]">Weight: {factor.weight}%</span>
                      <span className="font-mono font-bold text-purple-400">{factor.impactScore}/100</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500"
                      style={{ width: `${factor.impactScore}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400">{factor.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Candidate Cloud Comparative Table */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-3">
              Multi-Cloud Candidate Comparison
            </h4>
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Cloud Provider</th>
                    <th className="py-2.5 px-3">Overall Score</th>
                    <th className="py-2.5 px-3">Resource Headroom</th>
                    <th className="py-2.5 px-3">Est. Rate</th>
                    <th className="py-2.5 px-3">Latency</th>
                    <th className="py-2.5 px-3">Policy Feasibility</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                  {decision.candidateScores.map((c) => {
                    const isWinner = c.cloud === decision.recommendedCloud;
                    return (
                      <tr key={c.cloud} className={isWinner ? 'bg-purple-950/20' : ''}>
                        <td className="py-3 px-3 font-semibold uppercase text-slate-200 flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              c.cloud === 'aws' ? 'bg-amber-400' : c.cloud === 'azure' ? 'bg-sky-400' : 'bg-blue-400'
                            }`}
                          />
                          {c.cloud}
                          {isWinner && (
                            <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">
                              Selected
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-100">{c.totalScore}/100</td>
                        <td className="py-3 px-3 font-mono text-slate-300">{c.resourceAvailabilityScore}%</td>
                        <td className="py-3 px-3 font-mono text-amber-400">${c.estimatedCostPerHour}/hr</td>
                        <td className="py-3 px-3 font-mono text-sky-400">{c.estimatedLatencyMs} ms</td>
                        <td className="py-3 px-3">
                          {c.feasibility ? (
                            <span className="text-emerald-400 font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Passed
                            </span>
                          ) : (
                            <span className="text-rose-400 font-medium flex items-center gap-1" title={c.rejectReason}>
                              <XCircle className="w-3.5 h-3.5" /> Rejected
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <div className="text-xs text-slate-400">
              Policy Rule: <span className="text-slate-200 font-medium">{decision.policyRuleApplied}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-all"
              >
                Dismiss
              </button>
              <button
                onClick={handleApplyDecision}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Apply Decision
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
