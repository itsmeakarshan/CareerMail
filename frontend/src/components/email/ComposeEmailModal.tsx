import React, { useState, useEffect } from 'react';
import { X, Send, Sparkles, Wand2, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { emailsApi } from '../../services/api';

interface ComposeProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialTo?: string;
  initialSubject?: string;
  initialBody?: string;
  recruiterName?: string;
  roleTitle?: string;
  companyName?: string;
}

export const ComposeEmailModal: React.FC<ComposeProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialTo = '',
  initialSubject = '',
  initialBody,
  recruiterName,
  roleTitle,
  companyName,
}) => {
  const [to, setTo] = useState(initialTo);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody || '');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Compute clean recruiter first name or fallback
  const getRecruiterDisplayName = () => {
    if (!recruiterName || recruiterName.trim().length === 0) return '';
    const clean = recruiterName.trim();
    // If it has corporate words like "Recruiting" or "Team", use the full clean string or fallback
    if (clean.toLowerCase().includes('team') || clean.toLowerCase().includes('recruiting') || clean.toLowerCase().includes('careers')) {
      return clean;
    }
    return clean.split(/\s+/)[0];
  };

  const recruiterFirstName = getRecruiterDisplayName();

  const generateFollowUpMessage = () => {
    const greeting = recruiterFirstName ? `Hey ${recruiterFirstName},` : 'Hey,';
    const roleStr = roleTitle ? `the ${roleTitle}` : 'this';
    const compStr = companyName ? ` at ${companyName}` : '';
    return `${greeting}\n\nI had applied for ${roleStr} role${compStr} and I am eager to know the further process.\n\nCould you please let me know if there are any updates regarding my application?\n\nBest regards,\nAkarshan`;
  };

  useEffect(() => {
    if (isOpen) {
      setTo(initialTo || '');
      setSubject(
        initialSubject ||
          `Regarding application for ${roleTitle || 'Role'}${companyName ? ` at ${companyName}` : ''}`
      );
      if (initialBody) {
        setBody(initialBody);
      } else {
        setBody(generateFollowUpMessage());
      }
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen, initialTo, initialSubject, initialBody, recruiterName, roleTitle, companyName]);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to.trim()) {
      setErrorMessage('Please enter a recipient email address.');
      return;
    }
    if (!subject.trim()) {
      setErrorMessage('Please enter an email subject.');
      return;
    }
    if (!body.trim()) {
      setErrorMessage('Please write your email message body.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await emailsApi.send({
        to: to.trim(),
        subject: subject.trim(),
        body: body.trim(),
      });

      setSuccessMessage('Email successfully sent through your connected Gmail account!');
      setTimeout(() => {
        setSuccessMessage(null);
        setTo('');
        setSubject('');
        setBody('');
        if (onSuccess) onSuccess();
        onClose();
      }, 1600);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send email through Gmail. Please ensure Gmail is connected.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFollowUpTemplate = () => {
    setBody(generateFollowUpMessage());
    if (!subject || subject.trim() === '') {
      setSubject(`Regarding application for ${roleTitle || 'Role'}${companyName ? ` at ${companyName}` : ''}`);
    }
  };

  const buttonLabel = recruiterFirstName
    ? `Hey ${recruiterFirstName}, I had applied for this role and I am eager to know the further process`
    : `Hey, I had applied for this role and I am eager to know the further process`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-[#16181f] border border-[#e0e2e7] dark:border-[#282a2d] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-[#f6f8fc] dark:bg-[#111318] border-b border-[#e0e2e7] dark:border-[#282a2d] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-pink-600 dark:text-pink-400" />
            <h3 className="text-base font-bold text-[#1f1f1f] dark:text-white tracking-tight">New Gmail Message</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-black dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#282a2d] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Smart Follow-Up Action Bar */}
        <div className="p-4 bg-[#f0f4f9] dark:bg-[#111318] border-b border-[#e0e2e7] dark:border-[#282a2d] space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-pink-700 dark:text-pink-300">
            <Sparkles className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400" />
            <span>Quick Recruiter Follow-up</span>
          </div>
          <div>
            <button
              type="button"
              onClick={handleApplyFollowUpTemplate}
              className="w-full text-left px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/40 dark:to-rose-950/40 border border-pink-200/90 dark:border-pink-800/50 text-pink-800 dark:text-pink-200 text-xs font-semibold hover:border-pink-400 dark:hover:border-pink-600 transition-all flex items-center justify-between gap-2 shadow-sm group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-pink-500 flex-shrink-0 animate-pulse" />
                <span className="truncate">
                  &ldquo;{buttonLabel}&rdquo;
                </span>
              </div>
              <span className="text-[10px] text-pink-600 dark:text-pink-400 font-bold bg-white dark:bg-[#16181f] px-2 py-0.5 rounded-md border border-pink-200 dark:border-pink-800/60 flex-shrink-0 group-hover:bg-pink-600 group-hover:text-white transition-colors">
                Apply Template
              </span>
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950/90 border-b border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-rose-100 dark:bg-rose-950/90 border-b border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center justify-between gap-2 animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSend} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#5f6368] dark:text-slate-300 mb-1">
              Recipient Email (To) *
            </label>
            <input
              type="email"
              required
              placeholder="recruiter@company.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full px-3 py-2 bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#dadce0] dark:border-[#282a2d] rounded-xl text-sm text-[#1f1f1f] dark:text-white placeholder-slate-400 focus:outline-none focus:border-pink-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5f6368] dark:text-slate-300 mb-1">
              Subject *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Following up on Full Stack Engineer Application"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#dadce0] dark:border-[#282a2d] rounded-xl text-sm text-[#1f1f1f] dark:text-white placeholder-slate-400 focus:outline-none focus:border-pink-400 transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-[#5f6368] dark:text-slate-300">
                Message Body *
              </label>
              <button
                type="button"
                onClick={handleApplyFollowUpTemplate}
                className="text-[11px] text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <Wand2 className="w-3 h-3" />
                <span>Reset to Recruiter Follow-up</span>
              </button>
            </div>
            <textarea
              required
              rows={6}
              placeholder="Write your email here..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-3 py-2 bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#dadce0] dark:border-[#282a2d] rounded-xl text-sm text-[#1f1f1f] dark:text-white placeholder-slate-400 focus:outline-none focus:border-pink-400 resize-none font-sans leading-relaxed transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e0e2e7] dark:border-[#282a2d]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-sm font-medium text-[#5f6368] dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#282a2d] transition-colors disabled:opacity-50"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 hover:from-pink-600 hover:to-rose-600 text-white text-sm font-bold shadow-md shadow-pink-500/25 disabled:opacity-50 flex items-center gap-2 transition-all hover:scale-105"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Delivering via Gmail API...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send via Gmail</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
