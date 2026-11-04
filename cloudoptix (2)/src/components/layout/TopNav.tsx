import React, { useState } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { RoleSwitcherDropdown } from '../common/RoleSwitcherDropdown';
import {
  Search,
  Sliders,
  Sparkles,
  Bell,
  RotateCw,
  Zap,
  LogOut,
  Globe,
} from 'lucide-react';

interface TopNavProps {
  onOpenSearch: () => void;
  onOpenSimulator: () => void;
  onOpenDemoModal: () => void;
  onOpenCreateWorkload: () => void;
  onSignOut?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  onOpenSearch,
  onOpenSimulator,
  onOpenDemoModal,
  onOpenCreateWorkload,
  onSignOut,
}) => {
  const {
    notifications,
    markNotificationAsRead,
    clearAllNotifications,
    setActiveView,
    activeDemoScenario,
    activeView,
  } = useSimulation();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const handleNotificationClick = (item: typeof notifications[0]) => {
    markNotificationAsRead(item.id);
    if (item.actionView) {
      setActiveView(item.actionView);
    }
    setIsNotifOpen(false);
  };

  const getViewTitle = () => {
    switch (activeView) {
      case 'overview':
        return { title: 'Multi-Cloud Control Center', sub: 'Global Cluster Health • Live telemetry stream' };
      case 'workloads':
        return { title: 'Workload Orchestration Inventory', sub: 'Live container & VM placement telemetry' };
      case 'infrastructure':
        return { title: 'Cloud Infrastructure Topology', sub: 'AWS, Azure, and Google Cloud fleet metrics' };
      case 'ai-decisions':
        return { title: 'AI Decision Engine', sub: 'Pareto multi-objective score decomposition' };
      case 'autonomous-actions':
        return { title: 'Autonomous Operations Audit', sub: 'Real-time 8-step self-healing loop timeline' };
      case 'cost-intelligence':
        return { title: 'FinOps & Cost Intelligence', sub: 'Multi-cloud arbitrage & waste radar' };
      case 'performance':
        return { title: 'Performance & SLA Observability', sub: 'Tail latency and availability matrix' };
      case 'policies':
        return { title: 'Policy Guardrails & Governance', sub: 'Deterministic sovereign & budget boundary rules' };
      case 'what-if':
        return { title: 'What-If Multi-Cloud Simulator', sub: 'Predictive market and failure scenario sandbox' };
      case 'experiments':
        return { title: 'Empirical Research Benchmarks', sub: 'Scientific multi-cloud optimization validation' };
      case 'reports':
        return { title: 'Executive Intelligence Reports', sub: 'FinOps, SLA, and sustainability audit scorecards' };
      case 'settings':
        return { title: 'Engine Configuration & Weights', sub: 'Pareto weights & hyperscaler IAM connectors' };
      default:
        return { title: 'Multi-Cloud Control Center', sub: 'Global Cluster Health • Live telemetry stream' };
    }
  };

  const viewMeta = getViewTitle();

  return (
    <header className="h-16 border-b border-slate-800 bg-[#020617]/95 backdrop-blur-md sticky top-0 z-40 px-6 md:px-8 flex items-center justify-between gap-4 select-none">
      {/* Left: Active View Title, Subtitle, & Scenario Indicator */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-base md:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            {viewMeta.title}
          </h1>
          <p className="text-[11px] font-mono text-slate-400 hidden sm:block">{viewMeta.sub}</p>
        </div>

        {/* Active Scenario Indicator if running */}
        {activeDemoScenario && (
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-950/60 border border-indigo-700/40 rounded-full text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-indigo-200 font-semibold text-[10px] truncate max-w-[140px]">
              {activeDemoScenario.title}
            </span>
          </div>
        )}
      </div>

      {/* Right: Core Operational Tools, RBAC Switcher, & Sign Out */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* AI Engine Status Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#0b1120] border border-slate-800 rounded-full">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse shrink-0" />
          <span className="text-[10px] font-mono font-bold text-slate-300 tracking-wider uppercase">
            AI ENGINE: ONLINE
          </span>
        </div>

        {/* Global Search Button (⌘K) */}
        <button
          onClick={onOpenSearch}
          className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-slate-800"
          title="Search (⌘K)"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Traffic Simulator Drawer Trigger */}
        <button
          onClick={onOpenSimulator}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-[#0b1120] hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold rounded-lg border border-slate-800 transition-all cursor-pointer"
          title="Traffic & Chaos Simulator"
        >
          <Sliders className="w-3.5 h-3.5 text-indigo-400" />
          <span>Simulator</span>
        </button>

        {/* Demo Scenarios Button */}
        <button
          onClick={onOpenDemoModal}
          className="flex items-center gap-1.5 px-3 py-1 bg-indigo-950/80 hover:bg-indigo-900/90 text-indigo-300 hover:text-indigo-200 text-xs font-bold rounded-lg border border-indigo-700/40 transition-all cursor-pointer shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden md:inline">DEMO SCENARIOS</span>
          <span className="md:hidden">DEMO</span>
        </button>

        {/* Deploy Workload Quick Action */}
        <button
          onClick={onOpenCreateWorkload}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-md transition-all cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Deploy Workload</span>
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-slate-800"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0b1120] border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in divide-y divide-slate-850">
              <div className="flex items-center justify-between p-4 bg-[#020617]">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                    Audit Notifications ({notifications.length})
                  </span>
                </div>
                {notifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="text-[11px] text-slate-400 hover:text-slate-200 hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">No active notifications</div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      className={`p-3.5 hover:bg-slate-800/40 cursor-pointer transition-all ${
                        !item.isRead ? 'bg-indigo-950/20' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-slate-200">{item.title}</span>
                        <span className="text-[10px] font-mono text-slate-500 shrink-0">{item.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.message}</p>
                      {item.actionLabel && (
                        <span className="inline-block mt-2 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300">
                          {item.actionLabel} →
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Telemetry Refresh */}
        <button
          onClick={handleRefresh}
          className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-slate-800"
          title="Refresh Telemetry"
        >
          <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
        </button>

        <div className="w-px h-5 bg-slate-800 hidden sm:block" />

        {/* Mock Enterprise Identity & Role Switcher */}
        <RoleSwitcherDropdown variant="header" />

        {/* Exit to Public Marketing Site / Sign Out */}
        {onSignOut && (
          <button
            onClick={onSignOut}
            title="Return to Public Marketing Landing Page"
            className="flex items-center gap-1.5 px-2.5 py-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg text-xs transition-colors cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Public Site</span>
          </button>
        )}
      </div>
    </header>
  );
};
