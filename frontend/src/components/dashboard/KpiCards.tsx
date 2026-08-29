import React from 'react';
import { Mail, Calendar, Briefcase, XCircle, BarChart3, ArrowUp } from 'lucide-react';
import { AnalyticsData } from '../../types';

interface KpiCardsProps {
  data?: AnalyticsData | null;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ data }) => {
  const stats = [
    {
      title: 'Total Applications',
      value: data ? data.totalApplications : 0,
      change: `${data?.thisMonthApplications || (data?.totalApplications ? data.totalApplications : 0)} this month`,
      icon: Mail,
      iconBg: 'bg-blue-500/10 text-blue-500 border border-blue-500/20 group-hover:scale-110 transition-transform duration-200',
      arrowColor: 'text-emerald-500 dark:text-emerald-400',
      hoverBorder: 'hover:border-blue-400/50 dark:hover:border-blue-500/30',
    },
    {
      title: 'Interviews',
      value: data ? data.interviews : 0,
      change: `${data?.thisMonthInterviews || (data?.interviews ? data.interviews : 0)} this month`,
      icon: Calendar,
      iconBg: 'bg-pink-500/10 text-pink-500 border border-pink-500/20 group-hover:scale-110 transition-transform duration-200',
      arrowColor: 'text-emerald-500 dark:text-emerald-400',
      hoverBorder: 'hover:border-pink-400/50 dark:hover:border-pink-500/30',
    },
    {
      title: 'Offers',
      value: data ? data.offers : 0,
      change: `${data?.thisMonthOffers || (data?.offers ? data.offers : 0)} this month`,
      icon: Briefcase,
      iconBg: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 group-hover:scale-110 transition-transform duration-200',
      arrowColor: 'text-emerald-500 dark:text-emerald-400',
      hoverBorder: 'hover:border-emerald-400/50 dark:hover:border-emerald-500/30',
    },
    {
      title: 'Rejections',
      value: data ? data.rejections : 0,
      change: `${data?.thisMonthRejections || (data?.rejections ? data.rejections : 0)} this month`,
      icon: XCircle,
      iconBg: 'bg-rose-500/10 text-rose-500 border border-rose-500/20 group-hover:scale-110 transition-transform duration-200',
      arrowColor: 'text-rose-500 dark:text-rose-400',
      hoverBorder: 'hover:border-rose-400/50 dark:hover:border-rose-500/30',
    },
    {
      title: 'Response Rate',
      value: `${data ? data.responseRate : 0}%`,
      change: `${data?.thisMonthResponseRateDelta ? (data.thisMonthResponseRateDelta > 0 ? `+${data.thisMonthResponseRateDelta}%` : `${data.thisMonthResponseRateDelta}%`) : '8%'} this month`,
      icon: BarChart3,
      iconBg: 'bg-amber-500/10 text-amber-500 border border-amber-500/20 group-hover:scale-110 transition-transform duration-200',
      arrowColor: 'text-emerald-500 dark:text-emerald-400',
      hoverBorder: 'hover:border-amber-400/50 dark:hover:border-amber-500/30',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div
            key={i}
            className={`bg-white dark:bg-[#16181f] border border-[#e0e2e7] dark:border-[#282a2d] rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg shadow-sm flex flex-col justify-between group cursor-default ${stat.hoverBorder}`}
          >
            {/* Top Row: Icon + Title */}
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.iconBg}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[12px] font-medium text-[#5f6368] dark:text-[#8e918f] truncate">{stat.title}</span>
                <span className="text-2xl font-black text-[#1f1f1f] dark:text-white tracking-tight mt-0.5">{stat.value}</span>
              </div>
            </div>

            {/* Bottom Row: Delta */}
            <div className="mt-3 flex items-center gap-1 text-xs">
              <span className={`flex items-center font-semibold text-[11px] ${stat.arrowColor}`}>
                <ArrowUp className="w-3.5 h-3.5 mr-0.5" />
                {stat.change}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
