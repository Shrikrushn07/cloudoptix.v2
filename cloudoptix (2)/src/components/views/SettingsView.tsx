import React, { useState } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import {
  Settings,
  Sliders,
  Sparkles,
  RotateCcw,
  Shield,
  Key,
  Bell,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    isAutonomousActive,
    setIsAutonomousActive,
    resetSimulation,
  } = useSimulation();

  const [resourceWeight, setResourceWeight] = useState(30);
  const [costWeight, setCostWeight] = useState(25);
  const [latencyWeight, setLatencyWeight] = useState(20);
  const [slaWeight, setSlaWeight] = useState(15);
  const [historyWeight, setHistoryWeight] = useState(10);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveWeights = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Control Plane & Engine Settings</h1>
            <span className="text-xs font-mono font-bold bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700">
              v2.4.0-enterprise
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic scoring weights, autonomous loop intervals, hyperscaler identity credentials, and webhook endpoints
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in shadow-lg shadow-emerald-950/40">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Decision engine configuration weights updated & deployed to all nodes.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Scoring Weights Form (7 cols) */}
        <form
          onSubmit={handleSaveWeights}
          className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5"
        >
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <Sliders className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wide">
                Pareto Multi-Objective Scoring Weights
              </h3>
              <p className="text-xs text-slate-400">Total weight should normalize to 100%</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-200">Resource Headroom Weight</span>
                <span className="font-mono text-purple-400 font-bold">{resourceWeight}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={50}
                value={resourceWeight}
                onChange={(e) => setResourceWeight(Number(e.target.value))}
                className="w-full accent-purple-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-200">FinOps Cost Arbitrage Weight</span>
                <span className="font-mono text-purple-400 font-bold">{costWeight}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={50}
                value={costWeight}
                onChange={(e) => setCostWeight(Number(e.target.value))}
                className="w-full accent-purple-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-200">Latency Sensitivity Weight</span>
                <span className="font-mono text-purple-400 font-bold">{latencyWeight}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={50}
                value={latencyWeight}
                onChange={(e) => setLatencyWeight(Number(e.target.value))}
                className="w-full accent-purple-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-200">SLA Historical Target Weight</span>
                <span className="font-mono text-purple-400 font-bold">{slaWeight}%</span>
              </div>
              <input
                type="range"
                min={5}
                max={30}
                value={slaWeight}
                onChange={(e) => setSlaWeight(Number(e.target.value))}
                className="w-full accent-purple-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-200">Historical Placement Reliability</span>
                <span className="font-mono text-purple-400 font-bold">{historyWeight}%</span>
              </div>
              <input
                type="range"
                min={5}
                max={30}
                value={historyWeight}
                onChange={(e) => setHistoryWeight(Number(e.target.value))}
                className="w-full accent-purple-500"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
            >
              Update Scoring Matrix
            </button>
          </div>
        </form>

        {/* Hyperscaler Connectors & Sandbox Reset (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Autonomous Mode Toggle */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-100 uppercase tracking-wide">
                  Autonomous Remediation
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Allow AI engine to execute live workload migrations
                </p>
              </div>
              <button
                onClick={() => setIsAutonomousActive(!isAutonomousActive)}
                className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg border transition-all ${
                  isAutonomousActive
                    ? 'bg-emerald-950 text-emerald-400 border-emerald-500/50'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {isAutonomousActive ? 'ACTIVE' : 'PAUSED'}
              </button>
            </div>
          </div>

          {/* Connected Cloud Identity Roles */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3 text-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Lock className="w-4 h-4 text-purple-400" />
              <h4 className="font-bold text-slate-100 uppercase tracking-wider">
                Hyperscaler Cloud IAM Connectors
              </h4>
            </div>

            <div className="space-y-2 font-mono text-[11px]">
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-slate-300">
                <span className="text-slate-400 block text-[10px]">AWS IAM Cross-Account Role:</span>
                arn:aws:iam::849201948201:role/CloudOptiX-Orchestrator
              </div>
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-slate-300">
                <span className="text-slate-400 block text-[10px]">Azure Workload Identity:</span>
                sp-cloudoptix-eastus-prod-01 (Managed Identity)
              </div>
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-slate-300">
                <span className="text-slate-400 block text-[10px]">GCP Workload Federation:</span>
                cloudoptix-agent@prod-cluster-mesh.iam.gserviceaccount.com
              </div>
            </div>
          </div>

          {/* Reset State */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h4 className="font-bold text-sm text-slate-100 uppercase tracking-wide">
              Reset Simulation State
            </h4>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Restore default baseline workloads, release any active cloud stress, and reset metrics.
            </p>
            <button
              onClick={resetSimulation}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset All Telemetry to Default
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
