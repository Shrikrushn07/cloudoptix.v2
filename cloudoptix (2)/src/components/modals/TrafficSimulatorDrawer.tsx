import React, { useState } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { CloudProviderId } from '../../types';
import { X, Zap, Sliders, RefreshCw, Activity, ArrowUpRight, Flame, ShieldAlert, CheckCircle2, RotateCcw } from 'lucide-react';

interface TrafficSimulatorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TrafficSimulatorDrawer: React.FC<TrafficSimulatorDrawerProps> = ({ isOpen, onClose }) => {
  const {
    clouds,
    stressCloud,
    unstressCloud,
    resetSimulation,
    createWorkload,
    executeAutonomousRemediation,
    trafficMultiplier,
    setTrafficMultiplier,
    activeStress,
    isAutonomousActive,
    setIsAutonomousActive,
  } = useSimulation();

  const [localDemand, setLocalDemand] = useState(100);

  if (!isOpen) return null;

  const handleTrafficChange = (val: number) => {
    setLocalDemand(val);
    setTrafficMultiplier(val / 100);
  };

  const handleGenerateRandomWorkload = () => {
    const types = ['Checkout API', 'Recommendation Engine', 'Video Processing', 'Batch Analytics', 'Payment Gateway'] as const;
    const randomType = types[Math.floor(Math.random() * types.length)];
    const randomCloud: CloudProviderId = (['aws', 'azure', 'gcp'] as CloudProviderId[])[Math.floor(Math.random() * 3)];
    createWorkload(
      {
        name: `Dynamic-${randomType.replace(/\s+/g, '-')}-${Math.floor(100 + Math.random() * 900)}`,
        type: randomType,
        cpuCores: Math.floor(8 + Math.random() * 32),
        memoryGb: Math.floor(16 + Math.random() * 64),
        priority: 'HIGH',
      },
      randomCloud
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-[#0b1120] border-l border-slate-800 w-full max-w-md h-full overflow-y-auto shadow-2xl p-6 flex flex-col justify-between">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-base">Traffic & Chaos Sandbox</h3>
                <p className="text-xs text-slate-400">Inject load anomalies, surges, and hardware pressure</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Section 1: Traffic Multiplier */}
          <div className="mt-5 p-4 rounded-xl bg-[#020617] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                Traffic Demand Surge
              </span>
              <span className="font-mono text-xs text-indigo-400 font-bold">{localDemand}%</span>
            </div>
            <input
              type="range"
              min={50}
              max={250}
              step={10}
              value={localDemand}
              onChange={(e) => handleTrafficChange(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>0.5x (Night)</span>
              <span>1.0x (Baseline)</span>
              <span>2.5x (Flash Sale)</span>
            </div>
          </div>

          {/* Section 2: Targeted Cloud Stress Injections */}
          <div className="mt-5 space-y-3">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wide block">
              Inject Cloud Stress Faults
            </span>

            {/* AWS Stress */}
            <div className="p-3.5 bg-[#020617] border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-orange-400">AWS (us-east-1)</span>
                  {activeStress.aws && (
                    <span className="text-[10px] font-mono text-rose-400 font-bold animate-pulse">STRESSED 92%</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">CPU throttle & memory spike simulation</p>
              </div>
              <button
                onClick={() => (activeStress.aws ? unstressCloud('aws') : stressCloud('aws', 92))}
                className={`px-3 py-1.5 text-xs font-bold font-mono rounded-lg transition-all cursor-pointer ${
                  activeStress.aws
                    ? 'bg-rose-900 text-rose-200 border border-rose-600'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                {activeStress.aws ? 'Release' : 'Stress'}
              </button>
            </div>

            {/* Azure Stress */}
            <div className="p-3.5 bg-[#020617] border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-400">Azure (west-us)</span>
                  {activeStress.azure && (
                    <span className="text-[10px] font-mono text-rose-400 font-bold animate-pulse">STRESSED 91%</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">Hypervisor latency degradation</p>
              </div>
              <button
                onClick={() => (activeStress.azure ? unstressCloud('azure') : stressCloud('azure', 91))}
                className={`px-3 py-1.5 text-xs font-bold font-mono rounded-lg transition-all cursor-pointer ${
                  activeStress.azure
                    ? 'bg-rose-900 text-rose-200 border border-rose-600'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                {activeStress.azure ? 'Release' : 'Stress'}
              </button>
            </div>

            {/* GCP Stress */}
            <div className="p-3.5 bg-[#020617] border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-400">GCP (asia-east1)</span>
                  {activeStress.gcp && (
                    <span className="text-[10px] font-mono text-rose-400 font-bold animate-pulse">STRESSED 93%</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">Regional network packet loss spike</p>
              </div>
              <button
                onClick={() => (activeStress.gcp ? unstressCloud('gcp') : stressCloud('gcp', 93))}
                className={`px-3 py-1.5 text-xs font-bold font-mono rounded-lg transition-all cursor-pointer ${
                  activeStress.gcp
                    ? 'bg-rose-900 text-rose-200 border border-rose-600'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                {activeStress.gcp ? 'Release' : 'Stress'}
              </button>
            </div>
          </div>

          {/* Section 3: Autonomous Mode Toggle */}
          <div className="mt-5 p-4 rounded-xl bg-[#020617] border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wide block">
                  Autonomous Remediation
                </span>
                <span className="text-[11px] text-slate-400">Auto-heal SLA risks without manual approval</span>
              </div>
              <button
                onClick={() => setIsAutonomousActive(!isAutonomousActive)}
                className={`px-3 py-1 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                  isAutonomousActive
                    ? 'bg-emerald-950 text-emerald-400 border-emerald-600'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {isAutonomousActive ? 'ENABLED' : 'PAUSED'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Quick Actions */}
        <div className="pt-4 border-t border-slate-800 space-y-2 mt-6">
          <button
            onClick={handleGenerateRandomWorkload}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            Inject Synthetic Microservice
          </button>
          <button
            onClick={resetSimulation}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset All Simulated Faults
          </button>
        </div>
      </div>
    </div>
  );
};
