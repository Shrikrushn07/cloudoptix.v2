import React, { useState } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import {
  TASK_REGIMES,
  MultiCloudSimulationEnv,
} from '../../research/metaRl/simulationEnv';
import { TaskRegimeId } from '../../research/metaRl/metaRLTypes';
import {
  getCachedBenchmarkResults,
  runLiveEvaluationOnRegime,
} from '../../research/metaRl/metaRLBenchmark';
import {
  Cpu,
  Zap,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Play,
  RotateCcw,
  Layers,
  ArrowRight,
  Server,
  Activity,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';

export const MetaRlView: React.FC = () => {
  const { workloads, clouds, policies } = useSimulation();

  const [selectedRegime, setSelectedRegime] = useState<TaskRegimeId>('PROVIDER_FAILURE');
  const [adaptSteps, setAdaptSteps] = useState<number>(3);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [liveResults, setLiveResults] = useState<ReturnType<typeof runLiveEvaluationOnRegime> | null>(null);

  const benchmarkRows = getCachedBenchmarkResults();

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const res = runLiveEvaluationOnRegime(workloads, clouds, policies, selectedRegime, adaptSteps);
      setLiveResults(res);
      setIsSimulating(false);
    }, 400);
  };

  const currentRegimeConfig = TASK_REGIMES[selectedRegime];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold uppercase">
              Research Prototype
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase">
              Simulated Environment
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold uppercase">
              MAML Meta-PPO
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Zap className="w-6 h-6 text-indigo-400" />
            Graph-Aware Meta-Reinforcement Learning
          </h1>
          <p className="text-sm text-slate-400 mt-0.5 max-w-3xl">
            Few-shot policy adaptation for non-stationary multi-cloud environments. Learns an adaptable initial policy
            across training regimes and adapts in 1–3 gradient steps to sudden outages, bursts, and latency spikes.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            {isSimulating ? (
              <Clock className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-white" />
            )}
            Run Task Adaptation
          </button>
        </div>
      </div>

      {/* 3 Core Architectural Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-white text-sm">80-Dim Graph-Aware State</h3>
            <p className="text-xs text-slate-400 mt-1">
              Fuses 16-dim GraphSAGE microservice dependency embeddings, 48-dim cloud structural vectors, and 16-dim normalized cluster telemetry.
            </p>
          </div>
          <div className="mt-3 text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
            Observation: <span className="text-slate-300">s_t ∈ ℝ⁸⁰</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-white text-sm">Fast Inner-Loop Adaptation</h3>
            <p className="text-xs text-slate-400 mt-1">
              MAML-style meta-optimization learns parameter sensitivity θ* allowing 1–3 policy gradient steps on support rollouts to resolve novel operational regimes.
            </p>
          </div>
          <div className="mt-3 text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
            Inner Step: <span className="text-slate-300">θ&apos; = θ - α∇L_T(θ)</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-white text-sm">Safety Controller Intercept</h3>
            <p className="text-xs text-slate-400 mt-1">
              Active feasibility filter intercepts actions violating hard cloud boundaries (&gt;92% load or region outage), rerouting to safe clusters or quarantine.
            </p>
          </div>
          <div className="mt-3 text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Constraint: <span className="text-slate-300">Zero Infeasible Placements</span>
          </div>
        </div>
      </div>

      {/* 7 Task Regimes Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-indigo-400" />
            Task Distributions &amp; Environmental Regimes
          </h2>
          <span className="text-xs text-slate-400">
            4 Meta-Training Regimes · 3 Held-Out Evaluation Regimes
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.values(TASK_REGIMES).map((regime) => {
            const isSelected = selectedRegime === regime.id;
            return (
              <div
                key={regime.id}
                onClick={() => setSelectedRegime(regime.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-800/90 border-indigo-500/80 shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/40'
                    : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-850/60 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                        regime.isHeldOut
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {regime.isHeldOut ? 'HELD-OUT EVAL' : 'META-TRAIN'}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-white leading-snug">{regime.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {regime.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>Burst: {regime.burstMultiplier}x</span>
                  <span>
                    {regime.failedProvider ? (
                      <span className="text-rose-400 font-bold">FAIL: {regime.failedProvider.toUpperCase()}</span>
                    ) : (
                      <span className="text-emerald-400">ALL HEALTHY</span>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Interactive Task Adaptation Studio */}
      <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" />
              Live Task Adaptation Sandbox: {currentRegimeConfig.name}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulates deploying the Meta-RL policy into this regime and executing {adaptSteps} gradient adaptation steps.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs">
              <span className="text-slate-400">Inner Steps:</span>
              <span className="font-mono font-bold text-indigo-400">{adaptSteps}</span>
              <input
                type="range"
                min={1}
                max={5}
                value={adaptSteps}
                onChange={(e) => setAdaptSteps(Number(e.target.value))}
                className="w-20 accent-indigo-500 cursor-pointer"
              />
            </div>

            <button
              onClick={handleRunSimulation}
              disabled={isSimulating}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Re-Adapt
            </button>
          </div>
        </div>

        {liveResults ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <div className="text-[11px] font-medium text-slate-400 uppercase">Pre-Adapt Reward</div>
              <div className="text-lg font-mono font-bold text-amber-400 mt-1">
                {liveResults.unadaptedResults.meanReward > 0 ? '+' : ''}
                {liveResults.unadaptedResults.meanReward}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Cold-start initial policy</div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <div className="text-[11px] font-medium text-slate-400 uppercase">Post-Adapt Reward</div>
              <div className="text-lg font-mono font-bold text-emerald-400 mt-1">
                {liveResults.adaptedResults.meanReward > 0 ? '+' : ''}
                {liveResults.adaptedResults.meanReward}
              </div>
              <div className="text-[10px] text-emerald-400/80 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Adapted after {adaptSteps} gradient steps
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <div className="text-[11px] font-medium text-slate-400 uppercase">SLA Violation Rate</div>
              <div className="text-lg font-mono font-bold text-slate-200 mt-1">
                {liveResults.adaptedResults.slaRate}%
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Was {liveResults.unadaptedResults.slaRate}% pre-adaptation
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <div className="text-[11px] font-medium text-slate-400 uppercase">Safety Violations</div>
              <div className="text-lg font-mono font-bold text-emerald-400 mt-1">
                0 Violations
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Controller intercepted {liveResults.adaptedResults.safetyViolations} unsafe actions
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-slate-950/40 border border-slate-800/60 text-center text-xs text-slate-400">
            Click &quot;Run Task Adaptation&quot; above to simulate few-shot policy adaptation on the selected environment regime.
          </div>
        )}
      </div>

      {/* 7-Algorithm Benchmark Table */}
      <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              7-Algorithm Benchmark Comparison (Held-Out Regimes)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Evaluated across Capacity Reduction, Latency Spike, and Provider Failure regimes across seeds [42, 101, 202].
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950/60 border border-indigo-800/40 px-2 py-0.5 rounded">
              Seeds: 42, 101, 202
            </span>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
              N = 25 Workloads · 30 Steps/Episode
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                <th className="py-2.5 px-3">Algorithm</th>
                <th className="py-2.5 px-2">Type</th>
                <th className="py-2.5 px-2 text-right">Cost/hr</th>
                <th className="py-2.5 px-2 text-right">SLA Viol</th>
                <th className="py-2.5 px-2 text-right">p95 Latency</th>
                <th className="py-2.5 px-2 text-right">Carbon</th>
                <th className="py-2.5 px-2 text-right">Util Balance</th>
                <th className="py-2.5 px-2 text-right">Adapt Steps</th>
                <th className="py-2.5 px-2 text-right">Reward</th>
                <th className="py-2.5 px-3 text-right">Safety Viols</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {benchmarkRows.map((row) => {
                const isProposed = row.statusBadge === 'PROPOSED';
                return (
                  <tr
                    key={row.algorithmId}
                    className={`transition-colors ${
                      isProposed ? 'bg-indigo-950/30 font-medium' : 'hover:bg-slate-850/40'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-semibold text-slate-200 flex items-center gap-2">
                      {isProposed && <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                      {row.algorithmName}
                    </td>
                    <td className="py-2.5 px-2">
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                          isProposed
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                            : row.statusBadge === 'STATIC_GNN'
                            ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {row.statusBadge}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-slate-300">
                      ${row.totalCostPerHour.toFixed(2)}
                      {row.costStdDev !== undefined && (
                        <span className="text-[10px] text-slate-500 ml-1">±{row.costStdDev.toFixed(2)}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono">
                      <span
                        className={
                          row.slaViolationRate > 50
                            ? 'text-rose-400 font-bold'
                            : row.slaViolationRate > 35
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }
                      >
                        {row.slaViolationRate.toFixed(1)}%
                      </span>
                      {row.slaStdDev !== undefined && (
                        <span className="text-[10px] text-slate-500 ml-1">±{row.slaStdDev.toFixed(1)}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-slate-300">
                      {row.p95LatencyMs.toFixed(1)}ms
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-slate-400">
                      {row.carbonGrams.toFixed(1)}g
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-slate-300">
                      {row.resourceUtilizationPercent.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-slate-400">
                      {row.adaptationStepsRequired}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono font-bold">
                      <span
                        className={
                          row.meanReward > -3.0
                            ? 'text-emerald-400'
                            : row.meanReward > -4.0
                            ? 'text-slate-300'
                            : 'text-amber-400'
                        }
                      >
                        {row.meanReward > 0 ? '+' : ''}
                        {row.meanReward.toFixed(3)}
                      </span>
                      {row.rewardStdDev !== undefined && (
                        <span className="text-[10px] text-slate-500 font-normal ml-1">±{row.rewardStdDev.toFixed(2)}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {row.safetyViolationCount === 0 ? (
                        <span className="text-emerald-400 font-bold">0</span>
                      ) : (
                        <span className="text-amber-400 font-bold">{row.safetyViolationCount}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
