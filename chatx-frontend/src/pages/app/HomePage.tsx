import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { MessageSquare, LogOut, Shield, User, Mail, AtSign, CheckCircle2 } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-chatx-bg text-chatx-text flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-chatx-border bg-chatx-surface/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-chatx-accent/10 border border-chatx-accent/20 flex items-center justify-center text-chatx-accent">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-white">ChatX</span>
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-chatx-card border border-chatx-border text-chatx-text-secondary font-mono">
              v0.1.0
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 pr-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-chatx-accent to-purple-600 flex items-center justify-center font-bold text-white text-sm shadow-md">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : user?.username.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <div className="text-sm font-semibold text-white">{user?.displayName || user?.username}</div>
              <div className="text-xs text-chatx-accent">@{user?.username}</div>
            </div>
          </div>

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
            <span>Phase 2 Authenticated Session Active</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Hello, {user?.displayName || user?.username}!
          </h2>
          <p className="text-chatx-text-secondary mt-2 max-w-2xl text-sm leading-relaxed">
            Your JWT-secured session has been authenticated by Spring Security. Your permanent internal UUID identity is established, and your username is indexed for real-time search.
          </p>
        </div>

        {/* Identity Details Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Account Overview */}
          <div className="glass-panel p-6 space-y-5">
            <h3 className="text-base font-semibold text-white flex items-center gap-2 border-b border-chatx-border pb-3">
              <User className="w-4 h-4 text-chatx-accent" />
              Account Identity
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
                  <AtSign className="w-3.5 h-3.5" /> Username
                </span>
                <span className="font-semibold text-white">@{user?.username}</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-chatx-text-secondary flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Email
                </span>
                <span className="text-chatx-text font-medium">{user?.email}</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-chatx-text-secondary">Display Name</span>
                <span className="text-chatx-text font-medium">{user?.displayName || '—'}</span>
              </div>
            </div>
          </div>

          {/* Security & Access Level */}
          <div className="glass-panel p-6 space-y-5">
            <h3 className="text-base font-semibold text-white flex items-center gap-2 border-b border-chatx-border pb-3">
              <Shield className="w-4 h-4 text-chatx-accent" />
              Security & Access Control
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
                <span className="text-chatx-text-secondary">Message Privacy</span>
                <span className="text-chatx-text font-medium bg-chatx-card px-2.5 py-1 rounded-md border border-chatx-border text-xs">
                  {user?.messagePrivacy}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-chatx-text-secondary">Auth Mechanism</span>
                <span className="text-chatx-text font-mono text-xs">
                  Stateless JWT (HMAC-SHA256)
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
