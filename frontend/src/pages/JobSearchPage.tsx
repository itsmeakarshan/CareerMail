import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  MapPin,
  Sparkles,
  SlidersHorizontal,
  RefreshCw,
  Briefcase,
  ChevronDown,
  Lock,
  RotateCcw,
  Sliders,
  Star,
  CheckCircle2,
  X
} from 'lucide-react';
import { CvProfile, JobListing } from '../types';
import { jobSearchApi } from '../services/api';
import { CvUploadWidget } from '../components/job-search/CvUploadWidget';
import { JobCard } from '../components/job-search/JobCard';
import { JobDetailModal } from '../components/job-search/JobDetailModal';
import { FilterDrawer, JobFilterState } from '../components/job-search/FilterDrawer';
import { HiddenJobsModal } from '../components/job-search/HiddenJobsModal';

const DEFAULT_FILTERS: JobFilterState = {
  searchQuery: '',
  location: '',
  role: '',
  workMode: 'ALL',
  experienceLevel: 'ALL',
  minMatchScore: 0,
  sortOption: 'score_desc',
  recommendedOnly: false,
  showHidden: false
};

const POPULAR_LOCATIONS = [
  'Anywhere',
  'London',
  'United Kingdom',
  'Manchester',
  'Remote',
  'United States'
];

const POPULAR_ROLES = [
  'All Roles',
  'Software Engineer',
  'Full Stack Developer',
  'Frontend Developer',
  'Backend Developer',
  'Data Scientist',
  'Data Engineer',
  'Machine Learning',
  'DevOps / Cloud'
];

