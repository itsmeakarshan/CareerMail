import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Star,
  Bookmark,
  Trash2,
  Archive,
  Mail,
  Sparkles,
  ExternalLink,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';
import { emailsApi, gmailApi } from '../services/api';
import { Email } from '../types';
import { CompanyLogo } from '../components/common/CompanyLogo';
import { ComposeEmailModal } from '../components/email/ComposeEmailModal';

export const InboxPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const folder = searchParams.get('folder') || 'inbox';
  const searchQ = searchParams.get('q') || '';
  const navigate = useNavigate();

  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isComposeOpen, setIsComposeOpen] = useState<boolean>(false);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const list = searchQ ? await emailsApi.search(searchQ) : await emailsApi.getFolder(folder);
      setEmails(list);
      if (list.length > 0 && !selectedEmail) {
        setSelectedEmail(list[0]);
      } else if (list.length === 0) {
        setSelectedEmail(null);
      }
    } catch (err) {
      console.error('Error fetching emails:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, [folder, searchQ]);

  const handleSelectEmail = async (email: Email) => {
    setSelectedEmail(email);
    if (!email.read) {
      setEmails((prev) =>
        prev.map((e) => (e.id === email.id ? { ...e, read: true } : e))
      );
      try {
        await emailsApi.markRead(email.id, true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleToggleStar = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setEmails((prev) =>
      prev.map((item) => (item.id === id ? { ...item, starred: !item.starred } : item))
    );
    if (selectedEmail?.id === id) {
      setSelectedEmail((prev) => (prev ? { ...prev, starred: !prev.starred } : null));
    }
    await emailsApi.toggleStar(id);
  };

  const handleToggleImportant = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setEmails((prev) =>
      prev.map((item) => (item.id === id ? { ...item, important: !item.important } : item))
    );
    if (selectedEmail?.id === id) {
      setSelectedEmail((prev) => (prev ? { ...prev, important: !prev.important } : null));
    }
    await emailsApi.toggleImportant(id);
  };

  const handleDelete = async (id: number) => {
    await emailsApi.delete(id);
    setEmails((prev) => prev.filter((e) => e.id !== id));
    if (selectedEmail?.id === id) {
      setSelectedEmail(emails.find((e) => e.id !== id) || null);
    }
  };

  return (
    <div className="h-[calc(100vh-6.5rem)] flex flex-col md:flex-row bg-[#101626] border border-[#1e2640] rounded-2xl overflow-hidden shadow-2xl">
      {/* Email List Sidebar */}
      <div className="w-full md:w-96 lg:w-[420px] flex flex-col border-r border-[#1e2640] bg-[#0c111e] flex-shrink-0">
        {/* List Header */}
        <div className="p-4 border-b border-[#1e2640] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white capitalize">{folder}</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold">
              {emails.length}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={async () => {
                try {
                  setLoading(true);
                  await gmailApi.sync(300);
                  await fetchEmails();
                } catch (e) {
                  console.error(e);
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="px-2.5 py-1.5 rounded-xl bg-purple-950/80 text-purple-300 hover:bg-purple-900 border border-purple-800/40 text-xs font-semibold flex items-center gap-1 transition-colors"
              title="Sync incoming Gmail messages (last 3 months)"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync</span>
            </button>
            <button
              onClick={() => setIsComposeOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 border border-purple-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
              title="Test Email Auto-Extraction"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simulate</span>
            </button>
            <button
              onClick={fetchEmails}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Email Items List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#1e2640]/50">
          {emails.map((email) => {
            const isSelected = selectedEmail?.id === email.id;
            return (
              <div
                key={email.id}
                onClick={() => handleSelectEmail(email)}
                className={`p-3.5 cursor-pointer transition-all flex flex-col gap-1.5 relative ${
                  isSelected
                    ? 'bg-[#182138] border-l-4 border-purple-500'
                    : email.read
                    ? 'bg-transparent hover:bg-[#131b2e]'
                    : 'bg-[#12192c] hover:bg-[#162038]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {email.detectedCompany ? (
                      <CompanyLogo company={email.detectedCompany} size="sm" />
                    ) : (
                      <div className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300 flex-shrink-0">
                        {email.sender.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span
                      className={`text-xs truncate ${
                        !email.read ? 'font-bold text-white' : 'font-medium text-slate-300'
                      }`}
                    >
                      {email.sender}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-500 flex-shrink-0">
                    {formatEmailTime(email.timestamp)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-xs truncate ${
                      !email.read ? 'font-bold text-slate-100' : 'font-normal text-slate-400'
                    }`}
                  >
                    {email.subject}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 line-clamp-1">{email.preview}</p>

                {/* Tags & Action Icons */}
                <div className="flex items-center justify-between mt-1 pt-1">
                  <div className="flex items-center gap-1.5">
                    {email.jobRelated && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/40">
                        Job Auto-Detected
                      </span>
                    )}
                    {email.detectedStatus && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/40">
                        {email.detectedStatus}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleToggleStar(e, email.id)}
                      className={`p-1 rounded hover:bg-slate-800 transition-colors ${
                        email.starred ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'
                      }`}
                    >
                      <Star className="w-3.5 h-3.5 fill-current" />
                    </button>
                    <button
                      onClick={(e) => handleToggleImportant(e, email.id)}
                      className={`p-1 rounded hover:bg-slate-800 transition-colors ${
                        email.important ? 'text-purple-400' : 'text-slate-600 hover:text-slate-400'
                      }`}
                    >
                      <Bookmark className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {emails.length === 0 && !loading && (
            <div className="p-8 text-center text-xs text-slate-500">
              No emails found in {folder}. Connect your Google account and sync to scan your messages.
            </div>
          )}
        </div>
      </div>

      {/* Email Detail View */}
      <div className="flex-1 flex flex-col bg-[#101626] overflow-y-auto">
        {selectedEmail ? (
          <div className="flex-1 flex flex-col p-6 space-y-5">
            {/* Action Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-[#1e2640]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDelete(selectedEmail.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {}}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Archive"
                >
                  <Archive className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{selectedEmail.timestamp.replace('T', ' ').substring(0, 16)}</span>
              </div>
            </div>

            {/* Smart Pipeline Banner (The core value proposition!) */}
            {selectedEmail.jobRelated && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-950/60 to-indigo-950/60 border border-violet-700/40 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-violet-600/30 text-violet-300 border border-violet-500/40">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      CareerMail Intelligence Pipeline
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 inline" />
                    </span>
                    <span className="text-xs text-violet-200 mt-0.5">
                      Organized into tracker as{' '}
                      <strong>{selectedEmail.detectedRole || 'Software Engineer'}</strong> at{' '}
                      <strong>{selectedEmail.detectedCompany || 'Company'}</strong> ({selectedEmail.detectedStatus})
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/')}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-glow-purple flex-shrink-0"
                >
                  <span>View in Job Board</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Email Subject & Sender */}
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight leading-snug">
                {selectedEmail.subject}
              </h1>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#1e2640]/60">
                <div className="flex items-center gap-3">
                  {selectedEmail.detectedCompany ? (
                    <CompanyLogo company={selectedEmail.detectedCompany} size="md" />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-white">
                      {selectedEmail.sender.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-white">
                      {selectedEmail.sender}
                    </span>
                    <span className="text-xs text-slate-400">{selectedEmail.senderEmail}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-medium">
                    To: {selectedEmail.recipientEmail || 'Me'}
                  </span>
                </div>
              </div>
            </div>

            {/* Email Body */}
            <div className="pt-4 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
              {selectedEmail.body}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <Mail className="w-12 h-12 text-slate-600 mb-3" />
            <h4 className="text-sm font-semibold text-slate-300">No conversation selected</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Select an email from the list to view its contents and automatically extracted career
              data.
            </p>
          </div>
        )}
      </div>

      <ComposeEmailModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSuccess={fetchEmails}
      />
    </div>
  );
};

function formatEmailTime(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}
