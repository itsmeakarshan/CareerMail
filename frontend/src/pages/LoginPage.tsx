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
    <div className="min-h-screen w-screen bg-gradient-to-br from-[#fff0f5] via-[#fdf2f8] to-[#fce7f3] text-slate-800 flex flex-col justify-between p-6 md:p-12 relative overflow-hidden font-sans selection:bg-pink-500 selection:text-white">
      {/* Ambient soft background glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-pink-300/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[450px] h-[350px] bg-rose-200/40 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Corner: Made by Akarshan Rasyal with LinkedIn Link */}
      <a
        href="https://www.linkedin.com/in/akarshanrasyal/"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-5 right-5 sm:top-6 sm:right-8 z-30 px-3.5 py-1.5 rounded-full bg-white/90 hover:bg-white border border-pink-200 hover:border-pink-300 shadow-sm hover:shadow-md transition-all hover:scale-105 flex items-center gap-2 group backdrop-blur-md"
        title="Connect with Akarshan Rasyal on LinkedIn"
      >
        <span className="text-[11px] font-medium text-slate-600 group-hover:text-slate-900">
          Made by <strong className="text-pink-600 font-bold group-hover:text-pink-700">Akarshan Rasyal</strong>
        </span>
        <div className="w-5 h-5 rounded-full bg-[#0A66C2] text-white flex items-center justify-center shadow-xs flex-shrink-0 group-hover:scale-110 transition-transform">
          <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current">
            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
          </svg>
        </div>
      </a>

      {/* Subtle bottom wave curves */}
      <div className="absolute bottom-0 left-0 w-full h-48 pointer-events-none overflow-hidden opacity-40">
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
              <stop offset="0%" stopColor="#f472b6" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#fb7185" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#fda4af" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="waveGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.5" />
              <stop offset="60%" stopColor="#f472b6" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#fbcfe8" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Main Container */}
      <div className="max-w-6xl w-full mx-auto my-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center relative z-10 py-6">
        
        {/* Left Column: Brand, Pitch & 4 Feature Badges */}
        <div className="lg:col-span-6 flex flex-col justify-center space-y-7">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 via-rose-500 to-pink-400 p-[1.5px] flex items-center justify-center shadow-lg shadow-pink-500/25">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-pink-500" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
              </div>
            </div>
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">CareerMail</span>
          </div>

          {/* Heading */}
          <div className="space-y-1">
            <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Track applications.
            </h1>
            <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Stay organized.
            </h1>
            <h1 className="text-3xl md:text-5xl font-extrabold bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 bg-clip-text text-transparent tracking-tight leading-[1.15]">
              Land your dream job.
            </h1>
          </div>

          {/* Subtext */}
          <p className="text-sm md:text-base text-slate-600 leading-relaxed max-w-md">
            CareerMail automatically scans your emails, tracks your applications, schedules interviews, and never lets you miss a follow-up.
          </p>

          {/* 4 Feature Items */}
          <div className="space-y-3.5 pt-2">
            {/* Feature 1 */}
            <div className="flex items-start gap-4 p-3 rounded-2xl bg-white/80 border border-pink-100 shadow-sm transition-all hover:shadow-md hover:border-pink-200">
              <div className="w-10 h-10 rounded-xl bg-pink-50 border border-pink-200 flex items-center justify-center flex-shrink-0 text-pink-600">
                <Inbox className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-900">Sync your Gmail</span>
                <span className="text-xs text-slate-500 leading-relaxed">
                  Connect your Gmail to auto-detect job applications and important updates.
                </span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start gap-4 p-3 rounded-2xl bg-white/80 border border-pink-100 shadow-sm transition-all hover:shadow-md hover:border-pink-200">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center flex-shrink-0 text-rose-600">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-900">Track your progress</span>
                <span className="text-xs text-slate-500 leading-relaxed">
                  Get real-time insights into your application pipeline and response rates.
                </span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start gap-4 p-3 rounded-2xl bg-white/80 border border-pink-100 shadow-sm transition-all hover:shadow-md hover:border-pink-200">
              <div className="w-10 h-10 rounded-xl bg-pink-50 border border-pink-200 flex items-center justify-center flex-shrink-0 text-pink-600">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-900">Never miss an interview</span>
                <span className="text-xs text-slate-500 leading-relaxed">
                  Automatically detect interviews and get reminders for what matters.
                </span>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex items-start gap-4 p-3 rounded-2xl bg-white/80 border border-pink-100 shadow-sm transition-all hover:shadow-md hover:border-pink-200">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center flex-shrink-0 text-rose-600">
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-900">Smart follow-ups</span>
                <span className="text-xs text-slate-500 leading-relaxed">
                  Get AI-powered follow-up suggestions so you never fall off the radar.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sign In Card */}
        <div className="lg:col-span-6 flex justify-center lg:justify-end">
          <div className="w-full max-w-[440px] bg-white/95 backdrop-blur-xl border border-pink-200/80 rounded-[28px] p-8 md:p-10 shadow-2xl shadow-pink-500/10 space-y-6">
            
            {/* Form Header */}
            <div className="text-center space-y-1.5">
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Welcome back
              </h2>
              <p className="text-xs md:text-sm text-slate-500">
                Sign in to continue to CareerMail
              </p>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 text-center animate-fadeIn leading-relaxed">
                {error}
              </div>
            )}

            {/* Sign In Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-pink-50/40 border border-pink-200/80 focus:border-pink-500 focus:bg-white rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-200/60 transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-pink-50/40 border border-pink-200/80 focus:border-pink-500 focus:bg-white rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-200/60 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Forgot password */}
              <div className="flex justify-end">
                <a href="#" className="text-xs text-pink-600 hover:text-pink-700 transition-colors font-semibold">
                  Forgot password?
                </a>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                <span>{loading ? 'Signing in...' : 'Sign In'}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            {/* OR Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="h-px bg-pink-100 flex-1" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                OR
              </span>
              <div className="h-px bg-pink-100 flex-1" />
            </div>

            {/* Continue with Google Button */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading || loading}
                className="w-full py-3 px-4 bg-white hover:bg-pink-50/50 border border-pink-200 text-slate-800 rounded-xl text-sm font-bold shadow-sm flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99]"
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
                className="w-full py-2.5 px-3 bg-pink-50 hover:bg-pink-100/80 border border-pink-200 text-pink-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                <span>Fill Demo Credentials (Arjun Sharma)</span>
              </button>
            </div>

            {/* Bottom Sign up link */}
            <div className="text-center pt-1">
              <span className="text-xs text-slate-500">
                Don't have an account?{' '}
                <Link to="/register" className="text-pink-600 hover:text-pink-700 font-bold hover:underline">
                  Sign up
                </Link>
              </span>
            </div>

          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 relative z-10 pt-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
        <span>© 2026 CareerMail. All rights reserved.</span>
        <span className="hidden sm:inline text-slate-300">•</span>
        <a
          href="https://www.linkedin.com/in/akarshanrasyal/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-pink-600 font-semibold transition-colors group"
        >
          <span>Made by Akarshan Rasyal</span>
          <span className="w-4 h-4 rounded bg-[#0A66C2] text-white flex items-center justify-center text-[9px] font-bold">in</span>
        </a>
      </footer>
    </div>
  );
};
