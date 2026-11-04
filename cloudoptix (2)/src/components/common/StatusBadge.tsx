import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', showDot = true }) => {
  const normalized = status.toUpperCase();

  let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';
  let dotClass = 'bg-slate-400';

  if (normalized === 'OPTIMAL' || normalized === 'HEALTHY' || normalized === 'RUNNING' || normalized === 'SUCCESS' || normalized === 'COMPLETED') {
    colorClasses = 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30';
    dotClass = 'bg-emerald-400';
  } else if (normalized === 'WARNING' || normalized === 'PENDING' || normalized === 'OPTIMIZING' || normalized === 'MEDIUM' || normalized === 'MIGRATE') {
    colorClasses = 'bg-amber-950/60 text-amber-400 border-amber-500/30';
    dotClass = 'bg-amber-400 animate-pulse';
  } else if (normalized === 'CRITICAL' || normalized === 'FAILED' || normalized === 'HIGH' || normalized === 'SLA_RISK') {
    colorClasses = 'bg-rose-950/60 text-rose-400 border-rose-500/30';
    dotClass = 'bg-rose-400 animate-ping';
  } else if (normalized === 'MIGRATING' || normalized === 'IN_PROGRESS') {
    colorClasses = 'bg-sky-950/60 text-sky-400 border-sky-500/30';
    dotClass = 'bg-sky-400 animate-pulse';
  } else if (normalized === 'AUTONOMOUSLY_APPROVED') {
    colorClasses = 'bg-purple-950/60 text-purple-300 border-purple-500/30';
    dotClass = 'bg-purple-400';
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md border tracking-wide uppercase ${colorClasses} ${sizeClasses}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />}
      <span className="truncate">{status}</span>
    </span>
  );
};
