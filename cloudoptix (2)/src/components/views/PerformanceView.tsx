import React from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { CloudProvider } from '../../types';
import { MetricCard } from '../common/MetricCard';
import {
  Activity,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Server,
  TrendingUp,
  Cpu,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export const PerformanceView: React.FC = () => {
  const { clouds, workloads, systemSlaHealth } = useSimulation();

  const latencyBreakdown = [
    { name: 'Payment Gateway (WL-101)', p50: '18 ms', p90: '32 ms', p99: '48 ms', sla: '99.99%', status: 'HEALTHY' },
    { name: 'Checkout API (WL-102)', p50: '24 ms', p90: '45 ms', p99: '68 ms', sla: '99.96%', status: 'HEALTHY' },
    { name: 'Recommendation Engine (WL-104)', p50: '42 ms', p90: '88 ms', p99: '142 ms', sla: '99.92%', status: 'WARNING' },
    { name: 'Video Processing (WL-103)', p50: '120 ms', p90: '180 ms', p99: '310 ms', sla: '99.95%', status: 'HEALTHY' },
    { name: 'User Profile Graph (WL-106)', p50: '16 ms', p90: '28 ms', p99: '39 ms', sla: '99.98%', status: 'HEALTHY' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Performance & SLA Observability</h1>
            <span className="text-xs font-mono font-bold bg-sky-950 text-sky-400 px-2.5 py-1 rounded-md border border-sky-800/40">
              Live Micro-Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-cloud tail latency (P50, P90, P99), SLA violation detection, and degraded route mitigation
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Overall System SLA"
          value={`${systemSlaHealth}%`}
          change="Target: 99.95%"
          isPositiveChange={systemSlaHealth >= 99.95}
          icon={ShieldCheck}
          accentColor="emerald"
        />
        <MetricCard
          title="Global Mean Latency"
          value="28.4 ms"
          change="-4.2 ms after optimization"
          isPositiveChange={true}
          icon={Clock}
          accentColor="sky"
        />
        <MetricCard
          title="P99 Tail Latency"
          value="64.2 ms"
          subtitle="99th percentile across all workloads"
          icon={Activity}
          accentColor="purple"
        />
        <MetricCard
          title="SLA Breaches Prevented"
          value="14 This Week"
          tag="Autonomous"
          icon={Zap}
          accentColor="amber"
        />
      </div>

      {/* SLA Health Per Cloud Provider */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {(Object.values(clouds) as CloudProvider[]).map((cloud) => (
          <div key={cloud.id} className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-xs text-slate-200 uppercase">{cloud.name}</span>
              <span className="text-xs font-mono font-bold text-emerald-400">{cloud.uptime90d}% Uptime</span>
            </div>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Avg Round-Trip:</span>
                <span className="text-slate-200 font-bold">{cloud.p95LatencyMs} ms</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Packet Loss:</span>
                <span className="text-emerald-400">0.001%</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Network Jitter:</span>
                <span className="text-slate-300">0.8 ms</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tail Latency Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-xs uppercase text-slate-200 tracking-wider">
            Workload Tail Latency Distribution
          </h3>
          <span className="text-xs font-mono text-slate-400">P50 / P90 / P99 Measurements</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4">P50 (Median)</th>
                <th className="py-3 px-4">P90 Latency</th>
                <th className="py-3 px-4">P99 Tail</th>
                <th className="py-3 px-4">SLA Compliance</th>
                <th className="py-3 px-4">Health Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {latencyBreakdown.map((item) => (
                <tr key={item.name} className="hover:bg-slate-850/60">
                  <td className="py-3.5 px-4 font-sans font-semibold text-slate-200">{item.name}</td>
                  <td className="py-3.5 px-4 text-slate-300">{item.p50}</td>
                  <td className="py-3.5 px-4 text-slate-300">{item.p90}</td>
                  <td className="py-3.5 px-4 text-purple-300 font-bold">{item.p99}</td>
                  <td className="py-3.5 px-4 text-emerald-400 font-bold">{item.sla}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] font-sans font-bold px-2 py-0.5 rounded ${
                        item.status === 'HEALTHY'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                          : 'bg-amber-950 text-amber-400 border border-amber-800/40'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