export const JobSearchPage: React.FC = () => {
  const [cvProfile, setCvProfile] = useState<CvProfile | null>(null);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false);
  const [isHiddenModalOpen, setIsHiddenModalOpen] = useState<boolean>(false);

  // Hidden Jobs in LocalStorage
  const [hiddenJobIds, setHiddenJobIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('careermail_hidden_jobs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('careermail_hidden_jobs', JSON.stringify(hiddenJobIds));
    } catch {
      // Ignore
    }
  }, [hiddenJobIds]);

  // Unified Filter State Object
  const [filters, setFilters] = useState<JobFilterState>(DEFAULT_FILTERS);

  const handleFilterChange = <K extends keyof JobFilterState>(key: K, value: JobFilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const fetchCvProfile = async () => {
    try {
      const profile = await jobSearchApi.getCv();
      setCvProfile(profile);
    } catch {
      // Fallback
    }
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const result = await jobSearchApi.searchJobs({
        q: filters.searchQuery || filters.role,
        location: filters.location === 'Anywhere' ? '' : filters.location,
        workType: filters.workMode,
        minScore: 0, // We perform precise live client filtering on score
        sortBy: filters.sortOption
      });
      setJobs(result || []);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCvProfile();
  }, []);

  // Fetch from server when search query, location, or server-level fields change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchJobs();
    }, 250);
    return () => clearTimeout(timer);
  }, [filters.searchQuery, filters.location, filters.role, filters.workMode]);

  // Client-Side Real-Time Filter & Sort Pipeline
  const filteredJobs = useMemo(() => {
    return (jobs || []).filter((job) => {
      // 1. Hidden jobs filter
      if (!filters.showHidden && hiddenJobIds.includes(job.id)) {
        return false;
      }

      // 2. Search Query (Title, Company, Skills, Description)
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase().trim();
        const matchesQ =
          job.title.toLowerCase().includes(q) ||
          job.company.toLowerCase().includes(q) ||
          job.description.toLowerCase().includes(q) ||
          (job.skills || []).some((s) => s.toLowerCase().includes(q));
        if (!matchesQ) return false;
      }

      // 3. Location filter
      if (filters.location.trim() && filters.location !== 'Anywhere') {
        const loc = filters.location.toLowerCase().trim();
        const jobLoc = (job.location || '').toLowerCase();
        const jobCountry = (job.country || '').toLowerCase();
        const jobCity = (job.city || '').toLowerCase();

        const matchesLoc =
          jobLoc.includes(loc) ||
          jobCountry.includes(loc) ||
          jobCity.includes(loc) ||
          (loc.includes('remote') && job.workMode === 'REMOTE') ||
          (loc.includes('uk') && (jobCountry.includes('united kingdom') || jobLoc.includes('london') || jobLoc.includes('manchester'))) ||
          (loc.includes('united kingdom') && (jobCountry.includes('united kingdom') || jobLoc.includes('london') || jobLoc.includes('manchester') || jobLoc.includes('uk')));

        if (!matchesLoc) return false;
      }

      // 4. Role filter
      if (filters.role.trim() && filters.role !== 'All Roles') {
        const r = filters.role.toLowerCase().trim();
        const titleLower = job.title.toLowerCase();
        const skillsLower = (job.skills || []).map((s) => s.toLowerCase());

        let matchesRole = titleLower.includes(r);
        if (r.includes('data scientist') || r.includes('data science')) {
          matchesRole = titleLower.includes('data') || titleLower.includes('scientist') || skillsLower.includes('python') || skillsLower.includes('machine learning');
        } else if (r.includes('machine learning') || r.includes('ml')) {
          matchesRole = titleLower.includes('machine learning') || titleLower.includes('ml') || titleLower.includes('ai') || skillsLower.includes('pytorch') || skillsLower.includes('machine learning');
        } else if (r.includes('frontend') || r.includes('front end')) {
          matchesRole = titleLower.includes('frontend') || titleLower.includes('front end') || titleLower.includes('react') || titleLower.includes('ui');
        } else if (r.includes('backend') || r.includes('back end')) {
          matchesRole = titleLower.includes('backend') || titleLower.includes('back end') || titleLower.includes('c#') || titleLower.includes('.net') || titleLower.includes('go') || titleLower.includes('java') || titleLower.includes('node');
        } else if (r.includes('full stack') || r.includes('fullstack')) {
          matchesRole = titleLower.includes('full stack') || titleLower.includes('fullstack') || (titleLower.includes('developer') && !titleLower.includes('lead'));
        } else if (r.includes('devops') || r.includes('cloud')) {
          matchesRole = titleLower.includes('devops') || titleLower.includes('cloud') || titleLower.includes('sre') || titleLower.includes('infrastructure');
        }

        if (!matchesRole) return false;
      }

      // 5. Work Mode filter
      if (filters.workMode !== 'ALL') {
        const mode = filters.workMode.toUpperCase();
        const jobMode = (job.workMode || '').toUpperCase();
        const jobLoc = (job.location || '').toLowerCase();

        if (mode === 'REMOTE' && jobMode !== 'REMOTE' && !jobLoc.includes('remote')) return false;
        if (mode === 'HYBRID' && jobMode !== 'HYBRID' && !jobLoc.includes('hybrid')) return false;
        if (mode === 'ONSITE' && jobMode !== 'ONSITE' && (jobLoc.includes('remote') || jobMode === 'REMOTE')) return false;
      }

      // 6. Experience Level filter
      if (filters.experienceLevel !== 'ALL') {
        const exp = filters.experienceLevel.toUpperCase();
        const titleLower = job.title.toLowerCase();
        const jobExp = (job.experienceLevel || '').toLowerCase();

        if (exp === 'GRAD') {
          const isGrad =
            titleLower.includes('graduate') ||
            titleLower.includes('junior') ||
            titleLower.includes('0-1') ||
            titleLower.includes('entry') ||
            jobExp.includes('entry');
          if (!isGrad) return false;
        } else if (exp === 'ENTRY') {
          const isEntry = jobExp.includes('entry') || titleLower.includes('entry') || titleLower.includes('graduate');
          if (!isEntry) return false;
        } else if (exp === 'JUNIOR') {
          const isJunior = titleLower.includes('junior') || titleLower.includes('associate') || jobExp.includes('entry');
          if (!isJunior) return false;
        } else if (exp === 'MID') {
          const isMid = jobExp.includes('mid') || (!titleLower.includes('senior') && !titleLower.includes('graduate') && !titleLower.includes('lead'));
          if (!isMid) return false;
        } else if (exp === 'SENIOR') {
          const isSenior = titleLower.includes('senior') || titleLower.includes('lead') || titleLower.includes('principal') || jobExp.includes('senior');
          if (!isSenior) return false;
        }
      }

      // 7. Minimum Match Score filter
      if (job.matchScore < filters.minMatchScore) {
        return false;
      }

      // 8. Recommended Only filter
      if (filters.recommendedOnly && job.matchScore < 70) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      switch (filters.sortOption) {
        case 'score_asc':
          return a.matchScore - b.matchScore;
        case 'recent':
          return (b.postedDate || '').includes('hour') ? 1 : -1;
        case 'company':
          return (a.company || '').localeCompare(b.company || '');
        case 'salary_desc':
          const extractNum = (s: string) => {
            const m = (s || '').match(/\d+/);
            return m ? parseInt(m[0], 10) : 0;
          };
          return extractNum(b.salary) - extractNum(a.salary);
        case 'score_desc':
        default:
          return b.matchScore - a.matchScore;
      }
    });
  }, [jobs, filters, hiddenJobIds]);

  const handleHideJob = (jobId: string) => {
    setHiddenJobIds((prev) => (prev.includes(jobId) ? prev : [...prev, jobId]));
  };

  const handleRestoreJob = (jobId: string) => {
    setHiddenJobIds((prev) => prev.filter((id) => id !== jobId));
  };

  const handleRestoreAllJobs = () => {
    setHiddenJobIds([]);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery.trim()) count++;
    if (filters.location.trim() && filters.location !== 'Anywhere') count++;
    if (filters.role.trim() && filters.role !== 'All Roles') count++;
    if (filters.workMode !== 'ALL') count++;
    if (filters.experienceLevel !== 'ALL') count++;
    if (filters.minMatchScore > 0) count++;
    if (filters.recommendedOnly) count++;
    if (filters.sortOption !== 'score_desc') count++;
    return count;
  }, [filters]);

  return (
    <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-16 animate-fadeIn">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-[#282a2d] pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <Briefcase className="w-7 h-7 text-pink-500" />
            <span>Job Search & CV Match</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time verified tech jobs scored deterministically against your candidate CV profile.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-pink-500/10 text-pink-500 font-bold text-xs border border-pink-500/20 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>{filteredJobs.length} Jobs Displayed ({jobs.length} Loaded)</span>
          </div>
          <button
            onClick={() => fetchJobs()}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#202227] transition-colors"
            title="Refresh job search"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* CV Profile & Skill Extraction Section */}
      <CvUploadWidget
        cvProfile={cvProfile}
        onProfileUpdated={(updated) => {
          setCvProfile(updated);
          fetchJobs();
        }}
      />

      {/* TOP HORIZONTAL SEARCH & FILTER BAR */}
      <div className="space-y-3">
        {/* Search Bar Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by job title, company, skills, or technologies (e.g. Google, Data Scientist, React, C#)..."
              value={filters.searchQuery}
              onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl text-xs bg-white dark:bg-[#16181f] border border-slate-200 dark:border-[#282a2d] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-pink-500 shadow-xs transition-colors"
            />
            {filters.searchQuery && (
              <button
                onClick={() => handleFilterChange('searchQuery', '')}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="sm:w-64 relative">
            <MapPin className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Location (e.g. London, UK, Remote)..."
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl text-xs bg-white dark:bg-[#16181f] border border-slate-200 dark:border-[#282a2d] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-pink-500 shadow-xs transition-colors"
            />
            {filters.location && (
              <button
                onClick={() => handleFilterChange('location', '')}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Filter Controls Row */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none text-xs font-semibold">
          
          {/* Active "All Filters" Modal Trigger */}
          <button
            onClick={() => setIsFilterDrawerOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black flex items-center gap-1.5 flex-shrink-0 shadow-xs transition-all"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>••• All Filters</span>
            {activeFiltersCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-white text-emerald-700 rounded-full text-[10px] font-black">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Location Select Dropdown */}
          <select
            value={filters.location || 'Anywhere'}
            onChange={(e) => handleFilterChange('location', e.target.value === 'Anywhere' ? '' : e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#16181f] border border-slate-200 dark:border-[#282a2d] text-slate-700 dark:text-slate-200 flex items-center gap-1.5 flex-shrink-0 focus:outline-none cursor-pointer hover:border-pink-500/50 transition-colors"
          >
            {POPULAR_LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>
                Location: {loc}
              </option>
            ))}
          </select>

          {/* Role Select Dropdown */}
          <select
            value={filters.role || 'All Roles'}
            onChange={(e) => handleFilterChange('role', e.target.value === 'All Roles' ? '' : e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#16181f] border border-slate-200 dark:border-[#282a2d] text-slate-700 dark:text-slate-200 flex items-center gap-1.5 flex-shrink-0 focus:outline-none cursor-pointer hover:border-pink-500/50 transition-colors"
          >
            {POPULAR_ROLES.map((r) => (
              <option key={r} value={r}>
                Role: {r}
              </option>
            ))}
          </select>

          {/* Work Mode Select */}
          <select
            value={filters.workMode}
            onChange={(e) => handleFilterChange('workMode', e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#16181f] border border-slate-200 dark:border-[#282a2d] text-slate-700 dark:text-slate-200 flex items-center gap-1.5 flex-shrink-0 focus:outline-none cursor-pointer hover:border-pink-500/50 transition-colors"
          >
            <option value="ALL">Work Mode: All</option>
            <option value="REMOTE">🌐 Work Mode: Remote</option>
            <option value="HYBRID">🏢 Work Mode: Hybrid</option>
            <option value="ONSITE">📍 Work Mode: On-site</option>
          </select>

          {/* Experience Level Select */}
          <select
            value={filters.experienceLevel}
            onChange={(e) => handleFilterChange('experienceLevel', e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#16181f] border border-slate-200 dark:border-[#282a2d] text-slate-700 dark:text-slate-200 flex items-center gap-1.5 flex-shrink-0 focus:outline-none cursor-pointer hover:border-pink-500/50 transition-colors"
          >
            <option value="ALL">Exp: All Levels</option>
            <option value="GRAD">🎓 Grad / 0-1 Yrs</option>
            <option value="ENTRY">🌱 Entry Level</option>
            <option value="JUNIOR">⚡ Junior (1-2 yrs)</option>
            <option value="MID">🚀 Mid Level (2-4 yrs)</option>
            <option value="SENIOR">👑 Senior (5+ yrs)</option>
          </select>

          {/* Live Minimum Match Percentage Slider */}
          <div className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#16181f] border border-slate-200 dark:border-[#282a2d] text-slate-700 dark:text-slate-200 flex items-center gap-2 flex-shrink-0">
            <span className="text-pink-500 font-extrabold whitespace-nowrap">
              Min Match: {filters.minMatchScore}%
            </span>
            <input
              type="range"
              min="0"
              max="90"
              step="5"
              value={filters.minMatchScore}
              onChange={(e) => handleFilterChange('minMatchScore', Number(e.target.value))}
              className="w-20 accent-pink-500 cursor-pointer h-1.5"
            />
          </div>

          {/* Sort Dropdown */}
          <select
            value={filters.sortOption}
            onChange={(e) => handleFilterChange('sortOption', e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#16181f] border border-slate-200 dark:border-[#282a2d] text-slate-700 dark:text-slate-200 flex items-center gap-1.5 flex-shrink-0 focus:outline-none cursor-pointer hover:border-pink-500/50 transition-colors"
          >
            <option value="score_desc">Sort: Match Score (High to Low)</option>
            <option value="score_asc">Sort: Match Score (Low to High)</option>
            <option value="recent">Sort: Most Recent</option>
            <option value="company">Sort: Company Name</option>
            <option value="salary_desc">Sort: Salary (High to Low)</option>
          </select>

          {/* Recommended Filter Pill */}
          <button
            type="button"
            onClick={() => handleFilterChange('recommendedOnly', !filters.recommendedOnly)}
            className={`px-3.5 py-2 rounded-xl border flex items-center gap-1.5 flex-shrink-0 transition-all ${
              filters.recommendedOnly
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400 font-bold'
                : 'bg-white dark:bg-[#16181f] border-slate-200 dark:border-[#282a2d] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#202227]'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${filters.recommendedOnly ? 'fill-current text-amber-500' : 'text-slate-400'}`} />
            <span>Recommended (≥70%)</span>
          </button>

          {/* Hidden Jobs Pill */}
          <button
            type="button"
            onClick={() => setIsHiddenModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#202227] hover:bg-slate-200 dark:hover:bg-[#282a30] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 flex-shrink-0 transition-colors"
          >
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Hidden Jobs ({hiddenJobIds.length})</span>
          </button>

          {/* Clear Filters Reset */}
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-2 rounded-xl text-rose-500 hover:bg-rose-500/10 font-bold flex items-center gap-1 flex-shrink-0 transition-colors"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

        </div>
      </div>

      {/* MAIN WIDE HORIZONTAL JOB LISTINGS FEED */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Fetching verified job feeds & computing deterministic match scores...
          </p>
        </div>
      ) : filteredJobs.length > 0 ? (
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onViewDetails={(j) => {
                setSelectedJob(j);
                setIsDetailModalOpen(true);
              }}
              onJobConverted={() => {
                // Refresh if needed
              }}
              onHideJob={handleHideJob}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center bg-white dark:bg-[#16181f] rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-500 flex items-center justify-center mx-auto">
            <Briefcase className="w-6 h-6" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            No Jobs Matched Your Filters
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Try adjusting your search query, clearing specific location or role filters, or lowering the minimum match threshold.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-xl bg-pink-500 text-white font-bold text-xs hover:bg-pink-600 transition-colors inline-flex items-center gap-1.5 shadow-sm mt-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      )}

      {/* Slide-over Filter Drawer Panel */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        totalFilteredCount={filteredJobs.length}
      />

      {/* Hidden Jobs Modal */}
      <HiddenJobsModal
        isOpen={isHiddenModalOpen}
        onClose={() => setIsHiddenModalOpen(false)}
        hiddenJobIds={hiddenJobIds}
        allJobs={jobs}
        onRestoreJob={handleRestoreJob}
        onRestoreAll={handleRestoreAllJobs}
      />

      {/* Detailed Match Breakdown Modal */}
      <JobDetailModal
        job={selectedJob}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedJob(null);
        }}
      />
    </div>
  );
};
