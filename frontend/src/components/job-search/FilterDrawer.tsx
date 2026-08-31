import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, SlidersHorizontal, MapPin, Briefcase, Sparkles, RotateCcw, Check, Banknote } from 'lucide-react';

export interface JobFilterState {
  searchQuery: string;
  location: string;
  role: string;
  workMode: string; // ALL, REMOTE, HYBRID, ONSITE
  experienceLevel: string; // ALL, GRAD, ENTRY, JUNIOR, MID, SENIOR
  minMatchScore: number;
  sortOption: string; // score_desc, score_asc, recent, company, salary_desc
  recommendedOnly: boolean;
  showHidden: boolean;
}

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: JobFilterState;
  onFilterChange: <K extends keyof JobFilterState>(key: K, value: JobFilterState[K]) => void;
  onResetFilters: () => void;
  totalFilteredCount: number;
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onResetFilters,
  totalFilteredCount
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const popularRoles = [
    'All Roles',
    'Software Engineer',
    'Full Stack Developer',
    'Frontend Developer',
    'Backend Developer',
    'Data Scientist',
    'Data Engineer',
    'Machine Learning',
    'DevOps / Cloud',
    'Product Manager'
  ];

  const popularLocations = [
    'Anywhere',
    'London',
    'Manchester',
    'Cambridge',
    'Oxford',
    'Bristol',
    'Edinburgh',
    'Birmingham',
    'United Kingdom',
    'Remote'
  ];

  const experienceLevels = [
    { value: 'ALL', label: 'All Experience Levels' },
    { value: 'GRAD', label: '🎓 Graduate / 0-1 Yrs' },
    { value: 'ENTRY', label: '🌱 Entry Level (0-2 Yrs)' },
    { value: 'MID', label: '⚡ Mid Level (2-5 Yrs)' },
    { value: 'SENIOR', label: '🚀 Senior / Lead (5+ Yrs)' }
  ];

  const drawerContent = (
    <div className="fixed inset-0 z-[9999] overflow-hidden animate-fadeIn">
      {/* Dimmed Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
      />

      {/* Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-[#16181f] border-l border-slate-200 dark:border-[#282a2d] shadow-2xl flex flex-col justify-between overflow-hidden animate-slideLeft">
          
          {/* Drawer Header */}
          <div className="p-5 border-b border-slate-200 dark:border-[#282a2d] bg-slate-50/80 dark:bg-[#1e131d]/80 backdrop-blur-sm flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-pink-500/10 text-pink-500">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Advanced Filters
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Tailor multi-source job aggregation
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-[#282a2d] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body Options */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-200">
            
            {/* Minimum Match Score Slider */}
            <div className="space-y-2 bg-slate-50 dark:bg-[#202227] p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-pink-500" />
                  <span>Minimum Match Score</span>
                </label>
                <span className="text-xs font-black text-pink-500 bg-pink-500/10 px-2 py-0.5 rounded-lg border border-pink-500/20">
                  {filters.minMatchScore}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                step="5"
                value={filters.minMatchScore}
                onChange={(e) => onFilterChange('minMatchScore', parseInt(e.target.value))}
                className="w-full accent-pink-500 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                <span>0% (All Jobs)</span>
                <span>50% (Fair)</span>
                <span>70% (Good)</span>
                <span>85% (Strong)</span>
              </div>
            </div>

            {/* Work Mode Toggle Pills */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-900 dark:text-white">
                Work Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'ALL', label: 'All Modes' },
                  { value: 'REMOTE', label: '🌐 Remote Only' },
                  { value: 'HYBRID', label: '🏢 Hybrid' },
                  { value: 'ONSITE', label: '📍 On-site' }
                ].map((mode) => (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => onFilterChange('workMode', mode.value)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                      filters.workMode === mode.value
                        ? 'bg-pink-500 text-white border-pink-500 shadow-sm'
                        : 'bg-slate-50 dark:bg-[#202227] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-[#282a30]'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Experience Level Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-900 dark:text-white">
                Experience Level
              </label>
              <div className="space-y-1.5">
                {experienceLevels.map((lvl) => (
                  <button
                    key={lvl.value}
                    type="button"
                    onClick={() => onFilterChange('experienceLevel', lvl.value)}
                    className={`w-full text-left py-2.5 px-3 rounded-xl text-xs font-medium border flex items-center justify-between transition-all ${
                      filters.experienceLevel === lvl.value
                        ? 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/30 font-bold'
                        : 'bg-slate-50 dark:bg-[#202227] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-[#282a30]'
                    }`}
                  >
                    <span>{lvl.label}</span>
                    {filters.experienceLevel === lvl.value && (
                      <Check className="w-4 h-4 text-pink-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Popular Roles Chips */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                <span>Job Role Filter</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {popularRoles.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => onFilterChange('role', role)}
                    className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                      filters.role === role
                        ? 'bg-pink-500 text-white border-pink-500 font-bold shadow-sm'
                        : 'bg-slate-50 dark:bg-[#202227] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-[#282a30]'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* Popular Locations */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Popular UK / Global Locations</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {popularLocations.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => onFilterChange('location', loc)}
                    className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                      filters.location === loc
                        ? 'bg-pink-500 text-white border-pink-500 font-bold shadow-sm'
                        : 'bg-slate-50 dark:bg-[#202227] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-[#282a30]'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Strategy */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-900 dark:text-white">
                Sort Results By
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'score_desc', label: 'Match Score (High ➔ Low)' },
                  { value: 'recent', label: 'Most Recent' },
                  { value: 'company', label: 'Company Name' },
                  { value: 'salary_desc', label: 'Highest Salary' }
                ].map((sort) => (
                  <button
                    key={sort.value}
                    type="button"
                    onClick={() => onFilterChange('sortOption', sort.value)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-medium border text-left truncate transition-all ${
                      filters.sortOption === sort.value
                        ? 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/30 font-bold'
                        : 'bg-slate-50 dark:bg-[#202227] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-[#282a30]'
                    }`}
                  >
                    {sort.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Drawer Footer Actions */}
          <div className="p-4 border-t border-slate-200 dark:border-[#282a2d] bg-slate-50/80 dark:bg-[#1e131d]/80 flex items-center justify-between gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onResetFilters}
              className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#282a30] font-bold text-xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Apply ({totalFilteredCount} Jobs)</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
};
