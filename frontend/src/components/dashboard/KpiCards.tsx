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
      value: data ? data.totalApplications : 47,
      change: '12 this month',
      changeType: 'positive',
      icon: Mail,
      iconBg: 'bg-blue-600/20 text-blue-400 border border-blue-500/30',
      arrowColor: 'text-emerald-400',
    },
    {
      title: 'Interviews',
      value: data ? data.interviews : 8,
      change: '3 this month',
      changeType: 'positive',
      icon: Calendar,
      iconBg: 'bg-purple-600/20 text-purple-400 border border-purple-500/30',
      arrowColor: 'text-emerald-400',
    },
    {
      title: 'Offers',
      value: data ? data.offers : 2,
      change: '1 this month',
      changeType: 'positive',
      icon: Briefcase,
      iconBg: 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30',
      arrowColor: 'text-emerald-400',
    },
    {
      title: 'Rejections',
      value: data ? data.rejections : 5,
      change: '2 this month',
      changeType: 'negative',
      icon: XCircle,
      iconBg: 'bg-rose-600/20 text-rose-400 border border-rose-500/30',
      arrowColor: 'text-rose-400',
    },
    {
      title: 'Response Rate',
      value: `${data ? data.responseRate : 68}%`,
      change: '8% this month',
      changeType: 'positive',
      icon: BarChart3,
      iconBg: 'bg-amber-600/20 text-amber-400 border border-amber-500/30',
      arrowColor: 'text-emerald-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div
            key={i}
            className="bg-[#101626] dark:bg-[#101626] light:bg-white border border-[#1e2640] dark:border-[#1e2640] light:border-slate-200 rounded-2xl p-4 transition-all hover:border-slate-700/80 hover:shadow-lg shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.iconBg}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-medium text-slate-400">{stat.title}</span>
                <span className="text-2xl font-bold text-white tracking-tight">{stat.value}</span>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs">
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
