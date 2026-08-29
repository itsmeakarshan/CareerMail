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
import { EmailContentViewer } from '../components/email/EmailContentViewer';
import { useTheme } from '../context/ThemeContext';

export const InboxPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const folder = searchParams.get('folder') || 'inbox';
  const searchQ = searchParams.get('q') || '';
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

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
    <div
      className={`h-[calc(100vh-6.5rem)] flex flex-col md:flex-row border rounded-2xl overflow-hidden shadow-2xl transition-colors duration-200 ${
        isDark ? 'bg-[#16181f] border-[#282a2d]' : 'bg-white border-[#e0e2e7]'
      }`}
    >
      {/* Email List Sidebar */}
      <div
        className={`w-full md:w-96 lg:w-[420px] flex flex-col border-r flex-shrink-0 ${
          isDark ? 'bg-[#16181f] border-[#282a2d]' : 'bg-[#f0f4f9] border-[#e0e2e7]'
        }`}
      >
        {/* List Header */}
        <div
          className={`p-4 border-b flex items-center justify-between ${
            isDark ? 'border-[#282a2d]' : 'border-[#e0e2e7]'
          }`}
        >
          <div className="flex items-center gap-2">
            <h2
              className={`text-base font-bold capitalize ${
                isDark ? 'text-white' : 'text-[#1f1f1f]'
              }`}
            >
              {folder}
            </h2>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                isDark ? 'bg-[#282a2d] text-slate-300' : 'bg-[#e0e2e7] text-slate-700'
              }`}
            >
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
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-colors ${
                isDark
                  ? 'bg-pink-950/80 text-pink-300 hover:bg-pink-900 border-pink-800/40'
                  : 'bg-pink-100 text-pink-800 hover:bg-pink-200 border-pink-200'
              }`}
              title="Sync incoming Gmail messages (last 3 months)"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync</span>
            </button>
            <button
              onClick={() => setIsComposeOpen(true)}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-colors ${
                isDark
                  ? 'bg-pink-600/20 text-pink-300 hover:bg-pink-600/30 border-pink-500/30'
                  : 'bg-pink-50 text-pink-700 hover:bg-pink-100 border-pink-200'
              }`}
              title="Test Email Auto-Extraction"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simulate</span>
            </button>
            <button
              onClick={fetchEmails}
              className={`p-1.5 rounded-lg transition-colors ${
                isDark ? 'text-slate-400 hover:text-white hover:bg-[#282a2d]' : 'text-slate-600 hover:text-black hover:bg-[#e0e2e7]'
              }`}
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Email Items List */}
        <div
          className={`flex-1 overflow-y-auto divide-y ${
            isDark ? 'divide-[#282a2d]' : 'divide-[#e0e2e7]'
          }`}
        >
          {emails.map((email) => {
            const isSelected = selectedEmail?.id === email.id;

            let itemBg = '';
            if (isDark) {
              if (isSelected) {
                itemBg = 'bg-[#282a2d] border-l-4 border-pink-400';
              } else if (!email.read) {
                itemBg = 'bg-[#1e1f20] hover:bg-[#282a2d]/70';
              } else {
                itemBg = 'bg-transparent hover:bg-[#202227]';
              }
            } else {
              if (isSelected) {
                itemBg = 'bg-[#fce7f3]/80 border-l-4 border-pink-500';
              } else if (!email.read) {
                itemBg = 'bg-white hover:bg-[#fdf2f8] font-semibold';
              } else {
                itemBg = 'bg-[#f0f4f9] hover:bg-[#e4e8ee]';
              }
            }

            return (
              <div
                key={email.id}
                onClick={() => handleSelectEmail(email)}
                className={`p-3.5 cursor-pointer transition-all flex flex-col gap-1.5 relative ${itemBg}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {email.detectedCompany ? (
                      <CompanyLogo company={email.detectedCompany} size="sm" />
                    ) : (
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                          isDark ? 'bg-[#282a2d] text-slate-300' : 'bg-[#e0e2e7] text-slate-700'
                        }`}
                      >
                        {email.sender.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span
                      className={`text-xs truncate ${
                        !email.read
                          ? isDark ? 'font-bold text-white' : 'font-bold text-[#1f1f1f]'
                          : isDark ? 'font-medium text-slate-300' : 'font-medium text-[#444746]'
                      }`}
                    >
                      {email.sender}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] flex-shrink-0 ${
                      isDark ? 'text-[#8e918f]' : 'text-[#5f6368]'
                    }`}
                  >
                    {formatEmailTime(email.timestamp)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-xs truncate ${
                      !email.read
                        ? isDark ? 'font-bold text-slate-100' : 'font-bold text-[#1f1f1f]'
                        : isDark ? 'font-normal text-slate-400' : 'font-normal text-[#5f6368]'
                    }`}
                  >
                    {email.subject}
                  </span>
                </div>

                <p
                  className={`text-[11px] line-clamp-1 ${
                    isDark ? 'text-[#8e918f]' : 'text-[#5f6368]'
                  }`}
                >
                  {email.preview}
                </p>

                {/* Tags & Action Icons */}
                <div className="flex items-center justify-between mt-1 pt-1">
                  <div className="flex items-center gap-1.5">
                    {email.jobRelated && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                          isDark
                            ? 'bg-pink-950/80 text-pink-300 border-pink-800/40'
                            : 'bg-pink-100 text-pink-800 border-pink-200'
                        }`}
                      >
                        Job Auto-Detected
                      </span>
                    )}
                    {email.detectedStatus && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                          isDark
                            ? 'bg-slate-800 text-slate-300 border-slate-700'
                            : 'bg-slate-200 text-slate-800 border-slate-300'
                        }`}
                      >
                        {email.detectedStatus}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleToggleStar(e, email.id)}
                      className={`p-1 rounded transition-colors ${
                        email.starred
                          ? 'text-amber-400'
                          : isDark ? 'text-slate-600 hover:text-slate-400' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <Star className="w-3.5 h-3.5 fill-current" />
                    </button>
                    <button
                      onClick={(e) => handleToggleImportant(e, email.id)}
                      className={`p-1 rounded transition-colors ${
                        email.important
                          ? 'text-pink-400'
                          : isDark ? 'text-slate-600 hover:text-slate-400' : 'text-slate-400 hover:text-slate-600'
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
      <div
        className={`flex-1 flex flex-col overflow-y-auto ${
          isDark ? 'bg-[#111318]' : 'bg-white'
        }`}
      >
        {selectedEmail ? (
          <div className="flex-1 flex flex-col p-6 space-y-5">
            {/* Action Bar */}
            <div
              className={`flex items-center justify-between pb-4 border-b ${
                isDark ? 'border-[#282a2d]' : 'border-[#e0e2e7]'
              }`}
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDelete(selectedEmail.id)}
                  className={`p-2 rounded-xl transition-colors ${
                    isDark ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-950/30' : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                  }`}
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {}}
                  className={`p-2 rounded-xl transition-colors ${
                    isDark ? 'text-slate-400 hover:text-white hover:bg-[#282a2d]' : 'text-slate-500 hover:text-black hover:bg-[#e0e2e7]'
                  }`}
                  title="Archive"
                >
                  <Archive className="w-4 h-4" />
                </button>
              </div>

              <div
                className={`flex items-center gap-2 text-xs ${
                  isDark ? 'text-[#8e918f]' : 'text-[#5f6368]'
                }`}
              >
                <span>{selectedEmail.timestamp.replace('T', ' ').substring(0, 16)}</span>
              </div>
            </div>

            {/* Smart Pipeline Banner */}
            {selectedEmail.jobRelated && (
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between shadow-md ${
                  isDark
                    ? 'bg-gradient-to-r from-pink-950/60 to-rose-950/60 border-pink-800/40 text-pink-200'
                    : 'bg-gradient-to-r from-pink-50 to-rose-50 border-pink-200 text-pink-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl border ${
                      isDark ? 'bg-pink-600/30 text-pink-300 border-pink-500/40' : 'bg-pink-200 text-pink-800 border-pink-300'
                    }`}
                  >
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span
                      className={`text-xs font-bold flex items-center gap-1.5 ${
                        isDark ? 'text-white' : 'text-[#1f1f1f]'
                      }`}
                    >
                      CareerMail Intelligence Pipeline
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 inline" />
                    </span>
                    <span className="text-xs mt-0.5">
                      Organized into tracker as{' '}
                      <strong>{selectedEmail.detectedRole || 'Software Engineer'}</strong> at{' '}
                      <strong>{selectedEmail.detectedCompany || 'Company'}</strong> ({selectedEmail.detectedStatus})
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/')}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-400 hover:to-rose-300 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm flex-shrink-0"
                >
                  <span>View in Job Board</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Email Subject & Sender */}
            <div>
              <h1
                className={`text-xl font-bold tracking-tight leading-snug ${
                  isDark ? 'text-white' : 'text-[#1f1f1f]'
                }`}
              >
                {selectedEmail.subject}
              </h1>

              <div
                className={`flex items-center justify-between mt-3 pt-3 border-t ${
                  isDark ? 'border-[#282a2d]' : 'border-[#e0e2e7]'
                }`}
              >
                <div className="flex items-center gap-3">
                  {selectedEmail.detectedCompany ? (
                    <CompanyLogo company={selectedEmail.detectedCompany} size="md" />
                  ) : (
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                        isDark ? 'bg-[#282a2d] text-white' : 'bg-[#e0e2e7] text-slate-800'
                      }`}
                    >
                      {selectedEmail.sender.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span
                      className={`text-sm font-semibold ${
                        isDark ? 'text-white' : 'text-[#1f1f1f]'
                      }`}
                    >
                      {selectedEmail.sender}
                    </span>
                    <span
                      className={`text-xs ${
                        isDark ? 'text-[#8e918f]' : 'text-[#5f6368]'
                      }`}
                    >
                      {selectedEmail.senderEmail}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                      isDark ? 'bg-[#1e1f20] text-slate-300 border-[#282a2d]' : 'bg-[#f0f4f9] text-slate-700 border-[#e0e2e7]'
                    }`}
                  >
                    To: {selectedEmail.recipientEmail || 'Me'}
                  </span>
                </div>
              </div>
            </div>

            {/* Rich Email Body with Exact Gmail Styling & Working Links */}
            <div className="pt-2">
              <EmailContentViewer body={selectedEmail.body} subject={selectedEmail.subject} />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <Mail className={`w-12 h-12 mb-3 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
            <h4
              className={`text-sm font-semibold ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              No conversation selected
            </h4>
            <p
              className={`text-xs mt-1 max-w-xs ${
                isDark ? 'text-slate-500' : 'text-slate-500'
              }`}
            >
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
