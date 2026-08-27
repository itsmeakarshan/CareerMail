import React, { useState } from 'react';
import { Settings, User, Lock, Mail, CheckCircle2, Shield, Moon, Sun, Laptop } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  const [name, setName] = useState(user?.name || 'Arjun Sharma');
  const [email, setEmail] = useState(user?.email || 'arjun.sharma@email.com');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [gmailConnecting, setGmailConnecting] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleConnectGmail = () => {
    setGmailConnecting(true);
    setTimeout(() => {
      setGmailConnecting(false);
      setGmailConnected(true);
    }, 1200);
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
          Manage your profile, email integrations, and application settings
        </p>
      </div>

      {isSaved && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-700/60 rounded-xl text-xs font-semibold text-emerald-300 text-center animate-fadeIn flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Settings saved successfully!</span>
        </div>
      )}

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

      {/* Email Integrations (Specified in Prompt Section 20) */}
      <div className="p-6 rounded-2xl bg-[#101626] border border-[#1e2640] shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <Mail className="w-5 h-5 text-indigo-400" />
          <div>
            <h2 className="text-sm font-bold text-white">Email Providers & Auto-Ingestion</h2>
            <p className="text-xs text-slate-400">
              Configure sync with external email accounts to automatically detect applications
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Demo Email Provider */}
          <div className="p-4 rounded-xl bg-[#141b2d] border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold">
                <Mail className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">Demo Email Engine</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/40 text-emerald-400 text-[10px] font-bold">
                    ACTIVE
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  Pre-seeded realistic inbox with deterministic rule-based job analyzer
                </span>
              </div>
            </div>
            <span className="text-xs text-slate-400 font-medium">Syncing</span>
          </div>

          {/* Gmail API Integration Architecture */}
          <div className="p-4 rounded-xl bg-[#141b2d] border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white p-2 flex items-center justify-center shadow-sm">
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
                  {gmailConnected && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/40 text-emerald-400 text-[10px] font-bold">
                      CONNECTED
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400">
                  Connect personal Gmail account using Google OAuth to auto-extract incoming job emails
                </span>
              </div>
            </div>

            <button
              onClick={handleConnectGmail}
              disabled={gmailConnecting || gmailConnected}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                gmailConnected
                  ? 'bg-slate-800 text-slate-400 cursor-default'
                  : 'bg-white hover:bg-slate-100 text-slate-900 shadow-sm'
              }`}
            >
              {gmailConnecting ? 'Connecting...' : gmailConnected ? 'Connected' : 'Connect Gmail'}
            </button>
          </div>
        </div>
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
