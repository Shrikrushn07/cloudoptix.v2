import React, { useState } from 'react';
import {
  X,
  Check,
  Zap,
  Sparkles,
  ShieldCheck,
  TrendingDown,
  ArrowRight,
  HelpCircle,
  Percent,
  Sliders,
  DollarSign,
  Layers,
  Building2,
} from 'lucide-react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBookDemo: () => void;
  onOpenFreeTrial: () => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  onOpenBookDemo,
  onOpenFreeTrial,
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [cloudSpend, setCloudSpend] = useState<number>(65000);

  if (!isOpen) return null;

  // Real-time ROI calculations inspired by CAST AI savings-share model
  const projectedSavingsRate = 0.54; // 54% average multi-cloud waste reduction
  const grossSavingsMonthly = Math.round(cloudSpend * projectedSavingsRate);
  const annualGrossSavings = grossSavingsMonthly * 12;
  const cloudOptixFeeMonthly = Math.round(grossSavingsMonthly * 0.15); // 15% share of verified savings
  const netClientSavingsAnnual = (grossSavingsMonthly - cloudOptixFeeMonthly) * 12;

  const tiers = [
    {
      id: 'starter',
      name: 'Developer & Staging',
      tagline: 'Multi-cloud observability and heuristic rightsizing for pre-prod clusters',
      price: '$0',
      period: 'free forever',
      badge: 'COMMUNITY',
      badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
      ctaText: 'Deploy Free Agent',
      ctaStyle: 'bg-[#0b1120] hover:bg-slate-800 text-slate-200 border border-slate-700',
      action: () => {
        onClose();
        onOpenFreeTrial();
      },
      features: [
        'Up to 25 vCPU managed nodes',
        'Read-only multi-cloud discovery (AWS, Azure, GCP)',
        'Heuristic rightsizing recommendations',
        'Standard 15-minute telemetry interval',
        'Community Slack & docs support',
      ],
    },
    {
      id: 'pro',
      name: 'Growth & Scale',
      tagline: 'Autonomous rebalancing and proactive SLA defense for production microservices',
      price: billingCycle === 'annual' ? '$499' : '$599',
      period: 'per cluster / mo',
      badge: 'POPULAR',
      badgeColor: 'bg-indigo-950 text-indigo-300 border-indigo-700',
      ctaText: 'Start 14-Day Free Trial',
      ctaStyle: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30',
      action: () => {
        onClose();
        onOpenFreeTrial();
      },
      features: [
        'Up to 500 vCPU managed compute fleet',
        'Autonomous 8-step self-healing closed loop',
        'Sub-second telemetry & chaos resilience',
        'Deterministic SLA policy engine (POL-01 to POL-05)',
        'Zero-downtime cross-cloud live migrations',
        'SOC2 Type II compliance & audit logs',
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise Savings-Share',
      tagline: 'CAST AI-style zero-risk performance model: pay strictly from verified cloud savings',
      price: '15%',
      period: 'of verified net savings',
      badge: 'ZERO UPFRONT RISK',
      badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-700',
      ctaText: 'Book Architecture Demo',
      ctaStyle: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30',
      action: () => {
        onClose();
        onOpenBookDemo();
      },
      features: [
        'Unlimited vCPUs & multi-region clusters',
        'Guaranteed 50%+ cloud compute spend reduction',
        'Zero upfront software license fees',
        'Multi-cloud Spot arbitrage with 99.999% SLA insurance',
        'Custom IAM & sovereign air-gapped deployment',
        'Dedicated 24/7 SRE & Cloud Architect Pod',
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#020617] border border-slate-800 rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl relative my-8 animate-fade-in text-slate-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-950/70 border border-indigo-700/50 rounded-full text-xs font-mono text-indigo-300 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>TRANSPARENT VALUE-BASED MONETIZATION</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Predictable SaaS Pricing or Guaranteed Savings-Share
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Choose a fixed-tier plan or our proven enterprise model where we only get paid when we demonstrably cut your AWS, Azure, and Google Cloud bills.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="mt-6 inline-flex items-center p-1 bg-[#0b1120] border border-slate-800 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                billingCycle === 'annual'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Annual (Save 20%)</span>
              <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-800">
                2 MONTHS FREE
              </span>
            </button>
          </div>
        </div>

        {/* Interactive Savings Calculator Slider (CAST AI Benchmark) */}
        <div className="p-5 sm:p-6 bg-[#0b1120] border border-slate-800 rounded-2xl mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                  Enterprise ROI & Savings-Share Calculator
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Slide your organization's estimated monthly multi-cloud infrastructure spend:
              </p>
            </div>
            <div className="text-right">
              <span className="text-xl sm:text-2xl font-mono font-extrabold text-indigo-400">
                ${cloudSpend.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400 font-mono"> / month cloud bill</span>
            </div>
          </div>

          <input
            type="range"
            min="5000"
            max="300000"
            step="5000"
            value={cloudSpend}
            onChange={(e) => setCloudSpend(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-800/80 text-center">
            <div className="bg-[#020617] p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-mono">Projected Monthly Savings (54%)</span>
              <span className="text-lg font-bold font-mono text-emerald-400">
                +${grossSavingsMonthly.toLocaleString()} / mo
              </span>
            </div>
            <div className="bg-[#020617] p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-mono">Net Client Annual Windfall</span>
              <span className="text-lg font-bold font-mono text-emerald-300">
                +${netClientSavingsAnnual.toLocaleString()} / yr
              </span>
            </div>
            <div className="bg-[#020617] p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-mono">CloudOptiX 15% Success Share</span>
              <span className="text-lg font-bold font-mono text-indigo-400">
                ${cloudOptixFeeMonthly.toLocaleString()} / mo
              </span>
            </div>
          </div>
        </div>

        {/* Pricing Tiers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`p-6 rounded-2xl border flex flex-col justify-between transition-all ${
                tier.id === 'enterprise'
                  ? 'bg-gradient-to-b from-[#0b1120] to-emerald-950/20 border-emerald-500/40 ring-1 ring-emerald-500/20 shadow-xl'
                  : tier.id === 'pro'
                  ? 'bg-gradient-to-b from-[#0b1120] to-indigo-950/20 border-indigo-500/40 ring-1 ring-indigo-500/20 shadow-xl'
                  : 'bg-[#0b1120] border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${tier.badgeColor}`}>
                    {tier.badge}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white">{tier.name}</h3>
                <p className="text-xs text-slate-400 mt-1 min-h-[36px]">{tier.tagline}</p>

                <div className="my-5 pb-5 border-b border-slate-800">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold font-mono text-white">{tier.price}</span>
                    <span className="text-xs text-slate-400 font-mono">{tier.period}</span>
                  </div>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-300">
                  {tier.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-4">
                <button
                  onClick={tier.action}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${tier.ctaStyle}`}
                >
                  <span>{tier.ctaText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Enterprise Trust Footer */}
        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> SOC2 Type II Certified
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <Check className="w-4 h-4 text-emerald-400" /> Read-Only Cluster IAM Option
            </span>
          </div>
          <p className="text-[11px] font-mono text-slate-500">
            Guaranteed SLA: 99.999% multi-cloud failover availability
          </p>
        </div>
      </div>
    </div>
  );
};
