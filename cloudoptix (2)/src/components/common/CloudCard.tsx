import React from 'react';
import { CloudProvider } from '../../types';
import { StatusBadge } from './StatusBadge';
import { CloudProviderLogo } from './CloudProviderLogo';
import { Cpu, Database, DollarSign, Activity, Zap, Server, Shield } from 'lucide-react';

interface CloudCardProps {
  cloud: CloudProvider;
  isStressed: boolean;
  onStress: () => void;
  onInspect?: () => void;
}

export const CloudCard: React.FC<CloudCardProps> = ({
  cloud,
  isStressed,
  onStress,
  onInspect,
}) => {
  const getProviderConfig = () => {
    if (cloud.id === 'aws') {
      return {
        headerBg: 'bg-amber-950/30 border-amber-900/40',
        textColor: 'text-amber-400',
        barColor: 'bg-[#FF9900]',
        label: 'AWS (us-east-1)',
      };
    }
    if (cloud.id === 'azure') {
      return {
        headerBg: 'bg-sky-950/30 border-sky-900/40',
        textColor: 'text-sky-400',
        barColor: 'bg-[#0089D6]',
        label: 'AZURE (eastus2)',
      };
    }
    return {
      headerBg: 'bg-blue-950/30 border-blue-900/40',
      textColor: 'text-blue-400',
      barColor: 'bg-[#4285F4]',
      label: 'GCP (us-central1)',
    };
  };

  const config = getProviderConfig();

  return (
    <div
      className={`bg-[#0f172a] border rounded-xl overflow-hidden shadow-xl transition-all duration-200 ${
        isStressed
          ? 'border-rose-500/80 ring-1 ring-rose-500/40 shadow-rose-950/40'
          : 'border-slate-800'
      }`}
    >
      {/* Top Banner Header with Official Cloud Provider Logo */}
      <div className={`p-3 border-b flex justify-between items-center ${config.headerBg}`}>
        <div className="flex items-center gap-2.5">
          <CloudProviderLogo provider={cloud.id} size="sm" />
          <span className={`text-xs font-bold tracking-wider uppercase ${config.textColor}`}>
            {cloud.name} ({cloud.region})
          </span>
        </div>
        <div className="flex items-center gap-2">
          {cloud.healthStatus === 'healthy' || cloud.healthStatus === 'HEALTHY' ? (
            <span className="px-2 py-0.5 bg-emerald-900/30 text-emerald-400 text-[10px] font-bold border border-emerald-800 rounded">
              HEALTHY
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-rose-900/40 text-rose-300 text-[10px] font-bold border border-rose-700/50 rounded animate-pulse">
              CRITICAL
            </span>
          )}
        </div>
      </div>

      {/* Grid of Key Metrics */}
      <div className="p-4 grid grid-cols-2 gap-4">
        {/* CPU Util */}
        <div>
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">CPU Util</div>
          <div className="text-lg font-mono text-slate-200 font-bold">{cloud.cpuUtilizedPercent}%</div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                cloud.cpuUtilizedPercent > 85 ? 'bg-rose-500' : config.barColor
              }`}
              style={{ width: `${Math.min(100, cloud.cpuUtilizedPercent)}%` }}
            />
          </div>
        </div>

        {/* Memory Util */}
        <div>
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Memory</div>
          <div className="text-lg font-mono text-slate-200 font-bold">{cloud.memoryUtilizedPercent}%</div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                cloud.memoryUtilizedPercent > 85 ? 'bg-rose-500' : config.barColor
              }`}
              style={{ width: `${Math.min(100, cloud.memoryUtilizedPercent)}%` }}
            />
          </div>
        </div>

        {/* Cost / Hr */}
        <div>
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Cost/Hr</div>
          <div className="text-lg font-mono text-slate-200 font-bold">${cloud.costPerHour.toFixed(2)}</div>
        </div>

        {/* Latency */}
        <div>
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Latency</div>
          <div className="text-lg font-mono text-slate-200 font-bold">{cloud.averageLatencyMs}ms</div>
        </div>
      </div>

      {/* Action Bar Footer */}
      <div className="px-4 py-2.5 bg-[#0b1120] border-t border-slate-800/80 flex items-center justify-between gap-2">
        <span className="text-[10px] font-mono text-slate-500">
          {cloud.workloadCount} Workloads • {cloud.nodesActive} Nodes
        </span>

        <div className="flex items-center gap-2">
          <button
            id={`btn-stress-${cloud.id}`}
            onClick={onStress}
            className={`py-1 px-2.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
              isStressed
                ? 'bg-rose-900/60 border border-rose-500 text-rose-300 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            {isStressed ? 'Remediating...' : `Stress ${cloud.shortName}`}
          </button>
        </div>
      </div>
    </div>
  );
};
