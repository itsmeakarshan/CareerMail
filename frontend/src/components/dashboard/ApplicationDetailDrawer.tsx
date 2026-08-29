import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  DollarSign,
  Calendar,
  Briefcase,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Mail,
  Copy,
  Check,
  Sparkles,
  Maximize2,
  Clock,
  MailOpen,
} from 'lucide-react';
import { JobApplication, ApplicationStatus, Email } from '../../types';
import { CompanyLogo } from '../common/CompanyLogo';
import { emailsApi } from '../../services/api';
import { EmailContentViewer } from '../email/EmailContentViewer';
import { RecruiterIntelligenceCard } from '../applications/RecruiterIntelligenceCard';
import { ComposeEmailModal } from '../email/ComposeEmailModal';

interface DrawerProps {
  application: JobApplication | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (id: number, newStatus: ApplicationStatus) => Promise<void>;
  onEdit?: (app: JobApplication) => void;
  onDelete?: (id: number) => Promise<void>;
}

export const ApplicationDetailDrawer: React.FC<DrawerProps> = ({
  application,
  isOpen,
  onClose,
  onStatusChange,
}) => {
  const [linkedEmails, setLinkedEmails] = useState<Email[]>([]);
  const [loadingEmails, setLoadingEmails] = useState<boolean>(false);
  const [expandedEmailId, setExpandedEmailId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [selectedFullEmail, setSelectedFullEmail] = useState<Email | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState<boolean>(false);
  const [composeTo, setComposeTo] = useState<string>('');
  const [composeSubject, setComposeSubject] = useState<string>('');

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (application && isOpen) {
      const fetchAppEmails = async () => {
        setLoadingEmails(true);
        try {
          // Fetch synced emails linked to this job application
          const res = await emailsApi.getByApplication(application.id);
          setLinkedEmails(res);
          if (res.length > 0) {
            setExpandedEmailId(res[0].id);
          } else {
            setExpandedEmailId(null);
          }
        } catch (err) {
          console.error('Error fetching linked emails:', err);
          setLinkedEmails([]);
        } finally {
          setLoadingEmails(false);
        }
      };

      fetchAppEmails();
    } else {
      setLinkedEmails([]);
      setExpandedEmailId(null);
      setSelectedFullEmail(null);
    }
  }, [application, isOpen]);

  const handleCopyBody = (id: number, body: string) => {
    // If HTML, strip tags for clean text copy
    const textToCopy = /<(!DOCTYPE|html|head|body|div|p|span|table|tr|td|a|img|h[1-6]|style)[^>]*>/i.test(body)
      ? body.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s{2,}/g, ' ')
            .trim()
      : body;

    navigator.clipboard.writeText(textToCopy);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen || !application) return null;

  const statusOptions: ApplicationStatus[] = [
    'APPLIED',
    'ASSESSMENT',
    'RECRUITER_SCREEN',
    'INTERVIEW',
    'FINAL_INTERVIEW',
    'OFFER',
    'REJECTED',
    'WITHDRAWN',
  ];

  return (
    <>
      {/* Center Screen Modal Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 animate-fadeIn"
        onClick={onClose}
      >
        {/* Center Modal Dialog Container */}
        <div
          className="bg-white dark:bg-[#16181f] border border-[#e0e2e7] dark:border-[#282a2d] rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-popIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-[#e0e2e7] dark:border-[#282a2d] flex items-center justify-between bg-white dark:bg-[#16181f] gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <CompanyLogo company={application.company} size="lg" />
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg md:text-xl font-bold text-[#1f1f1f] dark:text-white tracking-tight leading-tight truncate">
                    {application.company}
                  </h2>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950/80 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800/40 font-semibold flex-shrink-0">
                    {application.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <span className="text-xs md:text-sm font-semibold text-[#5f6368] dark:text-slate-300 mt-0.5 truncate">
                  {application.title || 'Software Engineer'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Quick Status Selector */}
              <div className="hidden sm:flex items-center gap-2">
                <label className="text-xs font-semibold text-[#5f6368] dark:text-slate-400">Stage:</label>
                <select
                  value={application.status}
                  onChange={(e) => onStatusChange(application.id, e.target.value as ApplicationStatus)}
                  className="px-3 py-1.5 bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#dadce0] dark:border-[#282a2d] rounded-xl text-xs font-semibold text-[#1f1f1f] dark:text-white focus:outline-none focus:border-pink-400"
                >
                  {statusOptions.map((st) => (
                    <option key={st} value={st}>
                      {st.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#282a2d] transition-colors"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Unified Merged Content Area (Overview + Emails in One Place) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f6f8fc] dark:bg-[#111318] custom-scrollbar">
            
            {/* 1. Overview & Key Application Details Card */}
            <div className="bg-white dark:bg-[#16181f] border border-[#e0e2e7] dark:border-[#282a2d] rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#e0e2e7] dark:border-[#282a2d]">
                <h3 className="text-sm font-bold text-[#1f1f1f] dark:text-white tracking-tight flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-pink-500 dark:text-pink-400" />
                  <span>Application Overview</span>
                </h3>
                {application.dateApplied && (
                  <span className="text-xs text-[#5f6368] dark:text-slate-400 font-medium">
                    Applied on: <strong className="text-[#1f1f1f] dark:text-slate-200">{application.dateApplied}</strong>
                  </span>
                )}
              </div>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#e0e2e7] dark:border-[#282a2d] rounded-xl flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-pink-500 flex-shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] text-[#5f6368] dark:text-slate-400">Location</span>
                    <span className="text-xs font-semibold text-[#1f1f1f] dark:text-white truncate">
                      {application.location || 'Remote'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#e0e2e7] dark:border-[#282a2d] rounded-xl flex items-center gap-2.5">
                  <DollarSign className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] text-[#5f6368] dark:text-slate-400">Compensation</span>
                    <span className="text-xs font-semibold text-[#1f1f1f] dark:text-white truncate">
                      {application.salary || 'Competitive'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#e0e2e7] dark:border-[#282a2d] rounded-xl flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] text-[#5f6368] dark:text-slate-400">Priority</span>
                    <span className="text-xs font-semibold text-[#1f1f1f] dark:text-white truncate">
                      {application.priority || 'Medium'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#e0e2e7] dark:border-[#282a2d] rounded-xl flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-pink-500 flex-shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] text-[#5f6368] dark:text-slate-400">Status Note</span>
                    <span className="text-xs font-semibold text-[#1f1f1f] dark:text-white truncate">
                      {application.activitySubtitle || application.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Job Posting URL & User Notes */}
              {(application.jobUrl || application.notes) && (
                <div className="pt-2 border-t border-[#e0e2e7] dark:border-[#282a2d] space-y-2.5">
                  {application.jobUrl && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#5f6368] dark:text-slate-400">Posting URL:</span>
                      <a
                        href={application.jobUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-1 truncate font-medium"
                      >
                        <span className="truncate">{application.jobUrl}</span>
                        <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                      </a>
                    </div>
                  )}

                  {application.notes && (
                    <div>
                      <span className="block text-xs font-semibold text-[#5f6368] dark:text-slate-400 mb-1">Notes:</span>
                      <div className="p-3 bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#e0e2e7] dark:border-[#282a2d] rounded-xl text-xs text-[#1f1f1f] dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {application.notes}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. Recruiter & Contact Intelligence Card */}
            <RecruiterIntelligenceCard
              application={application}
              onComposeEmail={(toEmail, _toName) => {
                setComposeTo(toEmail);
                setComposeSubject(`Regarding application for ${application.title || 'Role'} at ${application.company}`);
                setIsComposeOpen(true);
              }}
            />

            {/* 3. Synchronized Emails Section (Merged in Same View) */}
            <div className="bg-white dark:bg-[#16181f] border border-[#e0e2e7] dark:border-[#282a2d] rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#e0e2e7] dark:border-[#282a2d]">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-pink-500 dark:text-pink-400" />
                  <h3 className="text-sm font-bold text-[#1f1f1f] dark:text-white tracking-tight">
                    Synchronized Email Messages
                  </h3>
                  <span className="px-2 py-0.2 rounded-full text-xs bg-pink-100 dark:bg-pink-950/80 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800/40 font-bold">
                    {linkedEmails.length}
                  </span>
                </div>
                <span className="text-xs text-[#5f6368] dark:text-slate-400">
                  Real emails matched to {application.company}
                </span>
              </div>

              {loadingEmails ? (
                <div className="p-8 text-center text-xs text-[#5f6368] dark:text-slate-400">Loading email threads...</div>
              ) : linkedEmails.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#5f6368] dark:text-slate-500 bg-[#f6f8fc] dark:bg-[#1e1f20] rounded-2xl border border-dashed border-[#dadce0] dark:border-slate-800">
                  No synced emails directly tied to this company yet. Click &apos;Sync Gmail&apos; on the dashboard to fetch recent emails.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {linkedEmails.map((email) => {
                    const isExpanded = expandedEmailId === email.id;

                    return (
                      <div
                        key={email.id}
                        className="rounded-2xl border border-[#e0e2e7] dark:border-[#282a2d] bg-white dark:bg-[#1e1f20] overflow-hidden transition-all shadow-sm"
                      >
                        {/* Email Accordion Header */}
                        <div
                          onClick={() => setExpandedEmailId(isExpanded ? null : email.id)}
                          className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#f6f8fc] dark:hover:bg-[#282a2d]/80 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-pink-100 dark:bg-pink-950/80 border border-pink-200 dark:border-pink-700/40 flex items-center justify-center flex-shrink-0">
                              <Mail className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-[#1f1f1f] dark:text-white truncate">
                                {email.subject}
                              </span>
                              <span className="text-[11px] text-[#5f6368] dark:text-slate-400 truncate">
                                From: {email.sender} ({email.senderEmail}) •{' '}
                                {new Date(email.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <button className="text-[#5f6368] dark:text-slate-400 hover:text-black dark:hover:text-white p-1">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Expanded Clean Email Body */}
                        {isExpanded && (
                          <div className="px-5 pb-5 pt-3 border-t border-[#e0e2e7] dark:border-[#282a2d] bg-[#f6f8fc] dark:bg-[#111318] space-y-3.5 animate-fadeIn">
                            {/* Metadata & Actions Bar */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
                                  Folder: {email.folder}
                                </span>
                                {email.classification && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950 text-pink-800 dark:text-pink-200 border border-pink-200 dark:border-pink-700/50">
                                    {email.classification}
                                  </span>
                                )}
                                {email.detectedRecruiterName && (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                                    Contact: {email.detectedRecruiterName}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleCopyBody(email.id, email.body)}
                                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1e1f20] hover:bg-slate-100 dark:hover:bg-[#282a2d] border border-[#dadce0] dark:border-slate-700 text-[10px] font-semibold text-[#444746] dark:text-slate-300 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1"
                                  title="Copy clean text"
                                >
                                  {copiedId === email.id ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-500" />
                                      <span className="text-emerald-500">Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3 text-slate-400" />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => setSelectedFullEmail(email)}
                                  className="px-2.5 py-1 rounded-lg bg-pink-100 dark:bg-pink-950/70 hover:bg-pink-200 dark:hover:bg-pink-900/80 border border-pink-200 dark:border-pink-700/50 text-[10px] font-semibold text-pink-700 dark:text-pink-300 hover:text-pink-900 dark:hover:text-white transition-colors flex items-center gap-1"
                                  title="Pop-out reading modal"
                                >
                                  <Maximize2 className="w-3 h-3" />
                                  <span>Expand</span>
                                </button>
                              </div>
                            </div>

                            {/* Formatted Rich Email Body with Exact Gmail Rendering & Working Links */}
                            <div className="pt-1">
                              <EmailContentViewer body={email.body} />
                            </div>

                            {/* Quick Reply Link */}
                            {email.senderEmail && (
                              <div className="pt-1 flex justify-end">
                                <a
                                  href={`mailto:${email.senderEmail}?subject=Re: ${encodeURIComponent(email.subject)}`}
                                  className="text-[11px] font-semibold text-pink-600 dark:text-pink-400 hover:underline inline-flex items-center gap-1.5"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                  <span>Reply via Email Client</span>
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pop-out Full Screen Email Reader Modal with High z-index & High Contrast */}
      {selectedFullEmail && (
        <div className="fixed inset-0 z-[1000] bg-black/80 flex items-center justify-center p-4 md:p-8 animate-fadeIn">
          <div className="bg-white dark:bg-[#16181f] border border-[#e0e2e7] dark:border-[#282a2d] rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-popIn">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#e0e2e7] dark:border-[#282a2d] flex items-center justify-between bg-[#f6f8fc] dark:bg-[#111318]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-pink-100 dark:bg-pink-950 border border-pink-200 dark:border-pink-600/50 flex items-center justify-center">
                  <MailOpen className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                </div>
                <div className="flex flex-col min-w-0">
                  <h3 className="text-base font-bold text-[#1f1f1f] dark:text-white tracking-tight truncate">
                    {selectedFullEmail.subject}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-[#5f6368] dark:text-slate-300 mt-0.5">
                    <span>
                      From: <strong className="text-[#1f1f1f] dark:text-white">{selectedFullEmail.sender}</strong> ({selectedFullEmail.senderEmail})
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedFullEmail(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-black dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#282a2d] transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Email Meta Info Bar */}
            <div className="px-6 py-2.5 bg-[#f0f4f9] dark:bg-[#111318] border-b border-[#e0e2e7] dark:border-[#282a2d] flex items-center justify-between text-xs text-[#5f6368] dark:text-slate-300">
              <span>Date: {new Date(selectedFullEmail.timestamp).toLocaleString()}</span>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[10px] font-bold border border-slate-300 dark:border-slate-700">
                  Folder: {selectedFullEmail.folder}
                </span>
                {selectedFullEmail.detectedCompany && (
                  <span className="px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950 text-pink-800 dark:text-pink-200 border border-pink-200 dark:border-pink-700/50 text-[10px] font-bold">
                    {selectedFullEmail.detectedCompany}
                  </span>
                )}
              </div>
            </div>

            {/* Full Email Message Content */}
            <div className="p-6 overflow-y-auto flex-1 bg-white dark:bg-[#111318] custom-scrollbar">
              <EmailContentViewer body={selectedFullEmail.body} />
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#f6f8fc] dark:bg-[#16181f] border-t border-[#e0e2e7] dark:border-[#282a2d] flex items-center justify-between">
              <button
                onClick={() => handleCopyBody(selectedFullEmail.id, selectedFullEmail.body)}
                className="px-4 py-2 bg-white dark:bg-[#1e1f20] hover:bg-[#f0f4f9] dark:hover:bg-[#282a2d] text-[#444746] dark:text-slate-200 hover:text-black dark:hover:text-white rounded-xl text-xs font-semibold transition-all border border-[#dadce0] dark:border-slate-700 flex items-center gap-1.5"
              >
                {copiedId === selectedFullEmail.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-500">Copied to Clipboard</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setSelectedFullEmail(null)}
                className="px-5 py-2 bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-400 hover:to-rose-300 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                Done Reading
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Compose Modal to Recruiter */}
      <ComposeEmailModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        initialTo={composeTo}
        initialSubject={composeSubject}
        recruiterName={application.recruiterName}
        roleTitle={application.title}
        companyName={application.company}
      />
    </>
  );
};
