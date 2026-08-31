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
  Camera,
  LogOut,
  Image as ImageIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { gmailApi, settingsApi } from '../services/api';
import { GmailStatus, GmailSyncResult, GeminiSettingsStatus } from '../types';
import { AvatarPickerModal, PRESET_AVATARS } from '../components/common/AvatarPickerModal';
import { Bot, Key, Eye, EyeOff, Check, X, ShieldAlert } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, updateProfile, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || PRESET_AVATARS[0].url);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Gmail OAuth & Status state
  const [gmailStatus, setGmailStatus] = useState<GmailStatus | null>(null);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<GmailSyncResult | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [oauthSuccess, setOauthSuccess] = useState<boolean>(false);

  // Gemini AI Settings State
  const [geminiStatus, setGeminiStatus] = useState<GeminiSettingsStatus | null>(null);
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [showGeminiKey, setShowGeminiKey] = useState<boolean>(false);
  const [geminiSaving, setGeminiSaving] = useState<boolean>(false);
  const [geminiTesting, setGeminiTesting] = useState<boolean>(false);
  const [geminiMessage, setGeminiMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      if (user.avatarUrl) setAvatarUrl(user.avatarUrl);
    }
  }, [user]);

  const fetchGmailStatus = async () => {
    try {
      const status = await gmailApi.getStatus();
      setGmailStatus(status);
    } catch (err) {
      console.error('Error fetching Gmail status:', err);
    }
  };

  const fetchGeminiStatus = async () => {
    try {
      const status = await settingsApi.getGeminiSettings();
      setGeminiStatus(status);
    } catch (err) {
      console.error('Error fetching Gemini status:', err);
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
    fetchGeminiStatus();
  }, []);

  const handleSaveGeminiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!geminiApiKey.trim()) return;

    setGeminiSaving(true);
    setGeminiMessage(null);
    try {
      const res = await settingsApi.saveGeminiKey(geminiApiKey.trim());
      setGeminiStatus({
        isConfigured: true,
        isEnabled: true,
        maskedKey: res.maskedKey,
        status: res.status || '✓ Gemini Connected'
      });
      setGeminiApiKey('');
      setGeminiMessage({ type: 'success', text: res.message || 'Gemini API key saved & validated successfully!' });
    } catch (err: any) {
      setGeminiMessage({ type: 'error', text: err.message || 'Failed to save Gemini API key. Please verify your key.' });
    } finally {
      setGeminiSaving(false);
      setTimeout(() => setGeminiMessage(null), 6000);
    }
  };

  const handleTestGeminiKey = async () => {
    setGeminiTesting(true);
    setGeminiMessage(null);
    try {
      const res = await settingsApi.testGeminiKey(geminiApiKey.trim() || undefined);
      setGeminiMessage({ type: 'success', text: res.message || '✓ Gemini Connected: API key is active and responsive!' });
    } catch (err: any) {
      setGeminiMessage({ type: 'error', text: err.message || 'Connection failed: Invalid API key or network error.' });
    } finally {
      setGeminiTesting(false);
      setTimeout(() => setGeminiMessage(null), 6000);
    }
  };

  const handleRemoveGeminiKey = async () => {
    try {
      await settingsApi.removeGeminiKey();
      setGeminiStatus({
        isConfigured: false,
        isEnabled: false,
        maskedKey: '',
        status: 'Not Configured'
      });
      setGeminiApiKey('');
      setGeminiMessage({ type: 'success', text: 'Gemini API key removed. Rule-based skill extraction will be used.' });
    } catch (err: any) {
      setGeminiMessage({ type: 'error', text: err.message || 'Failed to remove Gemini API key.' });
    } finally {
      setTimeout(() => setGeminiMessage(null), 5000);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({ name: name.trim(), avatarUrl });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleSelectPresetAvatar = async (url: string) => {
    setAvatarUrl(url);
    await updateProfile({ avatarUrl: url });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
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
        <h1 className="text-xl md:text-2xl font-bold text-[#1f1f1f] dark:text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-pink-600 dark:text-pink-400" />
          <span>Settings & Preferences</span>
        </h1>
        <p className="text-xs md:text-sm text-[#5f6368] dark:text-slate-400 mt-0.5 font-medium">
          Manage your connected Gmail account, profile, avatar, appearance, and sync settings
        </p>
      </div>

      {/* OAuth Success Alert */}
      {oauthSuccess && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-800/60 rounded-2xl text-xs text-emerald-300 flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div>
            <span className="font-bold text-white block">Google Account Connected Successfully!</span>
            <span>Your Gmail account is now authorized to automatically synchronize career emails.</span>
          </div>
        </div>
      )}

      {/* OAuth Error Alert */}
      {oauthError && (
        <div className="p-4 bg-rose-950/80 border border-rose-800/60 rounded-2xl text-xs text-rose-300 flex items-center gap-3 animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <div>
            <span className="font-bold text-white block">Gmail Integration Error</span>
            <span>{oauthError}</span>
          </div>
        </div>
      )}

      {/* Profile Saved Alert */}
      {isSaved && (
        <div className="p-3.5 bg-pink-950/80 border border-pink-700/60 rounded-2xl text-xs text-pink-200 flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-pink-400" />
          <span>Profile and avatar updated successfully!</span>
        </div>
      )}

      {/* Sync Summary Result Banner */}
      {syncResult && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-50 via-rose-50 to-pink-50 dark:from-pink-950/70 dark:to-rose-950/70 border border-pink-200 dark:border-pink-700/50 shadow-md space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              <h3 className="text-sm font-bold text-[#1f1f1f] dark:text-white">Gmail Scan Summary</h3>
            </div>
            <span className="text-[11px] text-pink-700 dark:text-pink-300 font-mono">
              {new Date(syncResult.syncedAt).toLocaleTimeString()}
            </span>
          </div>
          <p className="text-xs text-[#444746] dark:text-pink-200/90 leading-relaxed">{syncResult.message}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-pink-200 dark:border-pink-900/40">
            <div className="p-2 bg-white dark:bg-[#1e1f20] border border-[#e0e2e7] dark:border-transparent rounded-xl text-center shadow-sm">
              <span className="text-[10px] text-[#5f6368] dark:text-slate-400 block">Emails Scanned</span>
              <span className="text-sm font-bold text-[#1f1f1f] dark:text-white">{syncResult.scannedCount}</span>
            </div>
            <div className="p-2 bg-white dark:bg-[#1e1f20] border border-[#e0e2e7] dark:border-transparent rounded-xl text-center shadow-sm">
              <span className="text-[10px] text-[#5f6368] dark:text-slate-400 block">Job Emails Detected</span>
              <span className="text-sm font-bold text-pink-600 dark:text-pink-400">{syncResult.jobEmailsFound}</span>
            </div>
            <div className="p-2 bg-white dark:bg-[#1e1f20] border border-[#e0e2e7] dark:border-transparent rounded-xl text-center shadow-sm">
              <span className="text-[10px] text-[#5f6368] dark:text-slate-400 block">Applications Created</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{syncResult.applicationsCreated}</span>
            </div>
            <div className="p-2 bg-white dark:bg-[#1e1f20] border border-[#e0e2e7] dark:border-transparent rounded-xl text-center shadow-sm">
              <span className="text-[10px] text-[#5f6368] dark:text-slate-400 block">Applications Updated</span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{syncResult.applicationsUpdated}</span>
            </div>
          </div>
        </div>
      )}

      {/* Gmail OAuth & Auto-Ingestion Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#16181f] border border-[#e0e2e7] dark:border-[#282a2d] shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#e0e2e7] dark:border-[#282a2d]">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-pink-600 dark:text-pink-400" />
            <div>
              <h2 className="text-sm font-bold text-[#1f1f1f] dark:text-white">Gmail Integration & Email Scanning</h2>
              <p className="text-xs text-[#5f6368] dark:text-slate-400">
                Connect your Google account to automatically scan and organize incoming job opportunities
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {gmailStatus?.hasSendScope ? (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-800/40">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Read & Send Scopes Active</span>
              </span>
            ) : gmailStatus?.connected ? (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-300 dark:border-amber-800/40">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Read-Only (Reconnect for Send)</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-950/80 px-2.5 py-1 rounded-full border border-pink-300 dark:border-pink-800/40">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Read & Send Ready</span>
              </span>
            )}
          </div>
        </div>

        {gmailStatus?.connected && !gmailStatus.hasSendScope && (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0 animate-pulse" />
              <span>
                <strong>Send permission needed:</strong> Your Gmail was connected with read-only permissions. To compose and send emails directly through Gmail, please reconnect.
              </span>
            </div>
            <button
              onClick={handleConnectGmail}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-sm flex-shrink-0 transition-colors"
            >
              Reconnect with Send Permission
            </button>
          </div>
        )}

        <div className="space-y-3">
          {/* Main Google Integration Box */}
          <div className="p-4 rounded-xl bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#e0e2e7] dark:border-[#282a2d] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-white p-2.5 flex items-center justify-center shadow-md flex-shrink-0 border border-slate-200">
                <svg viewBox="0 0 24 24" className="w-full h-full">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.7 1 4 3.5 2.2 7.1l3.7 2.8C6.7 7.3 9.1 5 12 5z"/>
                  <path fill="#4285F4" d="M22.6 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h6c-.3 1.4-1 2.5-2.2 3.3v2.8h3.6c2.1-1.9 3.2-4.7 3.2-8.1z"/>
                  <path fill="#FBBC05" d="M5.9 14.1c-.2-.7-.3-1.4-.3-2.1s.1-1.4.3-2.1V7.1H2.2C1.4 8.6 1 10.2 1 12s.4 3.4 1.2 4.9l3.7-2.8z"/>
                  <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.2v2.8C4 20.5 7.7 23 12 23z"/>
                </svg>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#1f1f1f] dark:text-white">Google Gmail (OAuth 2.0)</span>
                  {gmailStatus?.connected ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                      CONNECTED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-400 text-[10px] font-bold">
                      NOT CONNECTED
                    </span>
                  )}
                </div>

                <span className="text-xs text-[#5f6368] dark:text-slate-400 mt-0.5">
                  {gmailStatus?.connected && gmailStatus.email
                    ? `Active connection to ${gmailStatus.email}`
                    : 'Secure access to sync recruitment emails and send direct follow-ups'}
                </span>

                {gmailStatus?.connected && (
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-[#5f6368] dark:text-slate-500">
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
                    className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-400 hover:to-rose-300 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5 disabled:opacity-50 transition-all hover:scale-105"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                    <span>{syncing ? 'Scanning Gmail...' : 'Scan Recent Emails'}</span>
                  </button>
                  <button
                    onClick={handleDisconnectGmail}
                    className="px-3 py-2 bg-rose-100 dark:bg-rose-950/40 hover:bg-rose-200 dark:hover:bg-rose-900/60 border border-rose-300 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-semibold transition-colors"
                    title="Disconnect Google Account"
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  onClick={handleConnectGmail}
                  className="px-4 py-2 bg-white dark:bg-white hover:bg-slate-50 text-slate-900 rounded-xl text-xs font-bold shadow-md transition-all hover:scale-105 flex items-center gap-2 border border-slate-200"
                >
                  <Zap className="w-3.5 h-3.5 text-pink-600" />
                  <span>Connect Gmail</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Trigger */}
          <div className="p-3.5 rounded-xl bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#e0e2e7] dark:border-[#282a2d] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-pink-600 dark:text-pink-400 flex-shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#1f1f1f] dark:text-white">Full 3-Month Email Auto-Scan</span>
                <span className="text-[11px] text-[#5f6368] dark:text-slate-400">
                  Scan all recruitment emails from the last 90 days and populate your pipeline
                </span>
              </div>
            </div>

            <button
              onClick={handleSyncGmail}
              disabled={syncing}
              className="px-3 py-1.5 rounded-lg bg-pink-100 dark:bg-pink-950/50 hover:bg-pink-200 dark:hover:bg-pink-900/60 border border-pink-300 dark:border-pink-800/40 text-pink-700 dark:text-pink-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Processing...' : 'Run Auto-Scan'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* GEMINI AI INTEGRATION CARD */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#16181f] border border-[#e0e2e7] dark:border-[#282a2d] shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#e0e2e7] dark:border-[#282a2d] gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-pink-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[#1f1f1f] dark:text-white">Gemini AI Integration</h2>
                {geminiStatus?.isConfigured ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/40">
                    Active ✓
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-[#202227] text-slate-600 dark:text-slate-400">
                    Rule-Based Fallback
                  </span>
                )}
              </div>
              <p className="text-xs text-[#5f6368] dark:text-slate-400">
                Gemini is used to improve CV skill extraction and semantic job matching.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="text-right">
              <span className="text-[11px] font-bold block text-slate-400">Status:</span>
              <span className={`text-xs font-bold ${geminiStatus?.isConfigured ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                {geminiStatus?.status || 'Not Configured'}
              </span>
            </div>
          </div>
        </div>

        {geminiMessage && (
          <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 animate-fadeIn ${
            geminiMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}>
            {geminiMessage.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
            )}
            <span>{geminiMessage.text}</span>
          </div>
        )}

        {/* Saved Key Status Display */}
        {geminiStatus?.isConfigured && (
          <div className="p-4 rounded-xl bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#e0e2e7] dark:border-[#282a2d] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Key className="w-4 h-4 text-pink-500 flex-shrink-0" />
              <div>
                <span className="text-xs font-bold text-[#1f1f1f] dark:text-white block">Configured Gemini API Key</span>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tracking-wider">
                  {geminiStatus.maskedKey || 'AIza****************abcd'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestGeminiKey}
                disabled={geminiTesting}
                className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#16181f] border border-slate-200 dark:border-[#282a2d] hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-pink-500 ${geminiTesting ? 'animate-spin' : ''}`} />
                <span>{geminiTesting ? 'Testing...' : 'Test Connection'}</span>
              </button>
              <button
                type="button"
                onClick={handleRemoveGeminiKey}
                className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 text-xs font-semibold transition-colors"
              >
                Remove Key
              </button>
            </div>
          </div>
        )}

        {/* Input Form for New / Updating Key */}
        <form onSubmit={handleSaveGeminiKey} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#1f1f1f] dark:text-slate-300 mb-1.5">
              {geminiStatus?.isConfigured ? 'Update Gemini API Key' : 'Enter Gemini API Key'}
            </label>
            <div className="relative">
              <input
                type={showGeminiKey ? 'text' : 'password'}
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="Paste your Gemini API key (AIzaSy...)"
                className="w-full pl-3.5 pr-10 py-2.5 bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#dadce0] dark:border-[#282a2d] rounded-xl text-sm font-mono text-[#1f1f1f] dark:text-white focus:outline-none focus:border-pink-400 placeholder:font-sans placeholder:text-xs"
              />
              <button
                type="button"
                onClick={() => setShowGeminiKey(!showGeminiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                title={showGeminiKey ? 'Hide key' : 'Show key'}
              >
                {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <span className="text-[11px] text-[#5f6368] dark:text-slate-400 mt-1 block">
              Your API key is securely transmitted to and stored on the server. The frontend never makes direct client-side calls with secrets.
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleTestGeminiKey}
              disabled={geminiTesting || (!geminiApiKey.trim() && !geminiStatus?.isConfigured)}
              className="px-4 py-2 bg-white dark:bg-[#1e1f20] border border-slate-200 dark:border-[#282a2d] hover:bg-slate-50 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-pink-500 ${geminiTesting ? 'animate-spin' : ''}`} />
              <span>{geminiTesting ? 'Testing...' : 'Test Connection'}</span>
            </button>

            <button
              type="submit"
              disabled={geminiSaving || !geminiApiKey.trim()}
              className="px-5 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-md shadow-pink-500/25 transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 flex items-center gap-1.5"
            >
              <Key className="w-3.5 h-3.5" />
              <span>{geminiSaving ? 'Validating & Saving...' : 'Save API Key'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Profile & Avatar Customization Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#16181f] border border-[#e0e2e7] dark:border-[#282a2d] shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#e0e2e7] dark:border-[#282a2d]">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-pink-600 dark:text-pink-400" />
            <div>
              <h2 className="text-sm font-bold text-[#1f1f1f] dark:text-white">Profile Information & Avatar</h2>
              <p className="text-xs text-[#5f6368] dark:text-slate-400">Customize your public name and select a profile icon</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAvatarModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-pink-50 dark:bg-pink-950/50 hover:bg-pink-100 dark:hover:bg-pink-900/60 border border-pink-200 dark:border-pink-800/40 text-pink-700 dark:text-pink-300 text-xs font-bold flex items-center gap-1.5 transition-all hover:scale-105"
          >
            <Camera className="w-3.5 h-3.5 text-pink-500" />
            <span>Choose from Avatars</span>
          </button>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-5">
          {/* Current Avatar + Quick Presets Row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#e0e2e7] dark:border-[#282a2d]">
            <div className="relative group flex-shrink-0 cursor-pointer" onClick={() => setIsAvatarModalOpen(true)}>
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-16 h-16 rounded-full object-cover border-2 border-pink-400 shadow-md bg-white/10"
              />
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#1f1f1f] dark:text-white">{name || 'User Profile'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950/80 text-pink-700 dark:text-pink-400 border border-pink-200 dark:border-pink-800/40 font-bold">
                  Active
                </span>
              </div>
              <span className="text-xs text-[#5f6368] dark:text-slate-400 mt-0.5">{email}</span>

              {/* Quick Pick Avatar Icons Row */}
              <div className="mt-3">
                <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">Quick Icon Picker:</span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {PRESET_AVATARS.slice(0, 8).map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPresetAvatar(preset.url)}
                      className={`relative w-8 h-8 rounded-full border transition-all hover:scale-110 flex-shrink-0 ${
                        avatarUrl === preset.url
                          ? 'border-pink-500 ring-2 ring-pink-400/40 shadow-sm'
                          : 'border-slate-300 dark:border-slate-700 opacity-70 hover:opacity-100'
                      }`}
                      title={preset.name}
                    >
                      <img src={preset.url} alt={preset.name} className="w-full h-full rounded-full object-cover" />
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setIsAvatarModalOpen(true)}
                    className="px-2 py-1 rounded-lg text-[10px] font-bold bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800/40 hover:bg-pink-200 whitespace-nowrap"
                  >
                    More +
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1f1f1f] dark:text-slate-300 mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#dadce0] dark:border-[#282a2d] rounded-xl text-sm text-[#1f1f1f] dark:text-white focus:outline-none focus:border-pink-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1f1f1f] dark:text-slate-300 mb-1.5">Email Address</label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full px-3.5 py-2.5 bg-[#f6f8fc] dark:bg-[#1e1f20] border border-[#dadce0] dark:border-[#282a2d] rounded-xl text-sm text-[#5f6368] dark:text-slate-400 cursor-not-allowed opacity-80"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-400 hover:to-rose-300 text-white rounded-xl text-xs font-bold shadow-md shadow-pink-500/25 transition-all hover:scale-105"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>

      {/* Theme Preference */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#16181f] border border-[#e0e2e7] dark:border-[#282a2d] shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-[#e0e2e7] dark:border-[#282a2d]">
          <Moon className="w-5 h-5 text-pink-600 dark:text-pink-400" />
          <h2 className="text-sm font-bold text-[#1f1f1f] dark:text-white">Appearance & Theme</h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-xl border flex items-center gap-3 text-left transition-all ${
              theme === 'dark'
                ? 'bg-[#1e1f20] border-pink-400 ring-2 ring-pink-400/20'
                : 'bg-[#f6f8fc] dark:bg-[#1e1f20] border-[#dadce0] dark:border-slate-800 hover:border-slate-400'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-pink-100 dark:bg-pink-600/20 text-pink-700 dark:text-pink-400 flex items-center justify-center">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#1f1f1f] dark:text-white block">Dark Mode</span>
              <span className="text-[11px] text-[#5f6368] dark:text-slate-400">Authentic Gmail dark theme</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-4 rounded-xl border flex items-center gap-3 text-left transition-all ${
              theme === 'light'
                ? 'bg-white text-slate-900 border-pink-400 ring-2 ring-pink-400/20 shadow-sm'
                : 'bg-[#f6f8fc] dark:bg-[#1e1f20] border-[#dadce0] dark:border-slate-800 hover:border-slate-400'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Sun className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#1f1f1f] dark:text-white block">Light Mode</span>
              <span className="text-[11px] text-[#5f6368] dark:text-slate-400">Clean Google Gmail light theme</span>
            </div>
          </button>
        </div>
      </div>

      {/* Account Security & Logout Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#16181f] border border-[#e0e2e7] dark:border-[#282a2d] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-[#1f1f1f] dark:text-white">Account Session</h2>
          <p className="text-xs text-[#5f6368] dark:text-slate-400 mt-0.5">
            Signed in as <strong className="text-pink-600 dark:text-pink-400">{user?.email}</strong>
          </p>
        </div>

        <button
          type="button"
          onClick={logout}
          className="px-5 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2 transition-all hover:scale-105 self-start md:self-auto shadow-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out of CareerMail</span>
        </button>
      </div>

      {/* Avatar Picker Modal */}
      <AvatarPickerModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentAvatar={avatarUrl}
        onSelectAvatar={(url) => {
          setAvatarUrl(url);
          handleSelectPresetAvatar(url);
        }}
      />
    </div>
  );
};
