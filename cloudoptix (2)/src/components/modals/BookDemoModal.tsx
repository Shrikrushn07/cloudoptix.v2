import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  Building2,
  Mail,
  User,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Zap,
  ArrowRight,
  Server,
} from 'lucide-react';

interface BookDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BookDemoModal: React.FC<BookDemoModalProps> = ({ isOpen, onClose }) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: 'Alex Vance',
    email: 'alex.vance@enterprise-corp.com',
    company: 'Enterprise Financial Technologies',
    spendRange: '$50,000 - $200,000 / mo',
    clouds: ['AWS', 'Azure', 'Google Cloud'],
    focusArea: 'Autonomous Self-Healing & Closed Loop Rebalancing',
    preferredDate: '2026-08-25',
    preferredTime: '10:00 AM PST',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  const handleReset = () => {
    setIsSubmitted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#020617] border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative my-8 animate-fade-in text-slate-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {!isSubmitted ? (
          <div>
            {/* Header */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-950/70 border border-indigo-700/50 rounded-full text-xs font-mono text-indigo-300 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>30-MINUTE ARCHITECTURE DEEP DIVE</span>
              </div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                Schedule a CloudOptiX Enterprise Demo
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                See live autonomous failover, multi-cloud Pareto optimization, and cost savings on your specific infrastructure topology.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase font-bold mb-1">
                    Your Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-[#0b1120] border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase font-bold mb-1">
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-[#0b1120] border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase font-bold mb-1">
                    Company Name
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full bg-[#0b1120] border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase font-bold mb-1">
                    Monthly Cloud Spend
                  </label>
                  <select
                    value={formData.spendRange}
                    onChange={(e) => setFormData({ ...formData, spendRange: e.target.value })}
                    className="w-full bg-[#0b1120] border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                  >
                    <option>$10,000 - $50,000 / mo</option>
                    <option>$50,000 - $200,000 / mo</option>
                    <option>$200,000 - $1,000,000 / mo</option>
                    <option>$1,000,000+ / mo (Enterprise Fleet)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase font-bold mb-1">
                  Primary Evaluation Focus
                </label>
                <select
                  value={formData.focusArea}
                  onChange={(e) => setFormData({ ...formData, focusArea: e.target.value })}
                  className="w-full bg-[#0b1120] border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                >
                  <option>Autonomous Self-Healing & Closed Loop Rebalancing</option>
                  <option>Multi-Cloud Cost Arbitrage & Waste Elimination</option>
                  <option>Tail-Latency SLA Defense & Chaos Resilience</option>
                  <option>Zero-Downtime Live Container Migration Proof-of-Concept</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase font-bold mb-1">
                    Preferred Date
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      value={formData.preferredDate}
                      onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                      className="w-full bg-[#0b1120] border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase font-bold mb-1">
                    Preferred Time (PST)
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={formData.preferredTime}
                      onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                      className="w-full bg-[#0b1120] border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none"
                    >
                      <option>09:00 AM PST</option>
                      <option>10:00 AM PST</option>
                      <option>11:30 AM PST</option>
                      <option>01:00 PM PST</option>
                      <option>02:30 PM PST</option>
                      <option>04:00 PM PST</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>Confirm Live Demo Session</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Confirmation Success View */
          <div className="text-center py-4 space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider font-bold">
                DEMO RESERVATION CONFIRMED
              </span>
              <h3 className="text-xl font-bold text-white mt-1">
                We're Ready for Your Architecture Session
              </h3>
              <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
                A calendar invitation and custom multi-cloud simulation workbook have been sent to{' '}
                <strong className="text-slate-200">{formData.email}</strong>.
              </p>
            </div>

            {/* Session Card */}
            <div className="p-4 bg-[#0b1120] border border-slate-800 rounded-2xl text-left space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Scheduled Time:</span>
                <span className="font-mono font-bold text-indigo-300">
                  {formData.preferredDate} @ {formData.preferredTime}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Primary Focus:</span>
                <span className="text-slate-200 font-medium">{formData.focusArea}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Cloud Architect:</span>
                <span className="text-emerald-400 font-bold">Dr. Maya Lin (Principal SRE)</span>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Return to Control Plane
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
