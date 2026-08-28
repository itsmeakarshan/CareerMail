import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ArrowRight, Inbox, BarChart2, Calendar, Bell, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { gmailApi } from '../services/api';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = async () => {
    setEmail('arjun.sharma@email.com');
    setPassword('password123');
    setError('');
    setLoading(true);
    try {
      await login('arjun.sharma@email.com', 'password123');
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with demo account');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      const res = await gmailApi.getAuthUrl();
      if (res.url) {
        window.location.href = res.url;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initiate Google Sign In');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#070913] text-slate-100 flex flex-col justify-between p-6 md:p-12 relative overflow-hidden font-sans selection:bg-purple-500 selection:text-white">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[300px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Subtle bottom wave curves matching Login.png */}
      <div className="absolute bottom-0 left-0 w-full h-48 pointer-events-none overflow-hidden opacity-35">
        <svg viewBox="0 0 1440 280" fill="none" className="w-full h-full object-cover">
          <path
            d="M-100 240 C 300 120, 500 290, 900 180 C 1200 100, 1400 220, 1600 160"
            stroke="url(#waveGrad1)"
            strokeWidth="2.5"
            fill="none"
          />
          <path
            d="M-50 260 C 350 160, 550 270, 950 210 C 1250 140, 1450 250, 1650 190"
            stroke="url(#waveGrad2)"
            strokeWidth="1.5"
            fill="none"
          />
          <defs>
            <linearGradient id="waveGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#9333ea" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="waveGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.5" />
              <stop offset="60%" stopColor="#6366f1" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Main Container */}
      <div className="max-w-6xl w-full mx-auto my-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center relative z-10 py-6">
        
        {/* Left Column: Brand, Pitch & 4 Feature Badges matching Login.png */}
        <div className="lg:col-span-6 flex flex-col justify-center space-y-7">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-fuchsia-500 p-[1.5px] flex items-center justify-center shadow-glow-purple">
              <div className="w-full h-full bg-[#0b0f1e] rounded-[10px] flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-purple-400" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
              </div>
            </div>
            <span className="text-2xl font-extrabold text-white tracking-tight">CareerMail</span>
          </div>

          {/* Heading */}
          <div className="space-y-1">
            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
              Track applications.
            </h1>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
              Stay organized.
            </h1>
            <h1 className="text-3xl md:text-5xl font-extrabold bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent tracking-tight leading-[1.15]">
              Land your dream job.
            </h1>
          </div>

          {/* Subtext */}
          <p className="text-sm md:text-base text-slate-400 leading-relaxed max-w-md">
            CareerMail automatically scans your emails, tracks your applications, schedules interviews, and never lets you miss a follow-up.
          </p>

          {/* 4 Feature Items matching Login.png */}
          <div className="space-y-4 pt-2">
            {/* Feature 1 */}
            <div className="flex items-start gap-4 group">
              <div className="w-11 h-11 rounded-2xl bg-[#141530] border border-violet-900/50 flex items-center justify-center flex-shrink-0 text-violet-400 shadow-sm transition-transform group-hover:scale-105">
                <Inbox className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white">Sync your Gmail</span>
                <span className="text-xs text-slate-400 leading-relaxed">
                  Connect your Gmail to auto-detect job applications and important updates.
                </span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start gap-4 group">
              <div className="w-11 h-11 rounded-2xl bg-[#181535] border border-purple-900/50 flex items-center justify-center flex-shrink-0 text-purple-400 shadow-sm transition-transform group-hover:scale-105">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white">Track your progress</span>
                <span className="text-xs text-slate-400 leading-relaxed">
                  Get real-time insights into your application pipeline and response rates.
                </span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start gap-4 group">
              <div className="w-11 h-11 rounded-2xl bg-[#1a1438] border border-fuchsia-900/50 flex items-center justify-center flex-shrink-0 text-fuchsia-400 shadow-sm transition-transform group-hover:scale-105">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white">Never miss an interview</span>
                <span className="text-xs text-slate-400 leading-relaxed">
                  Automatically detect interviews and get reminders for what matters.
                </span>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex items-start gap-4 group">
              <div className="w-11 h-11 rounded-2xl bg-[#131536] border border-indigo-900/50 flex items-center justify-center flex-shrink-0 text-indigo-400 shadow-sm transition-transform group-hover:scale-105">
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white">Smart follow-ups</span>
                <span className="text-xs text-slate-400 leading-relaxed">
                  Get AI-powered follow-up suggestions so you never fall off the radar.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sign In Card matching Login.png */}
        <div className="lg:col-span-6 flex justify-center lg:justify-end">
          <div className="w-full max-w-[440px] bg-[#0c1020]/90 backdrop-blur-xl border border-[#1e2744] rounded-[28px] p-8 md:p-10 shadow-2xl space-y-6">
            
            {/* Form Header */}
            <div className="text-center space-y-1.5">
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Welcome back
              </h2>
              <p className="text-xs md:text-sm text-slate-400">
                Sign in to continue to CareerMail
              </p>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="p-3 bg-rose-950/80 border border-rose-800/60 rounded-xl text-xs font-medium text-rose-300 text-center animate-fadeIn leading-relaxed">
                {error}
              </div>
            )}

            {/* Sign In Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#080d19] border border-slate-800 focus:border-purple-500 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-[#080d19] border border-slate-800 focus:border-purple-500 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Forgot password */}
              <div className="flex justify-end">
                <a href="#" className="text-xs text-purple-400 hover:text-purple-300 transition-colors font-medium">
                  Forgot password?
                </a>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-glow-purple flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                <span>{loading ? 'Signing in...' : 'Sign In'}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            {/* OR Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="h-px bg-slate-800 flex-1" />
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                OR
              </span>
              <div className="h-px bg-slate-800 flex-1" />
            </div>

            {/* Continue with Google Button matching Login.png */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading || loading}
                className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 rounded-xl text-sm font-bold shadow-md flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.7 1 4 3.5 2.2 7.1l3.7 2.8C6.7 7.3 9.1 5 12 5z"/>
                  <path fill="#4285F4" d="M22.6 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h6c-.3 1.4-1 2.5-2.2 3.3v2.8h3.6c2.1-1.9 3.2-4.7 3.2-8.1z"/>
                  <path fill="#FBBC05" d="M5.9 14.1c-.2-.7-.3-1.4-.3-2.1s.1-1.4.3-2.1V7.1H2.2C1.4 8.6 1 10.2 1 12s.4 3.4 1.2 4.9l3.7-2.8z"/>
                  <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.2v2.8C4 20.5 7.7 23 12 23z"/>
                </svg>
                <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
              </button>

              {/* Demo Account Quick Fill */}
              <button
                type="button"
                onClick={handleDemoFill}
                disabled={loading || googleLoading}
                className="w-full py-2 px-3 bg-[#11182c] hover:bg-[#18223d] border border-slate-800 hover:border-purple-800/60 rounded-xl text-xs font-semibold text-purple-300 flex items-center justify-center gap-1.5 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Fill Demo Credentials (Arjun Sharma)</span>
              </button>
            </div>

            {/* Bottom Sign up link */}
            <div className="text-center pt-1">
              <span className="text-xs text-slate-400">
                Don't have an account?{' '}
                <Link to="/register" className="text-purple-400 hover:text-purple-300 font-semibold hover:underline">
                  Sign up
                </Link>
              </span>
            </div>

          </div>
        </div>
      </div>

      {/* Footer matching Login.png */}
      <footer className="text-center text-xs text-slate-500 relative z-10 pt-4">
        © 2026 CareerMail. All rights reserved.
      </footer>
    </div>
  );
};
