import React, { useState } from 'react';
import { X, Sparkles, Building2, MapPin, DollarSign, ExternalLink, PlusCircle, CheckCircle2, AlertCircle, Check, Info, Zap, BookOpen } from 'lucide-react';
import { JobListing } from '../../types';
import { jobSearchApi } from '../../services/api';
import { CompanyLogo } from '../common/CompanyLogo';

interface JobDetailModalProps {
  job: JobListing | null;
  isOpen: boolean;
  onClose: () => void;
  onJobConverted?: () => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({ job, isOpen, onClose, onJobConverted }) => {
  const [converting, setConverting] = useState(false);
  const [converted, setConverted] = useState(false);

  if (!isOpen || !job) return null;

  const handleTrackJob = async () => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-[#16181f] border border-slate-200 dark:border-[#282a2d] w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col transition-colors">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-[#282a2d] flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-[#1e2029]/50">
          <div className="flex items-start gap-4">
            <CompanyLogo
              company={job.company}
              domain={job.companyDomain}
              logoUrl={job.companyLogoUrl}
              sizeClassName="w-14 h-14"
            />
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                {job.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-2 mt-1">
                <Building2 className="w-3.5 h-3.5" />
                <span>{job.company}</span>
                <span>•</span>
                <MapPin className="w-3.5 h-3.5" />
                <span>{job.location}</span>
                <span>•</span>
                <span className="text-pink-600 dark:text-pink-400 font-bold">{job.salary || 'Competitive market rate'}</span>
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Match Score Estimate Meter Box */}
          <div className="bg-gradient-to-br from-pink-500/10 via-purple-500/5 to-transparent border border-pink-500/20 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-pink-500" />
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    CareerMail Match Breakdown
                  </h3>
                  <span className="text-[10px] font-bold text-pink-500 uppercase tracking-widest">
                    {job.matchQualityLabel || 'MATCH ESTIMATE'}
                  </span>
                </div>
              </div>
              <div className="text-3xl font-black text-pink-500">
                {job.matchScore} / 100
              </div>
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
              <Info className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />
              <span>Calculated deterministically in C# using exact skills, Gemini semantic relationships, role relevance & experience compatibility.</span>
            </div>

            {/* 5-Pillar Score Breakdown Progress Bars */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2">
              
              {/* Technical Skills 40% */}
              <div className="space-y-1 bg-white/70 dark:bg-[#16181f]/70 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300">Technical Skills</span>
                  <span className="text-pink-500">{job.skillsScore} / 40</span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-pink-500 to-rose-400 rounded-full transition-all duration-500"
                    style={{ width: `${(job.skillsScore / 40) * 100}%` }}
                  />
                </div>
              </div>

              {/* Role Relevance 25% */}
              <div className="space-y-1 bg-white/70 dark:bg-[#16181f]/70 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300">Role & Title</span>
                  <span className="text-pink-500">{job.roleRelevanceScore} / 25</span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-pink-500 to-rose-400 rounded-full transition-all duration-500"
                    style={{ width: `${(job.roleRelevanceScore / 25) * 100}%` }}
                  />
                </div>
              </div>

              {/* Experience 15% */}
              <div className="space-y-1 bg-white/70 dark:bg-[#16181f]/70 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300">Experience Fit</span>
                  <span className="text-pink-500">{job.experienceRelevanceScore} / 15</span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-pink-500 to-rose-400 rounded-full transition-all duration-500"
                    style={{ width: `${(job.experienceRelevanceScore / 15) * 100}%` }}
                  />
                </div>
              </div>

              {/* Location 10% */}
              <div className="space-y-1 bg-white/70 dark:bg-[#16181f]/70 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300">Location / Work Mode</span>
                  <span className="text-pink-500">{job.locationScore} / 10</span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-pink-500 to-rose-400 rounded-full transition-all duration-500"
                    style={{ width: `${(job.locationScore / 10) * 100}%` }}
                  />
                </div>
              </div>

              {/* Education 10% */}
              <div className="space-y-1 bg-white/70 dark:bg-[#16181f]/70 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300">Education Fit</span>
                  <span className="text-pink-500">{job.educationScore} / 10</span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-pink-500 to-rose-400 rounded-full transition-all duration-500"
                    style={{ width: `${(job.educationScore / 10) * 100}%` }}
                  />
                </div>
              </div>

            </div>

            {/* Score Explanation Text */}
            <div className="text-xs bg-white/80 dark:bg-[#16181f]/80 p-3 rounded-xl text-slate-700 dark:text-slate-300 leading-relaxed border border-slate-200/50 dark:border-slate-800">
              <span className="font-bold text-slate-900 dark:text-white">Why this match? </span>
              {job.explanation}
            </div>
          </div>

          {/* Three Categorized Skill Sections: Exact Matches, Related Matches, Missing Skills */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* 1. Exact Matching Skills */}
            <div className="bg-slate-50 dark:bg-[#202227] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5">
              <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Exact Matches ({(job.matchingSkills || []).length})</span>
              </h4>
              {(job.matchingSkills || []).length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {(job.matchingSkills || []).map((s) => (
                    <span
                      key={s}
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                    >
                      ✓ {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400">No exact keyword matches found.</p>
              )}
            </div>

            {/* 2. Related / Semantic Transferable Skills */}
            <div className="bg-slate-50 dark:bg-[#202227] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5">
              <h4 className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                <span>Related Skills ({(job.relatedSkills || []).length})</span>
              </h4>
              {(job.relatedSkills || []).length > 0 ? (
                <div className="space-y-1.5">
                  {(job.relatedSkills || []).map((r) => (
                    <div
                      key={r.jobSkill}
                      className="text-[11px] p-2 rounded-lg bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20"
                    >
                      <div className="font-bold flex items-center justify-between">
                        <span>{r.candidateSkill} → {r.jobSkill}</span>
                        <span className="text-[10px] font-mono opacity-80">{Math.round(r.weightMultiplier * 100)}% credit</span>
                      </div>
                      <p className="text-[10px] text-purple-600 dark:text-purple-400/90 mt-0.5">{r.explanation}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400">No semantic skill substitutions required.</p>
              )}
            </div>

            {/* 3. Missing Skills */}
            <div className="bg-slate-50 dark:bg-[#202227] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5">
              <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>Missing Skills ({(job.missingSkills || []).length})</span>
              </h4>
              {(job.missingSkills || []).length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {(job.missingSkills || []).map((s) => (
                    <span
                      key={s}
                      className="text-xs font-medium px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400">Great fit! All required skills matched.</p>
              )}
            </div>

          </div>

          {/* Job Description Text */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Job Description
            </h4>
            <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-50 dark:bg-[#202227] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 max-h-60 overflow-y-auto">
              {job.description || 'No detailed description text provided in public feed.'}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-[#282a2d] bg-slate-50/50 dark:bg-[#1e2029]/50 flex items-center justify-between gap-3">
          <button
            onClick={handleTrackJob}
            disabled={converting || converted}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition-all ${
              converted
                ? 'bg-emerald-500 text-white cursor-default'
                : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white'
            }`}
          >
            {converted ? (
              <>
                <Check className="w-4 h-4" />
                <span>Tracked in Job Pipeline</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                <span>{converting ? 'Tracking...' : '1-Click Track Application'}</span>
              </>
            )}
          </button>

          {job.url && (
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#282a30] hover:bg-slate-200 dark:hover:bg-[#32343c] text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <span>Apply on Company Website</span>
              <ExternalLink className="w-3.5 h-3.5 text-pink-500" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
