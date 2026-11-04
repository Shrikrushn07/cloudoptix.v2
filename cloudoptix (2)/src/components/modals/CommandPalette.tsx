import React, { useState, useEffect } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { CloudProvider } from '../../types';
import { Search, Server, Cpu, Shield, Zap, Compass, DollarSign, X, ArrowRight } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const { workloads, clouds, policies, decisions, actions, setActiveView } = useSimulation();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const normalizedQuery = query.toLowerCase().trim();

  const filteredWorkloads = workloads.filter(
    (w) => w.name.toLowerCase().includes(normalizedQuery) || w.id.toLowerCase().includes(normalizedQuery) || w.type.toLowerCase().includes(normalizedQuery)
  );

  const filteredClouds = (Object.values(clouds) as CloudProvider[]).filter(
    (c) => c.name.toLowerCase().includes(normalizedQuery) || c.id.toLowerCase().includes(normalizedQuery) || c.region.toLowerCase().includes(normalizedQuery)
  );

  const filteredDecisions = decisions.filter(
    (d) => d.workloadName.toLowerCase().includes(normalizedQuery) || d.id.toLowerCase().includes(normalizedQuery)
  );

  const filteredActions = actions.filter(
    (a) => a.workloadName.toLowerCase().includes(normalizedQuery) || a.triggerReason.toLowerCase().includes(normalizedQuery)
  );

  const handleNavigate = (view: string) => {
    setActiveView(view);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800 bg-slate-950">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Search workloads, clouds, AI decisions, policies, actions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <kbd className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="p-3 max-h-[60vh] overflow-y-auto space-y-4">
          {/* Quick Views Navigation */}
          {!normalizedQuery && (
            <div>
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400 px-2">Navigation</span>
              <div className="grid grid-cols-2 gap-1.5 mt-1">
                {[
                  { label: 'Overview Dashboard', view: 'overview', icon: Server },
                  { label: 'Workloads Explorer', view: 'workloads', icon: Cpu },
                  { label: 'AI Decision Engine', view: 'ai-decisions', icon: Compass },
                  { label: 'Autonomous Actions', view: 'autonomous-actions', icon: Zap },
                  { label: 'Cost Intelligence (FinOps)', view: 'cost-intelligence', icon: DollarSign },
                  { label: 'Policy Engine', view: 'policies', icon: Shield },
                ].map((item) => (
                  <button
                    key={item.view}
                    onClick={() => handleNavigate(item.view)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg text-left transition-all"
                  >
                    <item.icon className="w-4 h-4 text-purple-400" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Workload Matches */}
          {filteredWorkloads.length > 0 && (
            <div>
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400 px-2">
                Workloads ({filteredWorkloads.length})
              </span>
              <div className="space-y-1 mt-1">
                {filteredWorkloads.slice(0, 5).map((w) => (
                  <div
                    key={w.id}
                    onClick={() => handleNavigate('workloads')}
                    className="flex items-center justify-between px-3 py-2 bg-slate-950/60 hover:bg-slate-800/80 rounded-lg cursor-pointer transition-all border border-slate-850"
                  >
                    <div className="flex items-center gap-2.5">
                      <Cpu className="w-4 h-4 text-purple-400" />
                      <div>
                        <span className="text-xs font-bold text-slate-200">{w.name}</span>
                        <span className="text-[11px] font-mono text-slate-400 block">
                          {w.id} • {w.type} • {w.cloud.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cloud Matches */}
          {filteredClouds.length > 0 && (
            <div>
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400 px-2">
                Cloud Providers ({filteredClouds.length})
              </span>
              <div className="space-y-1 mt-1">
                {filteredClouds.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleNavigate('infrastructure')}
                    className="flex items-center justify-between px-3 py-2 bg-slate-950/60 hover:bg-slate-800/80 rounded-lg cursor-pointer transition-all border border-slate-850"
                  >
                    <div className="flex items-center gap-2.5">
                      <Server className="w-4 h-4 text-sky-400" />
                      <div>
                        <span className="text-xs font-bold text-slate-200">{c.name}</span>
                        <span className="text-[11px] font-mono text-slate-400 block">
                          {c.region} • CPU {c.cpuUtilizedPercent}%
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Decision Matches */}
          {filteredDecisions.length > 0 && (
            <div>
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400 px-2">
                AI Decisions ({filteredDecisions.length})
              </span>
              <div className="space-y-1 mt-1">
                {filteredDecisions.slice(0, 3).map((d) => (
                  <div
                    key={d.id}
                    onClick={() => handleNavigate('ai-decisions')}
                    className="flex items-center justify-between px-3 py-2 bg-slate-950/60 hover:bg-slate-800/80 rounded-lg cursor-pointer transition-all border border-slate-850"
                  >
                    <div className="flex items-center gap-2.5">
                      <Compass className="w-4 h-4 text-purple-400" />
                      <div>
                        <span className="text-xs font-bold text-slate-200">{d.workloadName}</span>
                        <span className="text-[11px] text-slate-400 block">
                          Recommended: {d.recommendedCloud.toUpperCase()} ({d.confidence}%)
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
