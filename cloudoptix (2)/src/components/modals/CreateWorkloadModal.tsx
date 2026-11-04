import React, { useState } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { WorkloadType, WorkloadPriority, CloudProviderId, AIDecision } from '../../types';
import { evaluateCloudCandidates } from '../../services/aiEngine';
import { X, Sparkles, Server, Cpu, Database, Activity, DollarSign, Shield, ArrowRight, CheckCircle2 } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

interface CreateWorkloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateWorkloadModal: React.FC<CreateWorkloadModalProps> = ({ isOpen, onClose }) => {
  const { clouds, policies, createWorkload } = useSimulation();

  const [name, setName] = useState('Order-Processing-Worker');
  const [type, setType] = useState<WorkloadType>('Checkout API');
  const [cpuCores, setCpuCores] = useState(16);
  const [memoryGb, setMemoryGb] = useState(32);
  const [priority, setPriority] = useState<WorkloadPriority>('HIGH');
  const [targetLatencyMs, setTargetLatencyMs] = useState(35);
  const [slaTargetPercent, setSlaTargetPercent] = useState(99.95);
  const [maxAcceptableCost, setMaxAcceptableCost] = useState(3.50);
  const [dataLocality, setDataLocality] = useState('us-east-central');
  const [policyId, setPolicyId] = useState(policies[0]?.id || 'POL-01');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiDecision, setAiDecision] = useState<AIDecision | null>(null);
  const [isDeployed, setIsDeployed] = useState(false);

  if (!isOpen) return null;

  const handleRunAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      const decision = evaluateCloudCandidates(
        {
          workloadName: name,
          workloadType: type,
          cpuCores,
          memoryGb,
          priority,
          targetLatencyMs,
          minSlaPercent: slaTargetPercent,
          maxAcceptableCostPerHour: maxAcceptableCost,
          policyId,
        },
        clouds,
        policies
      );
      setAiDecision(decision);
      setIsAnalyzing(false);
    }, 800);
  };

  const handleDeploy = (targetCloudOverride?: CloudProviderId) => {
    const cloudToDeploy = targetCloudOverride || aiDecision?.recommendedCloud || 'gcp';
    createWorkload(
      {
        name,
        type,
        cpuCores,
        memoryGb,
        priority,
        slaTargetPercent,
        policyId,
      },
      cloudToDeploy
    );
    setIsDeployed(true);
    setTimeout(() => {
      setIsDeployed(false);
      setAiDecision(null);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Create & Orchestrate Workload</h2>
              <p className="text-xs text-slate-400">
                Define compute specs, latency constraints, and request autonomous multi-cloud placement
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {isDeployed ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40 animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-100">Workload Successfully Deployed</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                <strong className="text-purple-400">{name}</strong> has been allocated on{' '}
                <strong className="text-slate-200 uppercase">{aiDecision?.recommendedCloud || 'GCP'}</strong>.
                Continuous telemetry and autonomous optimization loop are now active.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Workload Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Workload Identifier
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none"
                    placeholder="e.g. Checkout API Service"
                  />
                </div>

                {/* Workload Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Workload Archetype
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as WorkloadType)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none"
                  >
                    <option value="Checkout API">Checkout API (Latency Sensitive)</option>
                    <option value="Video Processing">Video Processing (GPU Bound)</option>
                    <option value="ML Training">ML Training (High Compute/Spot)</option>
                    <option value="Image Processing">Image Processing</option>
                    <option value="Recommendation Engine">Recommendation Engine (Vector Index)</option>
                    <option value="Batch Analytics">Batch Analytics (Off-peak)</option>
                    <option value="Document Processing">Document Processing</option>
                    <option value="Notification Service">Notification Service</option>
                    <option value="Payment Gateway">Payment Gateway (Tier-0)</option>
                    <option value="Realtime WebSockets">Realtime WebSockets</option>
                  </select>
                </div>

                {/* CPU Requirement */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>vCPU Cores</span>
                    <span className="text-purple-400 font-mono font-bold">{cpuCores} Cores</span>
                  </label>
                  <input
                    type="range"
                    min={2}
                    max={64}
                    step={2}
                    value={cpuCores}
                    onChange={(e) => setCpuCores(Number(e.target.value))}
                    className="w-full accent-purple-500"
                  />
                </div>

                {/* Memory Requirement */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Memory Allocation (GB)</span>
                    <span className="text-purple-400 font-mono font-bold">{memoryGb} GB</span>
                  </label>
                  <input
                    type="range"
                    min={4}
                    max={256}
                    step={4}
                    value={memoryGb}
                    onChange={(e) => setMemoryGb(Number(e.target.value))}
                    className="w-full accent-purple-500"
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Operational Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as WorkloadPriority)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none"
                  >
                    <option value="CRITICAL">CRITICAL (Tier-0 / Zero Tolerance)</option>
                    <option value="HIGH">HIGH (Standard Production)</option>
                    <option value="MEDIUM">MEDIUM (Internal Services)</option>
                    <option value="LOW">LOW (Batch / Spot-tolerant)</option>
                  </select>
                </div>

                {/* SLA Target */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>SLA Target</span>
                    <span className="text-emerald-400 font-mono font-bold">{slaTargetPercent}%</span>
                  </label>
                  <select
                    value={slaTargetPercent}
                    onChange={(e) => setSlaTargetPercent(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none font-mono"
                  >
                    <option value={99.999}>99.999% (Five Nines)</option>
                    <option value={99.99}>99.99% (High Availability)</option>
                    <option value={99.95}>99.95% (Standard SLA)</option>
                    <option value={99.9}>99.9%</option>
                    <option value={98.5}>98.5% (Batch Target)</option>
                  </select>
                </div>

                {/* Max Cost Ceiling */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Max Hourly Cost ($/hr)</span>
                    <span className="text-amber-400 font-mono font-bold">${maxAcceptableCost.toFixed(2)}/hr</span>
                  </label>
                  <input
                    type="range"
                    min={0.5}
                    max={15.0}
                    step={0.25}
                    value={maxAcceptableCost}
                    onChange={(e) => setMaxAcceptableCost(Number(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>

                {/* Policy Binding */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Governing Policy Rule
                  </label>
                  <select
                    value={policyId}
                    onChange={(e) => setPolicyId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none"
                  >
                    {policies.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Analysis Trigger Button */}
              <div className="pt-2">
                <button
                  id="btn-run-ai-placement"
                  onClick={handleRunAnalysis}
                  disabled={isAnalyzing}
                  className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  {isAnalyzing ? 'Evaluating Multi-Cloud Decision Engine...' : 'Run AI Placement Analysis'}
                </button>
              </div>

              {/* AI Analysis Recommendation Result */}
              {aiDecision && (
                <div className="bg-slate-950 border border-purple-500/40 rounded-xl p-5 space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping" />
                      <h3 className="font-bold text-sm text-purple-300">Recommended Placement Decision</h3>
                    </div>
                    <StatusBadge status="AUTONOMOUSLY_APPROVED" size="sm" />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase">Recommended Cloud</span>
                      <span className="text-lg font-bold uppercase text-slate-100">
                        {aiDecision.recommendedCloud}
                      </span>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase">Confidence</span>
                      <span className="text-lg font-bold font-mono text-purple-400">{aiDecision.confidence}%</span>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase">Estimated Cost</span>
                      <span className="text-lg font-bold font-mono text-amber-400">
                        ${aiDecision.candidateScores[0]?.estimatedCostPerHour || 4.20}/hr
                      </span>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase">Predicted Latency</span>
                      <span className="text-lg font-bold font-mono text-sky-400">
                        {aiDecision.candidateScores[0]?.estimatedLatencyMs || 26} ms
                      </span>
                    </div>
                  </div>

                  {/* Factor Breakdown */}
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Decision Factor Weights:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {aiDecision.factors.slice(0, 4).map((f) => (
                        <div key={f.factorName} className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 text-xs">
                          <div className="flex justify-between font-medium mb-1">
                            <span className="text-slate-300">{f.factorName}</span>
                            <span className="text-purple-400 font-mono">{f.weight}%</span>
                          </div>
                          <p className="text-[11px] text-slate-400">{f.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Deploy Actions */}
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                    <button
                      onClick={() => handleDeploy(aiDecision.recommendedCloud)}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Deploy on {aiDecision.recommendedCloud.toUpperCase()}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
