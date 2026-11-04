import React, { useState } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { PolicyRule } from '../../types';
import {
  Shield,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  DollarSign,
  Activity,
  Layers,
  Sliders,
  Check,
  RotateCcw,
} from 'lucide-react';

export const PoliciesView: React.FC = () => {
  const { policies, togglePolicy, workloads, clouds } = useSimulation();
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleToggle = (id: string) => {
    togglePolicy(id);
    setSuccessToast(`Policy updated & synchronized to edge guardrail proxies.`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Policy & Governance Guardrails</h1>
            <span className="text-xs font-mono font-bold bg-emerald-950 text-emerald-400 px-2.5 py-1 rounded-md border border-emerald-800/40">
              Deterministic Hard Enforcement
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise boundary rules, sovereign data residency, FinOps budget caps, and autonomous migration constraints
          </p>
        </div>
      </div>

      {/* Success Toast */}
      {successToast && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in shadow-lg shadow-emerald-950/40">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Policies List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {policies.map((policy) => {
          return (
            <div
              key={policy.id}
              className={`bg-slate-900/90 border rounded-2xl p-6 shadow-xl space-y-4 transition-all ${
                policy.isEnabled
                  ? 'border-purple-500/40 shadow-purple-950/10'
                  : 'border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-xl border ${
                      policy.isEnabled
                        ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {policy.category === 'COMPLIANCE' ? (
                      <Lock className="w-5 h-5" />
                    ) : policy.category === 'FINOPS' ? (
                      <DollarSign className="w-5 h-5" />
                    ) : policy.category === 'AVAILABILITY' ? (
                      <Activity className="w-5 h-5" />
                    ) : (
                      <Shield className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-100">{policy.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-mono text-purple-300 bg-purple-950 px-1.5 py-0.5 rounded border border-purple-800/40">
                        {policy.category}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        Priority {policy.priority}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Toggle switch */}
                <button
                  onClick={() => handleToggle(policy.id)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    policy.isEnabled ? 'bg-purple-600' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      policy.isEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed font-sans">{policy.description}</p>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 font-mono text-[11px] text-slate-300">
                <span className="text-slate-400 text-[10px] uppercase block mb-1">Enforcement Logic:</span>
                <code>{policy.enforcementRule}</code>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
