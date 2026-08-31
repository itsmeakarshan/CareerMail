import React, { useState } from 'react';
import {
  MapPin,
  Clock,
  Briefcase,
  DollarSign,
  GraduationCap,
  Sparkles,
  Heart,
  Ban,
  CheckCircle2,
  PlusCircle,
  Check,
  Zap
} from 'lucide-react';
import { JobListing } from '../../types';
import { jobSearchApi } from '../../services/api';
import { CompanyLogo } from '../common/CompanyLogo';

interface JobCardProps {
  job: JobListing;
  onViewDetails: (job: JobListing) => void;
  onJobConverted?: () => void;
  onHideJob?: (jobId: string) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onViewDetails, onJobConverted, onHideJob }) => {
  const [saved, setSaved] = useState(false);
  const [converting, setConverting] = useState(false);
  const [converted, setConverted] = useState(false);

  const handleTrackInPipeline = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (converted || converting) return;
    setConverting(true);
    try {
      await jobSearchApi.convertToApplication(job);
      setConverted(true);
      if (onJobConverted) onJobConverted();
    } catch {
      // Fallback
    } finally {
      setConverting(false);
    }
  };

  const handleHide = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onHideJob) {
      onHideJob(job.id);
    }
  };

  // Color Theme based on Match Score
  const getTheme = (score: number) => {
    if (score >= 85) {
      return {
        sideCardBg: 'bg-gradient-to-b from-[#1b2b34] to-[#121c22]',
        ringColor: '#10b981', // emerald-500
        pillBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        textColor: 'text-emerald-500'
      };
    }
    if (score >= 70) {
      return {
        sideCardBg: 'bg-gradient-to-b from-[#241e38] to-[#151221]',
        ringColor: '#a855f7', // purple-500
        pillBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
        textColor: 'text-purple-500'
      };
    }
    if (score >= 50) {
      return {
        sideCardBg: 'bg-gradient-to-b from-[#2a241e] to-[#1a1612]',
        ringColor: '#f59e0b', // amber-500
        pillBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        textColor: 'text-amber-500'
      };
    }
    return {
      sideCardBg: 'bg-gradient-to-b from-[#222329] to-[#16171b]',
      ringColor: '#64748b', // slate-500
      pillBg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
      textColor: 'text-slate-500'
    };
  };

  const theme = getTheme(job.matchScore);
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (job.matchScore / 100) * circumference;

  const getMatchLevelText = (score: number) => {
    if (score >= 85) return 'STRONG MATCH';
    if (score >= 70) return 'GOOD MATCH';
    if (score >= 50) return 'FAIR MATCH';
    return 'LOW MATCH';
  };

  return (
    <div
      onClick={() => onViewDetails(job)}
      className="group relative flex flex-col md:flex-row bg-white dark:bg-[#16181f] border border-slate-200/90 dark:border-[#282a2d] rounded-2xl md:rounded-3xl shadow-sm hover:shadow-xl dark:hover:shadow-pink-950/20 hover:border-pink-500/40 transition-all duration-200 overflow-hidden cursor-pointer w-full"
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
                  {job.matchScore >= 80 && (
                    <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      High Skill Match
                    </span>
                  )}
                  {(job.experienceLevel?.includes('Entry') || job.title.toLowerCase().includes('graduate') || job.title.toLowerCase().includes('junior') || job.title.toLowerCase().includes('0-1')) && (
                    <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-500 border border-purple-500/20">
                      🎓 Graduate / 0-1 Yrs Exp
                    </span>
                  )}
                  {job.location.toLowerCase().includes('remote') && (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-500 border border-blue-500/20">
                      Remote Friendly
                    </span>
                  )}
                </div>

                {/* Job Title */}
                <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-pink-500 transition-colors leading-tight">
                  {job.title}
                </h3>

                {/* Company Name & Tagline */}
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium line-clamp-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300">{job.company}</span>
                  <span className="mx-1 text-slate-400">•</span>
                  <span>{job.description ? job.description.slice(0, 85) + '...' : 'Verified tech opportunity'}</span>
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

            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-[#202227] px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800/80">
              <DollarSign className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span className="font-bold text-slate-900 dark:text-slate-100 truncate">{job.salary || 'Competitive market rate'}</span>
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
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span className="font-medium truncate">{(job.matchingSkills || []).length} Exact + {(job.relatedSkills || []).length} Related</span>
            </div>
          </div>

          {/* Quick Skills Pill Preview */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {(job.matchingSkills || []).slice(0, 4).map((s) => (
              <span
                key={s}
                className="text-[11px] font-semibold px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
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
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>Verified job posting</span>
          </div>

          <div className="flex items-center gap-2">
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

            {/* CareerMail Assist Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(job);
              }}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-[#202227] hover:bg-slate-200 dark:hover:bg-[#282a30] text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-800 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-pink-500" />
              <span>CAREERMAIL ASSIST</span>
            </button>

            {/* 1-Click Track Button */}
            <button
              type="button"
              onClick={handleTrackInPipeline}
              disabled={converting || converted}
              className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition-all ${
                converted
                  ? 'bg-emerald-500 text-white cursor-default'
                  : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white'
              }`}
            >
              {converted ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>TRACKED</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>{converting ? 'ADDING...' : '1-CLICK TRACK'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR BLOCK: CIRCULAR MATCH GAUGE & BREAKDOWN */}
      <div className={`w-full md:w-56 p-6 flex flex-col items-center justify-between text-center border-t md:border-t-0 md:border-l border-slate-200 dark:border-[#282a2d] transition-colors ${theme.sideCardBg}`}>
        
        {/* SVG Circular Ring Gauge */}
        <div className="relative w-24 h-24 flex items-center justify-center my-auto">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 64 64">
            {/* Background Ring */}
            <circle
              cx="32"
              cy="32"
              r={radius}
              stroke="currentColor"
              strokeWidth="5"
              className="text-slate-200 dark:text-slate-800"
              fill="transparent"
            />
            {/* Value Progress Ring */}
            <circle
              cx="32"
              cy="32"
              r={radius}
              stroke={theme.ringColor}
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
            <span className="text-xl font-black text-white leading-none">
              {job.matchScore}<span className="text-xs font-bold">%</span>
            </span>
          </div>
        </div>

        {/* Match Title & Key Metrics */}
        <div className="space-y-2 mt-3 w-full">
          <div className="text-xs font-black tracking-wider uppercase text-white">
            {getMatchLevelText(job.matchScore)}
          </div>

          <div className="text-[11px] text-slate-300 space-y-1 pt-1 text-left font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span className="truncate">{(job.matchingSkills || []).length} Exact + {(job.relatedSkills || []).length} Related</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span className="truncate">Role Relevance Fit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span className="truncate">Experience Fit</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
