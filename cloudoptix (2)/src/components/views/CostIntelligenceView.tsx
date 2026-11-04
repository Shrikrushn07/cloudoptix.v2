import React from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { MetricCard } from '../common/MetricCard';
import {
  DollarSign,
  TrendingDown,
  AlertTriangle,
  Sparkles,
  PieChart,
  Server,
  ArrowRight,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  Building,
} from 'lucide-react';

export const CostIntelligenceView: React.FC = () => {
  const { clouds, workloads, totalMonthlyCost, totalPotentialSavings, migrateWorkload, currentUser } = useSimulation();

  const awsCostMonthly = Math.round(clouds.aws.costPerHour * 24 * 30);
  const azureCostMonthly = Math.round(clouds.azure.costPerHour * 24 * 30);
  const gcpCostMonthly = Math.round(clouds.gcp.costPerHour * 24 * 30);
  const totalCost = awsCostMonthly + azureCostMonthly + gcpCostMonthly;

  const awsShare = Math.round((awsCostMonthly / totalCost) * 100);
  const azureShare = Math.round((azureCostMonthly / totalCost) * 100);
  const gcpShare = Math.round((gcpCostMonthly / totalCost) * 100);

  const finOpsAnomalies = [
    {
      id: 'ANOM-1',
      severity: 'HIGH',
      title: 'AWS Inter-Region Data Egress Spike',
      description: 'Egress bandwidth between us-east-1 and eu-west-1 exceeded normal baseline by 28% (+$420/mo projected).',
      recommendation: 'Enable CloudOptiX Direct Route Caching on Azure/Cloudflare edge.',
      potentialSavings: '$420 / mo',
      actionLabel: 'Apply Route Cache',
    },
    {
      id: 'ANOM-2',
      severity: 'MEDIUM',
      title: 'Over-Provisioned CPU on FinOps Batch Aggregator',
      description: 'Nightly Batch Job utilizes only 18% of 48 vCPU allocation on GCP.',
      recommendation: 'Autonomous rightsize from 48 cores down to 24 cores.',
      potentialSavings: '$324 / mo',
      actionLabel: 'Apply Rightsize',
    },
    {
      id: 'ANOM-3',
      severity: 'LOW',
      title: 'Spot Instance Arbitrage Opportunity',
      description: 'GCP Spot N2-standard rates are currently 26% lower than AWS EC2 On-Demand for video encoding jobs.',
      recommendation: 'Migrate Realtime Video Transcoder (WL-108) to GCP Spot.',
      potentialSavings: '$412 / mo',
      actionLabel: 'Execute Migration',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">FinOps & Cost Intelligence</h1>
            <span className="text-xs font-mono font-bold bg-emerald-950/60 text-emerald-300 px-2.5 py-1 rounded-md border border-emerald-800/40">
              REAL-TIME ARBITRAGE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Autonomous multi-cloud cost arbitrage, waste detection, spot instance optimization, and rightsizing engine
          </p>
        </div>

        {/* User Context */}
        <div className="flex items-center gap-2 p-2 px-3 bg-[#0b1120] border border-slate-800 rounded-xl text-xs">
          <Building className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-slate-400">Auditing as:</span>
          <strong className="text-slate-200">{currentUser.name}</strong>
          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${currentUser.badgeColor}`}>
            {currentUser.roleTitle}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Monthly Run Rate"
          value={`$${totalMonthlyCost.toLocaleString()}`}
          change="-8.2% vs last billing cycle"
          isPositiveChange={true}
          icon={DollarSign}
          accentColor="blue"
        />
        <MetricCard
          title="Identified Potential Savings"
          value={`$${(totalPotentialSavings + 3840).toLocaleString()} / mo`}
          tag="AI Identified"
          icon={TrendingDown}
          accentColor="emerald"
        />
        <MetricCard
          title="Cost Efficiency Score"
          value="94.6 / 100"
          subtitle="Top decile multi-cloud utilization"
          icon={Sparkles}
          accentColor="purple"
        />
        <MetricCard
          title="Active Waste Alerts"
          value="3 Detected"
          subtitle="3 actionable FinOps anomalies"
          icon={AlertTriangle}
          accentColor="amber"
        />
      </div>

      {/* Cloud Breakdown & Spend Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Multi-Cloud Cost Share Breakdown (7 cols) */}
        <div className="lg:col-span-7 bg-[#0b1120] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wide">
                Multi-Cloud Expenditure Breakdown
              </h3>
              <p className="text-xs text-slate-400">Monthly normalized spend by provider</p>
            </div>
            <span className="text-xs font-mono text-slate-400 font-bold">Total: ${totalCost.toLocaleString()} / mo</span>
          </div>

          {/* Stacked Percentage Bar */}
          <div className="space-y-2">
            <div className="w-full h-4 rounded-full overflow-hidden flex bg-[#020617] border border-slate-800">
              <div
                style={{ width: `${awsShare}%` }}
                className="bg-[#FF9900] hover:opacity-90 transition-all"
                title={`AWS: ${awsShare}%`}
              />
              <div
                style={{ width: `${azureShare}%` }}
                className="bg-[#0089D6] hover:opacity-90 transition-all"
                title={`Azure: ${azureShare}%`}
              />
              <div
                style={{ width: `${gcpShare}%` }}
                className="bg-[#4285F4] hover:opacity-90 transition-all"
                title={`GCP: ${gcpShare}%`}
              />
            </div>

            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#FF9900]" /> AWS: {awsShare}%
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#0089D6]" /> Azure: {azureShare}%
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#4285F4]" /> GCP: {gcpShare}%
              </span>
            </div>
          </div>

          {/* Provider Detail Rows */}
          <div className="space-y-3 pt-2">
            <div className="p-3.5 bg-[#020617] rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FF9900]/10 border border-[#FF9900]/30 text-[#FF9900] font-bold text-xs flex items-center justify-center">
                  AWS
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-200">Amazon Web Services</h4>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {clouds.aws.workloadCount} Workloads • ${clouds.aws.costPerHour.toFixed(2)}/hr
                  </span>
                </div>
              </div>
              <span className="font-mono font-bold text-slate-100 text-sm">${awsCostMonthly.toLocaleString()} / mo</span>
            </div>

            <div className="p-3.5 bg-[#020617] rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#0089D6]/10 border border-[#0089D6]/30 text-[#0089D6] font-bold text-xs flex items-center justify-center">
                  AZ
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-200">Microsoft Azure</h4>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {clouds.azure.workloadCount} Workloads • ${clouds.azure.costPerHour.toFixed(2)}/hr
                  </span>
                </div>
              </div>
              <span className="font-mono font-bold text-slate-100 text-sm">${azureCostMonthly.toLocaleString()} / mo</span>
            </div>

            <div className="p-3.5 bg-[#020617] rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#4285F4]/10 border border-[#4285F4]/30 text-[#4285F4] font-bold text-xs flex items-center justify-center">
                  GCP
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-200">Google Cloud Platform</h4>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {clouds.gcp.workloadCount} Workloads • ${clouds.gcp.costPerHour.toFixed(2)}/hr
                  </span>
                </div>
              </div>
              <span className="font-mono font-bold text-slate-100 text-sm">${gcpCostMonthly.toLocaleString()} / mo</span>
            </div>
          </div>
        </div>

        {/* AI Waste & Anomaly Detection (5 cols) */}
        <div className="lg:col-span-5 bg-[#0b1120] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wide">
                AI Waste & Rightsizing Radar
              </h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/40">
              3 Opportunities
            </span>
          </div>

          <div className="space-y-3">
            {finOpsAnomalies.map((anom) => (
              <div key={anom.id} className="p-3.5 bg-[#020617] rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">{anom.title}</span>
                  <span className="font-mono font-bold text-emerald-400">{anom.potentialSavings}</span>
                </div>
                <p className="text-[11px] text-slate-400">{anom.description}</p>
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-[10px] font-mono text-indigo-400">{anom.recommendation}</span>
                  <button
                    onClick={() => migrateWorkload('WL-108', 'gcp', anom.title)}
                    className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/40 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer"
                  >
                    {anom.actionLabel}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
