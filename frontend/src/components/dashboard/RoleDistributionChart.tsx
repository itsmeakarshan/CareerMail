import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Target, ChevronDown, Check, TrendingUp, Sparkles, Layers, Briefcase, Award } from 'lucide-react';
import { JobApplication } from '../../types';

interface RoleDistributionChartProps {
  applications?: JobApplication[];
}

type ViewMode = 'domain' | 'role';

interface RoleCategoryData {
  id: string;
  name: string;
  count: number;
  percentage: number;
  activeCount: number;
  rejectedCount: number;
  color: string;
  gradient: string;
  bgLight: string;
  bgDark: string;
  topCompanies: string[];
}

export const RoleDistributionChart: React.FC<RoleDistributionChartProps> = ({ applications = [] }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('domain');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute live breakdown based on real applications data
  const data = useMemo<RoleCategoryData[]>(() => {
    if (!applications || applications.length === 0) {
      return [];
    }

    const total = applications.length;

    if (viewMode === 'domain') {
      // Group by high-level career specialization
      const domainMap: Record<
        string,
        {
          name: string;
          apps: JobApplication[];
          color: string;
          gradient: string;
          bgLight: string;
          bgDark: string;
        }
      > = {
        data_science: {
          name: 'Data Science',
          apps: [],
          color: '#ec4899', // Pink-500
          gradient: 'from-pink-500 to-rose-400',
          bgLight: 'bg-pink-50 text-pink-700 border-pink-200',
          bgDark: 'dark:bg-pink-950/70 dark:text-pink-300 dark:border-pink-800/40',
        },
        analytics: {
          name: 'Data & Analytics',
          apps: [],
          color: '#3b82f6', // Blue-500
          gradient: 'from-blue-500 to-cyan-400',
          bgLight: 'bg-blue-50 text-blue-700 border-blue-200',
          bgDark: 'dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800/40',
        },
        ml_ai: {
          name: 'AI & Machine Learning',
          apps: [],
          color: '#8b5cf6', // Purple-500
          gradient: 'from-purple-500 to-indigo-400',
          bgLight: 'bg-purple-50 text-purple-700 border-purple-200',
          bgDark: 'dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800/40',
        },
        software: {
          name: 'Software Engineering',
          apps: [],
          color: '#10b981', // Emerald-500
          gradient: 'from-emerald-500 to-teal-400',
          bgLight: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          bgDark: 'dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800/40',
        },
        other: {
          name: 'General & Associate',
          apps: [],
          color: '#f59e0b', // Amber-500
          gradient: 'from-amber-500 to-orange-400',
          bgLight: 'bg-amber-50 text-amber-700 border-amber-200',
          bgDark: 'dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800/40',
        },
      };

      for (const app of applications) {
        const titleLower = (app.title || '').toLowerCase();
        if (titleLower.includes('machine learning') || titleLower.includes('ml ') || titleLower.includes('ai ') || titleLower.includes('artificial intelligence')) {
          domainMap.ml_ai.apps.push(app);
        } else if (titleLower.includes('software') || titleLower.includes('developer') || titleLower.includes('data engineer')) {
          domainMap.software.apps.push(app);
        } else if (titleLower.includes('data analyst') || titleLower.includes('analyst') || titleLower.includes('power bi') || titleLower.includes('sql')) {
          domainMap.analytics.apps.push(app);
        } else if (titleLower.includes('data scientist') || titleLower.includes('data science')) {
          domainMap.data_science.apps.push(app);
        } else {
          domainMap.other.apps.push(app);
        }
      }

      return Object.entries(domainMap)
        .map(([id, info]) => {
          const count = info.apps.length;
          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
          const activeCount = info.apps.filter((a) => a.status !== 'REJECTED' && a.status !== 'WITHDRAWN').length;
          const rejectedCount = info.apps.filter((a) => a.status === 'REJECTED').length;
          const companies = Array.from(new Set(info.apps.map((a) => a.company))).slice(0, 3);

          return {
            id,
            name: info.name,
            count,
            percentage,
            activeCount,
            rejectedCount,
            color: info.color,
            gradient: info.gradient,
            bgLight: info.bgLight,
            bgDark: info.bgDark,
            topCompanies: companies,
          };
        })
        .filter((item) => item.count > 0)
        .sort((a, b) => b.count - a.count);
    } else {
      // Group by specific individual title
      const titleCountMap: Record<string, JobApplication[]> = {};
      for (const app of applications) {
        const title = app.title && app.title.trim().length > 0 ? app.title.trim() : 'Data Scientist';
        if (!titleCountMap[title]) {
          titleCountMap[title] = [];
        }
        titleCountMap[title].push(app);
      }

      const colors = [
        { color: '#ec4899', gradient: 'from-pink-500 to-rose-400', bgLight: 'bg-pink-50 text-pink-700 border-pink-200', bgDark: 'dark:bg-pink-950/70 dark:text-pink-300 dark:border-pink-800/40' },
        { color: '#3b82f6', gradient: 'from-blue-500 to-cyan-400', bgLight: 'bg-blue-50 text-blue-700 border-blue-200', bgDark: 'dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800/40' },
        { color: '#8b5cf6', gradient: 'from-purple-500 to-indigo-400', bgLight: 'bg-purple-50 text-purple-700 border-purple-200', bgDark: 'dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800/40' },
        { color: '#10b981', gradient: 'from-emerald-500 to-teal-400', bgLight: 'bg-emerald-50 text-emerald-700 border-emerald-200', bgDark: 'dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800/40' },
        { color: '#f59e0b', gradient: 'from-amber-500 to-orange-400', bgLight: 'bg-amber-50 text-amber-700 border-amber-200', bgDark: 'dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800/40' },
        { color: '#06b6d4', gradient: 'from-cyan-500 to-sky-400', bgLight: 'bg-cyan-50 text-cyan-700 border-cyan-200', bgDark: 'dark:bg-cyan-950/70 dark:text-cyan-300 dark:border-cyan-800/40' },
      ];

      return Object.entries(titleCountMap)
        .map(([name, apps], idx) => {
          const count = apps.length;
          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
          const activeCount = apps.filter((a) => a.status !== 'REJECTED' && a.status !== 'WITHDRAWN').length;
          const rejectedCount = apps.filter((a) => a.status === 'REJECTED').length;
          const style = colors[idx % colors.length];
          const companies = Array.from(new Set(apps.map((a) => a.company))).slice(0, 3);

          return {
            id: `role_${idx}`,
            name,
            count,
            percentage,
            activeCount,
            rejectedCount,
            color: style.color,
            gradient: style.gradient,
            bgLight: style.bgLight,
            bgDark: style.bgDark,
            topCompanies: companies,
          };
        })
        .sort((a, b) => b.count - a.count);
    }
  }, [applications, viewMode]);

  const maxCount = useMemo(() => {
    return data.length > 0 ? Math.max(...data.map((d) => d.count)) : 1;
  }, [data]);

  const primaryTarget = data.length > 0 ? data[0] : null;

  return (
    <div className="bg-white dark:bg-[#16181f] border border-[#e0e2e7] dark:border-[#282a2d] rounded-3xl p-5 md:p-6 shadow-sm flex flex-col justify-between h-[360px] w-full transition-all duration-300 hover:shadow-md hover:border-pink-300 dark:hover:border-pink-800/60 overflow-hidden">
      {/* Header with Dropdown Filter */}
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between pb-3 border-b border-[#e0e2e7] dark:border-[#282a2d]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-pink-50 dark:bg-pink-950/80 border border-pink-200 dark:border-pink-800/40 flex items-center justify-center text-pink-600 dark:text-pink-400">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1f1f1f] dark:text-white tracking-tight">
                Target Roles & Domains
              </h3>
              <p className="text-[11px] text-[#5f6368] dark:text-slate-400">
                Application breakdown by specialization
              </p>
            </div>
          </div>

          {/* View Mode Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#dadce0] dark:border-[#282a2d] bg-[#f6f8fc] dark:bg-[#1e1f20] hover:bg-[#eaeef6] dark:hover:bg-[#282a2d] text-xs font-semibold text-[#1f1f1f] dark:text-slate-200 transition-colors shadow-sm"
            >
              <span>{viewMode === 'domain' ? 'By Domain' : 'All Roles'}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 top-10 w-40 bg-white dark:bg-[#1e1f20] border border-[#e0e2e7] dark:border-[#282a2d] rounded-2xl shadow-xl py-1 z-30 animate-fadeIn">
                <button
                  onClick={() => {
                    setViewMode('domain');
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-[#1f1f1f] dark:text-slate-200 hover:bg-pink-50 dark:hover:bg-pink-950/50 hover:text-pink-600 dark:hover:text-pink-400 flex items-center justify-between"
                >
                  <span>By Domain</span>
                  {viewMode === 'domain' && <Check className="w-3.5 h-3.5 text-pink-500" />}
                </button>
                <button
                  onClick={() => {
                    setViewMode('role');
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-[#1f1f1f] dark:text-slate-200 hover:bg-pink-50 dark:hover:bg-pink-950/50 hover:text-pink-600 dark:hover:text-pink-400 flex items-center justify-between"
                >
                  <span>All Roles</span>
                  {viewMode === 'role' && <Check className="w-3.5 h-3.5 text-pink-500" />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Chart Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar my-2.5 pr-1.5 space-y-2.5 min-h-0">
        {data.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#5f6368] dark:text-slate-400">
            No application role data available yet.
          </div>
        ) : (
          data.map((item) => {
            const isHovered = hoveredItemId === item.id;
            const barWidthPercent = Math.max(Math.round((item.count / maxCount) * 100), 8);

            return (
              <div
                key={item.id}
                onMouseEnter={() => setHoveredItemId(item.id)}
                onMouseLeave={() => setHoveredItemId(null)}
                className={`group p-2.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                  isHovered
                    ? 'bg-[#f6f8fc] dark:bg-[#1e1f20] border-pink-300 dark:border-pink-700/60 shadow-sm scale-[1.01]'
                    : 'bg-transparent border-transparent hover:border-[#e0e2e7] dark:hover:border-[#282a2d]'
                }`}
              >
                {/* Row Header: Name, Percentage & Count */}
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-bold text-[#1f1f1f] dark:text-white truncate">
                      {item.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[11px] font-semibold text-[#5f6368] dark:text-slate-400">
                      {item.percentage}%
                    </span>
                    <span
                      className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full border ${item.bgLight} ${item.bgDark}`}
                    >
                      {item.count} {item.count === 1 ? 'app' : 'apps'}
                    </span>
                  </div>
                </div>

                {/* Animated Progress Bar */}
                <div className="w-full h-2.5 bg-[#eaeef6] dark:bg-[#282a2d] rounded-full overflow-hidden relative">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${item.gradient} transition-all duration-700 ease-out`}
                    style={{
                      width: `${barWidthPercent}%`,
                      boxShadow: isHovered ? `0 0 10px ${item.color}80` : 'none',
                    }}
                  />
                </div>

                {/* Dynamic Tooltip / Breakdown when Hovered */}
                {isHovered && (
                  <div className="mt-2.5 pt-2 border-t border-[#e0e2e7] dark:border-[#282a2d] flex items-center justify-between text-[11px] text-[#5f6368] dark:text-slate-400 animate-fadeIn">
                    <div className="flex items-center gap-3">
                      <span>
                        Active: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{item.activeCount}</strong>
                      </span>
                      <span>
                        Closed: <strong className="text-rose-600 dark:text-rose-400 font-bold">{item.rejectedCount}</strong>
                      </span>
                    </div>
                    {item.topCompanies.length > 0 && (
                      <div className="truncate max-w-[150px] text-right">
                        <span className="text-[#1f1f1f] dark:text-slate-300 font-medium">
                          {item.topCompanies.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Key Highlight Badge */}
      {primaryTarget && (
        <div className="pt-3 border-t border-[#e0e2e7] dark:border-[#282a2d] flex items-center justify-between text-xs flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-pink-500 dark:text-pink-400 flex-shrink-0" />
            <span className="text-[#5f6368] dark:text-slate-400">
              Primary Focus: <strong className="text-[#1f1f1f] dark:text-white font-bold">{primaryTarget.name}</strong>
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-pink-100 dark:bg-pink-950/80 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800/40">
            {primaryTarget.percentage}% of total
          </span>
        </div>
      )}
    </div>
  );
};
