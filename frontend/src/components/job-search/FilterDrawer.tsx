import React from 'react';
import { X, SlidersHorizontal, MapPin, Briefcase, Sparkles, RotateCcw, Check, DollarSign } from 'lucide-react';

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
    'United Kingdom',
    'Manchester',
    'Remote',
    'United States',
    'Europe'
  ];

  const workModes = [
    { value: 'ALL', label: 'All Modes' },
    { value: 'REMOTE', label: '🌐 Remote' },
    { value: 'HYBRID', label: '🏢 Hybrid' },
    { value: 'ONSITE', label: '📍 On-site' }
  ];

  const experienceLevels = [
    { value: 'ALL', label: 'All Experience Levels' },
    { value: 'GRAD', label: '🎓 Graduate / 0-1 Yrs' },
    { value: 'ENTRY', label: '🌱 Entry Level' },
    { value: 'JUNIOR', label: '⚡ Junior (1-2 Yrs)' },
    { value: 'MID', label: '🚀 Mid Level (2-4 Yrs)' },
    { value: 'SENIOR', label: '👑 Senior (5+ Yrs)' }
  ];

  const sortOptions = [
    { value: 'score_desc', label: 'Match Score: High to Low' },
    { value: 'score_asc', label: 'Match Score: Low to High' },
    { value: 'recent', label: 'Most Recent Postings' },
    { value: 'company', label: 'Company Name (A-Z)' },
    { value: 'salary_desc', label: 'Salary: High to Low' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fadeIn">
      {/* Click outside to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Slide-over Content Drawer */}
      <div className="w-full max-w-lg bg-white dark:bg-[#16181f] border-l border-slate-200 dark:border-[#282a2d] h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-slideLeft">
        
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 dark:border-[#282a2d] flex items-center justify-between bg-slate-50/70 dark:bg-[#1c1e24]/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-pink-500/10 text-pink-500">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                All Search & Job Filters
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Fine-tune matched listings and requirements
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#282a2d] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Scrollable Filter Sections */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* 1. Target Role & Title */}
          <div className="space-y-2.5">
            <label className="font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-pink-500" />
              <span>Target Role & Category</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {popularRoles.map((role) => {
                const isSelected = (role === 'All Roles' && !filters.role) || filters.role === role;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => onFilterChange('role', role === 'All Roles' ? '' : role)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                      isSelected
                        ? 'bg-pink-500 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-[#202227] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#282a2f] border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {role}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Location */}
          <div className="space-y-2.5">
            <label className="font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-pink-500" />
              <span>Location / Region</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {popularLocations.map((loc) => {
                const isSelected = (loc === 'Anywhere' && !filters.location) || filters.location.toLowerCase() === loc.toLowerCase();
                return (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => onFilterChange('location', loc === 'Anywhere' ? '' : loc)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                      isSelected
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-[#202227] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#282a2f] border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {loc}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              placeholder="Or type custom city/country (e.g. Edinburgh, Cambridge)..."
              value={filters.location}
              onChange={(e) => onFilterChange('location', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#202227] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-pink-500 transition-colors"
            />
          </div>

          {/* 3. Work Mode */}
          <div className="space-y-2.5">
            <label className="font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Work Mode Preference
            </label>
            <div className="grid grid-cols-2 gap-2">
              {workModes.map((mode) => {
                const isSelected = filters.workMode === mode.value;
                return (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => onFilterChange('workMode', mode.value)}
                    className={`px-3 py-2.5 rounded-xl font-bold text-center border transition-all ${
                      isSelected
                        ? 'bg-pink-500/10 border-pink-500 text-pink-600 dark:text-pink-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#202227]'
                    }`}
                  >
                    {mode.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Experience Level */}
          <div className="space-y-2.5">
            <label className="font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Experience Level
            </label>
            <div className="grid grid-cols-2 gap-2">
              {experienceLevels.map((exp) => {
                const isSelected = filters.experienceLevel === exp.value;
                return (
                  <button
                    key={exp.value}
                    type="button"
                    onClick={() => onFilterChange('experienceLevel', exp.value)}
                    className={`px-3 py-2 rounded-xl font-semibold text-left border transition-all ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#202227]'
                    }`}
                  >
                    {exp.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Minimum Match Score Slider */}
          <div className="space-y-2.5 bg-slate-50 dark:bg-[#202227] p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between font-extrabold">
              <span className="text-slate-700 dark:text-slate-300">Minimum Match Percentage</span>
              <span className="text-pink-500 text-sm font-black">{filters.minMatchScore}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="90"
              step="5"
              value={filters.minMatchScore}
              onChange={(e) => onFilterChange('minMatchScore', Number(e.target.value))}
              className="w-full accent-pink-500 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
              <span>0% (All Jobs)</span>
              <span>50% (Fair)</span>
              <span>75% (Strong)</span>
              <span>90% (Top Fit)</span>
            </div>
          </div>

          {/* 6. Sorting */}
          <div className="space-y-2">
            <label className="font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Sort Results By
            </label>
            <select
              value={filters.sortOption}
              onChange={(e) => onFilterChange('sortOption', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#202227] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-pink-500 cursor-pointer"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* 7. Recommended Only Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-[#202227] border border-slate-200 dark:border-slate-800">
            <div>
              <span className="font-bold text-slate-900 dark:text-white">Recommended Jobs Only</span>
              <p className="text-[11px] text-slate-400">Show only jobs matching ≥ 70% with high skill overlap</p>
            </div>
            <button
              type="button"
              onClick={() => onFilterChange('recommendedOnly', !filters.recommendedOnly)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                filters.recommendedOnly ? 'bg-pink-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  filters.recommendedOnly ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-[#282a2d] bg-slate-50/70 dark:bg-[#1c1e24]/70 flex items-center justify-between gap-3">
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
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Apply ({totalFilteredCount} Jobs)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
