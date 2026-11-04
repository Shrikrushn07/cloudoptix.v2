import React, { useState } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import {
  FileText,
  Download,
  CheckCircle2,
  Share2,
  Calendar,
  Layers,
  Sparkles,
  TrendingDown,
  ShieldCheck,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { workloads, clouds, totalMonthlyCost, totalPotentialSavings, systemSlaHealth, actions } = useSimulation();
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleExportJson = () => {
    const reportData = {
      timestamp: new Date().toISOString(),
      reportType: 'CloudOptiX Enterprise Multi-Cloud Executive Audit',
      summary: {
        totalWorkloads: workloads.length,
        monthlyRunRateUsd: totalMonthlyCost,
        identifiedSavingsUsd: totalPotentialSavings + 3840,
        systemSlaHealth: `${systemSlaHealth}%`,
        autonomousActionsCount: actions.length,
      },
      cloudProviders: clouds,
      workloadsInventory: workloads,
      recentActions: actions,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cloudoptix-audit-report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Executive Intelligence Reports</h1>
            <span className="text-xs font-mono font-bold bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700">
              Audit Ready
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated multi-cloud FinOps summaries, SLA compliance certifications, and architecture scorecards
          </p>
        </div>

        <button
          onClick={handleExportJson}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export Full JSON Report</span>
        </button>
      </div>

      {/* Download Alert */}
      {downloadSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in shadow-lg shadow-emerald-950/40">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Executive audit payload downloaded successfully!</span>
        </div>
      )}

      {/* Pre-generated Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <FileText className="w-5 h-5 text-purple-400" />
              <span className="text-xs font-mono font-bold text-purple-300 uppercase">Monthly FinOps</span>
            </div>
            <h3 className="font-bold text-base text-slate-100">Multi-Cloud Cost Arbitrage & Waste Audit</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Complete breakdown of monthly infrastructure expenditure across AWS, Azure, and GCP, highlighting $3,840/mo in realized and identified savings.
            </p>
          </div>
          <button
            onClick={handleExportJson}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Download Report (PDF/JSON)
          </button>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-mono font-bold text-emerald-300 uppercase">SLA & Reliability</span>
            </div>
            <h3 className="font-bold text-base text-slate-100">90-Day SLA & Tail Latency Certification</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Cryptographic audit logs demonstrating 99.94% composite uptime, zero SLA violations, and sub-40ms P95 latency across all production microservices.
            </p>
          </div>
          <button
            onClick={handleExportJson}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Download Report (PDF/JSON)
          </button>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <Sparkles className="w-5 h-5 text-sky-400" />
              <span className="text-xs font-mono font-bold text-sky-300 uppercase">Sustainability</span>
            </div>
            <h3 className="font-bold text-base text-slate-100">Green Compute & Carbon Footprint Scorecard</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Quantified carbon emissions tracking showing a 18.2% reduction in greenhouse gas emissions through intelligent routing to low-carbon regions.
            </p>
          </div>
          <button
            onClick={handleExportJson}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Download Report (PDF/JSON)
          </button>
        </div>
      </div>
    </div>
  );
};
