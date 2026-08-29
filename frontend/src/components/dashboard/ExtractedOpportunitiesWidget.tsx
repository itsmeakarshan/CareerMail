import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles,
  RefreshCw,
  Search,
  Plus,
  Mail,
  MailOpen,
  ExternalLink,
  CheckCircle2,
  Building2,
  User,
  DollarSign,
  MapPin,
  Clock,
  ArrowRight,
  Briefcase,
  X,
  Send,
  Copy,
  Check,
  SlidersHorizontal,
} from 'lucide-react';
import { Opportunity, JobApplication, Email } from '../../types';
import { CompanyLogo } from '../common/CompanyLogo';
import { opportunitiesApi, emailsApi } from '../../services/api';
import { ComposeEmailModal } from '../email/ComposeEmailModal';
import { EmailContentViewer } from '../email/EmailContentViewer';

interface ExtractedOpportunitiesWidgetProps {
  opportunities: Opportunity[];
  onRefresh: () => void;
  onOpportunityConverted: (app: JobApplication) => void;
  onSelectApplication?: (appId: number) => void;
}

export const ExtractedOpportunitiesWidget: React.FC<ExtractedOpportunitiesWidgetProps> = ({
  opportunities,
  onRefresh,
  onOpportunityConverted,
  onSelectApplication,
}) => {
  const [scanning, setScanning] = useState(false);
  const [convertingId, setConvertingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'NEW' | 'CONVERTED'>('ALL');
  const [scanNotice, setScanNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  // Email reader modal state
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [fullEmailData, setFullEmailData] = useState<Email | null>(null);
  const [loadingEmail, setLoadingEmail] = useState<boolean>(false);

  // Reply compose modal state
  const [replyOpp, setReplyOpp] = useState<Opportunity | null>(null);

  const handleOpenEmailModal = async (opp: Opportunity) => {
    setSelectedOpportunity(opp);
    setFullEmailData(null);
    setLoadingEmail(true);
    try {
      const email = await emailsApi.getById(opp.id);
      if (email) {
        setFullEmailData(email);
      }
    } catch (err) {
      console.warn('Could not fetch email by id, using local opportunity body:', err);
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleCopyBody = (text: string) => {
    const cleanText = text
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
    navigator.clipboard.writeText(cleanText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleScanGmail = async () => {
    try {
      setScanning(true);
      setErrorNotice(null);
      setScanNotice(null);
      const res = await opportunitiesApi.scan();
      setScanNotice(res.message || `Discovered ${res.opportunitiesCount} opportunities from your Gmail inbox!`);
      onRefresh();
    } catch (err: any) {
      console.error('Failed to scan opportunities:', err);
      setErrorNotice(err?.message || 'Failed to scan Gmail for opportunities. Ensure your Gmail is connected in Settings.');
    } finally {
      setScanning(false);
    }
  };

  const handleConvert = async (opp: Opportunity) => {
    try {
      setConvertingId(opp.id);
      const app = await opportunitiesApi.convert(opp.id, {
        company: opp.company,
        title: opp.role,
        status: 'APPLIED',
        location: opp.location,
        salary: opp.salary,
      });
      onOpportunityConverted(app);
      onRefresh();
    } catch (err: any) {
      console.error('Failed to convert opportunity:', err);
      alert('Error converting opportunity: ' + (err?.message || 'Unknown error'));
    } finally {
      setConvertingId(null);
    }
  };

  // Filter opportunities
  const filtered = opportunities.filter((opp) => {
    const matchesSearch =
      opp.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (opp.recruiterName && opp.recruiterName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (opp.snippet && opp.snippet.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeTab === 'NEW') return !opp.isConverted;
    if (activeTab === 'CONVERTED') return opp.isConverted;
    return true;
  });

  const newCount = opportunities.filter((o) => !o.isConverted).length;
  const convertedCount = opportunities.filter((o) => o.isConverted).length;

  return (
    <div className="w-full bg-white dark:bg-[#16181f] border border-[#e0e2e7] dark:border-[#282a2d] rounded-2xl shadow-sm overflow-hidden transition-all animate-fadeIn">
      {/* Header Banner */}
      <div className="p-5 bg-gradient-to-r from-pink-50/70 via-rose-50/40 to-white dark:from-pink-950/30 dark:via-rose-950/20 dark:to-[#16181f] border-b border-[#e0e2e7] dark:border-[#282a2d]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center text-white shadow-md shadow-pink-500/20 flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-[#1f1f1f] dark:text-white tracking-tight">
                  Extracted Opportunities from Gmail
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950/80 border border-pink-200 dark:border-pink-800 text-pink-700 dark:text-pink-300 text-xs font-bold">
                  {opportunities.length} Discovered
                </span>
              </div>
              <p className="text-xs text-[#5f6368] dark:text-slate-400 mt-0.5">
                AI & rule-based engine automatically surfaces new job leads, recruiter outreach, and hiring opportunities from your inbox.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Scan Button */}
            <button
              onClick={handleScanGmail}
              disabled={scanning}
              className="px-4 py-2 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl text-xs font-bold shadow-md shadow-pink-500/20 flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
              <span>{scanning ? 'Scanning Gmail...' : 'Extract from Gmail'}</span>
            </button>
          </div>
        </div>

        {/* Notices */}
        {scanNotice && (
          <div className="mt-3.5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>{scanNotice}</span>
            </div>
            <button onClick={() => setScanNotice(null)} className="text-emerald-600 hover:text-emerald-800">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {errorNotice && (
          <div className="mt-3.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/50 flex items-center justify-between text-xs text-rose-800 dark:text-rose-300 animate-fadeIn">
            <span>{errorNotice}</span>
            <button onClick={() => setErrorNotice(null)} className="text-rose-600 hover:text-rose-800">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Filters & Tabs Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-3.5 border-t border-pink-200/50 dark:border-pink-900/30">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-[#f0f4f9] dark:bg-[#111318] rounded-xl border border-[#e0e2e7] dark:border-[#282a2d]">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'ALL'
                  ? 'bg-white dark:bg-[#1e1f20] text-pink-600 dark:text-pink-400 shadow-sm'
                  : 'text-[#5f6368] dark:text-slate-400 hover:text-black dark:hover:text-white'
              }`}
            >
              All ({opportunities.length})
            </button>
            <button
              onClick={() => setActiveTab('NEW')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'NEW'
                  ? 'bg-white dark:bg-[#1e1f20] text-pink-600 dark:text-pink-400 shadow-sm'
                  : 'text-[#5f6368] dark:text-slate-400 hover:text-black dark:hover:text-white'
              }`}
            >
              New Leads ({newCount})
            </button>
            <button
              onClick={() => setActiveTab('CONVERTED')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'CONVERTED'
                  ? 'bg-white dark:bg-[#1e1f20] text-pink-600 dark:text-pink-400 shadow-sm'
                  : 'text-[#5f6368] dark:text-slate-400 hover:text-black dark:hover:text-white'
              }`}
            >
              In Pipeline ({convertedCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#5f6368] dark:text-slate-400" />
            <input
              type="text"
              placeholder="Search extracted opportunities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#dadce0] dark:border-[#282a2d] rounded-xl text-xs text-[#1f1f1f] dark:text-white placeholder-slate-400 focus:outline-none focus:border-pink-400 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Content Body: Grid of Opportunity Cards */}
      <div className="p-5">
        {filtered.length === 0 ? (
          <div className="py-12 px-4 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-pink-50 dark:bg-pink-950/50 border border-pink-200 dark:border-pink-800/40 flex items-center justify-center text-pink-500 dark:text-pink-400 shadow-sm">
              <Briefcase className="w-7 h-7" />
            </div>
            <div className="max-w-md">
              <h3 className="text-sm font-bold text-[#1f1f1f] dark:text-white">
                {opportunities.length === 0
                  ? 'No Extracted Opportunities Yet'
                  : 'No Opportunities Match Your Filter'}
              </h3>
              <p className="text-xs text-[#5f6368] dark:text-slate-400 mt-1 leading-relaxed">
                {opportunities.length === 0
                  ? 'Connect your Gmail in Settings and click "Extract from Gmail" above to scan your inbox for new job opportunities and recruiter reachouts.'
                  : 'Try clearing your search query or switching tabs to see all extracted job leads.'}
              </p>
            </div>
            {opportunities.length === 0 && (
              <button
                onClick={handleScanGmail}
                disabled={scanning}
                className="mt-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-400 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-all hover:scale-105"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Scan Gmail for Opportunities</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((opp) => {
              const isConverting = convertingId === opp.id;
              const dateDisplay = new Date(opp.receivedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              });

              return (
                <div
                  key={opp.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between group ${
                    opp.isConverted
                      ? 'bg-[#fcfdfd] dark:bg-[#14151a] border-emerald-200/70 dark:border-emerald-900/30 opacity-90'
                      : 'bg-[#f8fafd] dark:bg-[#1a1c23] border-[#e0e2e7] dark:border-[#282a2d] hover:border-pink-300 dark:hover:border-pink-700/60 hover:shadow-md'
                  }`}
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <CompanyLogo company={opp.company} className="w-9 h-9 text-xs flex-shrink-0" />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-[#1f1f1f] dark:text-white truncate">
                            {opp.company}
                          </h4>
                          <span className="text-[10px] text-[#5f6368] dark:text-slate-400 block truncate">
                            {opp.recruiterName || 'Recruiter'}
                          </span>
                        </div>
                      </div>

                      {opp.isConverted ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold flex items-center gap-1 flex-shrink-0">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>In Pipeline</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950/80 border border-pink-200 dark:border-pink-800 text-pink-700 dark:text-pink-300 text-[10px] font-bold flex items-center gap-1 flex-shrink-0">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>New Lead</span>
                        </span>
                      )}
                    </div>

                    {/* Role Title */}
                    <div className="mb-2">
                      <h3 className="text-sm font-bold text-[#1f1f1f] dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors line-clamp-1">
                        {opp.role}
                      </h3>
                      <p className="text-xs text-[#5f6368] dark:text-slate-400 font-medium truncate mt-0.5">
                        {opp.subject}
                      </p>
                    </div>

                    {/* Meta Badges */}
                    <div className="flex items-center gap-2 flex-wrap mb-3 text-[11px]">
                      <span className="px-2 py-0.5 rounded-md bg-white dark:bg-[#111318] border border-[#dadce0] dark:border-[#282a2d] text-[#444746] dark:text-slate-300 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#5f6368]" />
                        <span>{opp.location || 'Remote'}</span>
                      </span>

                      {opp.salary && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          <span>{opp.salary}</span>
                        </span>
                      )}

                      <span className="px-2 py-0.5 rounded-md bg-white dark:bg-[#111318] border border-[#dadce0] dark:border-[#282a2d] text-[#5f6368] dark:text-slate-400 flex items-center gap-1 ml-auto">
                        <Clock className="w-3 h-3" />
                        <span>{dateDisplay}</span>
                      </span>
                    </div>

                    {/* Email Excerpt Snippet */}
                    <div className="p-2.5 rounded-lg bg-white dark:bg-[#111318] border border-[#e0e2e7] dark:border-[#282a2d] mb-4">
                      <p className="text-xs text-[#444746] dark:text-slate-300 line-clamp-2 leading-relaxed italic">
                        &ldquo;{opp.snippet || opp.subject}&rdquo;
                      </p>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#e0e2e7] dark:border-[#282a2d]">
                    <button
                      onClick={() => handleOpenEmailModal(opp)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#5f6368] dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#282a2d] flex items-center gap-1 transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>View Email</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setReplyOpp(opp)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-pink-700 dark:text-pink-300 hover:bg-pink-100 dark:hover:bg-pink-950/60 border border-pink-200 dark:border-pink-800/40 flex items-center gap-1 transition-colors"
                        title="Reply to Recruiter"
                      >
                        <Send className="w-3 h-3" />
                        <span>Reply</span>
                      </button>

                      {opp.isConverted ? (
                        <button
                          onClick={() => opp.applicationId && onSelectApplication && onSelectApplication(opp.applicationId)}
                          className="px-3 py-1.5 bg-slate-100 dark:bg-[#1e1f20] hover:bg-slate-200 dark:hover:bg-[#282a2d] text-[#1f1f1f] dark:text-white rounded-lg text-xs font-bold flex items-center gap-1 border border-slate-300 dark:border-slate-700 transition-colors"
                        >
                          <span>View in Kanban</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleConvert(opp)}
                          disabled={isConverting}
                          className="px-3.5 py-1.5 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1 transition-all hover:scale-105 disabled:opacity-50"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{isConverting ? 'Adding...' : '+ Add to Pipeline'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Full Email Modal Popup rendered via React Portal directly into body */}
      {selectedOpportunity && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#16181f] border border-[#e0e2e7] dark:border-[#282a2d] rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#f6f8fc] dark:bg-[#111318] border-b border-[#e0e2e7] dark:border-[#282a2d] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <CompanyLogo company={selectedOpportunity.company} className="w-10 h-10 text-sm flex-shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-[#1f1f1f] dark:text-white tracking-tight truncate">
                    {fullEmailData?.subject || selectedOpportunity.subject}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-[#5f6368] dark:text-slate-300 mt-0.5">
                    <span>
                      From: <strong className="text-[#1f1f1f] dark:text-white">{fullEmailData?.sender || selectedOpportunity.recruiterName || 'Recruiter'}</strong> ({fullEmailData?.senderEmail || selectedOpportunity.recruiterEmail})
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedOpportunity(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-black dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#282a2d] transition-colors flex-shrink-0"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Email Meta Info Bar */}
            <div className="px-6 py-2.5 bg-[#f0f4f9] dark:bg-[#111318] border-b border-[#e0e2e7] dark:border-[#282a2d] flex items-center justify-between flex-wrap gap-2 text-xs text-[#5f6368] dark:text-slate-300">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#5f6368]" />
                <span>Received: {new Date(fullEmailData?.timestamp || selectedOpportunity.receivedAt).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950 text-pink-800 dark:text-pink-200 border border-pink-200 dark:border-pink-700/50 text-[10px] font-bold">
                  {selectedOpportunity.company}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[10px] font-bold border border-slate-300 dark:border-slate-700">
                  {selectedOpportunity.role}
                </span>
                {selectedOpportunity.salary && selectedOpportunity.salary !== 'Competitive' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-700 text-[10px] font-bold">
                    {selectedOpportunity.salary}
                  </span>
                )}
              </div>
            </div>

            {/* Full Email Message Content with rich EmailContentViewer */}
            <div className="p-6 overflow-y-auto flex-1 bg-white dark:bg-[#111318] custom-scrollbar">
              {loadingEmail ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-pink-500" />
                  <span className="text-xs font-semibold">Loading full email content...</span>
                </div>
              ) : (
                <EmailContentViewer
                  body={fullEmailData?.body || selectedOpportunity.fullBody || selectedOpportunity.snippet || ''}
                  subject={fullEmailData?.subject || selectedOpportunity.subject}
                />
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#f6f8fc] dark:bg-[#16181f] border-t border-[#e0e2e7] dark:border-[#282a2d] flex items-center justify-between gap-3">
              <button
                onClick={() => handleCopyBody(fullEmailData?.body || selectedOpportunity.fullBody || selectedOpportunity.snippet || '')}
                className="px-4 py-2 bg-white dark:bg-[#1e1f20] hover:bg-[#f0f4f9] dark:hover:bg-[#282a2d] text-[#444746] dark:text-slate-200 hover:text-black dark:hover:text-white rounded-xl text-xs font-semibold transition-all border border-[#dadce0] dark:border-slate-700 flex items-center gap-1.5 shadow-sm"
              >
                {copiedText ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-500 font-semibold">Copied to Clipboard</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const opp = selectedOpportunity;
                    setSelectedOpportunity(null);
                    setReplyOpp(opp);
                  }}
                  className="px-3.5 py-2 bg-pink-100 dark:bg-pink-950/80 text-pink-700 dark:text-pink-300 hover:bg-pink-200 dark:hover:bg-pink-900 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-pink-300 dark:border-pink-800 transition-colors shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Reply to Recruiter</span>
                </button>

                {!selectedOpportunity.isConverted && (
                  <button
                    onClick={() => {
                      handleConvert(selectedOpportunity);
                      setSelectedOpportunity(null);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl text-xs font-bold shadow-md shadow-pink-500/20 flex items-center gap-1.5 transition-all hover:scale-105"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Kanban Pipeline</span>
                  </button>
                )}

                <button
                  onClick={() => setSelectedOpportunity(null)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-[#1f1f1f] dark:text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Reply Modal */}
      {replyOpp && (
        <ComposeEmailModal
          isOpen={true}
          onClose={() => setReplyOpp(null)}
          onSuccess={() => {
            setReplyOpp(null);
            onRefresh();
          }}
          initialTo={replyOpp.recruiterEmail || ''}
          initialSubject={`Re: ${replyOpp.subject}`}
          recruiterName={replyOpp.recruiterName}
          companyName={replyOpp.company}
          roleTitle={replyOpp.role}
        />
      )}
    </div>
  );
};
