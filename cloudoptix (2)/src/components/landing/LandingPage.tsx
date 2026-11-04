import React, { useState } from 'react';
import {
  Zap,
  Sparkles,
  ShieldCheck,
  TrendingDown,
  Activity,
  ArrowRight,
  CheckCircle2,
  Lock,
  Sliders,
  DollarSign,
  Calendar,
  Server,
  Play,
  Layers,
  Cpu,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Shield,
  Award,
  Globe,
  Flame,
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import { EnterpriseInfoType } from '../modals/EnterpriseInfoModal';
import { CloudProviderLogo } from '../common/CloudProviderLogo';

interface LandingPageProps {
  onEnterDashboard: () => void;
  onOpenSignIn: () => void;
  onOpenBookDemo: () => void;
  onOpenFreeTrial: () => void;
  onOpenPricing: () => void;
  onOpenInfo: (type: EnterpriseInfoType) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterDashboard,
  onOpenSignIn,
  onOpenBookDemo,
  onOpenFreeTrial,
  onOpenPricing,
  onOpenInfo,
}) => {
  const { totalMonthlyCost, totalPotentialSavings } = useSimulation();
  const [calculatorSpend, setCalculatorSpend] = useState<number>(75000);

  // Real-time ROI calculation
  const monthlySavings = Math.round(calculatorSpend * 0.54);
  const annualSavings = monthlySavings * 12;
  const netClientSavings = Math.round(annualSavings * 0.85);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-indigo-600 selection:text-white relative overflow-hidden">
      {/* Ambient background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-gradient-to-b from-indigo-900/15 via-transparent to-transparent pointer-events-none -z-10 blur-3xl" />
      <div className="absolute top-40 right-10 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-96 left-10 w-96 h-96 bg-emerald-900/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* 1. Public Top Navigation Bar (CAST AI Style) */}
      <header className="sticky top-0 z-50 bg-[#020617]/90 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between gap-4">
          {/* Logo & Platform Tag */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/30 text-sm">
              OX
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-white">CloudOptiX</span>
              <span className="hidden sm:inline-block text-[10px] font-mono font-bold text-indigo-400 bg-indigo-950/80 border border-indigo-700/50 px-2 py-0.5 rounded-full">
                AUTONOMOUS
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-slate-300">
            <button
              onClick={() => onOpenInfo('platform')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Platform
            </button>
            <button
              onClick={() => onOpenInfo('customers')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Customers
            </button>
            <button
              onClick={onOpenPricing}
              className="hover:text-indigo-400 transition-colors flex items-center gap-1.5 cursor-pointer text-slate-200"
            >
              <span>Pricing</span>
              <span className="text-[9px] font-mono bg-emerald-950 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-800">
                50%+ SAVINGS
              </span>
            </button>
            <button
              onClick={() => onOpenInfo('resources')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Resources
            </button>
            <button
              onClick={() => onOpenInfo('company')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Company
            </button>
          </nav>

          {/* Public CTAs */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenBookDemo}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 border border-slate-700/80 transition-all cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>Book a Demo</span>
            </button>

            <button
              onClick={onOpenSignIn}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all cursor-pointer"
            >
              Sign In
            </button>

            <button
              onClick={onOpenFreeTrial}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-indigo-200" />
              <span>Start Free Trial</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="pt-16 pb-20 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0b1120] border border-indigo-500/30 text-indigo-300 text-xs font-mono shadow-sm">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
            <span>THE MULTI-CLOUD AUTONOMOUS CONTROL PLANE</span>
          </div>

          {/* Main Hero Headline (CAST AI Inspired) */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
            Application Performance and Multi-Cloud Automation.{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
              On Autopilot.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
            CloudOptiX continuously balances workloads across AWS, Microsoft Azure, and Google Cloud. Cut 50%+ of compute spend, maintain 99.999% SLA availability, and execute zero-downtime self-healing.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenFreeTrial}
              className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-xl shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>Start Free 14-Day Trial</span>
            </button>

            <button
              onClick={onEnterDashboard}
              className="px-6 py-3.5 bg-[#0b1120] hover:bg-slate-800 text-slate-100 rounded-xl text-xs font-bold uppercase tracking-wider border border-slate-700 hover:border-slate-600 shadow-md flex items-center gap-2 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 text-emerald-400" />
              <span>Launch Live Control Center</span>
            </button>

            <button
              onClick={onOpenBookDemo}
              className="px-5 py-3.5 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Book Architecture Demo</span>
              <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
            </button>
          </div>

          {/* Live KPI Ticker Chips */}
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center max-w-2xl mx-auto">
            <div className="p-3 rounded-2xl bg-[#0b1120] border border-slate-800">
              <span className="text-xl font-bold font-mono text-emerald-400">-54%</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Avg Cloud Cost Reduction</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#0b1120] border border-slate-800">
              <span className="text-xl font-bold font-mono text-indigo-400">&lt; 7 sec</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Autonomous Remediation</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#0b1120] border border-slate-800">
              <span className="text-xl font-bold font-mono text-sky-400">99.999%</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">SLA Upheld Across Clouds</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#0b1120] border border-slate-800">
              <span className="text-xl font-bold font-mono text-purple-400">0 ms</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Downtime Cutover</span>
            </div>
          </div>
        </div>

        {/* Live Interactive Hero Preview Card */}
        <div className="mt-12 p-1.5 sm:p-3 rounded-3xl bg-gradient-to-b from-indigo-500/20 via-slate-800/40 to-slate-900/60 border border-slate-700/60 shadow-2xl">
          <div className="bg-[#0b1120] rounded-2xl border border-slate-800 p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs font-mono text-slate-400 font-bold ml-2">
                  CloudOptiX Autonomous Orchestration Stream (AWS • Azure • GCP)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  CLOSED-LOOP ACTIVE
                </span>
                <button
                  onClick={onEnterDashboard}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                >
                  <span>Open Full Control Plane</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Visual 3-Cloud Topology Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* AWS Card */}
              <div className="p-4 bg-[#020617] rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CloudProviderLogo provider="aws" size="sm" />
                    <span className="text-xs font-bold text-slate-200 uppercase">Amazon Web Services</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">us-east-1</span>
                </div>
                <div className="flex justify-between text-xs pt-1 font-mono">
                  <span className="text-slate-400">P99 Latency:</span>
                  <span className="text-slate-200">18ms</span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Run Rate:</span>
                  <span className="text-slate-200 font-bold">$16.20/hr</span>
                </div>
                <div className="p-2 bg-indigo-950/40 rounded-lg text-[10px] font-mono text-indigo-300 border border-indigo-800/40">
                  ⚡ Autonomous Spot Arbitrage Active
                </div>
              </div>

              {/* Azure Card */}
              <div className="p-4 bg-[#020617] rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CloudProviderLogo provider="azure" size="sm" />
                    <span className="text-xs font-bold text-slate-200 uppercase">Microsoft Azure</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">eastus</span>
                </div>
                <div className="flex justify-between text-xs pt-1 font-mono">
                  <span className="text-slate-400">P99 Latency:</span>
                  <span className="text-slate-200">22ms</span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Run Rate:</span>
                  <span className="text-slate-200 font-bold">$14.80/hr</span>
                </div>
                <div className="p-2 bg-emerald-950/40 rounded-lg text-[10px] font-mono text-emerald-300 border border-emerald-800/40">
                  ✓ GDPR Sovereign Compliance Locked
                </div>
              </div>

              {/* GCP Card */}
              <div className="p-4 bg-[#020617] rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CloudProviderLogo provider="gcp" size="sm" />
                    <span className="text-xs font-bold text-slate-200 uppercase">Google Cloud Platform</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">us-central1</span>
                </div>
                <div className="flex justify-between text-xs pt-1 font-mono">
                  <span className="text-slate-400">P99 Latency:</span>
                  <span className="text-emerald-400 font-bold">14ms (Optimal)</span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Run Rate:</span>
                  <span className="text-slate-200 font-bold">$12.40/hr</span>
                </div>
                <div className="p-2 bg-purple-950/40 rounded-lg text-[10px] font-mono text-purple-300 border border-purple-800/40">
                  🎯 AI Recommendation Target Node
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Hyperscaler Trust Banner */}
      <section className="py-10 border-y border-slate-800/80 bg-[#020617]/60">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-6">
            Natively Integrated with Enterprise Cloud & Kubernetes Ecosystems
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 text-slate-300 font-bold text-sm">
            <span className="flex items-center gap-2.5">
              <CloudProviderLogo provider="aws" size="sm" /> Amazon Web Services (EKS/EC2)
            </span>
            <span className="flex items-center gap-2.5">
              <CloudProviderLogo provider="azure" size="sm" /> Microsoft Azure (AKS/VMs)
            </span>
            <span className="flex items-center gap-2.5">
              <CloudProviderLogo provider="gcp" size="sm" /> Google Cloud Platform (GKE)
            </span>
            <span className="flex items-center gap-2.5">
              <CloudProviderLogo provider="kubernetes" size="sm" /> Kubernetes
            </span>
            <span className="flex items-center gap-2.5">
              <CloudProviderLogo provider="terraform" size="sm" /> Terraform
            </span>
          </div>
        </div>
      </section>

      {/* 4. Interactive Savings-Share Calculator (CAST AI Benchmark) */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <div className="p-8 sm:p-10 bg-[#0b1120] border border-slate-800 rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-950/70 border border-emerald-700/50 rounded-full text-xs font-mono text-emerald-300 mb-3">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>GUARANTEED PERFORMANCE-BASED PRICING</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Calculate Your Enterprise Cloud Savings
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              With our CAST AI-style savings-share model, there are zero upfront licensing fees. We only get paid a fraction of the verified spend we eliminate.
            </p>
          </div>

          {/* Spend Slider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-slate-400 uppercase font-bold">
                Monthly Multi-Cloud Infrastructure Spend:
              </span>
              <span className="text-2xl font-extrabold font-mono text-indigo-400">
                ${calculatorSpend.toLocaleString()} <span className="text-xs text-slate-400 font-mono">/ mo</span>
              </span>
            </div>

            <input
              type="range"
              min="10000"
              max="300000"
              step="5000"
              value={calculatorSpend}
              onChange={(e) => setCalculatorSpend(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-center">
              <div className="bg-[#020617] p-4 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400 block font-mono">Projected Monthly Savings</span>
                <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">
                  +${monthlySavings.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">54% waste eliminated</span>
              </div>
              <div className="bg-[#020617] p-4 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400 block font-mono">Annual Net Client Gain</span>
                <span className="text-2xl font-bold font-mono text-emerald-300 mt-1 block">
                  +${netClientSavings.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">After CloudOptiX fee</span>
              </div>
              <div className="bg-[#020617] p-4 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400 block font-mono">Upfront License Cost</span>
                <span className="text-2xl font-bold font-mono text-white mt-1 block">
                  $0.00
                </span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">100% Risk Free</span>
              </div>
            </div>

            <div className="pt-6 text-center">
              <button
                onClick={onOpenFreeTrial}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                Claim Your Savings in 2 Minutes
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Core Pillars / Platform Capabilities */}
      <section className="py-20 px-6 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-950/70 border border-indigo-700/50 rounded-full text-xs font-mono text-indigo-300 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>FOUR AUTONOMOUS PILLARS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Engineered for Continuous Multi-Cloud Mastery
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Eliminate human toil, static spreadsheet calculations, and capacity outages with an 8-stage algorithmic loop.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pillar 1 */}
          <div className="p-6 bg-[#0b1120] border border-slate-800 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100">8-Step Closed Loop</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Observe, predict, optimize, decide, check policy, act, verify, and learn in sub-7-second continuous cycles.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="p-6 bg-[#0b1120] border border-slate-800 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100">Spot & Cost Arbitrage</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Exploits dynamic Spot rates across providers with zero risk to availability through proactive draining.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="p-6 bg-[#0b1120] border border-slate-800 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100">Sovereign Guardrails</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enforces GDPR, US-Only data residency, and SLA ceilings with deterministic policy verification before cutover.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="p-6 bg-[#0b1120] border border-slate-800 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100">Zero-Downtime Cutover</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Executes container state migration, DNS traffic shifting, and health checks seamlessly without dropped packets.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Comparison: Manual CloudOps vs. Autonomous CloudOptiX */}
      <section className="py-20 px-6 max-w-5xl mx-auto border-t border-slate-800/80">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Manual Multi-Cloud Operations vs. CloudOptiX Autopilot
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Traditional Manual Ops */}
          <div className="p-6 bg-[#0b1120] border border-rose-500/30 rounded-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-mono font-bold text-rose-400 uppercase">
                Traditional Multi-Cloud
              </span>
              <span className="text-[10px] font-mono text-rose-400 bg-rose-950 px-2 py-0.5 rounded border border-rose-800">
                MANUAL & SLOW
              </span>
            </div>
            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold shrink-0">✕</span>
                <span>Over-provisioning compute by 40–60% to buffer against sudden traffic spikes.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold shrink-0">✕</span>
                <span>Manual 3 AM pager duty calls when a cloud region degrades or saturates.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold shrink-0">✕</span>
                <span>Static spreadsheets to estimate multi-cloud reservations and spot arbitrage.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold shrink-0">✕</span>
                <span>Hours of downtime or manual DNS re-routing during cloud outages.</span>
              </li>
            </ul>
          </div>

          {/* CloudOptiX Autopilot */}
          <div className="p-6 bg-gradient-to-b from-[#0b1120] to-indigo-950/30 border border-indigo-500/50 rounded-2xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-mono font-bold text-indigo-400 uppercase">
                CloudOptiX Autonomous Platform
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                100% AUTOMATED
              </span>
            </div>
            <ul className="space-y-3 text-xs text-slate-200">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Continuous dynamic rightsizing saves 54% average multi-cloud compute cost.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Under 7-second self-healing loop automatically relocates degraded workloads.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Pareto multi-objective AI solves cost, latency, and SLA in real time.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Cryptographic audit trail with strict sovereign data residency policies.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 7. Bottom Conversion Banner */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-indigo-900/60 via-indigo-950/80 to-[#0b1120] border border-indigo-500/40 text-center space-y-6 shadow-2xl">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Ready to Put Multi-Cloud Optimization on Autopilot?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
            Connect your AWS, Azure, or Google Cloud clusters in 2 minutes with our read-only agent. Zero disruption, instant waste discovery.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={onOpenFreeTrial}
              className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xl shadow-indigo-600/30 cursor-pointer"
            >
              Start Free 14-Day Trial
            </button>
            <button
              onClick={onEnterDashboard}
              className="px-6 py-3.5 bg-[#020617] hover:bg-slate-850 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              Launch Live Control Center
            </button>
          </div>
        </div>
      </section>

      {/* 8. Enterprise Footer */}
      <footer className="py-12 border-t border-slate-800 bg-[#020617] text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white text-xs">
              OX
            </div>
            <span className="font-bold text-slate-300 text-sm">CloudOptiX</span>
            <span className="text-[11px] font-mono">© 2026 CloudOptiX Inc.</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => onOpenInfo('platform')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Architecture
            </button>
            <button
              onClick={onOpenPricing}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Pricing
            </button>
            <button
              onClick={() => onOpenInfo('resources')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Documentation
            </button>
            <button
              onClick={() => onOpenInfo('company')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Trust & Security
            </button>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>GLOBAL CLUSTER FLEET: ALL SYSTEMS OPERATIONAL</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
