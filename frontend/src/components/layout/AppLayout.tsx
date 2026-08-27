import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Inbox,
  Star,
  Bookmark,
  Send,
  FileText,
  Briefcase,
  Calendar,
  Bell,
  BarChart3,
  Settings,
  Search,
  PenSquare,
  Moon,
  Sun,
  Menu,
  ChevronDown,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { CareerAssistantWidget } from '../common/CareerAssistantWidget';
import { ComposeEmailModal } from '../email/ComposeEmailModal';

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Inbox', path: '/inbox', icon: Inbox, badge: 128 },
    { label: 'Important', path: '/inbox?folder=important', icon: Bookmark, badge: 32 },
    { label: 'Starred', path: '/inbox?folder=starred', icon: Star },
    { label: 'Sent', path: '/inbox?folder=sent', icon: Send },
    { label: 'Drafts', path: '/inbox?folder=drafts', icon: FileText, badge: 8 },
    { label: 'Job Tracker', path: '/', icon: Briefcase },
    { label: 'Interviews', path: '/interviews', icon: Calendar },
    { label: 'Follow-ups', path: '/follow-ups', icon: Bell, badge: 12 },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    if (location.pathname.startsWith('/inbox')) {
      navigate(`/inbox?q=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate(`/?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0a0e1a] text-slate-100 selection:bg-purple-500 selection:text-white">
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 flex flex-col bg-[#070a14] border-r border-[#1a233a] transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'w-64' : 'w-20'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo & Collapse Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#1a233a]/60">
          <div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={() => navigate('/')}>
            {/* Violet/purple gradient mail icon */}
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-500 flex items-center justify-center shadow-glow-purple flex-shrink-0">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="currentColor">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
            </div>
            {sidebarOpen && (
              <span className="font-extrabold text-lg text-white tracking-tight">CareerMail</span>
            )}
          </div>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Compose Button */}
        <div className="p-4">
          <button
            onClick={() => setShowComposeModal(true)}
            className={`w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold shadow-glow-purple flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02] active:scale-[0.98] ${
              !sidebarOpen ? 'px-0' : ''
            }`}
          >
            <PenSquare className="w-4 h-4" />
            {sidebarOpen && <span className="text-sm">Compose</span>}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto select-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isExactActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname + location.search === item.path ||
                  (item.path.startsWith('/inbox') && location.pathname.startsWith('/inbox') && !item.path.includes('?') && !location.search);

            return (
              <NavLink
                key={item.label}
                to={item.path}
                className={({ isActive }) => {
                  const active = isExactActive || (item.path !== '/' && !item.path.includes('?') && isActive);
                  return `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                    active
                      ? 'bg-[#182035] text-purple-300 font-semibold border-l-2 border-purple-500 shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-[#101524]'
                  }`;
                }}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon className="w-4 h-4 flex-shrink-0 text-slate-400 group-hover:text-purple-400 transition-colors" />
                  {sidebarOpen && <span className="truncate">{item.label}</span>}
                </div>

                {sidebarOpen && item.badge !== undefined && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#18223d] text-purple-300 border border-purple-900/40">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Profile Footer & Theme Switcher */}
        <div className="p-3 border-t border-[#1a233a]/60 space-y-2 relative">
          {/* User Row */}
          <div
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center justify-between p-2 rounded-xl hover:bg-[#141b2d] cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <img
                src={
                  user?.avatarUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                }
                alt="Avatar"
                className="w-8 h-8 rounded-full object-cover border border-slate-700 flex-shrink-0"
              />
              {sidebarOpen && (
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-white truncate">
                    {user?.name || 'Arjun Sharma'}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate">
                    {user?.email || 'arjun.sharma@email.com'}
                  </span>
                </div>
              )}
            </div>
            {sidebarOpen && <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
          </div>

          {/* User Dropdown */}
          {showUserMenu && (
            <div className="absolute bottom-16 left-3 right-3 bg-[#161e36] border border-slate-800 rounded-xl p-1.5 shadow-xl z-50 animate-fadeIn">
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  navigate('/settings');
                }}
                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 rounded-lg flex items-center gap-2"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Account Settings</span>
              </button>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                }}
                className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-rose-950/40 rounded-lg flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          )}

          {/* Theme Toggle Pill (Matching dashboard.png) */}
          {sidebarOpen && (
            <div className="bg-[#101626] border border-slate-800 rounded-xl p-1 flex items-center justify-between">
              <button
                onClick={() => theme !== 'dark' && toggleTheme()}
                className={`flex-1 py-1 px-2.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  theme === 'dark'
                    ? 'bg-[#1e2742] text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-purple-400" />
                <span>Dark</span>
              </button>
              <button
                onClick={() => theme !== 'light' && toggleTheme()}
                className={`flex-1 py-1 px-2.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  theme === 'light'
                    ? 'bg-slate-200 text-slate-900 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Light</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0a0e1a]">
        {/* Top Navbar */}
        <header className="h-16 px-6 border-b border-[#1a233a]/60 bg-[#0a0e1a] flex items-center justify-between gap-4 select-none z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Search Bar (with ⌘ K and / badges matching screenshot) */}
            <form onSubmit={handleSearch} className="relative w-72 md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search emails, applications, companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-16 py-2 bg-[#101626] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-colors"
              />
              <div className="absolute right-2.5 top-2 flex items-center gap-1">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800/80 text-slate-400 border border-slate-700">
                  ⌘ K
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800/80 text-slate-400 border border-slate-700">
                  /
                </span>
              </div>
            </form>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/interviews')}
              className="p-2 rounded-xl bg-[#101626] border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
              title="Calendar / Interviews"
            >
              <Calendar className="w-4 h-4" />
            </button>

            <div className="relative">
              <button
                onClick={() => navigate('/follow-ups')}
                className="p-2 rounded-xl bg-[#101626] border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center border border-[#0a0e1a]">
                  4
                </span>
              </button>
            </div>

            <div
              onClick={() => navigate('/settings')}
              className="cursor-pointer flex items-center gap-2 pl-1"
            >
              <img
                src={
                  user?.avatarUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                }
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover border-2 border-purple-500/60 shadow-sm"
              />
            </div>
          </div>
        </header>

        {/* Page Content Outlet */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#0a0e1a]">
          <Outlet />
        </main>
      </div>

      {/* Floating Career Assistant */}
      <CareerAssistantWidget />

      {/* Quick Compose Modal */}
      <ComposeEmailModal
        isOpen={showComposeModal}
        onClose={() => setShowComposeModal(false)}
      />
    </div>
  );
};
