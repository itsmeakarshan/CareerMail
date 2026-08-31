import React from 'react';
import { X, Lock, RotateCcw, Building2, MapPin, Trash2 } from 'lucide-react';
import { JobListing } from '../../types';
import { CompanyLogo } from '../common/CompanyLogo';

interface HiddenJobsModalProps {
  isOpen: boolean;
  onClose: () => void;
  hiddenJobIds: string[];
  allJobs: JobListing[];
  onRestoreJob: (jobId: string) => void;
  onRestoreAll: () => void;
}

export const HiddenJobsModal: React.FC<HiddenJobsModalProps> = ({
  isOpen,
  onClose,
  hiddenJobIds,
  allJobs,
  onRestoreJob,
  onRestoreAll
}) => {
  if (!isOpen) return null;

  const hiddenJobsList = allJobs.filter((j) => hiddenJobIds.includes(j.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-[#16181f] border border-slate-200 dark:border-[#282a2d] w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col transition-colors">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-[#282a2d] flex items-center justify-between bg-slate-50/60 dark:bg-[#1e2029]/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-[#282a30] text-slate-700 dark:text-slate-200">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Hidden & Ignored Jobs ({hiddenJobIds.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Jobs you have hidden from your match results
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

        {/* List of Hidden Jobs */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {hiddenJobsList.length > 0 ? (
            hiddenJobsList.map((job) => (
              <div
                key={job.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-[#202227] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <CompanyLogo
                    company={job.company}
                    domain={job.companyDomain}
                    logoUrl={job.companyLogoUrl}
                    sizeClassName="w-11 h-11"
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {job.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5 font-medium">
                      <span>{job.company}</span>
                      <span>•</span>
                      <span className="truncate">{job.location}</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onRestoreJob(job.id)}
                  className="px-3.5 py-1.5 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 dark:text-pink-400 font-bold text-xs flex items-center gap-1.5 flex-shrink-0 transition-colors border border-pink-500/20"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore</span>
                </button>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              <Lock className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <span>No hidden jobs. Click the ban icon on any job card to hide it.</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-[#282a2d] bg-slate-50/60 dark:bg-[#1e2029]/60 flex items-center justify-between">
          {hiddenJobIds.length > 0 && (
            <button
              type="button"
              onClick={onRestoreAll}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-[#282a30] hover:bg-slate-300 dark:hover:bg-[#32343c] text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore All Jobs</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="ml-auto px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
