import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Award, CheckCircle, Percent, ArrowUpRight } from 'lucide-react';
import { analyticsApi } from '../services/api';
import { AnalyticsData } from '../types';
import { KpiCards } from '../components/dashboard/KpiCards';
import { ApplicationsOverTimeChart } from '../components/dashboard/ApplicationsOverTimeChart';
import { ApplicationStatusDonut } from '../components/dashboard/ApplicationStatusDonut';

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await analyticsApi.getDashboard();
        setData(res);
      } catch (err) {
        console.error(err);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-purple-400" />
          <span>Job Search Analytics & Insights</span>
        </h1>
        <p className="text-xs md:text-sm text-slate-400 mt-0.5 font-medium">
          Comprehensive conversion funnels, response velocities, and outcome metrics
        </p>
      </div>

      {/* KPI Cards */}
      <KpiCards data={data} />

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ApplicationsOverTimeChart data={data} />
        <ApplicationStatusDonut data={data} />
      </div>

      {/* Funnel Metrics & Conversion Rates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#101626] border border-[#1e2640] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Response Rate</span>
              <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <span className="text-3xl font-extrabold text-white mt-2 block">
              {data ? data.responseRate : 0}%
            </span>
            <p className="text-xs text-slate-400 mt-1">
              {data && data.totalApplications > 0
                ? `Calculated from ${data.totalApplications} total applications synchronized from your emails.`
                : 'Connect Gmail and sync your emails to calculate response rate.'}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center text-xs text-emerald-400 font-semibold">
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            <span>{data && data.totalApplications > 0 ? 'Live database calculation' : 'No data yet'}</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#101626] border border-[#1e2640] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Interview Conversion</span>
              <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <span className="text-3xl font-extrabold text-white mt-2 block">
              {data && data.totalApplications > 0
                ? ((data.interviews / data.totalApplications) * 100).toFixed(1)
                : '0.0'}%
            </span>
            <p className="text-xs text-slate-400 mt-1">
              {data && data.totalApplications > 0
                ? `${data.interviews} scheduled technical and screening interviews from ${data.totalApplications} applications.`
                : 'No interview records found in database.'}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center text-xs text-purple-400 font-semibold">
            <CheckCircle className="w-3.5 h-3.5 mr-1" />
            <span>
              {data && data.thisMonthInterviews > 0
                ? `${data.thisMonthInterviews} scheduled this month`
                : (data?.interviews ? `${data.interviews} total interviews` : '0 interviews')}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#101626] border border-[#1e2640] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Offer Conversion</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <span className="text-3xl font-extrabold text-white mt-2 block">
              {data && data.totalApplications > 0
                ? ((data.offers / data.totalApplications) * 100).toFixed(1)
                : '0.0'}%
            </span>
            <p className="text-xs text-slate-400 mt-1">
              {data && data.totalApplications > 0
                ? `${data.offers} formal written offer${data.offers === 1 ? '' : 's'} recorded.`
                : 'No offer records found in database.'}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center text-xs text-emerald-400 font-semibold">
            <Award className="w-3.5 h-3.5 mr-1" />
            <span>
              {data && data.thisMonthOffers > 0
                ? `${data.thisMonthOffers} offers received this month`
                : (data?.offers ? `${data.offers} total offers` : '0 offers')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
