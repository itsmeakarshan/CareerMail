import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    setEmail('akarshan@email.com');
    setPassword('password123');
    setError('');
    setLoading(true);
    try {
      await login('akarshan@email.com', 'password123');
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with demo account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-screen bg-[#fff0f5] bg-no-repeat text-slate-800 flex flex-col justify-between p-4 sm:p-6 md:p-8 relative overflow-hidden font-sans selection:bg-pink-500 selection:text-white"
      style={{
        backgroundImage: "url('/assets/login-bg.png'), url('/assets/Login.png')",
        backgroundSize: "contain",
        backgroundPosition: "left center",
        backgroundRepeat: "no-repeat",
        backgroundColor: "#fdecf3",
      }}
    >
      {/* Top Corner: Made by Akarshan Rasyal with LinkedIn Link */}
      <a
        href="https://www.linkedin.com/in/akarshanrasyal/"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-4 right-4 sm:top-6 sm:right-8 z-30 px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-50 border border-pink-200 hover:border-pink-300 shadow-sm hover:shadow-md transition-all hover:scale-105 flex items-center gap-2 group"
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

      {/* Main Container - Extreme Right Login Section (No Blur, No Zoom Distortion) */}
      <div className="w-full my-auto flex items-center justify-end relative z-10 py-4 pr-1 sm:pr-6 md:pr-12 lg:pr-16">
        <div className="w-full max-w-[420px] bg-white border border-pink-200/80 rounded-[26px] p-7 sm:p-8 md:p-9 shadow-2xl shadow-slate-900/10 space-y-5 animate-fadeIn">
          
          {/* Logo & Header */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 via-rose-500 to-pink-400 p-[1.5px] flex items-center justify-center shadow-md shadow-pink-500/20">
                <div className="w-full h-full bg-white rounded-[9px] flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 text-pink-500" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                </div>
              </div>
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">CareerMail</span>
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Welcome back
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Sign in to manage your career applications
              </p>
            </div>
          </div>

          {/* Error Notification */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 text-center animate-fadeIn leading-relaxed">
              {error}
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Email */}
            <div className="space-y-1">
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
                  className="w-full pl-10 pr-4 py-2.5 bg-pink-50/40 border border-pink-200/80 focus:border-pink-500 focus:bg-white rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-200/60 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
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
                  className="w-full pl-10 pr-10 py-2.5 bg-pink-50/40 border border-pink-200/80 focus:border-pink-500 focus:bg-white rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-200/60 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="flex justify-end pt-0.5">
              <a href="#" className="text-xs text-pink-600 hover:text-pink-700 transition-colors font-semibold">
                Forgot password?
              </a>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Demo Account Quick Fill */}
          <div className="pt-0.5">
            <button
              type="button"
              onClick={handleDemoFill}
              disabled={loading}
              className="w-full py-2.5 px-3 bg-pink-50 hover:bg-pink-100/80 border border-pink-200 text-pink-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-pink-500" />
              <span>Fill Demo Credentials (Akarshan)</span>
            </button>
          </div>

          {/* Bottom Sign up link */}
          <div className="text-center pt-0.5">
            <span className="text-xs text-slate-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-pink-600 hover:text-pink-700 font-bold hover:underline">
                Sign up
              </Link>
            </span>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="text-right sm:text-right text-xs text-slate-600 relative z-10 pt-2 flex flex-col sm:flex-row items-end sm:items-center justify-end gap-1 sm:gap-4 pr-1 sm:pr-6 md:pr-12 lg:pr-16">
        <span>© 2026 CareerMail. All rights reserved.</span>
        <span className="hidden sm:inline text-slate-300">•</span>
        <a
          href="https://www.linkedin.com/in/akarshanrasyal/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-slate-700 hover:text-pink-600 font-semibold transition-colors group"
        >
          <span>Made by Akarshan Rasyal</span>
          <span className="w-4 h-4 rounded bg-[#0A66C2] text-white flex items-center justify-center text-[9px] font-bold">in</span>
        </a>
      </footer>
    </div>
  );
};
