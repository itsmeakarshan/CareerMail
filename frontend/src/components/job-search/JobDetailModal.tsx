import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Sparkles,
  Building2,
  MapPin,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Zap,
  Briefcase,
  Clock,
  Banknote,
  GraduationCap,
  FileText
} from 'lucide-react';
import { JobListing } from '../../types';
import { CompanyLogo } from '../common/CompanyLogo';

interface JobDetailModalProps {
  job: JobListing | null;
  isOpen: boolean;
  onClose: () => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({ job, isOpen, onClose }) => {
  // Prevent background scrolling while modal is open
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

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !job) return null;

  const isLinkedInOnly =
    (job.source || '').toLowerCase().includes('linkedin') &&
    !job.applyUrl?.includes('greenhouse') &&
    !job.applyUrl?.includes('lever') &&
    !job.applyUrl?.includes('careers.');

  const applyButtonText = isLinkedInOnly
    ? 'View on LinkedIn'
    : (job.applyUrl ? 'Apply on Company Site' : 'Apply for Job');

  const directApplyUrl = job.applyUrl || job.sourceUrl || job.url;

  // Defensive values to avoid NaN or undefined crashes
  const skillsScore = job.skillsScore ?? 0;
  const roleScore = job.roleRelevanceScore ?? 0;
  const expScore = job.experienceRelevanceScore ?? 0;
  const locScore = job.locationScore ?? 0;
  const eduScore = job.educationScore ?? 0;
  const totalScore = job.matchScore ?? Math.min(100, skillsScore + roleScore + expScore + locScore + eduScore);

  const matchingSkills = job.matchingSkills || [];
  const relatedSkills = job.relatedSkills || [];
  const missingSkills = job.missingSkills || [];

