import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, TrendingUp, Calendar } from 'lucide-react';
import { AnalyticsData, MonthlyTrend, JobApplication } from '../../types';

interface ChartProps {
  data?: AnalyticsData | null;
  applications?: JobApplication[];
}

type TimeframeOption =
  | 'last_30_days'
  | 'this_month_daily'
  | 'last_3_months'
  | 'last_6_months'
  | 'last_14_days'
  | 'last_7_days';

const TIMEFRAME_LABELS: Record<TimeframeOption, string> = {
  last_30_days: 'Last 30 Days (Daily)',
  this_month_daily: 'This Month (Daily)',
  last_3_months: 'Last 3 Months',
  last_6_months: 'Last 6 Months',
  last_14_days: 'Last 14 Days',
  last_7_days: 'Last 7 Days',
};

const normalizeDate = (d?: string | null): string => {
  if (!d) return '';
  return d.split('T')[0].trim().substring(0, 10);
};

export const ApplicationsOverTimeChart: React.FC<ChartProps> = ({ data, applications = [] }) => {
  // Default to Last 30 Days for a complete rolling trend regardless of calendar day
  const [timeframe, setTimeframe] = useState<TimeframeOption>('last_30_days');
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

  // Compute points directly from real application records with backend fallback
  const points = useMemo<MonthlyTrend[]>(() => {
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // If applications array is available, calculate directly from live applications
    if (applications && applications.length > 0) {
      if (timeframe === 'last_30_days') {
        const result: MonthlyTrend[] = [];
        for (let i = 29; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const dayStr = String(d.getDate()).padStart(2, '0');
          const dateFormatted = `${y}-${m}-${dayStr}`;
          const monthShort = months[d.getMonth()];

          const count = applications.filter((app) => normalizeDate(app.dateApplied) === dateFormatted).length;

          result.push({
            month: `${monthShort} ${d.getDate()}`,
            count,
            label: `${monthShort} ${d.getDate()}, ${y}: ${count} Application${count === 1 ? '' : 's'}`,
          });
        }
        return result;
      }

      if (timeframe === 'this_month_daily') {
        const result: MonthlyTrend[] = [];
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const todayDay = now.getDate();
        const monthShort = months[currentMonth];
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        // Render all days of the current month on the calendar scale
        for (let day = 1; day <= daysInMonth; day++) {
          const dayStr = String(day).padStart(2, '0');
          const monthStr = String(currentMonth + 1).padStart(2, '0');
          const dateFormatted = `${currentYear}-${monthStr}-${dayStr}`;

          const isFuture = day > todayDay;
          const count = isFuture
            ? 0
            : applications.filter((app) => normalizeDate(app.dateApplied) === dateFormatted).length;

          result.push({
            month: String(day),
            count,
            label: isFuture
              ? `${monthShort} ${day} (Upcoming)`
              : `${monthShort} ${day}${day === todayDay ? ' (Today)' : ''}: ${count} Application${count === 1 ? '' : 's'}`,
          });
        }
        return result;
      }

      if (timeframe === 'last_3_months') {
        const result: MonthlyTrend[] = [];
        for (let i = 2; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const y = d.getFullYear();
          const m = d.getMonth();
          const monthShort = months[m];

          const count = applications.filter((app) => {
            if (!app.dateApplied) return false;
            const norm = normalizeDate(app.dateApplied);
            const [appY, appM] = norm.split('-').map(Number);
            return appY === y && appM === m + 1;
          }).length;

          result.push({
            month: monthShort,
            count,
            label: `${monthShort} ${y}: ${count} Application${count === 1 ? '' : 's'}`,
          });
        }
        return result;
      }

      if (timeframe === 'last_6_months') {
        const result: MonthlyTrend[] = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const y = d.getFullYear();
          const m = d.getMonth();
          const monthShort = months[m];

          const count = applications.filter((app) => {
            if (!app.dateApplied) return false;
            const norm = normalizeDate(app.dateApplied);
            const [appY, appM] = norm.split('-').map(Number);
            return appY === y && appM === m + 1;
          }).length;

          result.push({
            month: monthShort,
            count,
            label: `${monthShort} ${y}: ${count} Application${count === 1 ? '' : 's'}`,
          });
        }
        return result;
      }

      if (timeframe === 'last_14_days') {
        const result: MonthlyTrend[] = [];
        for (let i = 13; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const dayStr = String(d.getDate()).padStart(2, '0');
          const dateFormatted = `${y}-${m}-${dayStr}`;
          const monthShort = months[d.getMonth()];

          const count = applications.filter((app) => normalizeDate(app.dateApplied) === dateFormatted).length;

          result.push({
            month: `${d.getMonth() + 1}/${d.getDate()}`,
            count,
            label: `${monthShort} ${d.getDate()}: ${count} Application${count === 1 ? '' : 's'}`,
          });
        }
        return result;
      }

      if (timeframe === 'last_7_days') {
        const result: MonthlyTrend[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const dayStr = String(d.getDate()).padStart(2, '0');
          const dateFormatted = `${y}-${m}-${dayStr}`;
          const monthShort = months[d.getMonth()];
          const dayName = daysOfWeek[d.getDay()];

          const count = applications.filter((app) => normalizeDate(app.dateApplied) === dateFormatted).length;

          result.push({
            month: dayName,
            count,
            label: `${dayName}, ${monthShort} ${d.getDate()}: ${count} Application${count === 1 ? '' : 's'}`,
          });
        }
        return result;
      }
    }

    // Backend Analytics Response fallback
    if (data) {
      if (timeframe === 'last_30_days' && data.dailyTrendsLast30Days && data.dailyTrendsLast30Days.length > 0) {
        return data.dailyTrendsLast30Days;
      }
      if (timeframe === 'this_month_daily' && data.thisMonthTrends && data.thisMonthTrends.length > 0) {
        return data.thisMonthTrends;
      }
      if (timeframe === 'last_3_months' && data.last3MonthsTrends && data.last3MonthsTrends.length > 0) {
        return data.last3MonthsTrends;
      }
      if (timeframe === 'last_6_months' && data.last6MonthsTrends && data.last6MonthsTrends.length > 0) {
        return data.last6MonthsTrends;
      }
      if (timeframe === 'last_14_days' && data.dailyTrendsLast14Days && data.dailyTrendsLast14Days.length > 0) {
        return data.dailyTrendsLast14Days;
      }
      if (timeframe === 'last_7_days' && data.dailyTrendsLast7Days && data.dailyTrendsLast7Days.length > 0) {
        return data.dailyTrendsLast7Days;
      }
    }

    // Default 30-day baseline fallback
    const fallback: MonthlyTrend[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const mShort = months[d.getMonth()];
      fallback.push({
        month: `${mShort} ${d.getDate()}`,
        count: 0,
        label: `${mShort} ${d.getDate()}: 0 Applications`,
      });
    }
    return fallback;
  }, [data, applications, timeframe]);

  // For this_month_daily, only count up to today for footer metrics
  const todayDay = new Date().getDate();
  const countablePoints = useMemo(() => {
    if (timeframe === 'this_month_daily') {
      return points.slice(0, todayDay);
    }
    return points;
  }, [points, timeframe, todayDay]);

  const peakCount = Math.max(...countablePoints.map((p) => p.count), 0);
  // Add 25% headroom so the peak point never slams against the top border/gridline
  const targetMax = Math.max(Math.ceil((peakCount * 1.25) / 5) * 5, 5);
  const maxVal = targetMax;
  const total = countablePoints.reduce((acc, curr) => acc + curr.count, 0);
  const peakPoint = countablePoints.reduce(
    (max, p) => (p.count > max.count ? p : max),
    countablePoints[0] || { month: '', count: 0, label: '' }
  );

  // SVG Chart Geometry
  const width = 540;
  const height = 195;
  const paddingLeft = 38;
  const paddingRight = 28;
  const paddingTop = 28;
  const paddingBottom = 32;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const bottomY = paddingTop + chartHeight;

  // Calculate coordinates across the full timeframe scale
  const coords = useMemo(() => {
    return points.map((p, i) => {
      const x = paddingLeft + (i / (points.length - 1 || 1)) * chartWidth;
      const y = paddingTop + chartHeight - (p.count / maxVal) * chartHeight;
      return { x, y, count: p.count, month: p.month, label: p.label };
    });
  }, [points, chartWidth, chartHeight, maxVal, paddingLeft, paddingTop]);

  // For "this_month_daily", draw line and area only up to today (the active month progress)
  const activeCoords = useMemo(() => {
    if (timeframe === 'this_month_daily') {
      return coords.slice(0, todayDay);
    }
    return coords;
  }, [coords, timeframe, todayDay]);

  // Clamped Monotonic Cubic Spline (prevents negative overshoot and dipping below axis)
  const generateClampedSmoothPath = (pts: { x: number; y: number; count: number }[]) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;

      // If both points are 0, flat straight line on bottom axis
      if (p1.count === 0 && p2.count === 0) {
        path += ` L ${p2.x} ${bottomY}`;
        continue;
      }

      // Calculate slopes
      let cp1x = p1.x + (p2.x - p0.x) / 6;
      let cp1y = p1.y + (p2.y - p0.y) / 6;
      let cp2x = p2.x - (p3.x - p1.x) / 6;
      let cp2y = p2.y - (p3.y - p1.y) / 6;

      // Strictly clamp control points so curve never dips below bottom axis or above chart top
      cp1y = Math.min(bottomY, Math.max(paddingTop, cp1y));
      cp2y = Math.min(bottomY, Math.max(paddingTop, cp2y));

      // Monotonic smoothing: clamp between p1.y and p2.y if monotonic
      if (p1.y >= p2.y) {
        // Going up
        cp1y = Math.min(bottomY, Math.max(p2.y, cp1y));
        cp2y = Math.min(bottomY, Math.max(p2.y, cp2y));
      } else {
        // Going down
        cp1y = Math.max(paddingTop, Math.min(p2.y, cp1y));
        cp2y = Math.max(paddingTop, Math.min(p2.y, cp2y));
      }

      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return path;
  };

  const linePath = generateClampedSmoothPath(activeCoords);
  const areaPath = activeCoords.length > 1
    ? `${linePath} L ${activeCoords[activeCoords.length - 1].x} ${bottomY} L ${activeCoords[0].x} ${bottomY} Z`
    : '';

  // Y-axis grid ticks
  const yTicks = [0, Math.ceil(maxVal / 2), maxVal];

  // X-axis label decimation for readability
  const shouldShowLabel = (idx: number, totalPts: number) => {
    if (totalPts <= 7) return true;
    if (totalPts <= 14) return idx % 2 === 0 || idx === totalPts - 1;
    if (totalPts <= 31) {
      // For ~30 days, display 1st, 5th, 10th, 15th, 20th, 25th, and last
      return idx === 0 || (idx + 1) % 5 === 0 || idx === totalPts - 1;
    }
    return idx % 4 === 0 || idx === totalPts - 1;
  };

  return (
    <div className="bg-white dark:bg-[#16181f] border border-[#e0e2e7] dark:border-[#282a2d] rounded-3xl p-5 md:p-6 shadow-sm flex flex-col justify-between h-[360px] w-full transition-all duration-300 hover:shadow-md hover:border-pink-300 dark:hover:border-pink-800/60 overflow-hidden group">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-pink-100 dark:bg-pink-950/80 border border-pink-200 dark:border-pink-800/40 flex items-center justify-center text-pink-600 dark:text-pink-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1f1f1f] dark:text-white tracking-tight flex items-center gap-1.5">
              <span>Applications Over Time</span>
            </h3>
            <p className="text-xs text-[#5f6368] dark:text-slate-400">
              Real application volume • {TIMEFRAME_LABELS[timeframe]}
            </p>
          </div>
        </div>

        {/* Timeframe Dropdown */}
        <div className="relative z-30" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f0f4f9] dark:bg-[#1e1f20] border border-[#dadce0] dark:border-slate-800 rounded-xl text-xs font-semibold text-[#444746] dark:text-slate-200 cursor-pointer hover:border-pink-300 dark:hover:border-pink-700/60 hover:text-pink-600 dark:hover:text-pink-300 transition-all shadow-sm active:scale-95"
          >
            <Calendar className="w-3.5 h-3.5 text-pink-500" />
            <span>{TIMEFRAME_LABELS[timeframe]}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180 text-pink-500' : ''
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-48 bg-white dark:bg-[#1e1f20] border border-[#e0e2e7] dark:border-[#282a2d] rounded-2xl shadow-2xl py-1.5 overflow-hidden animate-popIn">
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
                    className={`w-full flex items-center justify-between px-3.5 py-2 text-xs font-medium transition-colors ${
                      isSelected
                        ? 'text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/60 font-bold'
                        : 'text-[#444746] dark:text-slate-300 hover:bg-[#f0f4f9] dark:hover:bg-[#282a2d] hover:text-black dark:hover:text-white'
                    }`}
                  >
                    <span>{TIMEFRAME_LABELS[key]}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-pink-500" />}
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
            <linearGradient id="pinkSplineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f472b6" stopOpacity="0.45" />
              <stop offset="55%" stopColor="#fb7185" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#fb7185" stopOpacity="0.0" />
            </linearGradient>
            <filter id="pinkGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#f472b6" floodOpacity="0.75" />
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
                  stroke="#282a2d"
                  strokeOpacity={val === 0 ? '0.4' : '0.2'}
                  strokeDasharray={val === 0 ? '0' : '4 4'}
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 10}
                  y={y + 3.5}
                  textAnchor="end"
                  className="fill-[#5f6368] dark:fill-slate-500 text-[10px] font-semibold"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* X axis labels */}
          {coords.map((pt, i) => {
            if (!shouldShowLabel(i, coords.length)) return null;
            const isToday = timeframe === 'this_month_daily' && i === todayDay - 1;
            return (
              <text
                key={i}
                x={pt.x}
                y={bottomY + 18}
                textAnchor="middle"
                className={`text-[11px] ${
                  isToday
                    ? 'fill-pink-600 dark:fill-pink-400 font-bold'
                    : 'fill-[#444746] dark:fill-slate-400 font-medium'
                }`}
              >
                {pt.month}
              </text>
            );
          })}

          {/* Area Fill */}
          {areaPath && <path d={areaPath} fill="url(#pinkSplineGrad)" />}

          {/* Glowing Spline Line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#f472b6"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#pinkGlowFilter)"
            />
          )}

          {/* Interactive Data Points & Hover Targets (Only active points up to today) */}
          {activeCoords.map((pt, i) => {
            const isHovered = hoveredIndex === i;
            const isToday = timeframe === 'this_month_daily' && i === todayDay - 1;

            return (
              <g
                key={i}
                className="cursor-pointer transition-transform duration-200"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Hit target */}
                <circle cx={pt.x} cy={pt.y} r="14" fill="transparent" />

                {/* Pulsing ring for Today in This Month view */}
                {isToday && pt.count > 0 && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="9"
                    fill="#f472b6"
                    fillOpacity="0.25"
                    className="animate-ping"
                  />
                )}

                {/* Outer halo */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 8 : pt.count > 0 ? 5 : 3}
                  fill="#fbcfe8"
                  fillOpacity={isHovered ? 0.45 : pt.count > 0 ? 0.2 : 0}
                  className="transition-all duration-200"
                />

                {/* Center point */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 5 : pt.count > 0 ? 4 : 2.5}
                  fill={isHovered ? '#ffffff' : pt.count > 0 ? '#f472b6' : '#94a3b8'}
                  stroke={pt.count > 0 ? '#db2777' : '#64748b'}
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  className="transition-all duration-200"
                />
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Box */}
        {hoveredIndex !== null && activeCoords[hoveredIndex] && (
          <div
            className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-full pb-3 transition-all z-20"
            style={{
              left: `${(activeCoords[hoveredIndex].x / width) * 100}%`,
              top: `${(activeCoords[hoveredIndex].y / height) * 100}%`,
            }}
          >
            <div className="bg-[#1e1f20] text-white border border-pink-500/40 px-3 py-2 rounded-2xl shadow-2xl text-xs font-semibold whitespace-nowrap flex flex-col items-center gap-0.5 animate-popIn backdrop-blur-md">
              <span className="text-pink-300 text-[11px] font-medium">
                {activeCoords[hoveredIndex].label || activeCoords[hoveredIndex].month}
              </span>
              <span className="text-white font-extrabold text-sm">
                {activeCoords[hoveredIndex].count} Application{activeCoords[hoveredIndex].count !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Metrics */}
      <div className="flex items-center justify-between pt-3 border-t border-[#e0e2e7] dark:border-[#282a2d] text-xs">
        <span className="text-[#5f6368] dark:text-slate-400">
          Total in timeframe: <strong className="text-[#1f1f1f] dark:text-white font-bold">{total}</strong>
        </span>
        <span className="text-pink-600 dark:text-pink-400 font-bold flex items-center gap-1">
          <span>Peak: {peakPoint.count}</span>
          <span className="text-[#5f6368] dark:text-slate-400 font-normal">({peakPoint.month})</span>
        </span>
      </div>
    </div>
  );
};
