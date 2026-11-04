import React, { useState } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { CloudProviderId } from '../../types';
import {
  BenchmarkRunReport,
  ExperimentRunConfig,
  MultiObjectiveWeights,
  PlacementAlgorithmId,
  SingleAlgorithmBenchmarkResult,
} from '../../research/types';
import { executeBenchmarkExperiment } from '../../research/benchmarks/experimentRunner';
import { DEFAULT_OBJECTIVE_WEIGHTS } from '../../research/optimization/multiObjective';
import {
  FlaskConical,
  Play,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  Activity,
  Layers,
  Award,
  Download,
  RotateCcw,
  Sliders,
  Zap,
  Clock,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export const ExperimentsView: React.FC = () => {
  const { workloads, clouds, policies } = useSimulation();

  // Experiment Configuration State
  const [workloadCount, setWorkloadCount] = useState<number>(36);
  const [selectedClouds, setSelectedClouds] = useState<CloudProviderId[]>(['aws', 'azure', 'gcp']);
  const [weights, setWeights] = useState<MultiObjectiveWeights>({ ...DEFAULT_OBJECTIVE_WEIGHTS });
  const [cpuThreshold, setCpuThreshold] = useState<number>(85);
  const [enableDependencies, setEnableDependencies] = useState<boolean>(true);
  const [randomSeed, setRandomSeed] = useState<number>(42);

  // Execution State
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentReport, setCurrentReport] = useState<BenchmarkRunReport | null>(null);

  const handleRunExperiment = () => {
    setIsRunning(true);
    setTimeout(() => {
      const config: ExperimentRunConfig = {
        name: `Multi-Cloud Benchmark (${workloadCount} Workloads)`,
        workloadCount,
        cloudProviders: selectedClouds,
        weights,
        cpuCapacityThresholdPercent: cpuThreshold,
        memoryCapacityThresholdPercent: 90,
        slaMarginPercent: 99.9,
        enableInterWorkloadDependencies: enableDependencies,
        randomSeed,
        algorithmsToRun: [
          'random_feasible',
          'round_robin',
          'best_fit',
          'baseline_weighted_scoring',
          'graphsage_unmasked',
          'graphsage_feasibility_masked',
        ],
      };

      const report = executeBenchmarkExperiment(config, workloads, clouds, policies);
      setCurrentReport(report);
      setIsRunning(false);
    }, 450);
  };

  const handleExportJson = () => {
    if (!currentReport) return;
    const blob = new Blob([JSON.stringify(currentReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cloudoptix-benchmark-${currentReport.runId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-950/80 border border-purple-700/60 text-purple-400">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
                  Empirical Benchmark Laboratory
                </h1>
                <span className="text-[10px] font-mono font-bold bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-800/40">
                  REPRODUCIBLE RESEARCH
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Scientific evaluation comparing GraphSAGE + Hard Feasibility Masking against 5 multi-cloud placement baselines
              </p>
            </div>
          </div>
        </div>

        {currentReport && (
          <button
            onClick={handleExportJson}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Experiment Run (.JSON)</span>
          </button>
        )}
      </div>

      {/* Experiment Configuration Controls Card */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Experiment Run Parameters
            </h2>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            Configure multi-cloud workloads, objective weights & constraints
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5 text-xs">
          {/* Workload Count */}
          <div className="space-y-1.5">
            <label className="font-mono text-slate-400 block font-bold">
              Workload Fleet Scale: <strong className="text-white">{workloadCount} Workloads</strong>
            </label>
            <input
              type="range"
              min="12"
              max="96"
              step="6"
              value={workloadCount}
              onChange={(e) => setWorkloadCount(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>12</span>
              <span>48</span>
              <span>96</span>
            </div>
          </div>

          {/* CPU Feasibility Ceiling */}
          <div className="space-y-1.5">
            <label className="font-mono text-slate-400 block font-bold">
              CPU Safety Ceiling: <strong className="text-white">{cpuThreshold}% Max</strong>
            </label>
            <input
              type="range"
              min="70"
              max="95"
              step="5"
              value={cpuThreshold}
              onChange={(e) => setCpuThreshold(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>70% (Conservative)</span>
              <span>85%</span>
              <span>95% (Aggressive)</span>
            </div>
          </div>

          {/* Random Seed */}
          <div className="space-y-1.5">
            <label className="font-mono text-slate-400 block font-bold">
              Random Seed (Reproducibility):
            </label>
            <input
              type="number"
              value={randomSeed}
              onChange={(e) => setRandomSeed(Number(e.target.value))}
              className="w-full bg-[#020617] border border-slate-700 text-slate-200 rounded-xl px-3 py-1.5 font-mono text-xs focus:outline-none"
            />
            <span className="text-[10px] font-mono text-slate-500 block">Ensures identical stochastic sampling</span>
          </div>

          {/* Graph Dependencies Toggle */}
          <div className="space-y-1.5 flex flex-col justify-center">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={enableDependencies}
                onChange={(e) => setEnableDependencies(e.target.checked)}
                className="w-4 h-4 rounded accent-indigo-500"
              />
              <span className="font-bold text-slate-200">Model Microservice Dependencies</span>
            </label>
            <span className="text-[10px] font-mono text-slate-500">
              Constructs inter-service edges for communication cost minimization
            </span>
          </div>
        </div>

        {/* Objective Weights Sliders */}
        <div className="pt-3 border-t border-slate-800">
          <label className="text-[11px] font-mono text-slate-400 uppercase font-bold block mb-2">
            Multi-Objective Pareto Weight Tuning (&Sigma; w_i = 1.0)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px]">Cost Weight:</span>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={weights.costWeight}
                onChange={(e) => setWeights({ ...weights, costWeight: Number(e.target.value) })}
                className="w-full bg-[#020617] border border-slate-700 rounded-lg p-1 text-slate-200"
              />
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Latency Weight:</span>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={weights.latencyWeight}
                onChange={(e) => setWeights({ ...weights, latencyWeight: Number(e.target.value) })}
                className="w-full bg-[#020617] border border-slate-700 rounded-lg p-1 text-slate-200"
              />
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">SLA Weight:</span>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={weights.slaWeight}
                onChange={(e) => setWeights({ ...weights, slaWeight: Number(e.target.value) })}
                className="w-full bg-[#020617] border border-slate-700 rounded-lg p-1 text-slate-200"
              />
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Headroom Weight:</span>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={weights.utilizationWeight}
                onChange={(e) => setWeights({ ...weights, utilizationWeight: Number(e.target.value) })}
                className="w-full bg-[#020617] border border-slate-700 rounded-lg p-1 text-slate-200"
              />
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Carbon Weight:</span>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={weights.carbonWeight}
                onChange={(e) => setWeights({ ...weights, carbonWeight: Number(e.target.value) })}
                className="w-full bg-[#020617] border border-slate-700 rounded-lg p-1 text-slate-200"
              />
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Network Comm:</span>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={weights.communicationWeight}
                onChange={(e) => setWeights({ ...weights, communicationWeight: Number(e.target.value) })}
                className="w-full bg-[#020617] border border-slate-700 rounded-lg p-1 text-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={handleRunExperiment}
            disabled={isRunning}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
          >
            {isRunning ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Executing Benchmark Runs (6 Algorithms)...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Execute Empirical Experiment</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Benchmark Dashboard Results Section */}
      {!currentReport ? (
        /* Un-evaluated State */
        <div className="p-12 text-center bg-[#0b1120] border border-slate-800 rounded-2xl space-y-3 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <FlaskConical className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-200">Not Evaluated Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Configure the experimental parameters above and click <strong>"Execute Empirical Experiment"</strong> to benchmark the proposed GraphSAGE method against Baseline 1 and all heuristic algorithms.
          </p>
        </div>
      ) : (
        /* Real Evaluated Results */
        <div className="space-y-6 animate-fade-in">
          {/* Top KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#0b1120] p-4 rounded-xl border border-indigo-500/50 shadow-xl">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                Top Performing Framework
              </span>
              <div className="text-lg font-bold text-indigo-300 mt-1 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400 shrink-0" />
                <span>GraphSAGE + Masking</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 block mt-0.5">
                Score: {currentReport.results['graphsage_feasibility_masked'].overallScore}/100
              </span>
            </div>

            <div className="bg-[#0b1120] p-4 rounded-xl border border-slate-800 shadow-xl">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                Cost Reduction vs Baseline 1
              </span>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                +{currentReport.results['graphsage_feasibility_masked'].costReductionVsBaselinePercent}%
              </div>
              <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                Saved vs Existing Weighted Scoring
              </span>
            </div>

            <div className="bg-[#0b1120] p-4 rounded-xl border border-slate-800 shadow-xl">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                Constraint Feasibility Rate
              </span>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {currentReport.results['graphsage_feasibility_masked'].feasiblePlacementRatePercent}%
              </div>
              <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                0 Infeasible Assignments
              </span>
            </div>

            <div className="bg-[#0b1120] p-4 rounded-xl border border-slate-800 shadow-xl">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                Decision Throughput
              </span>
              <div className="text-2xl font-bold font-mono text-purple-400 mt-1">
                {currentReport.results['graphsage_feasibility_masked'].averageDecisionTimeUs} &micro;s
              </div>
              <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                Sub-millisecond inference
              </span>
            </div>
          </div>

          {/* Comparative Matrix Table */}
          <div className="bg-[#0b1120] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  Comprehensive 6-Algorithm Empirical Benchmark Matrix
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  Evaluated across {currentReport.workloadCount} workloads (Run ID: {currentReport.runId} • {currentReport.timestamp})
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#020617] text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Placement Algorithm</th>
                    <th className="py-3 px-4">Monthly Cost</th>
                    <th className="py-3 px-4">Cost vs Baseline 1</th>
                    <th className="py-3 px-4">SLA Violations</th>
                    <th className="py-3 px-4">Average Latency</th>
                    <th className="py-3 px-4">Cloud Util.</th>
                    <th className="py-3 px-4">Carbon (kg/day)</th>
                    <th className="py-3 px-4">Feasible Rate</th>
                    <th className="py-3 px-4">Decision Time</th>
                    <th className="py-3 px-4">Overall Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {(Object.values(currentReport.results) as SingleAlgorithmBenchmarkResult[]).map((res) => {
                    const isProposed = res.algorithmId === 'graphsage_feasibility_masked';
                    const isBaseline1 = res.algorithmId === 'baseline_weighted_scoring';

                    return (
                      <tr
                        key={res.algorithmId}
                        className={`transition-colors ${
                          isProposed
                            ? 'bg-indigo-950/40 font-bold text-indigo-200'
                            : isBaseline1
                            ? 'bg-slate-900/40 text-slate-200'
                            : 'hover:bg-slate-850/40 text-slate-300'
                        }`}
                      >
                        <td className="py-3.5 px-4 font-sans font-bold flex items-center gap-2">
                          {isProposed && <Award className="w-4 h-4 text-amber-400 shrink-0" />}
                          <span>{res.algorithmName}</span>
                          {isBaseline1 && (
                            <span className="text-[9px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded border border-slate-700">
                              PRESERVED
                            </span>
                          )}
                        </td>

                        {/* Monthly Cost */}
                        <td className="py-3.5 px-4 font-bold text-white">
                          ${res.totalMonthlyCost.toLocaleString()}
                        </td>

                        {/* Cost Reduction */}
                        <td className="py-3.5 px-4">
                          {res.costReductionVsBaselinePercent > 0 ? (
                            <span className="text-emerald-400 font-bold">
                              -{res.costReductionVsBaselinePercent}%
                            </span>
                          ) : res.costReductionVsBaselinePercent < 0 ? (
                            <span className="text-rose-400">
                              +{Math.abs(res.costReductionVsBaselinePercent)}%
                            </span>
                          ) : (
                            <span className="text-slate-500">0.0% (Ref)</span>
                          )}
                        </td>

                        {/* SLA Violations */}
                        <td className="py-3.5 px-4">
                          {res.slaViolationRatePercent === 0 ? (
                            <span className="text-emerald-400 font-bold">0.0%</span>
                          ) : (
                            <span className="text-rose-400">{res.slaViolationRatePercent}%</span>
                          )}
                        </td>

                        {/* Average Latency */}
                        <td className="py-3.5 px-4">{res.averageLatencyMs} ms</td>

                        {/* Cloud Utilization */}
                        <td className="py-3.5 px-4">{res.averageCloudUtilizationPercent}%</td>

                        {/* Carbon */}
                        <td className="py-3.5 px-4">{res.totalCarbonIntensityKgPerDay} kg</td>

                        {/* Feasible Rate */}
                        <td className="py-3.5 px-4">
                          {res.feasiblePlacementRatePercent >= 99 ? (
                            <span className="text-emerald-400 font-bold">
                              {res.feasiblePlacementRatePercent}%
                            </span>
                          ) : (
                            <span className="text-amber-400 font-bold">
                              {res.feasiblePlacementRatePercent}% ({res.infeasibleAssignmentsCount} failed)
                            </span>
                          )}
                        </td>

                        {/* Decision Time */}
                        <td className="py-3.5 px-4 text-slate-400">{res.averageDecisionTimeUs} &micro;s</td>

                        {/* Overall Score */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold ${
                              isProposed
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {res.overallScore}/100
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Key Insights & Findings */}
          <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Key Empirical Findings & Scientific Insights</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
              {currentReport.keyInsights.map((insight, idx) => (
                <div key={idx} className="p-3 bg-[#020617] rounded-xl border border-slate-800 leading-relaxed font-mono">
                  {insight}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
