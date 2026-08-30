import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Inbox,
  Briefcase,
  Settings,
  LogOut,
  PenSquare,
  Search,
  Menu,
  X,
  ChevronDown,
  Star,
  Tag,
  Send,
  FileEdit,
  Moon,
  Sun,
  Camera,
  Sparkles,
  CalendarDays,
  BarChart3,
  Video,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { CareerAssistantWidget } from '../common/CareerAssistantWidget';
import { ComposeEmailModal } from '../email/ComposeEmailModal';
import { AvatarPickerModal } from '../common/AvatarPickerModal';
import { emailsApi } from '../../services/api';

export const AppLayout: React.FC = () => {
  const { user, updateProfile, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const isDark = theme === 'dark';

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const fetchEmailCounts = async () => {
    try {
      const counts = await emailsApi.getCounts();
      setUnreadCount(counts.unread || 0);
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchEmailCounts();
    const interval = setInterval(fetchEmailCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { label: 'Inbox', path: '/inbox', icon: Inbox, badge: unreadCount || undefined },
    { label: 'Important', path: '/inbox?folder=IMPORTANT', icon: Tag },
    { label: 'Starred', path: '/inbox?folder=STARRED', icon: Star },
    { label: 'Sent', path: '/inbox?folder=SENT', icon: Send },
    { label: 'Drafts', path: '/inbox?folder=DRAFTS', icon: FileEdit },
    { label: 'Job Tracker', path: '/', icon: Briefcase },
    { label: 'Calendar', path: '/calendar', icon: CalendarDays },
    { label: 'Interviews', path: '/interviews', icon: Video },
    { label: 'Follow-ups', path: '/follow-ups', icon: Clock },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/inbox?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div
      className={`flex h-screen w-screen overflow-hidden font-sans ${
        isDark ? 'bg-[#111318] text-[#e3e3e3]' : 'bg-[#f6f8fc] text-[#1f1f1f]'
      }`}
    >
      {/* Sidebar Overlay on Mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 ease-in-out border-r ${
          isDark
            ? 'bg-[#16181f] border-[#282a2d]'
            : 'bg-[#f0f4f9] border-[#e0e2e7]'
        } ${sidebarOpen ? 'w-64' : 'w-20'} ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo & Collapse Header */}
        <div
          className={`h-16 flex items-center justify-between px-4 border-b ${
            isDark ? 'border-[#282a2d]' : 'border-[#e0e2e7]'
          }`}
        >
          <div
            className="flex items-center gap-3 overflow-hidden cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-400 via-rose-400 to-pink-300 flex items-center justify-center shadow-md shadow-pink-500/20 flex-shrink-0">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="currentColor">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
            </div>
            {sidebarOpen && (
              <span
                className={`font-black text-lg tracking-tight ${
                  isDark ? 'text-white' : 'text-[#1f1f1f]'
                }`}
              >
                CareerMail
              </span>
            )}
          </div>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-1.5 rounded-lg transition-colors hidden lg:block ${
              isDark
                ? 'text-slate-400 hover:text-white hover:bg-[#282a2d]'
                : 'text-slate-600 hover:text-black hover:bg-[#e0e2e7]'
            }`}
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>

        {/* Primary Compose Action */}
        <div className="p-3">
          <button
            onClick={() => setShowComposeModal(true)}
            className={`w-full py-3 rounded-2xl flex items-center justify-center gap-3 font-semibold transition-all duration-200 shadow-md ${
              isDark
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-400 hover:to-rose-400 shadow-pink-500/20'
                : 'bg-gradient-to-r from-pink-500 via-rose-400 to-pink-400 text-white hover:from-pink-600 hover:to-rose-500 shadow-pink-500/25'
            } ${!sidebarOpen && 'px-0'}`}
          >
            <PenSquare className="w-4 h-4 flex-shrink-0 stroke-[2.5]" />
            {sidebarOpen && <span className="text-sm font-bold tracking-wide">Compose</span>}
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isFolderMatch =
              item.path.includes('folder=') &&
              location.pathname === '/inbox' &&
              location.search.includes(item.path.split('?')[1]);
            const isRootInbox =
              item.path === '/inbox' &&
              location.pathname === '/inbox' &&
              (!location.search || location.search === '');
            const isExactPathMatch = item.path !== '/inbox' && !item.path.includes('?') && location.pathname === item.path;

            const active = isFolderMatch || isRootInbox || isExactPathMatch;

            return (
              <NavLink
                key={item.label}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-full text-xs font-semibold transition-all duration-150 group ${
                  active
                    ? isDark
                      ? 'bg-[#282a2d] text-white shadow-sm font-bold'
                      : 'bg-[#d3e3fd] text-[#041e49] shadow-sm font-bold'
                    : isDark
                    ? 'text-[#c4c7c5] hover:bg-[#202227] hover:text-white'
                    : 'text-[#444746] hover:bg-[#e4e8ee] hover:text-[#1f1f1f]'
                }`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <Icon className="w-4 h-4 flex-shrink-0 transition-colors" />
                  {sidebarOpen && <span className="truncate">{item.label}</span>}
                </div>

                {sidebarOpen && item.badge !== undefined && (
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      isDark
                        ? 'bg-[#202227] text-pink-300'
                        : 'bg-[#fbcfe8] text-[#831843]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Profile Footer & Direct Logout */}
        <div
          className={`p-3 border-t space-y-2 relative ${
            isDark ? 'border-[#282a2d]' : 'border-[#e0e2e7]'
          }`}
        >
          {/* User Profile Row */}
          <div
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors ${
              isDark ? 'hover:bg-[#202227]' : 'hover:bg-[#e4e8ee]'
            }`}
            title="Profile options"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="relative group">
                <img
                  src={
                    user?.avatarUrl ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                  }
                  alt="Avatar"
                  className={`w-8 h-8 rounded-full object-cover border flex-shrink-0 ${
                    isDark ? 'border-slate-700' : 'border-slate-300'
                  }`}
                />
              </div>
              {sidebarOpen && (
                <div className="flex flex-col min-w-0">
                  <span
                    className={`text-xs font-semibold truncate ${
                      isDark ? 'text-white' : 'text-[#1f1f1f]'
                    }`}
                  >
                    {user?.name || 'My Account'}
                  </span>
                  <span
                    className={`text-[10px] truncate ${
                      isDark ? 'text-[#8e918f]' : 'text-[#5f6368]'
                    }`}
                  >
                    {user?.email || ''}
                  </span>
                </div>
              )}
            </div>
            {sidebarOpen && (
              <ChevronDown
                className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
              />
            )}
          </div>

          {/* User Options Dropdown */}
          {showUserMenu && (
            <div
              className={`absolute bottom-16 left-3 right-3 border rounded-2xl p-2 shadow-2xl z-50 animate-fadeIn space-y-1 ${
                isDark ? 'bg-[#1e1f20] border-[#282a2d]' : 'bg-white border-[#e0e2e7]'
              }`}
            >
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  setIsAvatarModalOpen(true);
                }}
                className={`w-full text-left px-3 py-2 text-xs rounded-xl flex items-center gap-2.5 ${
                  isDark
                    ? 'text-[#e3e3e3] hover:bg-[#282a2d]'
                    : 'text-[#1f1f1f] hover:bg-[#f0f4f9]'
                }`}
              >
                <Camera className="w-3.5 h-3.5 text-pink-500" />
                <span>Change Profile Picture</span>
              </button>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                }}
                className="w-full text-left px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-xl flex items-center gap-2.5 font-semibold"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}

          {/* Theme Toggle Pill */}
          {sidebarOpen && (
            <div
              className={`border rounded-xl p-1 flex items-center justify-between ${
                isDark ? 'bg-[#111318] border-[#282a2d]' : 'bg-[#e4e8ee] border-[#dadce0]'
              }`}
            >
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  isDark
                    ? 'bg-[#282a2d] text-white shadow-sm border border-slate-700/50'
                    : 'text-[#5f6368] hover:text-[#1f1f1f]'
                }`}
              >
                <Moon className={`w-3.5 h-3.5 ${isDark ? 'text-pink-400' : 'text-slate-500'}`} />
                <span>Dark</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  !isDark
                    ? 'bg-white text-[#1f1f1f] shadow-sm border border-slate-200'
                    : 'text-[#8e918f] hover:text-white'
                }`}
              >
                <Sun className={`w-3.5 h-3.5 ${!isDark ? 'text-amber-500' : 'text-slate-400'}`} />
                <span>Light</span>
              </button>
            </div>
          )}

          {/* Quick Logout Button for Sidebar */}
          {sidebarOpen && (
            <button
              onClick={logout}
              className={`w-full py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors border ${
                isDark
                  ? 'border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 hover:border-rose-900/40'
                  : 'border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200'
              }`}
            >
              <LogOut className="w-3.5 h-3.5 text-rose-500" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col h-full overflow-hidden ${
          isDark ? 'bg-[#111318]' : 'bg-[#f6f8fc]'
        }`}
      >
        {/* Top Navbar */}
        <header
          className={`h-16 px-6 border-b flex items-center justify-between gap-4 select-none z-30 ${
            isDark ? 'bg-[#111318] border-[#282a2d]' : 'bg-[#f6f8fc] border-[#e0e2e7]'
          }`}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className={`lg:hidden p-2 rounded-lg ${
                isDark ? 'text-slate-400 hover:text-white hover:bg-[#282a2d]' : 'text-slate-600 hover:text-black hover:bg-[#e0e2e7]'
              }`}
            >
              <Menu className="w-5 h-5" />
            </button>

            <form onSubmit={handleSearch} className="relative w-72 md:w-96">
              <Search
                className={`w-4 h-4 absolute left-3 top-2.5 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              />
              <input
                type="text"
                placeholder="Search emails, applications, companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-4 py-2 rounded-2xl text-xs transition-colors focus:outline-none ${
                  isDark
                    ? 'bg-[#1e1f20] border border-[#282a2d] text-white placeholder-slate-400 focus:border-pink-400'
                    : 'bg-[#eaf1fb] border border-[#dadce0] text-[#1f1f1f] placeholder-slate-500 focus:border-pink-400'
                }`}
              />
            </form>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3 relative">
            <button
              onClick={() => navigate('/settings')}
              className={`p-2 rounded-xl border transition-colors ${
                isDark
                  ? 'bg-[#16181f] border-[#282a2d] text-slate-300 hover:text-white hover:border-slate-600'
                  : 'bg-white border-[#e0e2e7] text-slate-700 hover:text-black hover:border-slate-400'
              }`}
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* User Profile Avatar with dropdown */}
            <div className="relative">
              <div
                onClick={() => setShowHeaderMenu(!showHeaderMenu)}
                className="cursor-pointer flex items-center gap-2 pl-1 group"
                title="Profile Menu"
              >
                <img
                  src={
                    user?.avatarUrl ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                  }
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover border-2 border-pink-400 shadow-sm transition-transform group-hover:scale-105"
                />
              </div>

              {showHeaderMenu && (
                <div
                  className={`absolute right-0 mt-2 w-56 border rounded-2xl p-2 shadow-2xl z-50 animate-fadeIn space-y-1 ${
                    isDark ? 'bg-[#1e1f20] border-[#282a2d]' : 'bg-white border-[#e0e2e7]'
                  }`}
                >
                  <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {user?.name || 'My Account'}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                  </div>

                  <button
                    onClick={() => {
                      setShowHeaderMenu(false);
                      setIsAvatarModalOpen(true);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs rounded-xl flex items-center gap-2.5 ${
                      isDark
                        ? 'text-[#e3e3e3] hover:bg-[#282a2d]'
                        : 'text-[#1f1f1f] hover:bg-[#f0f4f9]'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5 text-pink-500" />
                    <span>Change Avatar</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowHeaderMenu(false);
                      navigate('/settings');
                    }}
                    className={`w-full text-left px-3 py-2 text-xs rounded-xl flex items-center gap-2.5 ${
                      isDark
                        ? 'text-[#e3e3e3] hover:bg-[#282a2d]'
                        : 'text-[#1f1f1f] hover:bg-[#f0f4f9]'
                    }`}
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>Account Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowHeaderMenu(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-xl flex items-center gap-2.5 font-semibold"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Outlet */}
        <main
          className={`flex-1 overflow-y-auto p-4 md:p-6 transition-colors duration-200 ${
            isDark ? 'bg-[#111318]' : 'bg-[#f6f8fc]'
          }`}
        >
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

      {/* Global Avatar Picker Modal */}
      <AvatarPickerModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentAvatar={user?.avatarUrl}
        onSelectAvatar={async (url) => {
          await updateProfile({ avatarUrl: url });
        }}
      />
    </div>
  );
};
