import React, { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { AnalyticsData } from '../../types';

interface DonutProps {
  data?: AnalyticsData | null;
}

export const ApplicationStatusDonut: React.FC<DonutProps> = ({ data }) => {
  const [filter, setFilter] = useState<'all_time' | 'this_month'>('all_time');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const items = data?.applicationStatus || [
    { name: 'Applied', count: 0, percentage: 0, color: '#3b82f6' },
    { name: 'Interview', count: 0, percentage: 0, color: '#8b5cf6' },
    { name: 'Assessment', count: 0, percentage: 0, color: '#f59e0b' },
    { name: 'Offer', count: 0, percentage: 0, color: '#10b981' },
    { name: 'Rejected', count: 0, percentage: 0, color: '#ef4444' },
    { name: 'Withdrawn', count: 0, percentage: 0, color: '#64748b' },
  ];

  const total = data ? data.totalApplications : 0;
  const hasData = total > 0 && items.some((item) => item.count > 0);

  // Donut geometry
  const radius = 64;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="bg-[#101626] border border-[#1e2640] rounded-2xl p-5 flex flex-col justify-between shadow-sm relative overflow-visible">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-white tracking-tight">Application Status</h3>

        <div className="relative z-30">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#151c30] border border-slate-800 rounded-lg text-xs font-medium text-slate-300 cursor-pointer hover:border-slate-700 hover:text-white transition-all shadow-sm active:scale-95"
          >
            <span>{filter === 'all_time' ? 'All Time' : 'This Month'}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-indigo-400' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-36 bg-[#141b2d] border border-[#222d48] rounded-xl shadow-2xl py-1 overflow-hidden backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
              <button
                type="button"
                onClick={() => {
                  setFilter('all_time');
                  setIsDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors ${
                  filter === 'all_time'
                    ? 'text-indigo-400 bg-indigo-500/10 font-semibold'
                    : 'text-slate-300 hover:bg-[#1a233b] hover:text-white'
                }`}
              >
                <span>All Time</span>
                {filter === 'all_time' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilter('this_month');
                  setIsDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors ${
                  filter === 'this_month'
                    ? 'text-indigo-400 bg-indigo-500/10 font-semibold'
                    : 'text-slate-300 hover:bg-[#1a233b] hover:text-white'
                }`}
              >
                <span>This Month</span>
                {filter === 'this_month' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Donut & Legend Container */}
      <div className="flex items-center justify-between gap-4 py-2">
        {/* SVG Donut */}
        <div className="relative w-44 h-44 flex-shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 160 160" className="w-full h-full transform -rotate-90">
            {!hasData ? (
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke="#1e2640"
                strokeWidth={strokeWidth}
                strokeDasharray="4 4"
              />
            ) : (
              items.map((item, idx) => {
                if (item.percentage === 0) return null;
                const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
                const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
                accumulatedPercent += item.percentage;

                return (
                  <circle
                    key={idx}
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="transparent"
                    stroke={item.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="butt"
                    className="transition-all duration-300 hover:opacity-90 cursor-pointer"
                  />
                );
              })
            )}
          </svg>

          {/* Center Text */}
          <div className="absolute flex flex-col items-center justify-center select-none pointer-events-none">
            <span className="text-3xl font-extrabold text-white tracking-tight">{total}</span>
            <span className="text-[11px] font-medium text-slate-400 -mt-0.5">Total</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2.5 flex-1 pr-1">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs group cursor-default">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-slate-300 font-medium group-hover:text-white transition-colors">
                  {item.name}
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold">
                <span className="text-white">{item.count}</span>
                <span className="text-slate-400 font-normal text-[11px]">({item.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
