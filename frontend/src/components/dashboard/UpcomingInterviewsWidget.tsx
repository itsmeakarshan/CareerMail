import React from 'react';
import { Link } from 'react-router-dom';
import { CompanyLogo } from '../common/CompanyLogo';
import { Interview } from '../../types';

interface WidgetProps {
  interviews: Interview[];
  onSelectInterview?: (interview: Interview) => void;
}

export const UpcomingInterviewsWidget: React.FC<WidgetProps> = ({ interviews, onSelectInterview }) => {
  const displayItems = interviews.slice(0, 3);

  return (
    <div className="bg-white dark:bg-[#16181f] border border-[#e0e2e7] dark:border-[#282a2d] rounded-2xl p-4 shadow-sm flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:border-pink-300 dark:hover:border-pink-800/60 group">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-sm font-bold text-[#1f1f1f] dark:text-white tracking-tight">Upcoming Interviews</h3>
        <div className="flex items-center gap-2">
          <Link
            to="/calendar"
            className="text-xs font-semibold text-pink-600 dark:text-pink-400 hover:underline transition-colors flex items-center gap-1"
          >
            <span>Calendar</span>
          </Link>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <Link
            to="/interviews"
            className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:underline transition-colors"
          >
            View all
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {displayItems.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectInterview && onSelectInterview(item)}
            className="flex items-center justify-between p-2.5 rounded-xl bg-[#f6f8fc] dark:bg-[#1e1f20] hover:bg-[#fdf2f8] dark:hover:bg-[#282a2d] border border-[#e0e2e7] dark:border-[#282a2d] hover:border-pink-300 dark:hover:border-pink-700/50 transition-all duration-200 cursor-pointer group/item hover:-translate-y-0.5 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <CompanyLogo company={item.company} size="md" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-[#1f1f1f] dark:text-white group-hover/item:text-pink-600 dark:group-hover/item:text-pink-300 transition-colors">
                  {item.company}
                </span>
                <span className="text-xs text-[#5f6368] dark:text-slate-400 font-medium">{item.title}</span>
                <span className="text-[11px] text-[#5f6368] dark:text-slate-500 mt-0.5">
                  {formatDateTime(item.interviewDate)}
                </span>
              </div>
            </div>
            <div className="px-2.5 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950/60 border border-pink-200 dark:border-pink-800/40 text-pink-700 dark:text-pink-300 text-[11px] font-semibold whitespace-nowrap">
              {item.daysAwayBadge || 'In 2 days'}
            </div>
          </div>
        ))}

        {displayItems.length === 0 && (
          <div className="py-5 text-center text-xs text-[#5f6368] dark:text-slate-500">
            No upcoming interviews scheduled.
          </div>
        )}
      </div>
    </div>
  );
};

function formatDateTime(isoStr?: string): string {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoStr;
  }
}