  const modalContent = (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md transition-opacity animate-fadeIn"
      style={{ minHeight: '100vh', minWidth: '100vw' }}
    >
      {/* Modal Dialog Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#16181f] border border-slate-200 dark:border-pink-500/20 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col my-auto transition-all animate-scaleUp"
      >
        
        {/* Header Bar */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-[#282a2d] flex items-start justify-between gap-4 bg-slate-50/90 dark:bg-[#1e131d]/90 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-start gap-4">
            <CompanyLogo
              company={job.company}
              domain={job.companyDomain}
              logoUrl={job.companyLogoUrl}
              sizeClassName="w-14 h-14"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20">
                  {job.source}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#202227] text-slate-500 dark:text-slate-400">
                  {job.postedDate || 'Recently posted'}
                </span>
                {totalScore >= 80 && (
                  <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    High Fit Match
                  </span>
                )}
              </div>

              <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                {job.title}
              </h2>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1.5">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <strong className="text-slate-700 dark:text-slate-200">{job.company}</strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{job.location}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-pink-600 dark:text-pink-400 font-bold">
                  <Banknote className="w-3.5 h-3.5" />
                  <span>{job.salary || 'Competitive compensation'}</span>
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-2xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-[#282a2d] transition-colors flex-shrink-0"
            title="Close dialog (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-200">
          
          {/* Top Score Banner */}
          <div className="bg-gradient-to-br from-[#240e1b] via-[#1a0a14] to-[#12060e] border border-pink-500/25 rounded-3xl p-5 text-white shadow-md space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-pink-200">
                    Deterministic Match Intelligence
                  </h3>
                  <div className="text-[11px] text-pink-300/80 font-medium">
                    Calculated in C# across 5 verified evidence pillars
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-3xl font-black text-pink-400 leading-none">
                    {totalScore}<span className="text-lg font-bold text-pink-200 ml-0.5">%</span>
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-pink-300 mt-0.5">
                    {job.matchQualityLabel || 'MATCH ESTIMATE'}
                  </div>
                </div>
              </div>
            </div>

            {/* 5-Pillar Score Progress Bars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-2">
              
              {/* Technical Skills 40% */}
              <div className="bg-black/30 p-3 rounded-2xl border border-pink-500/20 space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-pink-100">Skills Fit</span>
                  <span className="text-pink-400">{skillsScore} / 40</span>
                </div>
                <div className="w-full h-1.5 bg-pink-950/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-pink-500 to-rose-400 rounded-full"
                    style={{ width: `${Math.min(100, (skillsScore / 40) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Role Relevance 25% */}
              <div className="bg-black/30 p-3 rounded-2xl border border-pink-500/20 space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-pink-100">Role & Title</span>
                  <span className="text-pink-400">{roleScore} / 25</span>
                </div>
                <div className="w-full h-1.5 bg-pink-950/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-pink-500 to-rose-400 rounded-full"
                    style={{ width: `${Math.min(100, (roleScore / 25) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Experience 15% */}
              <div className="bg-black/30 p-3 rounded-2xl border border-pink-500/20 space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-pink-100">Experience Fit</span>
                  <span className="text-pink-400">{expScore} / 15</span>
                </div>
                <div className="w-full h-1.5 bg-pink-950/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-pink-500 to-rose-400 rounded-full"
                    style={{ width: `${Math.min(100, (expScore / 15) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Location 10% */}
              <div className="bg-black/30 p-3 rounded-2xl border border-pink-500/20 space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-pink-100">Location</span>
                  <span className="text-pink-400">{locScore} / 10</span>
                </div>
                <div className="w-full h-1.5 bg-pink-950/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-pink-500 to-rose-400 rounded-full"
                    style={{ width: `${Math.min(100, (locScore / 10) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Education 10% */}
              <div className="bg-black/30 p-3 rounded-2xl border border-pink-500/20 space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-pink-100">Education</span>
                  <span className="text-pink-400">{eduScore} / 10</span>
                </div>
                <div className="w-full h-1.5 bg-pink-950/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-pink-500 to-rose-400 rounded-full"
                    style={{ width: `${Math.min(100, (eduScore / 10) * 100)}%` }}
                  />
                </div>
              </div>

            </div>

            {/* Explanation Note */}
            <div className="text-xs bg-black/40 p-3 rounded-xl text-pink-100/90 leading-relaxed border border-pink-500/15">
              <span className="font-bold text-white">Match Rationale: </span>
              {job.explanation || 'Calculated deterministically using technical skills coverage, role relevance tokens, experience level compatibility, and location alignment.'}
            </div>
          </div>

          {/* SIDE-BY-SIDE SKILL COMPARISON MATRIX */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-500" />
              <span>Skills Comparison: Your CV vs Job Requirements</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* 1. Exact Matching Skills */}
              <div className="bg-emerald-50/50 dark:bg-[#12221b] p-4 rounded-2xl border border-emerald-500/20 space-y-2.5">
                <h5 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Exact Skills Match</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-extrabold">
                    {matchingSkills.length} Found
                  </span>
                </h5>
                {matchingSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {matchingSkills.map((s) => (
                      <span
                        key={s}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30"
                      >
                        ✓ {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400">No exact keyword overlap found in candidate CV.</p>
                )}
              </div>

              {/* 2. Semantic Transferable Skills */}
              <div className="bg-purple-50/50 dark:bg-[#1f162c] p-4 rounded-2xl border border-purple-500/20 space-y-2.5">
                <h5 className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-purple-500" />
                    <span>Related / Semantic Skills</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-300 font-extrabold">
                    {relatedSkills.length} Transferable
                  </span>
                </h5>
                {relatedSkills.length > 0 ? (
                  <div className="space-y-1.5">
                    {relatedSkills.map((r) => (
                      <div
                        key={r.jobSkill}
                        className="text-[11px] p-2 rounded-xl bg-purple-500/10 text-purple-800 dark:text-purple-200 border border-purple-500/20"
                      >
                        <div className="font-bold flex items-center justify-between">
                          <span>{r.candidateSkill} ➔ {r.jobSkill}</span>
                          <span className="text-[10px] font-mono text-purple-400">{Math.round(r.weightMultiplier * 100)}% credit</span>
                        </div>
                        <p className="text-[10px] text-purple-600 dark:text-purple-400/90 mt-0.5">{r.explanation}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400">No semantic skill substitutions required.</p>
                )}
              </div>

              {/* 3. Missing Skills / Skill Gaps */}
              <div className="bg-rose-50/50 dark:bg-[#28151b] p-4 rounded-2xl border border-rose-500/20 space-y-2.5">
                <h5 className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                    <span>Missing Skills Gaps</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-300 font-extrabold">
                    {missingSkills.length} Gaps
                  </span>
                </h5>
                {missingSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {missingSkills.map((s) => (
                      <span
                        key={s}
                        className="text-xs font-medium px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-800 dark:text-rose-200 border border-rose-500/30"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    Outstanding! All core technical requirements matched.
                  </p>
                )}
              </div>

            </div>
          </div>

          {/* Job Requirements & Overview Metadata Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#202227] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <Briefcase className="w-4 h-4 text-slate-400" />
              <div>
                <div className="text-[10px] text-slate-400">Employment</div>
                <div className="font-bold text-slate-800 dark:text-slate-200">{job.employmentType}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#202227] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <GraduationCap className="w-4 h-4 text-slate-400" />
              <div>
                <div className="text-[10px] text-slate-400">Experience</div>
                <div className="font-bold text-slate-800 dark:text-slate-200">{job.experienceLevel || 'Entry Level'}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#202227] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <MapPin className="w-4 h-4 text-slate-400" />
              <div>
                <div className="text-[10px] text-slate-400">Work Mode</div>
                <div className="font-bold text-slate-800 dark:text-slate-200">{job.workMode || 'REMOTE'}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#202227] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <Clock className="w-4 h-4 text-slate-400" />
              <div>
                <div className="text-[10px] text-slate-400">Posted</div>
                <div className="font-bold text-slate-800 dark:text-slate-200">{job.postedDate || 'Recently'}</div>
              </div>
            </div>
          </div>

          {/* Full Job Description Section */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-pink-500" />
              <span>Full Job Description</span>
            </h4>
            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-50 dark:bg-[#202227] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 max-h-72 overflow-y-auto">
              {job.description || 'No detailed description text provided in the public feed.'}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-200 dark:border-[#282a2d] bg-slate-50/90 dark:bg-[#1e131d]/90 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            Source: <span className="font-bold text-slate-700 dark:text-slate-300">{job.source}</span>
          </div>

          <div className="flex items-center gap-2.5">
            {job.sourceUrl && (
              <a
                href={job.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-[#202227] hover:bg-slate-300 dark:hover:bg-[#282a30] text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 transition-colors"
              >
                <span>View Job</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            )}

            {directApplyUrl && (
              <a
                href={directApplyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm hover:shadow-pink-500/30 transition-all"
              >
                <span>{applyButtonText}</span>
                <ExternalLink className="w-3.5 h-3.5 text-white" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
