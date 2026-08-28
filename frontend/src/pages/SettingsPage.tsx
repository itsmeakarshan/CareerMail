import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Settings,
  User,
  Mail,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Moon,
  Sun,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { gmailApi } from '../services/api';
import { GmailStatus, GmailSyncResult } from '../types';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [isSaved, setIsSaved] = useState(false);

  // Gmail OAuth & Status state
  const [gmailStatus, setGmailStatus] = useState<GmailStatus | null>(null);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<GmailSyncResult | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [oauthSuccess, setOauthSuccess] = useState<boolean>(false);

  const fetchGmailStatus = async () => {
    try {
      const status = await gmailApi.getStatus();
      setGmailStatus(status);
    } catch (err) {
      console.error('Error fetching Gmail status:', err);
    }
  };

  useEffect(() => {
    // Check URL parameters for OAuth callbacks
    const gmailParam = searchParams.get('gmail');
    const tokenParam = searchParams.get('token');
    const errorParam = searchParams.get('error');

    if (tokenParam) {
      localStorage.setItem('careermail_token', tokenParam);
    }

    if (gmailParam === 'connected') {
      setOauthSuccess(true);
      setTimeout(() => setOauthSuccess(false), 5000);
      // Clean query params
      setSearchParams({});
    }

    if (errorParam) {
      setOauthError(decodeURIComponent(errorParam));
      setTimeout(() => setOauthError(null), 7000);
      setSearchParams({});
    }

    fetchGmailStatus();
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleConnectGmail = async () => {
    try {
      setOauthError(null);
      const res = await gmailApi.getAuthUrl();
      if (res.url) {
        window.location.href = res.url;
      }
    } catch (err: any) {
      setOauthError(err.message || 'Failed to initiate Google OAuth');
    }
  };

  const handleSyncGmail = async () => {
    setSyncing(true);
    setSyncResult(null);
    setOauthError(null);
    try {
      const result = await gmailApi.sync(300);
      setSyncResult(result);
      await fetchGmailStatus();
    } catch (err: any) {
      setOauthError(err.message || 'Failed to scan Gmail');
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnectGmail = async () => {
    if (confirm('Are you sure you want to disconnect your Gmail integration?')) {
      try {
        await gmailApi.disconnect();
        setSyncResult(null);
        await fetchGmailStatus();
      } catch (err: any) {
        setOauthError(err.message || 'Failed to disconnect Gmail');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-purple-400" />
          <span>Account & Preferences</span>
        </h1>
        <p className="text-xs md:text-sm text-slate-400 mt-0.5">
          Manage your profile, Google OAuth & Gmail integration, and application settings
        </p>
      </div>

      {oauthSuccess && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-700/60 rounded-2xl text-xs font-semibold text-emerald-300 animate-fadeIn flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div>
              <span className="font-bold block text-emerald-200">Gmail Successfully Connected!</span>
              <span className="text-[11px] text-emerald-300/80">
                Your Gmail account is now authorized for secure read-only job email tracking.
              </span>
            </div>
          </div>
          <button
            onClick={handleSyncGmail}
            disabled={syncing}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all"
          >
            {syncing ? 'Scanning...' : 'Scan Now'}
          </button>
        </div>
      )}

      {oauthError && (
        <div className="p-4 bg-rose-950/80 border border-rose-700/60 rounded-2xl text-xs font-semibold text-rose-300 animate-fadeIn flex items-center gap-3 shadow-lg">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <div>
            <span className="font-bold block text-rose-200">Notice</span>
            <span className="text-[11px] text-rose-300/80">{oauthError}</span>
          </div>
        </div>
      )}

      {isSaved && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-700/60 rounded-xl text-xs font-semibold text-emerald-300 text-center animate-fadeIn flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      {/* Sync Summary Result Banner */}
      {syncResult && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-950/70 to-indigo-950/70 border border-purple-700/50 shadow-xl space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-bold text-white">Gmail Scan Summary</h3>
            </div>
            <span className="text-[11px] text-purple-300 font-mono">
              {new Date(syncResult.syncedAt).toLocaleTimeString()}
            </span>
          </div>
          <p className="text-xs text-purple-200/90 leading-relaxed">{syncResult.message}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-purple-900/40">
            <div className="p-2 bg-[#0d1222]/80 rounded-xl text-center">
              <span className="text-[10px] text-slate-400 block">Emails Scanned</span>
              <span className="text-sm font-bold text-white">{syncResult.scannedCount}</span>
            </div>
            <div className="p-2 bg-[#0d1222]/80 rounded-xl text-center">
              <span className="text-[10px] text-slate-400 block">Job Emails Detected</span>
              <span className="text-sm font-bold text-purple-400">{syncResult.jobEmailsFound}</span>
            </div>
            <div className="p-2 bg-[#0d1222]/80 rounded-xl text-center">
              <span className="text-[10px] text-slate-400 block">Applications Created</span>
              <span className="text-sm font-bold text-emerald-400">{syncResult.applicationsCreated}</span>
            </div>
            <div className="p-2 bg-[#0d1222]/80 rounded-xl text-center">
              <span className="text-[10px] text-slate-400 block">Applications Updated</span>
              <span className="text-sm font-bold text-blue-400">{syncResult.applicationsUpdated}</span>
            </div>
          </div>
        </div>
      )}

      {/* Gmail OAuth & Auto-Ingestion Card */}
      <div className="p-6 rounded-2xl bg-[#101626] border border-[#1e2640] shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-sm font-bold text-white">Gmail Integration & Email Scanning</h2>
              <p className="text-xs text-slate-400">
                Connect your Google account to automatically scan and organize incoming job opportunities
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800/40">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Read-Only Scope</span>
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {/* Main Google Integration Box */}
          <div className="p-4 rounded-xl bg-[#141b2d] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-white p-2.5 flex items-center justify-center shadow-md flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-full h-full">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.7 1 4 3.5 2.2 7.1l3.7 2.8C6.7 7.3 9.1 5 12 5z"/>
                  <path fill="#4285F4" d="M22.6 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h6c-.3 1.4-1 2.5-2.2 3.3v2.8h3.6c2.1-1.9 3.2-4.7 3.2-8.1z"/>
                  <path fill="#FBBC05" d="M5.9 14.1c-.2-.7-.3-1.4-.3-2.1s.1-1.4.3-2.1V7.1H2.2C1.4 8.6 1 10.2 1 12s.4 3.4 1.2 4.9l3.7-2.8z"/>
                  <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.2v2.8C4 20.5 7.7 23 12 23z"/>
                </svg>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">Google Gmail (OAuth 2.0)</span>
                  {gmailStatus?.connected ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/40 text-emerald-400 text-[10px] font-bold">
                      CONNECTED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-bold">
                      NOT CONNECTED
                    </span>
                  )}
                </div>

                <span className="text-xs text-slate-400 mt-0.5">
                  {gmailStatus?.connected && gmailStatus.email
                    ? `Active connection to ${gmailStatus.email}`
                    : 'Secure read-only access to scan recent emails and extract applications'}
                </span>

                {gmailStatus?.connected && (
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500">
                    <span>Last synced: {gmailStatus.lastSyncedAt ? new Date(gmailStatus.lastSyncedAt).toLocaleString() : 'Never'}</span>
                    <span>•</span>
                    <span>Total scanned: {gmailStatus.totalEmailsScanned} emails</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 self-end md:self-center">
              {gmailStatus?.connected ? (
                <>
                  <button
                    onClick={handleSyncGmail}
                    disabled={syncing}
                    className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-glow-purple flex items-center gap-1.5 disabled:opacity-50 transition-all hover:scale-105"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                    <span>{syncing ? 'Scanning Gmail...' : 'Scan Recent Emails'}</span>
                  </button>
                  <button
                    onClick={handleDisconnectGmail}
                    className="px-3 py-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 rounded-xl text-xs font-semibold transition-colors"
                    title="Disconnect Google Account"
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  onClick={handleConnectGmail}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-900 rounded-xl text-xs font-bold shadow-md transition-all hover:scale-105 flex items-center gap-2"
                >
                  <Zap className="w-3.5 h-3.5 text-purple-600" />
                  <span>Connect Gmail</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Simulation / Manual Scan Fallback */}
          <div className="p-3.5 rounded-xl bg-[#0e1322] border border-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">Live Scanner & Preset Presets</span>
                <span className="text-[11px] text-slate-400">
                  Trigger automatic job parsing and test application deduplication in real time
                </span>
              </div>
            </div>

            <button
              onClick={handleSyncGmail}
              disabled={syncing}
              className="px-3 py-1.5 rounded-lg bg-[#182138] hover:bg-[#1e2a47] border border-slate-700 text-purple-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Processing...' : 'Run Auto-Scan'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Profile Card */}
      <div className="p-6 rounded-2xl bg-[#101626] border border-[#1e2640] shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <User className="w-5 h-5 text-purple-400" />
          <h2 className="text-sm font-bold text-white">Profile Information</h2>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="flex items-center gap-4">
            <img
              src={
                user?.avatarUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
              }
              alt="Avatar"
              className="w-16 h-16 rounded-full object-cover border-2 border-purple-500/60 shadow-md"
            />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white">{name}</span>
              <span className="text-xs text-slate-400">{email}</span>
              <span className="text-[11px] text-purple-400 mt-1 font-medium">Free Pro Plan Active</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#0c101d] border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full px-3.5 py-2 bg-[#0c101d] border border-slate-800 rounded-xl text-sm text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-glow-purple transition-all"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>

      {/* Theme Preference */}
      <div className="p-6 rounded-2xl bg-[#101626] border border-[#1e2640] shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <Moon className="w-5 h-5 text-purple-400" />
          <h2 className="text-sm font-bold text-white">Appearance & Theme</h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-xl border flex items-center gap-3 text-left transition-all ${
              theme === 'dark'
                ? 'bg-[#182138] border-purple-500 ring-2 ring-purple-500/20'
                : 'bg-[#12182a] border-slate-800'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Dark Mode</span>
              <span className="text-[11px] text-slate-400">Default deep navy theme</span>
            </div>
          </button>

          <button
            onClick={() => setTheme('light')}
            className={`p-4 rounded-xl border flex items-center gap-3 text-left transition-all ${
              theme === 'light'
                ? 'bg-white text-slate-900 border-purple-500 ring-2 ring-purple-500/20'
                : 'bg-[#12182a] border-slate-800'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Sun className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Light Mode</span>
              <span className="text-[11px] text-slate-400">Clean high-contrast light theme</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
