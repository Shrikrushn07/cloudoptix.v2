import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  id?: string;
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  isPositiveChange?: boolean;
  tag?: string;
  icon?: LucideIcon;
  accentColor?: 'indigo' | 'purple' | 'blue' | 'emerald' | 'amber' | 'rose' | 'sky';
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  id,
  title,
  value,
  subtitle,
  change,
  isPositiveChange = true,
  tag,
  icon: Icon,
  accentColor = 'blue',
  onClick,
}) => {
  const isIndigo = accentColor === 'indigo' || accentColor === 'purple' || tag === 'AI Identified' || tag === 'AI OPTIMIZED';

  return (
    <div
      id={id}
      onClick={onClick}
      className={`relative bg-[#10172a] hover:bg-[#131d35] border border-slate-800 rounded-xl p-4 shadow-xl transition-all duration-200 ${
        isIndigo ? 'border-l-2 border-l-indigo-500' : ''
      } ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div
          className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
            isIndigo ? 'text-indigo-400/90' : 'text-slate-500'
          }`}
        >
          {title}
        </div>
        {Icon && (
          <div className="p-1 rounded-md text-slate-500 hover:text-slate-400">
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mt-1">
        <div
          className={`text-2xl font-bold tracking-tight ${
            isIndigo
              ? 'text-indigo-100'
              : title.toLowerCase().includes('sla')
              ? 'text-emerald-400'
              : 'text-white'
          }`}
        >
          {value}
        </div>

        {tag && (
          <div className="text-[10px] bg-indigo-500/20 px-1.5 py-0.5 rounded text-indigo-300 font-mono font-bold tracking-tight">
            {tag}
          </div>
        )}

        {change && !tag && (
          <div
            className={`text-[11px] font-medium font-sans ${
              isPositiveChange ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {change}
          </div>
        )}
      </div>

      {(subtitle || (change && tag)) && (
        <div className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between">
          <span className="truncate">{subtitle || change}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
        </div>
      )}
    </div>
  );
};
