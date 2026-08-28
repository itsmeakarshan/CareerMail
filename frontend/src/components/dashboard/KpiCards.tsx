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
      iconBg: 'bg-[#15233e] text-[#4f8bf9] border border-blue-500/20',
      arrowColor: 'text-emerald-400',
    },
    {
      title: 'Interviews',
      value: data ? data.interviews : 0,
      change: `${data?.thisMonthInterviews || (data?.interviews ? data.interviews : 0)} this month`,
      icon: Calendar,
      iconBg: 'bg-[#261c3e] text-[#a855f7] border border-purple-500/20',
      arrowColor: 'text-emerald-400',
    },
    {
      title: 'Offers',
      value: data ? data.offers : 0,
      change: `${data?.thisMonthOffers || (data?.offers ? data.offers : 0)} this month`,
      icon: Briefcase,
      iconBg: 'bg-[#122e26] text-[#10b981] border border-emerald-500/20',
      arrowColor: 'text-emerald-400',
    },
    {
      title: 'Rejections',
      value: data ? data.rejections : 0,
      change: `${data?.thisMonthRejections || (data?.rejections ? data.rejections : 0)} this month`,
      icon: XCircle,
      iconBg: 'bg-[#331824] text-[#f43f5e] border border-rose-500/20',
      arrowColor: 'text-rose-400',
    },
    {
      title: 'Response Rate',
      value: `${data ? data.responseRate : 0}%`,
      change: `${data?.thisMonthResponseRateDelta ? (data.thisMonthResponseRateDelta > 0 ? `+${data.thisMonthResponseRateDelta}%` : `${data.thisMonthResponseRateDelta}%`) : '8%'} this month`,
      icon: BarChart3,
      iconBg: 'bg-[#332514] text-[#f59e0b] border border-amber-500/20',
      arrowColor: 'text-emerald-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div
            key={i}
            className="bg-[#101626] border border-[#1e2640] rounded-2xl p-4 transition-all hover:border-slate-700 hover:shadow-lg shadow-sm flex flex-col justify-between"
          >
            {/* Top Row: Icon + Title */}
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.iconBg}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-medium text-slate-400">{stat.title}</span>
                <span className="text-2xl font-bold text-white tracking-tight mt-0.5">{stat.value}</span>
              </div>
            </div>

            {/* Bottom Row: Delta */}
            <div className="mt-3 flex items-center gap-1 text-xs">
              <span className={`flex items-center font-medium ${stat.arrowColor}`}>
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
