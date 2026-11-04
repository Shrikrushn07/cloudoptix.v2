import React from 'react';
import { Eye, TrendingUp, Cpu, Compass, ShieldCheck, Zap, CheckCircle2, BookOpen } from 'lucide-react';

interface AutonomousLoopIndicatorProps {
  activeStepIndex?: number;
  compact?: boolean;
}

export const AutonomousLoopIndicator: React.FC<AutonomousLoopIndicatorProps> = ({
  activeStepIndex = -1,
  compact = false,
}) => {
  const steps = [
    { label: 'OBSERVE', icon: Eye, color: 'text-indigo-400' },
    { label: 'PREDICT', icon: TrendingUp, color: 'text-blue-400' },
    { label: 'OPTIMIZE', icon: Cpu, color: 'text-indigo-400' },
    { label: 'DECIDE', icon: Compass, color: 'text-blue-400' },
    { label: 'POLICY CHECK', icon: ShieldCheck, color: 'text-indigo-300' },
    { label: 'ACT', icon: Zap, color: 'text-amber-400' },
    { label: 'VERIFY', icon: CheckCircle2, color: 'text-emerald-400' },
    { label: 'LEARN', icon: BookOpen, color: 'text-teal-400' },
  ];

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = activeStepIndex === idx;
          const isPast = activeStepIndex > idx;
          return (
            <React.Fragment key={step.label}>
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded border transition-all ${
                  isActive
                    ? 'bg-indigo-900/50 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500 shadow-sm shadow-indigo-500/20'
                    : isPast
                    ? 'bg-slate-800/80 border-slate-700 text-slate-300'
                    : 'bg-slate-900/60 border-slate-800/80 text-slate-400'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-300 animate-pulse' : step.color}`} />
                <span className="font-mono text-[10px] tracking-wider">{step.label}</span>
              </div>
              {idx < steps.length - 1 && <span className="text-slate-600 font-mono text-[10px]">→</span>}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  return (
    <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Autonomous Orchestration Loop
          </span>
        </div>
        <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-700/40">
          CONTINUOUS ENGINE: ACTIVE
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = activeStepIndex === idx;
          const isPast = activeStepIndex > idx;

          return (
            <div
              key={step.label}
              className={`relative flex flex-col items-center justify-center p-2.5 rounded-lg border text-center transition-all ${
                isActive
                  ? 'bg-indigo-950/80 border-indigo-400 text-indigo-100 ring-2 ring-indigo-500/50 shadow-md shadow-indigo-950'
                  : isPast
                  ? 'bg-slate-850/90 border-slate-700/80 text-slate-200'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-slate-800/80 mb-1.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-300 animate-pulse' : step.color}`} />
              </div>
              <span className="text-[9px] font-mono text-slate-500 mb-0.5">0{idx + 1}</span>
              <span className="text-[11px] font-semibold tracking-tight whitespace-nowrap">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
