import React, { useState, useMemo } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { CloudProviderId, Workload } from '../../types';
import { buildMultiCloudGraph } from '../../research/graph/graphBuilder';
import { defaultGraphSageModel } from '../../research/gnn/graphSageModel';
import { generateExplainableRecommendation } from '../../research/explainability/decisionExplainer';
import { CloudProviderLogo } from '../common/CloudProviderLogo';
import { StatusBadge } from '../common/StatusBadge';
import {
  Brain,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Layers,
  Network,
  Cpu,
  Zap,
  Activity,
  Sliders,
  Sparkles,
  RefreshCw,
  Info,
} from 'lucide-react';

export const GnnRecommendationsView: React.FC = () => {
  const { workloads, clouds, policies, stressCloud, unstressCloud, activeStress, migrateWorkload } =
    useSimulation();

  const [selectedWorkloadId, setSelectedWorkloadId] = useState<string>(workloads[0]?.id || 'WL-104');
  const [activeTab, setActiveTab] = useState<'ranking' | 'feasibility' | 'explainability'>('ranking');
  const [isApplying, setIsApplying] = useState(false);

  // Build real graph representation and run GraphSAGE forward pass
  const graph = useMemo(() => {
    return buildMultiCloudGraph(workloads, clouds, { includeDependencies: true, includeInterconnects: true });
  }, [workloads, clouds]);

  const embeddings = useMemo(() => {
    return defaultGraphSageModel.forwardEmbeddings(graph);
  }, [graph]);

  const selectedWorkload = useMemo(() => {
    return workloads.find((w) => w.id === selectedWorkloadId) || workloads[0];
  }, [workloads, selectedWorkloadId]);

  // Generate grounded GNN recommendation with hard feasibility masking
  const recommendation = useMemo(() => {
    if (!selectedWorkload) return null;
    return generateExplainableRecommendation(
      selectedWorkload,
      clouds,
      policies,
      workloads,
      graph,
      defaultGraphSageModel,
      embeddings
    );
  }, [selectedWorkload, clouds, policies, workloads, graph, embeddings]);

  const handleApplyPlacement = async () => {
    if (!recommendation?.recommendedCloud || !selectedWorkload) return;
    setIsApplying(true);
    await migrateWorkload(
      selectedWorkload.id,
      recommendation.recommendedCloud,
      `Autonomous GNN placement: ${recommendation.summaryExplanation}`
    );
    setIsApplying(false);
  };

  if (!selectedWorkload || !recommendation) {
    return <div className="p-8 text-center text-slate-400">Loading GNN model & topology...</div>;
  }

  const isStressOnAnyCloud = Object.values(activeStress).some(Boolean);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-950/80 border border-indigo-700/60 text-indigo-400">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
                  GraphSAGE Constraint-Aware Placement
                </h1>
                <span className="text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-700/50">
                  2-LAYER GNN + HARD MASK
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Inductive graph message passing across microservices with strict multi-cloud feasibility verification
              </p>
            </div>
          </div>
        </div>

        {/* Live Stress Remediator Trigger */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (activeStress.aws) unstressCloud('aws');
              else stressCloud('aws', 91);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
              activeStress.aws
                ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
                : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <span>AWS Stress: {activeStress.aws ? 'CRITICAL (91%)' : 'NORMAL'}</span>
          </button>
        </div>
      </div>

      {/* Workload Selector Bar */}
      <div className="p-4 bg-[#0b1120] border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
            Target Workload:
          </label>
          <select
            value={selectedWorkloadId}
            onChange={(e) => setSelectedWorkloadId(e.target.value)}
            className="bg-[#020617] border border-slate-700 text-xs font-bold text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none"
          >
            {workloads.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.id} • {w.cpuCores} vCPU • SLA {w.slaTargetPercent}%)
              </option>
            ))}
          </select>
        </div>

        {/* Graph context stats */}
        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1.5">
            <Network className="w-3.5 h-3.5 text-indigo-400" />
            <span>Graph Degree: <strong className="text-slate-200">{recommendation.graphMetrics.nodeDegree}</strong></span>
          </span>
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>Service Dependencies: <strong className="text-slate-200">{recommendation.graphMetrics.connectedDependenciesCount}</strong></span>
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>Inference: <strong className="text-slate-200">{recommendation.inferenceLatencyMs}ms</strong></span>
          </span>
        </div>
      </div>

      {/* Primary Recommendation Banner */}
      <div
        className={`p-6 rounded-2xl border shadow-xl transition-all ${
          recommendation.isFeasible
            ? 'bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-950 border-indigo-500/40'
            : 'bg-rose-950/30 border-rose-500/50'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {recommendation.isFeasible ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/60 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  FEASIBLE PLACEMENT IDENTIFIED
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-700/60 flex items-center gap-1 animate-pulse">
                  <XCircle className="w-3 h-3 text-rose-400" />
                  NO FEASIBLE PLACEMENT FOUND
                </span>
              )}

              <span className="text-xs font-mono text-slate-400">
                Confidence: <strong className="text-indigo-400">{recommendation.modelConfidence}%</strong>
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <h2 className="text-xl font-bold text-white">
                {recommendation.isFeasible
                  ? `Recommended Target: ${clouds[recommendation.recommendedCloud!].name}`
                  : 'All Multi-Cloud Candidates Infeasible'}
              </h2>
              {recommendation.isFeasible && (
                <span className="text-xs font-mono text-slate-400">
                  ({clouds[recommendation.recommendedCloud!].region})
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              {recommendation.summaryExplanation}
            </p>
          </div>

          {/* Action Trigger */}
          {recommendation.isFeasible && recommendation.recommendedCloud !== selectedWorkload.cloud && (
            <button
              onClick={handleApplyPlacement}
              disabled={isApplying}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer self-start lg:self-center shrink-0"
            >
              {isApplying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Migrating via GNN Plan...</span>
                </>
              ) : (
                <>
                  <span>Deploy to {clouds[recommendation.recommendedCloud!].shortName}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-6 text-xs font-bold uppercase tracking-wider">
        <button
          onClick={() => setActiveTab('ranking')}
          className={`pb-3 transition-colors cursor-pointer border-b-2 ${
            activeTab === 'ranking'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          1. GNN Candidate Rankings & Mask
        </button>
        <button
          onClick={() => setActiveTab('feasibility')}
          className={`pb-3 transition-colors cursor-pointer border-b-2 ${
            activeTab === 'feasibility'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          2. Hard Constraint Verification Gates
        </button>
        <button
          onClick={() => setActiveTab('explainability')}
          className={`pb-3 transition-colors cursor-pointer border-b-2 ${
            activeTab === 'explainability'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          3. Rejection Rationales & Grounded Attribution
        </button>
      </div>

      {/* Tab 1: GNN Candidate Rankings */}
      {activeTab === 'ranking' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recommendation.candidateRankings.map((cand) => {
            const cloud = clouds[cand.cloud];
            const isWinner = recommendation.recommendedCloud === cand.cloud;

            return (
              <div
                key={cand.cloud}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  !cand.isFeasible
                    ? 'bg-[#0b1120]/60 border-rose-900/40 opacity-75'
                    : isWinner
                    ? 'bg-indigo-950/30 border-indigo-500 ring-1 ring-indigo-500/40 shadow-xl'
                    : 'bg-[#0b1120] border-slate-800'
                }`}
              >
                <div>
                  {/* Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
                    <div className="flex items-center gap-2.5">
                      <CloudProviderLogo provider={cand.cloud} size="md" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-100 text-sm">{cloud.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">({cloud.region})</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 uppercase">
                          Rank #{cand.rank} {isWinner && '• OPTIMAL'}
                        </span>
                      </div>
                    </div>

                    {cand.isFeasible ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                        FEASIBLE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800">
                        MASKED OUT
                      </span>
                    )}
                  </div>

                  {/* Score Breakdown */}
                  <div className="space-y-3 mb-5">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400 font-mono">Final Masked Placement Score</span>
                        <span className="font-mono font-bold text-indigo-300">{cand.maskedScore}/100</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            cand.isFeasible ? 'bg-indigo-500' : 'bg-slate-700'
                          }`}
                          style={{ width: `${cand.maskedScore}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-[11px] font-mono text-slate-500 flex justify-between">
                      <span>Raw GraphSAGE Prediction:</span>
                      <span className="text-slate-400 font-bold">{cand.rawGnnScore}/100</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-2 border-t border-slate-800">
                      <div>
                        <span className="text-slate-500 block">Est. Cost/Hr:</span>
                        <span className="text-slate-200 font-bold">${cand.estimatedCostPerHour}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Round-Trip Latency:</span>
                        <span className="text-slate-200 font-bold">{cand.estimatedLatencyMs}ms</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Carbon Intensity:</span>
                        <span className="text-slate-200 font-bold">{cand.carbonGrams} gCO2</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Cluster Headroom:</span>
                        <span className="text-emerald-400 font-bold">
                          {100 - cloud.cpuUtilizedPercent}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Constraint rejection or approval note */}
                <div
                  className={`p-3 rounded-xl text-[11px] font-mono border ${
                    cand.isFeasible
                      ? 'bg-emerald-950/30 text-emerald-300 border-emerald-800/40'
                      : 'bg-rose-950/40 text-rose-300 border-rose-800/50'
                  }`}
                >
                  {cand.isFeasible ? (
                    <span>✓ Passed CPU, Memory, Latency, SLA & Policy checks.</span>
                  ) : (
                    <span>✕ {cand.feasibilityDetails.rejectionReasons[0]}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Hard Constraint Verification Gates */}
      {activeTab === 'feasibility' && (
        <div className="bg-[#0b1120] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 bg-slate-900/40">
            <h3 className="text-sm font-bold text-slate-200">
              Hard Feasibility Gate Audit Matrix (Constraint-Aware Mask)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Strict exclusion of candidates violating cluster headroom, latency ceilings, SLA thresholds, or compliance rules.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#020617] text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Cloud Provider</th>
                  <th className="py-3 px-4">CPU Capacity Gate (&le; 85%)</th>
                  <th className="py-3 px-4">RAM Footprint Gate (&le; 90%)</th>
                  <th className="py-3 px-4">SLA Floor Gate (&ge; {selectedWorkload.slaTargetPercent}%)</th>
                  <th className="py-3 px-4">Latency Ceiling (&le; {selectedWorkload.latencyMs}ms)</th>
                  <th className="py-3 px-4">Placement Policy Gate</th>
                  <th className="py-3 px-4">Feasibility Mask Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {recommendation.candidateRankings.map((cand) => {
                  const cloud = clouds[cand.cloud];
                  const details = cand.feasibilityDetails;

                  return (
                    <tr key={cand.cloud} className="hover:bg-slate-850/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-200 flex items-center gap-2">
                        <CloudProviderLogo provider={cand.cloud} size="sm" />
                        <span>{cloud.name}</span>
                      </td>

                      {/* CPU */}
                      <td className="py-3.5 px-4 font-mono">
                        {details.cpuFeasible ? (
                          <span className="text-emerald-400 flex items-center gap-1 font-bold">
                            ✓ {details.cpuUtilizationIfPlaced}% (Pass)
                          </span>
                        ) : (
                          <span className="text-rose-400 flex items-center gap-1 font-bold">
                            ✕ {details.cpuUtilizationIfPlaced}% (Exceeded)
                          </span>
                        )}
                      </td>

                      {/* RAM */}
                      <td className="py-3.5 px-4 font-mono">
                        {details.memoryFeasible ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            ✓ {details.memoryUtilizationIfPlaced}% (Pass)
                          </span>
                        ) : (
                          <span className="text-rose-400 flex items-center gap-1 font-bold">
                            ✕ {details.memoryUtilizationIfPlaced}% (Failed)
                          </span>
                        )}
                      </td>

                      {/* SLA */}
                      <td className="py-3.5 px-4 font-mono">
                        {details.slaFeasible ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            ✓ {cloud.uptime90d}% (Pass)
                          </span>
                        ) : (
                          <span className="text-rose-400 flex items-center gap-1 font-bold">
                            ✕ {cloud.uptime90d}% (Below target)
                          </span>
                        )}
                      </td>

                      {/* Latency */}
                      <td className="py-3.5 px-4 font-mono">
                        {details.latencyFeasible ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            ✓ {details.predictedLatencyMs}ms (Pass)
                          </span>
                        ) : (
                          <span className="text-rose-400 flex items-center gap-1 font-bold">
                            ✕ {details.predictedLatencyMs}ms (Violated)
                          </span>
                        )}
                      </td>

                      {/* Policy */}
                      <td className="py-3.5 px-4 font-mono">
                        {details.policyFeasible ? (
                          <span className="text-emerald-400">✓ Allowed</span>
                        ) : (
                          <span className="text-rose-400 font-bold">✕ Policy Disallowed</span>
                        )}
                      </td>

                      {/* Mask Outcome */}
                      <td className="py-3.5 px-4 font-mono">
                        {details.isFeasible ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                            ELIGIBLE (1)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                            MASKED (0)
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
      )}

      {/* Tab 3: Rejection Rationales & Grounded Attribution */}
      {activeTab === 'explainability' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Why Selected */}
          <div className="p-6 bg-[#0b1120] border border-slate-800 rounded-2xl space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Grounded Multi-Objective Attribution Factors</span>
            </h3>
            <p className="text-xs text-slate-400">
              Feature contributions derived from actual workload specifications, regional cloud telemetry, and graph dependencies:
            </p>

            <div className="space-y-3">
              {recommendation.topInfluencingFactors.map((factor, i) => (
                <div key={i} className="p-3 bg-[#020617] rounded-xl border border-slate-800">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-bold text-slate-200">{factor.factor}</span>
                    <span className="font-mono text-indigo-400 font-bold">{factor.score}/100</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 block">{factor.importance}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rejection Rationales for Alternatives */}
          <div className="p-6 bg-[#0b1120] border border-slate-800 rounded-2xl space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Alternative Provider Rejection Audit</span>
            </h3>
            <p className="text-xs text-slate-400">
              Scientific justification explaining why other candidate cloud providers were ruled out or ranked lower:
            </p>

            <div className="space-y-3">
              {(['aws', 'azure', 'gcp'] as CloudProviderId[]).map((cid) => {
                const cloud = clouds[cid];
                const isWinner = recommendation.recommendedCloud === cid;
                const rationale = recommendation.rejectionRationales[cid];

                return (
                  <div
                    key={cid}
                    className={`p-3.5 rounded-xl border ${
                      isWinner
                        ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                        : 'bg-[#020617] border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <CloudProviderLogo provider={cid} size="sm" />
                      <span className="font-bold text-xs text-white">{cloud.name}</span>
                      {isWinner ? (
                        <span className="text-[9px] font-mono bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-800">
                          SELECTED
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded">
                          REJECTED / SUBOPTIMAL
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-slate-400 leading-relaxed">{rationale}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
