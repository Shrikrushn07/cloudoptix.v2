import React from 'react';
import {
  X,
  Building2,
  BookOpen,
  FileText,
  Users,
  ShieldCheck,
  TrendingDown,
  Activity,
  Zap,
  ArrowRight,
  ExternalLink,
  Award,
  Lock,
  Globe,
  Sparkles,
} from 'lucide-react';

export type EnterpriseInfoType = 'platform' | 'customers' | 'resources' | 'company' | null;

interface EnterpriseInfoModalProps {
  type: EnterpriseInfoType;
  onClose: () => void;
  onOpenPricing: () => void;
  onOpenBookDemo: () => void;
  onOpenFreeTrial: () => void;
}

export const EnterpriseInfoModal: React.FC<EnterpriseInfoModalProps> = ({
  type,
  onClose,
  onOpenPricing,
  onOpenBookDemo,
  onOpenFreeTrial,
}) => {
  if (!type) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#020617] border border-slate-800 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl relative my-8 animate-fade-in text-slate-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content based on type */}
        {type === 'platform' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 px-3 py-1 bg-indigo-950/70 border border-indigo-700/50 rounded-full text-xs font-mono text-indigo-300 w-fit">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              <span>THE AUTONOMOUS CONTROL PLANE</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Next-Gen Autonomous Multi-Cloud Orchestration Architecture
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              CloudOptiX continuously senses multi-cloud telemetry, computes Pareto-optimal workload placements across AWS, Azure, and GCP, and executes zero-downtime container cutovers under strict sovereign policy guardrails.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-[#0b1120] border border-slate-800 rounded-2xl">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mb-3">
                  <Activity className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-100">8-Step Closed-Loop Loop</h4>
                <p className="text-xs text-slate-400 mt-1">
                  OBSERVE → PREDICT → OPTIMIZE → DECIDE → POLICY CHECK → ACT → VERIFY → LEARN in under 7 seconds.
                </p>
              </div>

              <div className="p-4 bg-[#0b1120] border border-slate-800 rounded-2xl">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-3">
                  <TrendingDown className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-100">Cross-Cloud Arbitrage</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Exploits dynamic Spot rates, reserved instance commitments, and region cost differentials automatically.
                </p>
              </div>

              <div className="p-4 bg-[#0b1120] border border-slate-800 rounded-2xl">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center mb-3">
                  <Lock className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-100">Sovereign Guardrails</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Enforces strict data residency (GDPR/EU, US-Only) and SLA targets before allowing any container cutover.
                </p>
              </div>
            </div>

            <div className="pt-4 flex items-center gap-3">
              <button
                onClick={() => {
                  onClose();
                  onOpenFreeTrial();
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                Start Free Trial
              </button>
              <button
                onClick={() => {
                  onClose();
                  onOpenBookDemo();
                }}
                className="px-5 py-2.5 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                Book Architecture Demo
              </button>
            </div>
          </div>
        )}

        {type === 'customers' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-950/70 border border-emerald-700/50 rounded-full text-xs font-mono text-emerald-300 w-fit">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>PROVEN AT SCALE</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Trusted by High-Velocity Engineering & FinOps Teams
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              See how modern enterprises reduce multi-cloud compute bills by up to 58% while improving 99.999% availability.
            </p>

            <div className="space-y-3 pt-2">
              <div className="p-4 bg-[#0b1120] border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-indigo-400">FINTECH UNICORN</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-xs text-slate-400">Series D Financial Core</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-100 mt-1">
                    Saved $1.42M annually across AWS and GCP with autonomous Spot rebalancing
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    "CloudOptiX eliminated all 3 AM pager duty calls for compute saturation and reduced our Kubernetes spend by 54%."
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xl font-bold font-mono text-emerald-400">-54%</span>
                  <span className="text-[10px] text-slate-400 block font-mono">Cloud Cost Delta</span>
                </div>
              </div>

              <div className="p-4 bg-[#0b1120] border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-sky-400">GLOBAL E-COMMERCE</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-xs text-slate-400">120M Monthly Active Shoppers</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-100 mt-1">
                    Zero downtime during Black Friday surge via multi-cloud burst orchestration
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    "When Azure experienced a regional capacity freeze, CloudOptiX seamlessly drained traffic to GCP in 6 seconds."
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xl font-bold font-mono text-emerald-400">99.999%</span>
                  <span className="text-[10px] text-slate-400 block font-mono">SLA Upheld</span>
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <span className="text-xs text-slate-400">Want custom customer reference calls?</span>
              <button
                onClick={() => {
                  onClose();
                  onOpenBookDemo();
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Request Case Study Pack
              </button>
            </div>
          </div>
        )}

        {type === 'resources' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 px-3 py-1 bg-sky-950/70 border border-sky-700/50 rounded-full text-xs font-mono text-sky-300 w-fit">
              <BookOpen className="w-3.5 h-3.5 text-sky-400" />
              <span>RESEARCH & DOCUMENTATION</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Multi-Cloud Architecture Guides & Research
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Explore our empirical benchmarks, whitepapers on autonomous closed-loop optimization, and CLI documentation.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-[#0b1120] border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-indigo-400 font-bold">WHITEPAPER (2026)</span>
                  <span className="text-slate-500">PDF • 18 Pages</span>
                </div>
                <h4 className="text-sm font-bold text-slate-100">
                  Pareto Multi-Objective Scheduling in Heterogeneous Clouds
                </h4>
                <p className="text-xs text-slate-400">
                  Mathematical proof and benchmarks comparing CloudOptiX against Kubernetes default deschedulers.
                </p>
              </div>

              <div className="p-4 bg-[#0b1120] border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-emerald-400 font-bold">FINOPS GUIDE</span>
                  <span className="text-slate-500">E-Book</span>
                </div>
                <h4 className="text-sm font-bold text-slate-100">
                  The Multi-Cloud Spot Arbitrage Playbook
                </h4>
                <p className="text-xs text-slate-400">
                  How to leverage 70% cheaper compute without compromising tier-0 customer reliability.
                </p>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <span className="text-xs text-slate-400">Need API and Terraform providers?</span>
              <button
                onClick={() => {
                  onClose();
                  onOpenFreeTrial();
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Access Developer Docs
              </button>
            </div>
          </div>
        )}

        {type === 'company' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 px-3 py-1 bg-indigo-950/70 border border-indigo-700/50 rounded-full text-xs font-mono text-indigo-300 w-fit">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>ABOUT CLOUDOPTIX</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Autonomous Cloud Infrastructure for the Modern Enterprise
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              CloudOptiX was founded by distributed systems engineers, cloud economists, and AI researchers to eliminate the manual toil of cross-cloud capacity planning and multi-million dollar compute waste.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center pt-2">
              <div className="bg-[#0b1120] p-3.5 rounded-2xl border border-slate-800">
                <span className="text-xl font-mono font-extrabold text-indigo-400">14.8M+</span>
                <span className="text-[11px] text-slate-400 block mt-0.5">Automated Actions</span>
              </div>
              <div className="bg-[#0b1120] p-3.5 rounded-2xl border border-slate-800">
                <span className="text-xl font-mono font-extrabold text-emerald-400">$38M+</span>
                <span className="text-[11px] text-slate-400 block mt-0.5">Client Cloud Savings</span>
              </div>
              <div className="bg-[#0b1120] p-3.5 rounded-2xl border border-slate-800">
                <span className="text-xl font-mono font-extrabold text-sky-400">99.999%</span>
                <span className="text-[11px] text-slate-400 block mt-0.5">SLA Guaranteed</span>
              </div>
              <div className="bg-[#0b1120] p-3.5 rounded-2xl border border-slate-800">
                <span className="text-xl font-mono font-extrabold text-purple-400">SOC2</span>
                <span className="text-[11px] text-slate-400 block mt-0.5">Type II Audited</span>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <span className="text-xs text-slate-400">Headquartered in San Francisco, CA • Distributed Worldwide</span>
              <button
                onClick={() => {
                  onClose();
                  onOpenBookDemo();
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Contact Enterprise Team
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
