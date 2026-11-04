import React from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { RoleSwitcherDropdown } from '../common/RoleSwitcherDropdown';
import {
  LayoutDashboard,
  Cpu,
  Server,
  Compass,
  Zap,
  DollarSign,
  Activity,
  Shield,
  Sliders,
  FlaskConical,
  Brain,
  Network,
  FileText,
  Settings,
  LogOut,
  Globe,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  onSignOut?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onSignOut }) => {
  const { activeView, setActiveView } = useSimulation();

  const controlPlaneItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, badge: null },
    { id: 'workloads', label: 'Workloads', icon: Cpu, badge: '12' },
    { id: 'infrastructure', label: 'Cloud Infrastructure', icon: Server, badge: '3' },
    { id: 'ai-decisions', label: 'AI Decisions', icon: Compass, badge: 'NEW' },
    { id: 'autonomous-actions', label: 'Autonomous Actions', icon: Zap, badge: 'LIVE' },
  ];

  const researchItems = [
    { id: 'meta-rl', label: 'Meta-RL Engine', icon: Sparkles, badge: 'META' },
    { id: 'gnn-recommendations', label: 'GNN Placement', icon: Brain, badge: 'GNN' },
    { id: 'graph-explorer', label: 'Graph Explorer', icon: Network, badge: 'Graph' },
    { id: 'experiments', label: 'Benchmark Lab', icon: FlaskConical, badge: 'Research' },
  ];

  const operationsItems = [
    { id: 'cost-intelligence', label: 'Cost Intelligence', icon: DollarSign, badge: 'FinOps' },
    { id: 'what-if', label: 'What-If Simulator', icon: Sliders, badge: null },
    { id: 'policies', label: 'Policies', icon: Shield, badge: '5' },
    { id: 'performance', label: 'Performance', icon: Activity, badge: null },
    { id: 'reports', label: 'Reports', icon: FileText, badge: null },
    { id: 'settings', label: 'Settings', icon: Settings, badge: null },
  ];

  const renderNavGroup = (items: typeof controlPlaneItems) => {
    return items.map((item) => {
      const Icon = item.icon;
      const isActive = activeView === item.id;

      return (
        <button
          key={item.id}
          id={`nav-item-${item.id}`}
          onClick={() => setActiveView(item.id)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all group cursor-pointer ${
            isActive
              ? 'bg-slate-800/50 text-indigo-400 border border-slate-700/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/40 border border-transparent'
          }`}
        >
          {isActive ? (
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
          ) : (
            <Icon className="w-4 h-4 text-slate-400 group-hover:text-slate-300 shrink-0 transition-colors" />
          )}

          <span className="truncate text-left flex-1 font-medium">{item.label}</span>

          {item.badge && (
            <span
              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                item.badge === 'NEW' || item.badge === 'LIVE'
                  ? 'bg-indigo-900/40 text-indigo-300 border-indigo-700/30'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700/60'
              }`}
            >
              {item.badge}
            </span>
          )}
        </button>
      );
    });
  };

  return (
    <aside className="w-60 border-r border-slate-800 flex flex-col bg-[#0b1120] shrink-0 h-screen sticky top-0 select-none">
      {/* Brand Header & Exit to Landing Button */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20 shrink-0 text-sm">
            OX
          </div>
          <div className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
            <span>CloudOptiX</span>
          </div>
        </div>

        {onSignOut && (
          <button
            onClick={onSignOut}
            title="Return to Public Landing Page"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 py-3 overflow-y-auto px-3 space-y-1 scrollbar-thin">
        <div className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
          Control Plane
        </div>
        {renderNavGroup(controlPlaneItems)}

        <div className="px-3 pt-4 pb-1.5 text-[10px] uppercase tracking-widest text-indigo-400 font-bold flex items-center justify-between">
          <span>GNN Research Engine</span>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
        </div>
        {renderNavGroup(researchItems)}

        <div className="px-3 pt-4 pb-1.5 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
          Operations
        </div>
        {renderNavGroup(operationsItems)}
      </nav>

      {/* Bottom User & System Status */}
      <div className="p-3 border-t border-slate-800 bg-[#020617] space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-[10px] text-slate-400 font-mono tracking-tight">
              STATUS: <strong className="text-emerald-400 font-bold">OPERATIONAL</strong>
            </span>
          </div>
          <span className="text-[9px] font-mono text-slate-500">v2.4.1</span>
        </div>

        <RoleSwitcherDropdown variant="sidebar" />

        {onSignOut && (
          <button
            onClick={onSignOut}
            className="w-full py-1.5 px-2 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Public Marketing Site</span>
          </button>
        )}
      </div>
    </aside>
  );
};
