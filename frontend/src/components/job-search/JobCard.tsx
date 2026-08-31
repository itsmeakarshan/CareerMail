import React, { useState } from 'react';
import {
  MapPin,
  Clock,
  Briefcase,
  Banknote,
  GraduationCap,
  Sparkles,
  Heart,
  Ban,
  CheckCircle2,
  Zap,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { JobListing } from '../../types';
import { CompanyLogo } from '../common/CompanyLogo';
import { jobSearchApi } from '../../services/api';

interface JobCardProps {
  job: JobListing;
  onViewDetails?: (job: JobListing) => void;
  onHideJob?: (jobId: string) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onViewDetails, onHideJob }) => {
  const [saved, setSaved] = useState(false);
  const [resolvingLink, setResolvingLink] = useState(false);

  const handleOpenRealJob = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // 1. Direct verified ATS or live provider URLs
    if (
      job.applyUrl?.includes('greenhouse.io') ||
      job.applyUrl?.includes('lever.co') ||
      job.applyUrl?.includes('remotive.com') ||
      job.applyUrl?.includes('remoteok.com') ||
      job.applyUrl?.includes('jobicy.com') ||
      job.applyUrl?.includes('ashbyhq.com') ||
      job.applyUrl?.includes('workable.com') ||
      job.applyUrl?.includes('amazon.jobs') ||
      job.applyUrl?.includes('careers.google.com') ||
      job.applyUrl?.includes('careers.deliveroo.co.uk') ||
      job.applyUrl?.includes('deepmind.google/careers') ||
      job.applyUrl?.includes('revolut.com/careers')
    ) {
      window.open(job.applyUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    // 2. Ask Gemini AI for the real verified career URL
    setResolvingLink(true);
    try {
      const res = await jobSearchApi.resolveRealLink({
        jobId: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        currentUrl: job.applyUrl || job.url
      });

      if (res?.realJobUrl) {
        window.open(res.realJobUrl, '_blank', 'noopener,noreferrer');
        return;
      }
    } catch {
      // Fallback
    } finally {
      setResolvingLink(false);
    }

    const fallbackUrl =
      job.applyUrl ||
      job.url ||
      `https://www.google.com/search?q=${encodeURIComponent(`${job.company} ${job.title} careers apply`)}`;

    window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
  };

  const handleHide = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onHideJob) {
      onHideJob(job.id);
    }
  };

  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (job.matchScore / 100) * circumference;

  const getMatchLevelText = (score: number) => {
    if (score >= 85) return 'STRONG MATCH';
    if (score >= 70) return 'GOOD MATCH';
    if (score >= 50) return 'FAIR MATCH';
    return 'LOW MATCH';
  };

  const isAtsOrDirect =
    job.applyUrl?.includes('greenhouse.io') ||
    job.applyUrl?.includes('lever.co') ||
    job.applyUrl?.includes('remotive.com') ||
    job.applyUrl?.includes('remoteok.com') ||
    job.applyUrl?.includes('jobicy.com');

  const applyButtonText = isAtsOrDirect
    ? 'APPLY ON COMPANY ATS'
    : (job.source?.includes('Careers') ? `APPLY ON ${job.company.toUpperCase()}` : 'APPLY / VIEW JOB');

  return (
    <div
      onClick={() => handleOpenRealJob()}
      className="group relative flex flex-col md:flex-row bg-white dark:bg-[#16181f] border border-slate-200/90 dark:border-[#282a2d] rounded-2xl md:rounded-3xl shadow-sm hover:shadow-xl dark:hover:shadow-pink-950/30 hover:border-pink-500/50 transition-all duration-200 overflow-hidden cursor-pointer w-full"
      title="Click anywhere on card to open real job posting in new tab"
    >
      {/* LEFT SECTION: MAIN JOB CONTENT & METADATA */}
      <div className="flex-1 p-5 md:p-6 flex flex-col justify-between space-y-4">
        
        {/* Top Header: Company Logo, Badges & Options Menu */}
        <div>
          <div className="flex items-start justify-between gap-4 mb-2.5">
            <div className="flex items-start gap-3.5">
              {/* Bulletproof Company Logo Component */}
              <CompanyLogo
                company={job.company}
                domain={job.companyDomain}
                logoUrl={job.companyLogoUrl}
                sizeClassName="w-14 h-14"
              />

              <div>
                {/* Time & Highlight Tags Above Title */}
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#202227] text-slate-600 dark:text-slate-400">
                    {job.postedDate || 'Recently posted'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20">
                    {job.source}
                  </span>
                  {job.matchScore >= 80 && (
                    <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-pink-500/10 text-pink-500 border border-pink-500/25">
                      High Skill Match
                    </span>
                  )}
                  {(job.experienceLevel?.includes('Entry') || job.title.toLowerCase().includes('graduate') || job.title.toLowerCase().includes('junior') || job.title.toLowerCase().includes('0-1')) && (
                    <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-500 border border-purple-500/20">
                      🎓 Grad / 0-1 Yrs Exp
                    </span>
                  )}
                  {job.location.toLowerCase().includes('remote') && (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-500 border border-blue-500/20">
                      Remote Friendly
                    </span>
                  )}
                </div>

                {/* Job Title with External Link Icon Indicator */}
                <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-pink-500 transition-colors leading-tight flex items-center gap-2">
                  <span>{job.title}</span>
                  {resolvingLink ? (
                    <Loader2 className="w-4 h-4 text-pink-500 animate-spin" />
                  ) : (
                    <ExternalLink className="w-4 h-4 text-pink-500 flex-shrink-0 opacity-70 group-hover:opacity-100" />
                  )}
                </h3>

                {/* Company Name & Description Snippet */}
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium line-clamp-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300">{job.company}</span>
                  <span className="mx-1 text-slate-400">•</span>
                  <span>{job.description ? job.description.slice(0, 85) + '...' : 'Verified real tech vacancy'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* 2x3 Grid of Key Metadata Icons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 my-4 pt-1 text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-[#202227] px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800/80">
              <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="font-medium truncate">{job.location}</span>
            </div>

            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-[#202227] px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800/80">
              <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="font-medium truncate">{job.employmentType}</span>
            </div>

            {/* Universal Currency Compensation Chip (No hardcoded Dollar sign) */}
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-[#202227] px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800/80">
              <Banknote className="w-4 h-4 text-pink-500 flex-shrink-0" />
              <span className="font-bold text-slate-900 dark:text-slate-100 truncate">{job.salary || 'Competitive compensation'}</span>
            </div>

            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-[#202227] px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800/80">
              <Briefcase className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="font-medium truncate">{job.source}</span>
            </div>

            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-[#202227] px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800/80">
              <GraduationCap className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="font-medium truncate">{job.experienceLevel || 'Degree Preferred'}</span>
            </div>

            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-[#202227] px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800/80">
              <CheckCircle2 className="w-4 h-4 text-pink-500 flex-shrink-0" />
              <span className="font-medium truncate">{(job.matchingSkills || []).length} Exact + {(job.relatedSkills || []).length} Related</span>
            </div>
          </div>

          {/* Quick Skills Pill Preview */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {(job.matchingSkills || []).slice(0, 4).map((s) => (
              <span
                key={s}
                className="text-[11px] font-semibold px-2.5 py-0.5 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20"
              >
                ✓ {s}
              </span>
            ))}
            {(job.relatedSkills || []).slice(0, 2).map((r) => (
              <span
                key={r.jobSkill}
                className="text-[11px] font-semibold px-2.5 py-0.5 rounded-lg bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 flex items-center gap-1"
                title={`${r.candidateSkill} applies to ${r.jobSkill} (${Math.round(r.weightMultiplier * 100)}% credit)`}
              >
                <Zap className="w-3 h-3 text-purple-500" />
                <span>{r.candidateSkill} → {r.jobSkill}</span>
              </span>
            ))}
            {(job.missingSkills || []).slice(0, 2).map((m) => (
              <span
                key={m}
                className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-rose-500/5 text-rose-600 dark:text-rose-400 border border-rose-500/20"
              >
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-[#282a2d]">
          <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-pink-500 inline-block" />
            <span>Click card to open real verified job posting</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Ignore / Hide Button */}
            <button
              type="button"
              onClick={handleHide}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/10 dark:hover:bg-rose-500/10 hover:border-rose-500/30 transition-colors"
              title="Hide this job from results"
            >
              <Ban className="w-4 h-4" />
            </button>

            {/* Bookmark / Save Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSaved(!saved);
              }}
              className={`p-2.5 rounded-xl border transition-colors ${
                saved
                  ? 'bg-pink-500/10 border-pink-500/30 text-pink-500'
                  : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#202227]'
              }`}
              title="Bookmark / Save Job"
            >
              <Heart className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
            </button>

            {/* Primary Real Job Apply Button */}
            <button
              type="button"
              onClick={(e) => handleOpenRealJob(e)}
              disabled={resolvingLink}
              className="px-4 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 disabled:opacity-70 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm hover:shadow-pink-500/25 transition-all"
              title="Open real application page"
            >
              {resolvingLink ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>RESOLVING LINK...</span>
                </>
              ) : (
                <>
                  <span>{applyButtonText}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-white" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR BLOCK: LUXURY CAREERMAIL PINK MATCH GAUGE */}
      <div className="w-full md:w-56 p-6 flex flex-col items-center justify-between text-center border-t md:border-t-0 md:border-l border-pink-500/20 dark:border-pink-500/20 bg-gradient-to-b from-[#220d1b] via-[#180913] to-[#10050c] dark:from-[#220d1b] dark:via-[#180913] dark:to-[#10050c] shadow-inner transition-colors">
        
        {/* SVG Circular Pink Gradient Ring Gauge */}
        <div className="relative w-24 h-24 flex items-center justify-center my-auto">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 64 64">
            <defs>
              <linearGradient id={`pinkRingGrad-${job.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#f43f5e" />
              </linearGradient>
            </defs>

            {/* Background Ring */}
            <circle
              cx="32"
              cy="32"
              r={radius}
              stroke="rgba(236, 72, 153, 0.18)"
              strokeWidth="5"
              fill="transparent"
            />
            {/* Value Progress Ring */}
            <circle
              cx="32"
              cy="32"
              r={radius}
              stroke={`url(#pinkRingGrad-${job.id})`}
              strokeWidth="5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-out"
            />
          </svg>

          {/* Percentage Text Center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-white leading-none tracking-tight">
              {job.matchScore}<span className="text-xs font-bold text-pink-400 ml-0.5">%</span>
            </span>
          </div>
        </div>

        {/* Match Title & Key Metrics */}
        <div className="space-y-2.5 mt-3 w-full">
          <div className="px-2.5 py-0.5 rounded-full bg-pink-500/15 text-pink-400 border border-pink-500/30 text-[10px] font-black tracking-widest uppercase inline-block">
            {getMatchLevelText(job.matchScore)}
          </div>

          <div className="text-[11px] text-pink-100/90 space-y-1 pt-1 text-left font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />
              <span className="truncate">{(job.matchingSkills || []).length} Exact + {(job.relatedSkills || []).length} Related</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />
              <span className="truncate">Role Relevance Fit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />
              <span className="truncate">Experience Fit</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
