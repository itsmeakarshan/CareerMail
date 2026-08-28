import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { AnalyticsData } from '../../types';

interface ChartProps {
  data?: AnalyticsData | null;
}

export const ApplicationsOverTimeChart: React.FC<ChartProps> = ({ data }) => {
  // Generate real default 6 months if data is not loaded yet
  const getDefaultMonths = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      result.push({
        month: months[d.getMonth()],
        count: 0,
        label: `${months[d.getMonth()]} ${d.getFullYear()}: 0 Applications`,
      });
    }
    return result;
  };

  const points = data?.applicationsOverTime && data.applicationsOverTime.length > 0
    ? data.applicationsOverTime
    : getDefaultMonths();

  const total = points.reduce((acc, p) => acc + p.count, 0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Chart dimensions
  const width = 520;
  const height = 210;
  const paddingLeft = 36;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  
  const peakCount = Math.max(...points.map((p) => p.count), 0);
  const maxVal = Math.max(10, Math.ceil((peakCount + 2) / 5) * 5);

  // Compute SVG coordinates for spline
  const coords = points.map((p, i) => {
    const x = paddingLeft + (i / Math.max(points.length - 1, 1)) * chartWidth;
    const y = paddingTop + chartHeight - (p.count / maxVal) * chartHeight;
    return { x, y, ...p };
  });

  // Generate smooth SVG cubic bezier path
  const linePath = coords.reduce((acc, pt, i, arr) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = arr[i - 1];
    const cp1x = prev.x + (pt.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (pt.x - prev.x) / 2;
    const cp2y = pt.y;
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${pt.x} ${pt.y}`;
  }, '');

  const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${paddingTop + chartHeight} L ${coords[0].x} ${paddingTop + chartHeight} Z`;

  const yTicks = [0, Math.round(maxVal * 0.25), Math.round(maxVal * 0.5), Math.round(maxVal * 0.75), maxVal];

  return (
    <div className="bg-[#101626] border border-[#1e2640] rounded-2xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-white tracking-tight">Applications Over Time</h3>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-[#151c30] border border-slate-800 rounded-lg text-xs font-medium text-slate-300 cursor-pointer hover:border-slate-700 transition-colors">
          <span>Last 6 Months</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full h-[220px] select-none">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#6366f1" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#8b5cf6" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* Grid lines and Y axis */}
          {yTicks.map((val) => {
            const y = paddingTop + chartHeight - (val / maxVal) * chartHeight;
            return (
              <g key={val}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#1c253d"
                  strokeDasharray={val === 0 ? '0' : '4 4'}
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 10}
                  y={y + 3.5}
                  textAnchor="end"
                  className="fill-slate-500 text-[10px] font-medium"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* X axis labels */}
          {coords.map((pt, i) => (
            <text
              key={i}
              x={pt.x}
              y={paddingTop + chartHeight + 18}
              textAnchor="middle"
              className="fill-slate-400 text-[11px] font-medium"
            >
              {pt.month}
            </text>
          ))}

          {/* Area Fill */}
          <path d={areaPath} fill="url(#purpleGradient)" />

          {/* Glowing Spline Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#a78bfa"
            strokeWidth="3"
            strokeLinecap="round"
            filter="url(#glow)"
          />

          {/* Interactive Data Points */}
          {coords.map((pt, i) => {
            const isHovered = hoveredIndex === i;
            return (
              <g
                key={i}
                className="cursor-pointer transition-transform duration-200"
                onMouseEnter={() => setHoveredIndex(i)}
              >
                {/* Hit area */}
                <circle cx={pt.x} cy={pt.y} r="16" fill="transparent" />

                {/* Outer halo */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 7 : 4}
                  fill="#c084fc"
                  fillOpacity={isHovered ? 0.35 : 0}
                  className="transition-all"
                />
                {/* Center dot */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 4.5 : 3.5}
                  fill="#ffffff"
                  stroke="#8b5cf6"
                  strokeWidth="2.5"
                />
              </g>
            );
          })}
        </svg>

        {/* Highlighted Tooltip (Mar 2025: 31 Applications) matching dashboard.png */}
        {hoveredIndex !== null && coords[hoveredIndex] && (
          <div
            className="absolute pointer-events-none transition-all duration-200"
            style={{
              left: `${(coords[hoveredIndex].x / width) * 100}%`,
              top: `${(coords[hoveredIndex].y / height) * 100 - 32}%`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="bg-[#182035] border border-indigo-500/40 text-white px-3 py-1.5 rounded-xl shadow-xl flex flex-col items-center">
              <span className="text-[10px] text-slate-400 font-medium">{coords[hoveredIndex].month} 2025</span>
              <span className="text-xs font-bold text-indigo-200 whitespace-nowrap">
                {coords[hoveredIndex].count} Applications
              </span>
              <div className="w-2 h-2 bg-[#182035] border-b border-r border-indigo-500/40 transform rotate-45 -mb-1 mt-0.5"></div>
            </div>
          </div>
        )}
        {/* Empty state message when total === 0 */}
        {total === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="px-3 py-1.5 rounded-xl bg-[#0e1424]/90 border border-slate-800 text-xs text-slate-400">
              No application activity recorded yet. Sync Gmail to populate trends.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
