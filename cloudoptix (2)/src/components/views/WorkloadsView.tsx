import React, { useState } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { Workload, CloudProviderId, WorkloadPriority, WorkloadStatus } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { CloudProviderLogo } from '../common/CloudProviderLogo';
import {
  Cpu,
  Search,
  Filter,
  ArrowUpDown,
  Sparkles,
  Server,
  Trash2,
  MoveRight,
  Zap,
  Activity,
  DollarSign,
  Plus,
  RefreshCw,
  ShieldAlert,
  Lock,
} from 'lucide-react';

interface WorkloadsViewProps {
  onOpenCreateModal: () => void;
}

export const WorkloadsView: React.FC<WorkloadsViewProps> = ({ onOpenCreateModal }) => {
  const { workloads, clouds, migrateWorkload, deleteWorkload, isSimulatingAction, currentUser, switchUserRole } = useSimulation();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCloud, setSelectedCloud] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [migratingWorkloadId, setMigratingWorkloadId] = useState<string | null>(null);
  const [targetMigrationCloud, setTargetMigrationCloud] = useState<CloudProviderId>('azure');

  const filteredWorkloads = workloads.filter((w) => {
    const matchSearch =
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCloud = selectedCloud === 'ALL' || w.cloud === selectedCloud;
    const matchPriority = selectedPriority === 'ALL' || w.priority === selectedPriority;
    const matchStatus = selectedStatus === 'ALL' || w.status === selectedStatus;
    return matchSearch && matchCloud && matchPriority && matchStatus;
  });

  const handleStartMigration = async (workloadId: string, destCloud: CloudProviderId) => {
    await migrateWorkload(workloadId, destCloud);
    setMigratingWorkloadId(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Role Restriction Notice for FinOps Lead */}
      {!currentUser.permissions.canDeployWorkloads && (
        <div className="p-3.5 bg-amber-950/40 border border-amber-500/40 rounded-2xl flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold text-amber-200">FinOps Lead Read-Only Mode: </span>
              <span className="text-amber-300/80">
                Workload provisioning and decommission actions are locked for this role.
              </span>
            </div>
          </div>
          <button
            onClick={() => switchUserRole('sre_admin_04')}
            className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded-lg text-xs font-semibold shrink-0 cursor-pointer"
          >
            Switch to SRE Admin
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Workload Orchestration Inventory</h1>
            <span className="text-xs font-mono font-bold bg-[#0b1120] text-slate-300 px-2.5 py-1 rounded-md border border-slate-800">
              {workloads.length} Managed Services
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-cloud scheduling, compute requirements, tail latency, and AI placement telemetry
          </p>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Workload</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#0b1120] border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, ID, or archetype..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#020617] border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Cloud Filter */}
          <select
            value={selectedCloud}
            onChange={(e) => setSelectedCloud(e.target.value)}
            className="bg-[#020617] border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-1.5 focus:outline-none"
          >
            <option value="ALL">All Clouds (AWS, Azure, GCP)</option>
            <option value="aws">AWS Only</option>
            <option value="azure">Azure Only</option>
            <option value="gcp">Google Cloud Only</option>
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="bg-[#020617] border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-1.5 focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">CRITICAL Tier-0</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-[#020617] border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-1.5 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="Running">Running</option>
            <option value="Optimizing">Optimizing</option>
            <option value="Warning">Warning</option>
          </select>
        </div>
      </div>

      {/* Workloads Table */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#020617] text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Workload ID & Name</th>
                <th className="py-3.5 px-4">Archetype</th>
                <th className="py-3.5 px-4">Host Cloud</th>
                <th className="py-3.5 px-4">Compute Specs</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Latency</th>
                <th className="py-3.5 px-4">SLA Compliance</th>
                <th className="py-3.5 px-4">Est. Cost</th>
                <th className="py-3.5 px-4">AI Recommendation</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-[#0b1120]">
              {filteredWorkloads.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 text-xs">
                    No matching workloads found for current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredWorkloads.map((w) => {
                  const cloudObj = clouds[w.cloud];
                  const hasRecommendation = !!w.aiRecommendation;

                  return (
                    <tr key={w.id} className="hover:bg-slate-850/40 transition-colors">
                      {/* Name & ID */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-100">{w.name}</div>
                        <div className="font-mono text-[10px] text-slate-400">{w.id}</div>
                      </td>

                      {/* Archetype */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 font-mono text-[10px]">
                          {w.type}
                        </span>
                      </td>

                      {/* Cloud */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <CloudProviderLogo provider={w.cloud} size="sm" />
                          <span className="font-bold uppercase text-slate-200">
                            {cloudObj?.shortName || w.cloud}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">({w.region})</span>
                        </div>
                      </td>

                      {/* Specs */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                        <div>{w.cpuCores} vCPU ({w.cpuUtilPercent}%)</div>
                        <div className="text-slate-400">{w.memoryGb} GB RAM ({w.memUtilPercent}%)</div>
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            w.priority === 'CRITICAL'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : w.priority === 'HIGH'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-slate-900 text-slate-400 border border-slate-800'
                          }`}
                        >
                          {w.priority}
                        </span>
                      </td>

                      {/* Latency */}
                      <td className="py-3.5 px-4 font-mono">
                        <span className={w.latencyMs > 50 ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                          {w.latencyMs}ms
                        </span>
                      </td>

                      {/* SLA */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-emerald-400">{w.currentSlaPercent}%</span>
                          <span className="text-[10px] text-slate-400">(tgt {w.slaTargetPercent}%)</span>
                        </div>
                      </td>

                      {/* Cost */}
                      <td className="py-3.5 px-4 font-mono text-slate-200">
                        ${w.costPerHour}/hr
                        <div className="text-[10px] text-slate-400 font-mono">
                          ~${Math.round(w.costPerHour * 24 * 30)}/mo
                        </div>
                      </td>

                      {/* AI Recommendation */}
                      <td className="py-3.5 px-4">
                        {hasRecommendation ? (
                          <div className="bg-indigo-950/40 border border-indigo-500/40 p-2 rounded-xl text-[11px] max-w-[240px]">
                            <div className="flex items-center gap-1 text-indigo-300 font-bold mb-0.5">
                              <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
                              <span>Move to {clouds[w.aiRecommendation!.recommendedCloud]?.shortName}</span>
                            </div>
                            <div className="text-[10px] font-mono text-emerald-400">
                              Save ${w.aiRecommendation!.potentialSavingsPerMonth}/mo
                            </div>
                            <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                              {w.aiRecommendation!.reason}
                            </p>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-mono">Optimal allocation</span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {migratingWorkloadId === w.id ? (
                            <div className="flex items-center gap-1 bg-[#020617] p-1 rounded-lg border border-indigo-500">
                              <select
                                value={targetMigrationCloud}
                                onChange={(e) => setTargetMigrationCloud(e.target.value as CloudProviderId)}
                                className="bg-slate-900 text-[11px] text-slate-200 rounded px-1.5 py-0.5"
                              >
                                <option value="aws">AWS</option>
                                <option value="azure">Azure</option>
                                <option value="gcp">GCP</option>
                              </select>
                              <button
                                onClick={() => handleStartMigration(w.id, targetMigrationCloud)}
                                className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-bold cursor-pointer"
                              >
                                Move
                              </button>
                              <button
                                onClick={() => setMigratingWorkloadId(null)}
                                className="px-1 py-0.5 text-slate-400 text-[10px] cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <>
                              {hasRecommendation && (
                                <button
                                  onClick={() =>
                                    handleStartMigration(w.id, w.aiRecommendation!.recommendedCloud)
                                  }
                                  title="Apply AI Recommended Migration"
                                  className="p-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/40 rounded-lg transition-all cursor-pointer"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setMigratingWorkloadId(w.id);
                                  setTargetMigrationCloud(w.cloud === 'azure' ? 'gcp' : 'azure');
                                }}
                                title="Migrate Workload to another cloud"
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all cursor-pointer"
                              >
                                <MoveRight className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deleteWorkload(w.id)}
                                title="Decommission Workload"
                                className="p-1.5 bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 rounded-lg transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
