import React, { useRef, useState } from 'react';
import { Upload, FileText, CheckCircle2, Sparkles, AlertCircle, RefreshCw, Briefcase, GraduationCap, Clock } from 'lucide-react';
import { CvProfile } from '../../types';
import { jobSearchApi } from '../../services/api';

interface CvUploadWidgetProps {
  cvProfile: CvProfile | null;
  onProfileUpdated: (profile: CvProfile) => void;
}

export const CvUploadWidget: React.FC<CvUploadWidgetProps> = ({ cvProfile, onProfileUpdated }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processUpload(file);
  };

  const processUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const profile = await jobSearchApi.uploadCv(file);
      onProfileUpdated(profile);
    } catch (err: any) {
      setError(err.message || 'Failed to upload and extract CV text');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white dark:bg-[#16181f] border border-slate-200 dark:border-[#282a2d] rounded-2xl p-5 shadow-sm mb-6 transition-colors">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.docx,.txt"
        className="hidden"
      />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Side: Title & Status */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>CV Profile & Skill Intelligence</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  Deterministic NLP Active
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload your CV (PDF, DOCX, or TXT) to extract skills and compute your CareerMail Match Estimate.
              </p>
            </div>
          </div>

          {cvProfile ? (
            <div className="space-y-2.5 pt-1">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-lg border border-emerald-200 dark:border-emerald-900/50">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{cvProfile.fileName}</span>
                </span>
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-[#202227] px-2.5 py-1 rounded-lg font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{cvProfile.experienceYears === 0 ? '🎓 Graduate / Entry Level (0-1 yrs exp)' : `~${cvProfile.experienceYears} yrs exp`}</span>
                </span>
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-[#202227] px-2.5 py-1 rounded-lg">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                  <span>{cvProfile.educationLevel}</span>
                </span>
              </div>

              {/* Extracted Skills Chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-400 mr-1">Extracted Skills:</span>
                {(cvProfile.extractedSkills || []).map((skill) => (
                  <span
                    key={skill}
                    className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-pink-50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-900/40"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/40">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>No CV uploaded yet. Using standard default developer profile baseline for match scoring.</span>
            </div>
          )}

          {error && (
            <div className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/40 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Right Side: Upload Action Button */}
        <div className="flex-shrink-0 flex items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-sm flex items-center gap-2 ${
              uploading
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 shadow-pink-500/20 active:scale-95'
            }`}
          >
            {uploading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Extracting Text...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 stroke-[2.5]" />
                <span>{cvProfile ? 'Re-upload CV' : 'Upload CV (.pdf, .docx)'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
