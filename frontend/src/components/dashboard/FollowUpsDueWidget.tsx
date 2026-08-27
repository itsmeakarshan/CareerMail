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
    <div className="bg-[#101626] border border-[#1e2640] rounded-2xl p-4 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-sm font-semibold text-white tracking-tight">Follow-ups Due</h3>
        <Link
          to="/follow-ups"
          className="text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors"
        >
          View all
        </Link>
      </div>

      <div className="flex flex-col gap-2.5">
        {displayItems.map((item) => {
          const isUrgent = item.daysDueBadge?.includes('1 day') || item.daysDueBadge?.includes('Overdue') || item.daysDueBadge?.includes('today');
          const badgeColor = isUrgent
            ? 'text-rose-400 font-semibold'
            : 'text-amber-400 font-medium';

          return (
            <div
              key={item.id}
              onClick={() => onSelectFollowUp && onSelectFollowUp(item)}
              className="flex items-center justify-between p-2.5 rounded-xl bg-[#141b2d] hover:bg-[#182138] border border-slate-800/60 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <CompanyLogo company={item.company} size="md" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white group-hover:text-amber-200 transition-colors">
                    {item.company}
                  </span>
                  <span className="text-xs text-slate-400">
                    {item.appliedSubtitle || 'Applied recently'}
                  </span>
                </div>
              </div>
              <div className={`text-xs ${badgeColor} whitespace-nowrap`}>
                {item.daysDueBadge || 'Due soon'}
              </div>
            </div>
          );
        })}

        {displayItems.length === 0 && (
          <div className="py-6 text-center text-xs text-slate-500">
            No pending follow-ups due
          </div>
        )}
      </div>
    </div>
  );
};
