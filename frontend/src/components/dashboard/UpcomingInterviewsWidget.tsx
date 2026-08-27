import React from 'react';
import { Link } from 'react-router-dom';
import { CompanyLogo } from '../common/CompanyLogo';
import { Interview } from '../../types';

interface WidgetProps {
  interviews: Interview[];
  onSelectInterview?: (interview: Interview) => void;
}

export const UpcomingInterviewsWidget: React.FC<WidgetProps> = ({ interviews, onSelectInterview }) => {
  // Show up to 3 upcoming interviews matching screenshot
  const displayItems = interviews.slice(0, 3);

  return (
    <div className="bg-[#101626] border border-[#1e2640] rounded-2xl p-4 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-sm font-semibold text-white tracking-tight">Upcoming Interviews</h3>
        <Link
          to="/interviews"
          className="text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors"
        >
          View all
        </Link>
      </div>

      <div className="flex flex-col gap-2.5">
        {displayItems.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectInterview && onSelectInterview(item)}
            className="flex items-center justify-between p-2.5 rounded-xl bg-[#141b2d] hover:bg-[#182138] border border-slate-800/60 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <CompanyLogo company={item.company} size="md" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white group-hover:text-purple-200 transition-colors">
                  {item.company}
                </span>
                <span className="text-xs text-slate-400 font-medium">{item.title}</span>
                <span className="text-[11px] text-slate-500 mt-0.5">
                  {formatDateTime(item.interviewDate)}
                </span>
              </div>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-purple-950/60 border border-purple-800/40 text-purple-300 text-[11px] font-semibold whitespace-nowrap">
              {item.daysAwayBadge || 'Soon'}
            </div>
          </div>
        ))}

        {displayItems.length === 0 && (
          <div className="py-6 text-center text-xs text-slate-500">
            No upcoming interviews scheduled
          </div>
        )}
      </div>
    </div>
  );
};

function formatDateTime(dateStr: string): string {
  if (!dateStr) return 'May 17, 2025 · 10:00 AM';
  try {
    const d = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    const dateFormatted = d.toLocaleDateString('en-US', options);
    const timeFormatted = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return `${dateFormatted} · ${timeFormatted}`;
  } catch {
    return dateStr;
  }
}
