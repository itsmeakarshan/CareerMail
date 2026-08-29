import React, { useState, useMemo } from 'react';
import { ChevronDown, Check, PieChart } from 'lucide-react';
import { AnalyticsData, StatusDistribution, JobApplication } from '../../types';

interface DonutProps {
  data?: AnalyticsData | null;
  applications?: JobApplication[];
}

export const ApplicationStatusDonut: React.FC<DonutProps> = ({ data, applications = [] }) => {
  const [filter, setFilter] = useState<'all_time' | 'this_month'>('all_time');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Compute live real status distribution if applications list is available
  const items = useMemo<StatusDistribution[]>(() => {
    if (applications && applications.length > 0) {
      let filteredApps = applications;
      if (filter === 'this_month') {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        filteredApps = applications.filter((app) => {
          if (!app.dateApplied) return true;
          const [y, m] = app.dateApplied.split('-').map(Number);
          return y === currentYear && m === currentMonth;
        });
      }

      const total = filteredApps.length;
      const countByStatus: Record<string, number> = {
        Applied: filteredApps.filter((a) => a.status === 'APPLIED').length,
        Interview: filteredApps.filter((a) => ['INTERVIEW', 'FINAL_INTERVIEW', 'RECRUITER_SCREEN'].includes(a.status)).length,
        Assessment: filteredApps.filter((a) => a.status === 'ASSESSMENT').length,
        Offer: filteredApps.filter((a) => a.status === 'OFFER').length,
        Rejected: filteredApps.filter((a) => a.status === 'REJECTED').length,
        Withdrawn: filteredApps.filter((a) => a.status === 'WITHDRAWN').length,
      };

      const colors: Record<string, string> = {
        Applied: '#3b82f6',
        Interview: '#f472b6',
        Assessment: '#f59e0b',
        Offer: '#10b981',
        Rejected: '#ef4444',
        Withdrawn: '#94a3b8',
      };

      return Object.entries(countByStatus).map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        color: colors[name],
      }));
    }

    if (data?.applicationStatus && data.applicationStatus.length > 0) {
      return data.applicationStatus.map((item) => ({
        ...item,
        color: item.name.toLowerCase().includes('interview') ? '#f472b6' : item.color,
      }));
    }

    return [
      { name: 'Applied', count: 18, percentage: 64, color: '#3b82f6' },
      { name: 'Interview', count: 0, percentage: 0, color: '#f472b6' },
      { name: 'Assessment', count: 0, percentage: 0, color: '#f59e0b' },
      { name: 'Offer', count: 0, percentage: 0, color: '#10b981' },
      { name: 'Rejected', count: 10, percentage: 36, color: '#ef4444' },
      { name: 'Withdrawn', count: 0, percentage: 0, color: '#94a3b8' },
    ];
  }, [data, applications, filter]);

  const total = items.reduce((acc, curr) => acc + curr.count, 0);
  const hasData = total > 0 && items.some((item) => item.count > 0);

  // Donut geometry
  const radius = 62;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * radius;

  // Active hover target information
  const activeItem = hoveredIndex !== null ? items[hoveredIndex] : null;

  let accumulatedPercent = 0;

  return (
    <div className="bg-white dark:bg-[#16181f] border border-[#e0e2e7] dark:border-[#282a2d] rounded-3xl p-5 md:p-6 flex flex-col justify-between shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md hover:border-pink-300 dark:hover:border-pink-800/60 h-[360px] w-full group">
      {/* Header */}
      <div className="flex items-center justify-between mb-1 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-pink-100 dark:bg-pink-950/80 border border-pink-200 dark:border-pink-800/40 flex items-center justify-center text-pink-600 dark:text-pink-400">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1f1f1f] dark:text-white tracking-tight">Application Status</h3>
            <p className="text-xs text-[#5f6368] dark:text-slate-400">Pipeline distribution</p>
          </div>
        </div>

        <div className="relative z-30">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f0f4f9] dark:bg-[#1e1f20] border border-[#dadce0] dark:border-slate-800 rounded-xl text-xs font-semibold text-[#444746] dark:text-slate-200 cursor-pointer hover:border-pink-300 dark:hover:border-pink-700/60 hover:text-pink-600 dark:hover:text-pink-300 transition-all shadow-sm active:scale-95"
          >
            <span>{filter === 'all_time' ? 'All Time' : 'This Month'}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-pink-500' : ''}`} />
          </button>

          {/* Dropdown menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-36 bg-white dark:bg-[#1e1f20] border border-[#e0e2e7] dark:border-[#282a2d] rounded-2xl shadow-xl py-1 overflow-hidden animate-popIn">
              <button
                type="button"
                onClick={() => {
                  setFilter('all_time');
                  setIsDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2 text-xs transition-colors ${
                  filter === 'all_time'
                    ? 'text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/60 font-bold'
                    : 'text-[#444746] dark:text-slate-300 hover:bg-[#f0f4f9] dark:hover:bg-[#282a2d] hover:text-black dark:hover:text-white'
                }`}
              >
                <span>All Time</span>
                {filter === 'all_time' && <Check className="w-3.5 h-3.5 text-pink-500" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilter('this_month');
                  setIsDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2 text-xs transition-colors ${
                  filter === 'this_month'
                    ? 'text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/60 font-bold'
                    : 'text-[#444746] dark:text-slate-300 hover:bg-[#f0f4f9] dark:hover:bg-[#282a2d] hover:text-black dark:hover:text-white'
                }`}
              >
                <span>This Month</span>
                {filter === 'this_month' && <Check className="w-3.5 h-3.5 text-pink-500" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Donut & Legend Container */}
      <div className="flex items-center justify-between gap-4 py-1 flex-1 min-h-0">
        {/* SVG Donut */}
        <div className="relative w-44 h-44 flex-shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 160 160" className="w-full h-full transform -rotate-90 overflow-visible">
            <defs>
              <filter id="donutShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.35" />
              </filter>
            </defs>

            {!hasData ? (
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke="#282a2d"
                strokeWidth={strokeWidth}
                strokeDasharray="4 4"
              />
            ) : (
              items.map((item, index) => {
                const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
                const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
                accumulatedPercent += item.percentage;

                const isHovered = hoveredIndex === index;

                return (
                  <circle
                    key={index}
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="transparent"
                    stroke={item.color}
                    strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-300 ease-out cursor-pointer"
                    style={{
                      opacity: hoveredIndex !== null && !isHovered ? 0.45 : 1,
                      filter: isHovered ? 'url(#donutShadow)' : 'none',
                    }}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                );
              })
            )}
          </svg>

          {/* Dynamic Center Info */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none transition-all duration-200">
            {activeItem ? (
              <div className="animate-popIn flex flex-col items-center">
                <span
                  className="text-2xl font-black tracking-tight leading-none"
                  style={{ color: activeItem.color }}
                >
                  {activeItem.count}
                </span>
                <span className="text-[11px] font-bold text-[#1f1f1f] dark:text-white mt-1">
                  {activeItem.name}
                </span>
                <span className="text-[10px] text-[#5f6368] dark:text-slate-400 font-mono">
                  {activeItem.percentage}% of total
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-3xl font-black text-[#1f1f1f] dark:text-white tracking-tight leading-none">
                  {total}
                </span>
                <span className="text-[11px] font-bold text-[#5f6368] dark:text-slate-400 mt-1 uppercase tracking-wider">
                  Total
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Legend List */}
        <div className="flex-1 grid grid-cols-1 gap-1.5">
          {items.map((item, i) => {
            const isHovered = hoveredIndex === i;
            return (
              <div
                key={i}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-xl cursor-pointer transition-all duration-200 ${
                  isHovered
                    ? 'bg-pink-50/80 dark:bg-pink-950/40 shadow-sm border border-pink-200 dark:border-pink-800/40 scale-[1.02]'
                    : 'hover:bg-[#f6f8fc] dark:hover:bg-[#1e1f20] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-transform"
                    style={{
                      backgroundColor: item.color,
                      transform: isHovered ? 'scale(1.3)' : 'scale(1)',
                    }}
                  />
                  <span
                    className={`truncate font-semibold ${
                      isHovered ? 'text-black dark:text-white' : 'text-[#444746] dark:text-slate-300'
                    }`}
                  >
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[#1f1f1f] dark:text-white font-bold">{item.count}</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      item.percentage > 0
                        ? 'bg-slate-100 dark:bg-[#282a2d] text-[#1f1f1f] dark:text-slate-200'
                        : 'text-slate-400 dark:text-slate-600'
                    }`}
                  >
                    {item.percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
