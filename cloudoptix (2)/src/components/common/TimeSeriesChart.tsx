import React, { useState } from 'react';
import { TimeSeriesPoint } from '../../types';

interface TimeSeriesChartProps {
  data: TimeSeriesPoint[];
}

type MetricType = 'cpu' | 'memory' | 'cost' | 'workloads';
type TimeRange = '1h' | '6h' | '24h' | '7d';

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({ data }) => {
  const [metric, setMetric] = useState<MetricType>('cpu');
  const [range, setRange] = useState<TimeRange>('6h');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Extend data points dynamically if needed for range display
  const displayPoints = React.useMemo(() => {
    if (range === '1h') return data.slice(-3);
    if (range === '6h') return data;
    if (range === '24h') {
      return [
        { timestamp: 'Yesterday 10:00', awsCpu: 62, azureCpu: 44, gcpCpu: 28, awsMem: 55, azureMem: 48, gcpMem: 35, awsCost: 7.9, azureCost: 6.2, gcpCost: 5.5, totalWorkloads: 140 },
        { timestamp: 'Yesterday 18:00', awsCpu: 68, azureCpu: 48, gcpCpu: 31, awsMem: 59, azureMem: 50, gcpMem: 37, awsCost: 8.1, azureCost: 6.4, gcpCost: 5.6, totalWorkloads: 144 },
        ...data,
      ];
    }
    // 7d
    return [
      { timestamp: 'Day -6', awsCpu: 55, azureCpu: 40, gcpCpu: 26, awsMem: 50, azureMem: 45, gcpMem: 32, awsCost: 7.5, azureCost: 6.0, gcpCost: 5.3, totalWorkloads: 136 },
      { timestamp: 'Day -4', awsCpu: 64, azureCpu: 42, gcpCpu: 28, awsMem: 54, azureMem: 46, gcpMem: 34, awsCost: 7.8, azureCost: 6.2, gcpCost: 5.5, totalWorkloads: 142 },
      { timestamp: 'Day -2', awsCpu: 70, azureCpu: 45, gcpCpu: 30, awsMem: 58, azureMem: 48, gcpMem: 36, awsCost: 8.1, azureCost: 6.3, gcpCost: 5.6, totalWorkloads: 145 },
      ...data,
    ];
  }, [data, range]);

  const svgWidth = 800;
  const svgHeight = 240;
  const paddingX = 45;
  const paddingY = 25;

  const chartW = svgWidth - paddingX * 2;
  const chartH = svgHeight - paddingY * 2;

  const getValue = (p: TimeSeriesPoint, cloud: 'aws' | 'azure' | 'gcp') => {
    if (metric === 'cpu') return cloud === 'aws' ? p.awsCpu : cloud === 'azure' ? p.azureCpu : p.gcpCpu;
    if (metric === 'memory') return cloud === 'aws' ? p.awsMem : cloud === 'azure' ? p.azureMem : p.gcpMem;
    if (metric === 'cost') return cloud === 'aws' ? p.awsCost : cloud === 'azure' ? p.azureCost : p.gcpCost;
    const total = p.totalWorkloads;
    return cloud === 'aws' ? Math.round(total * 0.42) : cloud === 'azure' ? Math.round(total * 0.33) : Math.round(total * 0.25);
  };

  const maxY = metric === 'cost' ? 12 : metric === 'workloads' ? 100 : 100;
  const minY = 0;

  const getPointsPath = (cloud: 'aws' | 'azure' | 'gcp') => {
    return displayPoints
      .map((p, i) => {
        const x = paddingX + (i / Math.max(1, displayPoints.length - 1)) * chartW;
        const val = getValue(p, cloud);
        const y = paddingY + chartH - ((val - minY) / (maxY - minY)) * chartH;
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  const getAreaPath = (cloud: 'aws' | 'azure' | 'gcp') => {
    const line = getPointsPath(cloud);
    const lastX = paddingX + chartW;
    const firstX = paddingX;
    const bottomY = paddingY + chartH;
    return `${line} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  const activePoint = hoverIndex !== null && hoverIndex >= 0 && hoverIndex < displayPoints.length
    ? displayPoints[hoverIndex]
    : displayPoints[displayPoints.length - 1];

  return (
    <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
            Multi-Cloud Telemetry & Resource Trends
          </h3>
          <p className="text-xs text-slate-400">Continuous telemetry feed sampled across active cloud compute clusters</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Metric Selector */}
          <div className="flex items-center bg-[#020617] p-1 rounded-lg border border-slate-800">
            {(['cpu', 'memory', 'cost', 'workloads'] as MetricType[]).map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all uppercase cursor-pointer ${
                  metric === m
                    ? 'bg-indigo-950 text-indigo-300 border border-indigo-700/60 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {m === 'cpu' ? 'CPU %' : m === 'memory' ? 'RAM %' : m === 'cost' ? 'Cost $/hr' : 'Workloads'}
              </button>
            ))}
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center bg-[#020617] p-1 rounded-lg border border-slate-800">
            {(['1h', '6h', '24h', '7d'] as TimeRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-all cursor-pointer ${
                  range === r
                    ? 'bg-slate-800 text-slate-100 border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Legend & Current Hover Inspector */}
      <div className="flex flex-wrap items-center justify-between gap-4 my-3 text-xs">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50" />
            <span className="text-slate-300 font-medium">AWS</span>
            <span className="font-mono text-orange-400 font-bold">
              {getValue(activePoint, 'aws')}
              {metric === 'cpu' || metric === 'memory' ? '%' : metric === 'cost' ? ' $/hr' : ' pods'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
            <span className="text-slate-300 font-medium">Azure</span>
            <span className="font-mono text-blue-400 font-bold">
              {getValue(activePoint, 'azure')}
              {metric === 'cpu' || metric === 'memory' ? '%' : metric === 'cost' ? ' $/hr' : ' pods'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            <span className="text-slate-300 font-medium">Google Cloud</span>
            <span className="font-mono text-emerald-400 font-bold">
              {getValue(activePoint, 'gcp')}
              {metric === 'cpu' || metric === 'memory' ? '%' : metric === 'cost' ? ' $/hr' : ' pods'}
            </span>
          </div>
        </div>

        <div className="text-slate-400 font-mono text-[11px]">
          Sample: <span className="text-slate-200">{activePoint.timestamp}</span>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-56 select-none overflow-visible"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="awsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F97316" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#F97316" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="azureGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="gcpGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid Lines */}
          {[0, 25, 50, 75, 100].map((gridPercent) => {
            const y = paddingY + chartH - (gridPercent / 100) * chartH;
            const labelVal = metric === 'cost' ? `$${((gridPercent / 100) * 12).toFixed(1)}` : `${gridPercent}${metric === 'workloads' ? '' : '%'}`;
            return (
              <g key={gridPercent}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={paddingX + chartW}
                  y2={y}
                  stroke="#1E293B"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  fill="#64748B"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  {labelVal}
                </text>
              </g>
            );
          })}

          {/* Area Fills */}
          <path d={getAreaPath('aws')} fill="url(#awsGrad)" />
          <path d={getAreaPath('azure')} fill="url(#azureGrad)" />
          <path d={getAreaPath('gcp')} fill="url(#gcpGrad)" />

          {/* Lines */}
          <path d={getPointsPath('aws')} fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" />
          <path d={getPointsPath('azure')} fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
          <path d={getPointsPath('gcp')} fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />

          {/* Interactive Hover Vertical Column */}
          {displayPoints.map((p, i) => {
            const x = paddingX + (i / Math.max(1, displayPoints.length - 1)) * chartW;
            return (
              <g
                key={p.timestamp + i}
                onMouseEnter={() => setHoverIndex(i)}
                className="cursor-pointer"
              >
                <rect
                  x={x - chartW / (displayPoints.length * 2)}
                  y={paddingY}
                  width={chartW / displayPoints.length}
                  height={chartH}
                  fill="transparent"
                />
                {hoverIndex === i && (
                  <line
                    x1={x}
                    y1={paddingY}
                    x2={x}
                    y2={paddingY + chartH}
                    stroke="#6366F1"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                )}
                {/* Bottom X-axis label */}
                <text
                  x={x}
                  y={svgHeight - 4}
                  fill={hoverIndex === i ? '#E2E8F0' : '#64748B'}
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {p.timestamp}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
