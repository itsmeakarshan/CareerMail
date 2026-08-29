import React from 'react';
import { Link } from 'react-router-dom';
import { CompanyLogo } from '../common/CompanyLogo';
import { FollowUp } from '../../types';

interface WidgetProps {
  followUps: FollowUp[];
  onSelectFollowUp?: (followUp: FollowUp) => void;
}

export const FollowUpsDueWidget: React.FC<WidgetProps> = ({ followUps, onSelectFollowUp }) => {
  const displayItems = followUps.slice(0, 3);

  return (
    <div className="bg-white dark:bg-[#16181f] border border-[#e0e2e7] dark:border-[#282a2d] rounded-2xl p-4 shadow-sm flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:border-pink-300 dark:hover:border-pink-800/60 group">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-sm font-bold text-[#1f1f1f] dark:text-white tracking-tight">Follow-ups Due</h3>
        <Link
          to="/follow-ups"
          className="text-xs font-semibold text-pink-600 dark:text-pink-400 hover:underline transition-colors"
        >
          View all
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        {displayItems.map((item) => {
          const isUrgent = item.daysDueBadge?.includes('1 day') || item.daysDueBadge?.includes('Overdue') || item.daysDueBadge?.includes('today');
          const badgeColor = isUrgent
            ? 'text-rose-600 dark:text-rose-400 font-semibold'
            : 'text-amber-600 dark:text-amber-400 font-medium';

          return (
            <div
              key={item.id}
              onClick={() => onSelectFollowUp && onSelectFollowUp(item)}
              className="flex items-center justify-between p-2.5 rounded-xl bg-[#f6f8fc] dark:bg-[#1e1f20] hover:bg-[#fdf2f8] dark:hover:bg-[#282a2d] border border-[#e0e2e7] dark:border-[#282a2d] hover:border-pink-300 dark:hover:border-pink-700/50 transition-all duration-200 cursor-pointer group/item hover:-translate-y-0.5 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <CompanyLogo company={item.company} size="md" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-[#1f1f1f] dark:text-white group-hover/item:text-amber-600 dark:group-hover/item:text-amber-200 transition-colors">
                    {item.company}
                  </span>
                  <span className="text-xs text-[#5f6368] dark:text-slate-400 font-medium">
                    {item.appliedSubtitle || 'Applied recently'}
                  </span>
                </div>
              </div>
              <div className={`text-xs ${badgeColor} whitespace-nowrap`}>
                {item.daysDueBadge || 'Due in 2 days'}
              </div>
            </div>
          );
        })}

        {displayItems.length === 0 && (
          <div className="py-5 text-center text-xs text-[#5f6368] dark:text-slate-500">
            No follow-ups due.
          </div>
        )}
      </div>
    </div>
  );
};
