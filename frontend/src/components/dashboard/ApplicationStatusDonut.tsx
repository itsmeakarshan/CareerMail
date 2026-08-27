import React from 'react';
import { ChevronDown } from 'lucide-react';
import { AnalyticsData } from '../../types';

interface DonutProps {
  data?: AnalyticsData | null;
}

export const ApplicationStatusDonut: React.FC<DonutProps> = ({ data }) => {
  const items = data?.applicationStatus || [
    { name: 'Applied', count: 24, percentage: 51, color: '#3b82f6' },
    { name: 'Interview', count: 8, percentage: 17, color: '#8b5cf6' },
    { name: 'Assessment', count: 6, percentage: 13, color: '#f59e0b' },
    { name: 'Offer', count: 2, percentage: 4, color: '#10b981' },
    { name: 'Rejected', count: 5, percentage: 11, color: '#ef4444' },
    { name: 'Withdrawn', count: 2, percentage: 4, color: '#64748b' },
  ];

  const total = data ? data.totalApplications : 47;

  // Donut geometry
  const radius = 64;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="bg-[#101626] border border-[#1e2640] rounded-2xl p-5 flex flex-col justify-between shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-white tracking-tight">Application Status</h3>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-[#151c30] border border-slate-800 rounded-lg text-xs font-medium text-slate-300 cursor-pointer hover:border-slate-700 transition-colors">
          <span>All Time</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>

      {/* Donut & Legend Container */}
      <div className="flex items-center justify-between gap-4 py-2">
        {/* SVG Donut */}
        <div className="relative w-44 h-44 flex-shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 160 160" className="w-full h-full transform -rotate-90">
            {items.map((item, idx) => {
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
            })}
          </svg>

          {/* Center Text */}
          <div className="absolute flex flex-col items-center justify-center select-none pointer-events-none">
            <span className="text-3xl font-extrabold text-white tracking-tight">{total}</span>
            <span className="text-[11px] font-medium text-slate-400 -mt-0.5">Total</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2.5 flex-1 pr-2">
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
