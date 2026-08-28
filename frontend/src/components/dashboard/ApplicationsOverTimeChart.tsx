import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { AnalyticsData, MonthlyTrend } from '../../types';

interface ChartProps {
  data?: AnalyticsData | null;
}

type TimeframeOption = 'this_month' | 'last_3_months' | 'last_6_months' | 'last_12_months';

const TIMEFRAME_LABELS: Record<TimeframeOption, string> = {
  this_month: 'This Month',
  last_3_months: 'Last 3 Months',
  last_6_months: 'Last 6 Months',
  last_12_months: 'Last 12 Months',
};

export const ApplicationsOverTimeChart: React.FC<ChartProps> = ({ data }) => {
  const [timeframe, setTimeframe] = useState<TimeframeOption>('last_6_months');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generate fallback data if analytics is loading
  const getFallbackMonths = (count: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const result: MonthlyTrend[] = [];
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      result.push({
        month: months[d.getMonth()],
        count: 0,
        label: `${months[d.getMonth()]} ${d.getFullYear()}: 0 Applications`,
      });
    }
    return result;
  };

  const getFallbackWeeks = () => {
    return [
      { month: 'W1', count: 0, label: 'Week 1: 0 Applications' },
      { month: 'W2', count: 0, label: 'Week 2: 0 Applications' },
      { month: 'W3', count: 0, label: 'Week 3: 0 Applications' },
      { month: 'W4', count: 0, label: 'Week 4: 0 Applications' },
    ];
  };

  // Select points based on active timeframe
  const getActivePoints = (): MonthlyTrend[] => {
    if (!data) {
      if (timeframe === 'this_month') return getFallbackWeeks();
      if (timeframe === 'last_3_months') return getFallbackMonths(3);
      if (timeframe === 'last_12_months') return getFallbackMonths(12);
      return getFallbackMonths(6);
    }

    switch (timeframe) {
      case 'this_month':
        if (data.thisMonthTrends && data.thisMonthTrends.length > 0) {
          return data.thisMonthTrends;
        }
        return getFallbackWeeks();

      case 'last_3_months':
        if (data.last3MonthsTrends && data.last3MonthsTrends.length > 0) {
          return data.last3MonthsTrends;
        }
        if (data.applicationsOverTime && data.applicationsOverTime.length >= 3) {
          return data.applicationsOverTime.slice(data.applicationsOverTime.length - 3);
        }
        return getFallbackMonths(3);

      case 'last_12_months':
        if (data.last12MonthsTrends && data.last12MonthsTrends.length > 0) {
          return data.last12MonthsTrends;
        }
        return getFallbackMonths(12);

      case 'last_6_months':
      default:
        if (data.last6MonthsTrends && data.last6MonthsTrends.length > 0) {
          return data.last6MonthsTrends;
        }
        if (data.applicationsOverTime && data.applicationsOverTime.length > 0) {
          return data.applicationsOverTime;
        }
        return getFallbackMonths(6);
    }
  };

  const points = getActivePoints();
  const total = points.reduce((acc, p) => acc + p.count, 0);

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

  const areaPath = coords.length > 0
    ? `${linePath} L ${coords[coords.length - 1].x} ${paddingTop + chartHeight} L ${coords[0].x} ${paddingTop + chartHeight} Z`
    : '';

  const yTicks = [0, Math.round(maxVal * 0.25), Math.round(maxVal * 0.5), Math.round(maxVal * 0.75), maxVal];

  return (
    <div className="bg-[#101626] border border-[#1e2640] rounded-2xl p-5 flex flex-col justify-between shadow-sm relative overflow-visible">
      {/* Header with Interactive Dropdown */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-white tracking-tight">Applications Over Time</h3>

        {/* Timeframe Dropdown */}
        <div className="relative z-30" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#151c30] border border-slate-800 rounded-lg text-xs font-medium text-slate-300 cursor-pointer hover:border-slate-700 hover:text-white transition-all shadow-sm active:scale-95"
          >
            <span>{TIMEFRAME_LABELS[timeframe]}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-indigo-400' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-40 bg-[#141b2d] border border-[#222d48] rounded-xl shadow-2xl py-1 overflow-hidden backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
              {(Object.keys(TIMEFRAME_LABELS) as TimeframeOption[]).map((key) => {
                const isSelected = timeframe === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setTimeframe(key);
                      setIsDropdownOpen(false);
                      setHoveredIndex(null);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors ${
                      isSelected
                        ? 'text-indigo-400 bg-indigo-500/10 font-semibold'
                        : 'text-slate-300 hover:bg-[#1a233b] hover:text-white'
                    }`}
                  >
                    <span>{TIMEFRAME_LABELS[key]}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </button>
                );
              })}
            </div>
          )}
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
          {areaPath && <path d={areaPath} fill="url(#purpleGradient)" />}

          {/* Glowing Spline Line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#a78bfa"
              strokeWidth="3"
              strokeLinecap="round"
              filter="url(#glow)"
            />
          )}

          {/* Interactive Data Points */}
          {coords.map((pt, i) => {
            const isHovered = hoveredIndex === i;
            return (
              <g
                key={i}
                className="cursor-pointer transition-transform duration-200"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
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

        {/* Highlighted Tooltip */}
        {hoveredIndex !== null && coords[hoveredIndex] && (
          <div
            className="absolute pointer-events-none transition-all duration-200 z-20"
            style={{
              left: `${(coords[hoveredIndex].x / width) * 100}%`,
              top: `${(coords[hoveredIndex].y / height) * 100 - 32}%`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="bg-[#182035] border border-indigo-500/40 text-white px-3 py-1.5 rounded-xl shadow-xl flex flex-col items-center">
              <span className="text-[10px] text-slate-400 font-medium">
                {coords[hoveredIndex].label ? coords[hoveredIndex].label.split(':')[0] : coords[hoveredIndex].month}
              </span>
              <span className="text-xs font-bold text-indigo-200 whitespace-nowrap">
                {coords[hoveredIndex].count} {coords[hoveredIndex].count === 1 ? 'Application' : 'Applications'}
              </span>
              <div className="w-2 h-2 bg-[#182035] border-b border-r border-indigo-500/40 transform rotate-45 -mb-1 mt-0.5"></div>
            </div>
          </div>
        )}

        {/* Empty state message when total === 0 */}
        {total === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="px-3 py-1.5 rounded-xl bg-[#0e1424]/90 border border-slate-800 text-xs text-slate-400">
              No application activity recorded in this period.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
