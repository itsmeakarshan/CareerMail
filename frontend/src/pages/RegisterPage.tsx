import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { gmailApi } from '../services/api';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Password strength calculation
  const getPasswordStrength = () => {
    if (!password) return { score: 0, text: '', color: 'bg-slate-700' };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { score: 1, text: 'Weak', color: 'bg-rose-500' };
    if (score === 2) return { score: 2, text: 'Fair', color: 'bg-amber-500' };
    if (score === 3) return { score: 3, text: 'Good', color: 'bg-blue-500' };
    return { score: 4, text: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) return;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-[#fff0f5] via-[#fdf2f8] to-[#fce7f3] flex flex-col items-center justify-between p-4 sm:p-6 md:p-8 selection:bg-pink-500 selection:text-white relative overflow-hidden font-sans">
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-300/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-rose-200/40 rounded-full blur-3xl pointer-events-none" />

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

      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl border border-pink-200/80 rounded-[28px] p-8 md:p-10 shadow-2xl shadow-pink-500/10 relative z-10 space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-pink-400 p-[1.5px] flex items-center justify-center shadow-lg shadow-pink-500/25">
            <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-pink-500" fill="currentColor">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create your account</h1>
          <p className="text-xs text-slate-500">
            Start organizing your job search directly from your inbox
          </p>
        </div>

        {/* Google OAuth Quick Action */}
        <button
          type="button"
          onClick={async () => {
            setError('');
            try {
              const res = await gmailApi.getAuthUrl();
              if (res.url) {
                window.location.href = res.url;
              }
            } catch (err: any) {
              setError(err.message || 'Failed to initiate Google Sign Up');
            }
          }}
          className="w-full py-2.5 px-4 bg-white hover:bg-pink-50/50 border border-pink-200 text-slate-800 rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2.5 transition-all hover:scale-[1.01]"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4">
            <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.7 1 4 3.5 2.2 7.1l3.7 2.8C6.7 7.3 9.1 5 12 5z"/>
            <path fill="#4285F4" d="M22.6 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h6c-.3 1.4-1 2.5-2.2 3.3v2.8h3.6c2.1-1.9 3.2-4.7 3.2-8.1z"/>
            <path fill="#FBBC05" d="M5.9 14.1c-.2-.7-.3-1.4-.3-2.1s.1-1.4.3-2.1V7.1H2.2C1.4 8.6 1 10.2 1 12s.4 3.4 1.2 4.9l3.7-2.8z"/>
            <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.2v2.8C4 20.5 7.7 23 12 23z"/>
          </svg>
          <span>Sign up with Google / Gmail</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="h-px bg-pink-100 flex-1" />
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Or register with email
          </span>
          <div className="h-px bg-pink-100 flex-1" />
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 text-center animate-fadeIn">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                placeholder="Arjun Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-pink-50/40 border border-pink-200/80 focus:border-pink-500 focus:bg-white rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-200/60 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="name@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-pink-50/40 border border-pink-200/80 focus:border-pink-500 focus:bg-white rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-200/60 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-pink-50/40 border border-pink-200/80 focus:border-pink-500 focus:bg-white rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-200/60 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password strength meter */}
            {password && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>Strength</span>
                  <span className="font-semibold text-slate-700">{strength.text}</span>
                </div>
                <div className="h-1 w-full bg-pink-100 rounded-full overflow-hidden flex gap-1">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                    style={{ width: `${(strength.score / 4) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-pink-50/40 border border-pink-200/80 focus:border-pink-500 focus:bg-white rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-200/60 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:scale-[1.01]"
          >
            <span>{loading ? 'Creating account...' : 'Create Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2">
          <span className="text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-pink-600 hover:text-pink-700 font-bold hover:underline">
              Sign in
            </Link>
          </span>
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
