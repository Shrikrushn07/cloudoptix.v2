import React, { useState } from 'react';
import {
  X,
  Zap,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  Server,
  ArrowRight,
  Terminal,
  Layers,
} from 'lucide-react';
import { CloudProviderId } from '../../types';
import { CloudProviderLogo } from '../common/CloudProviderLogo';

interface FreeTrialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FreeTrialModal: React.FC<FreeTrialModalProps> = ({ isOpen, onClose }) => {
  const [selectedCloud, setSelectedCloud] = useState<CloudProviderId>('aws');
  const [hasCopied, setHasCopied] = useState(false);
  const [clusterName, setClusterName] = useState('prod-us-east-cluster');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  if (!isOpen) return null;

  const getCliCommand = () => {
    if (selectedCloud === 'aws') {
      return `curl -sSL https://get.cloudoptix.ai/aws-agent.sh | bash -s -- --cluster-name ${clusterName} --mode read-only --region us-east-1`;
    }
    if (selectedCloud === 'azure') {
      return `az account set --subscription <SUBSCRIPTION_ID>\ncurl -sSL https://get.cloudoptix.ai/azure-aks.sh | bash -s -- --cluster ${clusterName}`;
    }
    return `gcloud container clusters get-credentials ${clusterName} --region us-central1\nkubectl apply -f https://get.cloudoptix.ai/gke-telemetry.yaml`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCliCommand());
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleVerify = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setIsVerified(true);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#020617] border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8 animate-fade-in text-slate-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-950/70 border border-emerald-700/50 rounded-full text-xs font-mono text-emerald-300 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>14-DAY ENTERPRISE TRIAL • ZERO CREDIT CARD REQUIRED</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Connect Your Multi-Cloud Cluster in 2 Minutes
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Deploy the read-only CloudOptiX telemetry agent to immediately discover multi-cloud waste, tail-latency bottlenecks, and autonomous savings potential.
          </p>
        </div>

        {/* Step 1: Select Cloud */}
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono text-slate-400 uppercase font-bold mb-2">
              1. Select Target Cloud Infrastructure
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setSelectedCloud('aws')}
                className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2.5 transition-all cursor-pointer ${
                  selectedCloud === 'aws'
                    ? 'bg-amber-950/30 border-[#FF9900] text-white shadow-md ring-1 ring-[#FF9900]/40'
                    : 'bg-[#0b1120] border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <CloudProviderLogo provider="aws" size="md" />
                <span className="text-xs font-bold text-slate-200">AWS (EKS / EC2)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCloud('azure')}
                className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2.5 transition-all cursor-pointer ${
                  selectedCloud === 'azure'
                    ? 'bg-sky-950/30 border-[#0089D6] text-white shadow-md ring-1 ring-[#0089D6]/40'
                    : 'bg-[#0b1120] border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <CloudProviderLogo provider="azure" size="md" />
                <span className="text-xs font-bold text-slate-200">Azure (AKS / VMs)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCloud('gcp')}
                className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2.5 transition-all cursor-pointer ${
                  selectedCloud === 'gcp'
                    ? 'bg-blue-950/30 border-[#4285F4] text-white shadow-md ring-1 ring-[#4285F4]/40'
                    : 'bg-[#0b1120] border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <CloudProviderLogo provider="gcp" size="md" />
                <span className="text-xs font-bold text-slate-200">Google Cloud (GKE)</span>
              </button>
            </div>
          </div>

          {/* Cluster Identifier */}
          <div>
            <label className="block text-[11px] font-mono text-slate-400 uppercase font-bold mb-1">
              2. Cluster Identifier
            </label>
            <input
              type="text"
              value={clusterName}
              onChange={(e) => setClusterName(e.target.value)}
              className="w-full bg-[#0b1120] border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none"
              placeholder="e.g. prod-primary-eks"
            />
          </div>

          {/* Step 3: CLI Agent Snippet */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-mono text-slate-400 uppercase font-bold">
                3. Run Read-Only Discovery Command
              </label>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                NON-INVASIVE
              </span>
            </div>

            <div className="p-4 bg-[#0b1120] border border-slate-800 rounded-2xl relative font-mono text-xs text-slate-300">
              <pre className="overflow-x-auto whitespace-pre-wrap leading-relaxed pr-16">
                {getCliCommand()}
              </pre>

              <button
                type="button"
                onClick={handleCopy}
                className="absolute top-3 right-3 p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs flex items-center gap-1 transition-all cursor-pointer"
                title="Copy Command"
              >
                {hasCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[10px]">Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Verification Status Bar */}
          <div className="pt-2">
            {isVerified ? (
              <div className="p-4 bg-emerald-950/50 border border-emerald-600/50 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">
                    ✓
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-300 block">
                      Cluster Connected & Telemetry Streaming
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Found 14 node pools, $24,190/mo compute spend, 42% immediate savings potential.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  View Live Telemetry
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <p className="text-[11px] text-slate-500">
                  Agent streams anonymous metric telemetry over HTTPS (port 443) only.
                </p>
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={isVerifying}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer shrink-0"
                >
                  {isVerifying ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>Test Connection</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
