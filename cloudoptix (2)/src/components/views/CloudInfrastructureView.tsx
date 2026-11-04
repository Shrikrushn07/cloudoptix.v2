import React from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { CloudProvider } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { CloudProviderLogo } from '../common/CloudProviderLogo';
import {
  Server,
  Cpu,
  Database,
  Globe,
  DollarSign,
  Activity,
  Flame,
  Shield,
  Leaf,
  Layers,
  ArrowRightLeft,
  CheckCircle2,
} from 'lucide-react';

export const CloudInfrastructureView: React.FC = () => {
  const { clouds, stressCloud, unstressCloud, activeStress } = useSimulation();

  const providerList = Object.values(clouds) as CloudProvider[];

  const latencyMatrix = [
    { from: 'AWS us-east-1', toAws: '2 ms', toAzure: '18 ms', toGcp: '24 ms' },
    { from: 'Azure eastus2', toAws: '19 ms', toAzure: '3 ms', toGcp: '21 ms' },
    { from: 'GCP us-central1', toAws: '25 ms', toAzure: '22 ms', toGcp: '2 ms' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Cloud Infrastructure Topology</h1>
            <span className="text-xs font-mono font-bold bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700">
              3 Connected Clouds
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Global compute clusters, node pools, cross-cloud interconnects, and carbon sustainability metrics
          </p>
        </div>
      </div>

      {/* 3 Deep Provider Inspection Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {providerList.map((cloud) => {
          const isStressed = activeStress[cloud.id];
          return (
            <div
              key={cloud.id}
              className={`bg-slate-900/90 border rounded-2xl p-6 shadow-xl space-y-5 transition-all ${
                isStressed
                  ? 'border-rose-500 ring-1 ring-rose-500/40 bg-slate-900 shadow-rose-900/20'
                  : 'border-slate-800'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <CloudProviderLogo provider={cloud.id} size="lg" />
                  <div>
                    <h3 className="font-bold text-slate-100 text-base">{cloud.name}</h3>
                    <p className="text-xs text-slate-400 font-mono">{cloud.region}</p>
                  </div>
                </div>
                <StatusBadge status={cloud.healthStatus} size="sm" />
              </div>

              {/* Node Fleet Stats */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Active Compute Nodes</span>
                  <span className="text-lg font-bold font-mono text-slate-100">
                    {cloud.nodesActive} / {cloud.nodesTotal}
                  </span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Total vCPU Capacity</span>
                  <span className="text-lg font-bold font-mono text-purple-400">{cloud.cpuCapacityGhz} GHz</span>
                </div>
              </div>

              {/* Utilization Progress */}
              <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                      <Cpu className="w-3.5 h-3.5 text-slate-400" /> CPU Allocation
                    </span>
                    <span className="font-mono font-bold text-slate-200">{cloud.cpuUtilizedPercent}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        cloud.cpuUtilizedPercent > 85 ? 'bg-rose-500' : 'bg-purple-500'
                      }`}
                      style={{ width: `${cloud.cpuUtilizedPercent}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                      <Database className="w-3.5 h-3.5 text-slate-400" /> RAM Footprint
                    </span>
                    <span className="font-mono font-bold text-slate-200">{cloud.memoryUtilizedPercent}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-slate-400 transition-all duration-500"
                      style={{ width: `${cloud.memoryUtilizedPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Technical Specifications List */}
              <div className="space-y-2 text-xs border-t border-slate-800 pt-3">
                <div className="flex justify-between text-slate-400">
                  <span>Availability Zones:</span>
                  <span className="text-slate-200 font-mono">{cloud.zone}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Network Egress Rate:</span>
                  <span className="text-amber-400 font-mono">${cloud.egressCostPerGb}/GB</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>90-Day SLA Uptime:</span>
                  <span className="text-emerald-400 font-mono font-bold">{cloud.uptime90d}%</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span className="flex items-center gap-1">
                    <Leaf className="w-3.5 h-3.5 text-emerald-400" /> Carbon Footprint:
                  </span>
                  <span className="text-emerald-300 font-mono">{cloud.carbonIntensityGrams} g CO2/kWh</span>
                </div>
              </div>

              {/* Stress Injector Button */}
              <div className="pt-2">
                <button
                  onClick={() => (isStressed ? unstressCloud(cloud.id) : stressCloud(cloud.id, 94))}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                    isStressed
                      ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  <Flame className="w-4 h-4 text-amber-400" />
                  {isStressed ? `Release ${cloud.shortName} Stress` : `Inject Load on ${cloud.shortName}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cross-Cloud Interconnect Latency Matrix */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
          <ArrowRightLeft className="w-5 h-5 text-purple-400" />
          <div>
            <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wide">
              Cross-Cloud Interconnect & Direct Connect Latency Matrix
            </h3>
            <p className="text-xs text-slate-400">P95 round-trip times measured across direct-peering fiber backbones</p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Origin Region</th>
                <th className="py-3 px-4 text-amber-400">Target: AWS (us-east-1)</th>
                <th className="py-3 px-4 text-sky-400">Target: Azure (eastus2)</th>
                <th className="py-3 px-4 text-blue-400">Target: GCP (us-central1)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {latencyMatrix.map((row) => (
                <tr key={row.from} className="hover:bg-slate-850/60">
                  <td className="py-3 px-4 font-sans font-semibold text-slate-200">{row.from}</td>
                  <td className="py-3 px-4 text-slate-300">{row.toAws}</td>
                  <td className="py-3 px-4 text-slate-300">{row.toAzure}</td>
                  <td className="py-3 px-4 text-slate-300">{row.toGcp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
