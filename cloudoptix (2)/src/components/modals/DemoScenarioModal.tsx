import React from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { DEMO_SCENARIOS } from '../../data/initialData';
import { X, Play, RotateCcw, Sparkles, CheckCircle2, Flame, ShieldAlert, DollarSign, Activity } from 'lucide-react';

interface DemoScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoScenarioModal: React.FC<DemoScenarioModalProps> = ({ isOpen, onClose }) => {
  const { loadDemoScenario, resetSimulation, activeDemoScenario } = useSimulation();

  if (!isOpen) return null;

  const handleSelect = (id: string) => {
    loadDemoScenario(id);
    onClose();
  };

  const getScenarioIcon = (id: string) => {
    if (id === 'scenario-2') return <Flame className="w-5 h-5 text-rose-400" />;
    if (id === 'scenario-3') return <DollarSign className="w-5 h-5 text-amber-400" />;
    if (id === 'scenario-4') return <Activity className="w-5 h-5 text-sky-400" />;
    if (id === 'scenario-6') return <ShieldAlert className="w-5 h-5 text-indigo-400" />;
    return <Sparkles className="w-5 h-5 text-indigo-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0b1120] border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-[#020617]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Live Demo Mode Scenarios</h2>
              <p className="text-xs text-slate-400">
                Pre-configured operational simulation states for presentations and architectural reviews
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetSimulation}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset All
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scenarios Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {DEMO_SCENARIOS.map((scenario) => {
            const isActive = activeDemoScenario?.id === scenario.id;

            return (
              <div
                key={scenario.id}
                onClick={() => handleSelect(scenario.id)}
                className={`p-5 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                  isActive
                    ? 'bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/30 shadow-xl shadow-indigo-950/40'
                    : 'bg-[#10172a] hover:bg-[#131d35] border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-[#020617] border border-slate-800">
                        {getScenarioIcon(scenario.id)}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-100">{scenario.title}</h3>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">
                          {scenario.badge} • {scenario.subtitle}
                        </span>
                      </div>
                    </div>

                    {isActive && (
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> ACTIVE
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed mb-4">{scenario.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-indigo-400">
                    Outcome: {scenario.expectedOutcome}
                  </span>
                  <button className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30">
                    <Play className="w-3 h-3 fill-current" />
                    Load Scenario
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
