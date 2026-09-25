import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  MessageSquare,
  LogOut,
  Shield,
  User,
  Mail,
  AtSign,
  CheckCircle2,
  Search,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react';
import { UserSearchModal } from '../../features/users/components/UserSearchModal';

export const HomePage: React.FC = () => {
  const { user, logout } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Global Ctrl+K / Cmd+K listener to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-chatx-bg text-chatx-text flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-chatx-border bg-chatx-surface/80 backdrop-blur-md sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-chatx-accent/10 border border-chatx-accent/20 flex items-center justify-center text-chatx-accent shadow-sm">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white">ChatX</span>
              <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-chatx-card border border-chatx-border text-chatx-text-secondary font-mono">
                v0.1.0
              </span>
            </div>
          </Link>

          {/* Search Trigger Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-chatx-card/80 hover:bg-chatx-hover border border-chatx-border text-chatx-text-secondary hover:text-white transition-all text-xs"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search users (@username)...</span>
            <kbd className="ml-2 px-1.5 py-0.5 rounded bg-chatx-bg text-[10px] border border-chatx-border font-mono">
              Ctrl+K
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="sm:hidden p-2 rounded-lg bg-chatx-card hover:bg-chatx-hover border border-chatx-border text-chatx-text-secondary"
            title="Search users"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Chat Messages link */}
          <Link
            to="/chat"
            className="p-2 rounded-lg bg-chatx-card hover:bg-chatx-hover border border-chatx-border text-chatx-text-secondary hover:text-white transition-colors"
            title="Chat Conversations"
          >
            <MessageSquare className="w-4 h-4" />
          </Link>

          {/* Friends link */}
          <Link
            to="/friends"
            className="p-2 rounded-lg bg-chatx-card hover:bg-chatx-hover border border-chatx-border text-chatx-text-secondary hover:text-white transition-colors"
            title="Friends & Requests"
          >
            <Users className="w-4 h-4" />
          </Link>

          {/* Profile & Settings link */}
          <Link
            to="/profile"
            className="p-2 rounded-lg bg-chatx-card hover:bg-chatx-hover border border-chatx-border text-chatx-text-secondary hover:text-white transition-colors"
            title="Edit profile & privacy"
          >
            <Settings className="w-4 h-4" />
          </Link>

          {/* User Badge */}
          <Link
            to="/profile"
            className="flex items-center gap-2.5 px-2 py-1 rounded-xl hover:bg-chatx-card/60 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-chatx-accent to-purple-600 flex items-center justify-center font-bold text-white text-xs shadow-md overflow-hidden">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                user?.displayName ? user.displayName.charAt(0).toUpperCase() : user?.username.charAt(0).toUpperCase()
              )}
            </div>
            <div className="hidden md:block text-left leading-tight">
              <div className="text-xs font-semibold text-white">{user?.displayName || user?.username}</div>
              <div className="text-[11px] text-chatx-accent">@{user?.username}</div>
            </div>
          </Link>

          {/* Logout */}
          <button
            onClick={logout}
            className="p-2 rounded-lg bg-chatx-card hover:bg-chatx-hover border border-chatx-border text-chatx-text-secondary hover:text-chatx-danger transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-10 space-y-8">
        {/* Welcome Banner */}
        <div className="glass-panel p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-chatx-accent/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="flex items-center gap-2 text-chatx-success text-xs font-semibold uppercase tracking-wider mb-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Phases 1, 2 & 3 Active</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Welcome, {user?.displayName || user?.username}!
          </h2>
          <p className="text-chatx-text-secondary mt-2 max-w-2xl text-sm leading-relaxed">
            Your ChatX profile and username search are live. You can discover other users by typing their username handle or edit your display bio and messaging privacy settings.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="btn-primary text-xs flex items-center gap-2 py-2.5 px-4"
            >
              <Search className="w-4 h-4" />
              <span>Search Other Users</span>
            </button>
            <Link
              to="/friends"
              className="btn-secondary text-xs flex items-center gap-2 py-2.5 px-4"
            >
              <Users className="w-4 h-4" />
              <span>Friends & Requests</span>
            </Link>
            <Link
              to="/profile"
              className="btn-secondary text-xs flex items-center gap-2 py-2.5 px-4"
            >
              <User className="w-4 h-4" />
              <span>Edit My Profile & Privacy</span>
            </Link>
          </div>
        </div>

        {/* Identity & Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Account Overview */}
          <div className="glass-panel p-6 space-y-5">
            <h3 className="text-base font-semibold text-white flex items-center gap-2 border-b border-chatx-border pb-3">
              <User className="w-4 h-4 text-chatx-accent" />
              Profile Identity
            </h3>

            <div className="space-y-4 text-sm">
              <div>
                <div className="text-xs text-chatx-text-secondary mb-1">Permanent Internal UUID</div>
                <div className="font-mono text-xs bg-chatx-bg p-2.5 rounded-lg border border-chatx-border text-chatx-text select-all break-all">
                  {user?.id}
                </div>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-chatx-text-secondary flex items-center gap-1.5">
                  <AtSign className="w-3.5 h-3.5" /> Searchable Username
                </span>
                <span className="font-semibold text-white font-mono">@{user?.username}</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-chatx-text-secondary flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Email
                </span>
                <span className="text-chatx-text font-medium">{user?.email}</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-chatx-text-secondary">Bio</span>
                <span className="text-chatx-text font-normal text-xs italic">
                  {user?.bio || 'No bio set'}
                </span>
              </div>
            </div>
          </div>

          {/* Security & Access Level */}
          <div className="glass-panel p-6 space-y-5">
            <h3 className="text-base font-semibold text-white flex items-center gap-2 border-b border-chatx-border pb-3">
              <Shield className="w-4 h-4 text-chatx-accent" />
              Privacy & Access Rules
            </h3>

            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between py-1">
                <span className="text-chatx-text-secondary">Assigned Role</span>
                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-chatx-accent/10 border border-chatx-accent/30 text-chatx-accent">
                  {user?.role}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-chatx-text-secondary">Account Status</span>
                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-chatx-success/10 border border-chatx-success/30 text-chatx-success">
                  {user?.accountStatus}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-chatx-text-secondary">Direct Message Privacy</span>
                <span className="text-chatx-text font-medium bg-chatx-card px-2.5 py-1 rounded-md border border-chatx-border text-xs">
                  {user?.messagePrivacy}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-chatx-text-secondary">Next Upcoming Phase</span>
                <span className="text-chatx-accent text-xs font-semibold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Phase 4: Friend System
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* User Search Modal */}
      <UserSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
};

export default HomePage;
