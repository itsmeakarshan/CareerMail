import React, { useState } from 'react';
import {
  UserCheck,
  User,
  Bot,
  HelpCircle,
  Mail,
  Phone,
  Linkedin,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Send,
  Sparkles,
  Server,
  Info,
} from 'lucide-react';
import { JobApplication, RecruiterType } from '../../types';

interface Props {
  application: JobApplication;
  loading?: boolean;
  onComposeEmail?: (email: string, name: string) => void;
}

export const RecruiterIntelligenceCard: React.FC<Props> = ({
  application,
  loading = false,
  onComposeEmail,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Recruiter intelligence data from application
  const recruiterName = application.recruiterName;
  const recruiterEmail = application.recruiterEmail;
  const recruiterTitle = application.recruiterTitle || (application.recruiterType === 'AUTOMATED_SYSTEM' ? 'Automated ATS / System Delivery' : 'Talent Acquisition Partner');
  const recruiterPhone = application.recruiterPhone;
  const recruiterLinkedin = application.recruiterLinkedin;
  const recruiterType: RecruiterType = application.recruiterType || (recruiterName ? 'POSSIBLE_RECRUITER' : 'NO_RECRUITER_IDENTIFIED');
  const confidence = application.contactConfidence ?? (recruiterType === 'HUMAN_RECRUITER' ? 95 : (recruiterType === 'AUTOMATED_SYSTEM' ? 95 : (recruiterType === 'POSSIBLE_RECRUITER' ? 85 : 0)));
  const extractionSource = application.contactExtractionSource || (recruiterType === 'AUTOMATED_SYSTEM' ? 'Automated ATS Delivery' : 'Gmail Auto-Detection');

  const isAutomatedEmail = recruiterEmail && (
    recruiterEmail.toLowerCase().includes('noreply') ||
    recruiterEmail.toLowerCase().includes('no-reply') ||
    recruiterEmail.toLowerCase().includes('donotreply') ||
    recruiterEmail.toLowerCase().includes('notifications') ||
    recruiterEmail.toLowerCase().includes('careers@') ||
    recruiterEmail.toLowerCase().includes('jobs@') ||
    recruiterEmail.toLowerCase().includes('myworkday') ||
    recruiterEmail.toLowerCase().includes('greenhouse') ||
    recruiterEmail.toLowerCase().includes('bamboohr') ||
    recruiterEmail.toLowerCase().includes('ashbyhq') ||
    recruiterEmail.toLowerCase().includes('lever.co') ||
    recruiterEmail.toLowerCase().includes('apply4u') ||
    recruiterEmail.toLowerCase().includes('indeed') ||
    recruiterEmail.toLowerCase().includes('linkedin')
  );

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Recruiter status configuration
  const typeConfig: Record<
    RecruiterType,
    {
      label: string;
      badgeClass: string;
      icon: React.ReactNode;
      description: string;
    }
  > = {
    HUMAN_RECRUITER: {
      label: 'Human Recruiter Identified',
      badgeClass:
        'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60',
      icon: <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
      description: 'Verified direct human recruiter / talent partner.',
    },
    POSSIBLE_RECRUITER: {
      label: 'Possible Recruiter / Contact',
      badgeClass:
        'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700/60',
      icon: <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
      description: 'Human contact identified in email body or ATS signature.',
    },
    AUTOMATED_SYSTEM: {
      label: 'Automated System Sender',
      badgeClass:
        'bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600/60',
      icon: <Bot className="w-4 h-4 text-slate-500 dark:text-slate-400" />,
      description: 'Automated ATS / No-reply notification system.',
    },
    NO_RECRUITER_IDENTIFIED: {
      label: 'No Recruiter Identified',
      badgeClass:
        'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700/60',
      icon: <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
      description: 'No explicit human recruiter signature detected yet.',
    },
  };

  const currentConfig = typeConfig[recruiterType] || typeConfig.NO_RECRUITER_IDENTIFIED;

  const getInitials = (name?: string) => {
    if (!name) return 'RC';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#16181f] border border-[#e0e2e7] dark:border-[#282a2d] rounded-2xl p-5 shadow-sm animate-pulse space-y-4">
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3" />
        <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#16181f] border border-[#e0e2e7] dark:border-[#282a2d] rounded-2xl p-5 shadow-sm space-y-4 transition-all">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#e0e2e7] dark:border-[#282a2d] gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-pink-100 dark:bg-pink-950/80 border border-pink-200 dark:border-pink-800/40 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-4 h-4 text-pink-600 dark:text-pink-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-[#1f1f1f] dark:text-white tracking-tight flex items-center gap-2">
              <span>Recruiter & Contact Intelligence</span>
            </h3>
            <span className="text-[11px] text-[#5f6368] dark:text-slate-400 block truncate">
              Rule-based extraction &amp; contact verification
            </span>
          </div>
        </div>

        {/* Recruiter Classification Badge */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-sm ${currentConfig.badgeClass}`}
          >
            {currentConfig.icon}
            <span>{currentConfig.label}</span>
          </span>
        </div>
      </div>

      {/* Main Body */}
      {recruiterType === 'NO_RECRUITER_IDENTIFIED' && !recruiterName ? (
        <div className="p-4 bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#dadce0] dark:border-[#282a2d] rounded-xl flex items-start gap-3">
          <HelpCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#1f1f1f] dark:text-slate-200">
              No human recruiter identified for {application.company}.
            </p>
            <p className="text-[11px] text-[#5f6368] dark:text-slate-400 mt-1 leading-relaxed">
              Emails from this company are delivered via automated notification systems without a personal recruiter signature. If a recruiter reaches out in a future email, CareerMail will automatically extract and display their details here.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left Column: Contact Profile & Channels */}
          <div className="lg:col-span-8 space-y-3 min-w-0">
            <div className="flex items-start gap-3.5">
              {/* Avatar / Icon */}
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-inner ${
                  recruiterType === 'HUMAN_RECRUITER'
                    ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700/50'
                    : recruiterType === 'POSSIBLE_RECRUITER'
                    ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700/50'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                }`}
              >
                {recruiterType === 'AUTOMATED_SYSTEM' ? (
                  <Bot className="w-6 h-6 text-slate-500 dark:text-slate-300" />
                ) : (
                  getInitials(recruiterName)
                )}
              </div>

              {/* Names & Titles */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-[#1f1f1f] dark:text-white truncate">
                    {recruiterName || application.company + ' Contact'}
                  </h4>
                </div>
                <p className="text-xs font-semibold text-pink-600 dark:text-pink-400 mt-0.5 truncate">
                  {recruiterTitle}
                </p>
                <p className="text-[11px] text-[#5f6368] dark:text-slate-400 mt-0.5 truncate">
                  {currentConfig.description}
                </p>
              </div>
            </div>

            {/* Automated Sender Notice (when human contact was extracted from an automated sender) */}
            {isAutomatedEmail && recruiterType !== 'AUTOMATED_SYSTEM' && (
              <div className="p-2.5 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/40 rounded-xl flex items-center gap-2 text-[11px] text-blue-800 dark:text-blue-300">
                <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span className="truncate">
                  Sender address is an automated ATS relay (<strong>{recruiterEmail}</strong>), but human contact <strong>{recruiterName}</strong> was identified in the signature/body.
                </span>
              </div>
            )}

            {/* Direct Contact Channels */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {/* Email Address */}
              {recruiterEmail && (
                <div className="p-2.5 bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#e0e2e7] dark:border-[#282a2d] rounded-xl flex items-center justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <Mail className="w-3.5 h-3.5 text-pink-500 flex-shrink-0" />
                    <a
                      href={`mailto:${recruiterEmail}`}
                      className="text-xs text-[#1f1f1f] dark:text-slate-200 hover:text-pink-600 dark:hover:text-pink-400 font-medium truncate"
                      title={recruiterEmail}
                    >
                      {recruiterEmail}
                    </a>
                  </div>
                  <button
                    onClick={() => copyToClipboard(recruiterEmail, 'email')}
                    className="p-1 rounded-lg text-[#5f6368] dark:text-slate-400 hover:text-pink-600 dark:hover:text-pink-300 hover:bg-slate-200 dark:hover:bg-[#282a2d] transition-colors flex-shrink-0"
                    title="Copy Email"
                  >
                    {copiedField === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}

              {/* Phone Number */}
              {recruiterPhone ? (
                <div className="p-2.5 bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#e0e2e7] dark:border-[#282a2d] rounded-xl flex items-center justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <Phone className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <a
                      href={`tel:${recruiterPhone}`}
                      className="text-xs text-[#1f1f1f] dark:text-slate-200 hover:text-emerald-600 font-medium truncate"
                      title={recruiterPhone}
                    >
                      {recruiterPhone}
                    </a>
                  </div>
                  <button
                    onClick={() => copyToClipboard(recruiterPhone, 'phone')}
                    className="p-1 rounded-lg text-[#5f6368] dark:text-slate-400 hover:text-emerald-600 hover:bg-slate-200 dark:hover:bg-[#282a2d] transition-colors flex-shrink-0"
                    title="Copy Phone"
                  >
                    {copiedField === 'phone' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ) : null}

              {/* LinkedIn Profile */}
              {recruiterLinkedin && (
                <div className="p-2.5 bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#e0e2e7] dark:border-[#282a2d] rounded-xl flex items-center justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <Linkedin className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                    <a
                      href={recruiterLinkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium truncate flex items-center gap-1"
                    >
                      <span>LinkedIn Profile</span>
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Confidence & Source Meta Card */}
          <div className="lg:col-span-4 p-3.5 bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#e0e2e7] dark:border-[#282a2d] rounded-xl space-y-2.5 min-w-0">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-[#5f6368] dark:text-slate-400">Detection Confidence</span>
                <span className="font-bold text-[#1f1f1f] dark:text-white">{confidence}%</span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-[#282a2d] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    confidence >= 85
                      ? 'bg-emerald-500'
                      : confidence >= 70
                      ? 'bg-blue-500'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${confidence}%` }}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-[#dadce0] dark:border-[#282a2d] text-[11px] text-[#5f6368] dark:text-slate-400 space-y-1">
              <div className="flex items-center gap-1 truncate">
                <span className="font-semibold">Source:</span>
                <span className="text-[#1f1f1f] dark:text-slate-300 truncate">{extractionSource}</span>
              </div>
            </div>

            {/* Quick Email Action Button (only if valid email and not pure no-reply) */}
            {recruiterEmail && !isAutomatedEmail && (
              <div className="pt-1">
                <button
                  onClick={() => {
                    if (onComposeEmail) {
                      onComposeEmail(recruiterEmail, recruiterName || application.company);
                    } else {
                      window.location.href = `mailto:${recruiterEmail}?subject=${encodeURIComponent(
                        `Regarding application for ${application.title || 'Role'} at ${application.company}`
                      )}`;
                    }
                  }}
                  className="w-full py-1.5 px-3 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                >
                  <Send className="w-3 h-3" />
                  <span>Email Recruiter</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
