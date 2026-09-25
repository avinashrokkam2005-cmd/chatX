import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import adminApi, { AdminUsersQuery } from '../services/adminApi';
import { AdminDashboardStats, AdminUser, AuditLog } from '../../../types/admin';
import { ReportDto, ReportStatus } from '../../../types/report';
import {
  Shield,
  Users,
  MessageSquare,
  AlertTriangle,
  FileText,
  Search,
  RefreshCw,
  ArrowLeft,
  CheckCircle,
  XCircle,
  ShieldAlert,
  Loader2,
  Layers,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

type AdminTab = 'users' | 'reports' | 'audit';

export const AdminDashboardPage: React.FC = () => {
  const { user: currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Users Tab State
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userQuery, setUserQuery] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Reports Tab State
  const [reports, setReports] = useState<ReportDto[]>([]);
  const [reportStatusFilter, setReportStatusFilter] = useState<ReportStatus | ''>('PENDING');
  const [isLoadingReports, setIsLoadingReports] = useState(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  // Resolution modal state
  const [resolvingReport, setResolvingReport] = useState<ReportDto | null>(null);
  const [resolutionStatus, setResolutionStatus] = useState<'RESOLVED' | 'DISMISSED'>('RESOLVED');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isSubmittingResolution, setIsSubmittingResolution] = useState(false);

  // User action modal state
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('ACTIVE');
  const [statusReason, setStatusReason] = useState<string>('');
  const [isSubmittingUserStatus, setIsSubmittingUserStatus] = useState(false);

  const fetchStats = async () => {
    try {
      setIsLoadingStats(true);
      const data = await adminApi.getStats();
      setStats(data);
    } catch (err: any) {
      toast.error('Failed to load system statistics');
    } finally {
      setIsLoadingStats(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const query: AdminUsersQuery = {
        query: userQuery,
        status: userStatusFilter || undefined,
        role: userRoleFilter || undefined,
        page: 0,
        size: 50,
      };
      const res = await adminApi.getUsers(query);
      setUsers(res.data || []);
    } catch (err: any) {
      toast.error('Failed to load user list');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchReports = async () => {
    try {
      setIsLoadingReports(true);
      const res = await adminApi.getReports(reportStatusFilter || undefined);
      setReports(res.data || []);
    } catch (err: any) {
      toast.error('Failed to load reports queue');
    } finally {
      setIsLoadingReports(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setIsLoadingAudit(true);
      const res = await adminApi.getAuditLogs(0, 50);
      setAuditLogs(res.data || []);
    } catch (err: any) {
      toast.error('Failed to load audit logs');
    } finally {
      setIsLoadingAudit(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'reports') fetchReports();
    else if (activeTab === 'audit') fetchAuditLogs();
  }, [activeTab, userStatusFilter, userRoleFilter, reportStatusFilter]);

  const handleUserStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setIsSubmittingUserStatus(true);
      const updated = await adminApi.updateUserStatus(editingUser.id, selectedStatus, statusReason);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      toast.success(`User @${updated.username} status set to ${updated.accountStatus}`);
      setEditingUser(null);
      fetchStats();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update user status');
    } finally {
      setIsSubmittingUserStatus(false);
    }
  };

  const handleToggleRole = async (targetUser: AdminUser) => {
    const newRole = targetUser.role === 'ADMIN' ? 'USER' : 'ADMIN';
    if (!window.confirm(`Change role of @${targetUser.username} to ${newRole}?`)) return;

    try {
      const updated = await adminApi.updateUserRole(targetUser.id, newRole, 'Admin role toggle via dashboard');
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      toast.success(`User @${updated.username} role updated to ${updated.role}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update user role');
    }
  };

  const handleResolveReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingReport) return;

    try {
      setIsSubmittingResolution(true);
      const resolved = await adminApi.resolveReport(resolvingReport.id, resolutionStatus, resolutionNotes);
      setReports((prev) => prev.map((r) => (r.id === resolved.id ? resolved : r)));
      toast.success(`Report marked as ${resolutionStatus}`);
      setResolvingReport(null);
      setResolutionNotes('');
      fetchStats();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to resolve report');
    } finally {
      setIsSubmittingResolution(false);
    }
  };

  return (
    <div className="min-h-screen bg-chatx-bg text-chatx-text flex flex-col">
      {/* Top Admin Navbar */}
      <header className="border-b border-chatx-border bg-chatx-surface/90 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3.5">
          <Link
            to="/chat"
            className="p-2 rounded-xl bg-chatx-card hover:bg-chatx-hover border border-chatx-border text-chatx-text-secondary hover:text-white transition-colors"
            title="Return to Chat"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-white tracking-tight">ChatX Admin</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 uppercase tracking-wider">
                  {currentUser?.role}
                </span>
              </div>
              <p className="text-[11px] text-chatx-text-secondary">Platform Moderation & System Management</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchStats();
              if (activeTab === 'users') fetchUsers();
              if (activeTab === 'reports') fetchReports();
              if (activeTab === 'audit') fetchAuditLogs();
            }}
            className="btn-ghost text-xs py-2 px-3 flex items-center gap-1.5"
            title="Refresh statistics and data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <div className="h-6 w-px bg-chatx-border" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-xs font-bold text-white">
              {currentUser?.username.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-semibold text-white">@{currentUser?.username}</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Metric Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Users */}
          <div className="p-4 sm:p-5 rounded-2xl glass-panel border border-chatx-border">
            <div className="flex items-center justify-between text-chatx-text-secondary mb-2">
              <span className="text-xs font-medium">Registered Users</span>
              <Users className="w-4 h-4 text-chatx-accent" />
            </div>
            <div className="text-2xl font-black text-white tracking-tight">
              {isLoadingStats ? <Loader2 className="w-6 h-6 animate-spin text-chatx-accent" /> : stats?.totalUsers ?? 0}
            </div>
            <div className="text-[11px] text-chatx-text-secondary mt-1 flex items-center gap-2">
              <span className="text-emerald-400 font-semibold">{stats?.activeUsers ?? 0} active</span>
              <span>•</span>
              <span className="text-rose-400 font-semibold">{(stats?.suspendedUsers ?? 0) + (stats?.bannedUsers ?? 0)} suspended</span>
            </div>
          </div>

          {/* Total Messages */}
          <div className="p-4 sm:p-5 rounded-2xl glass-panel border border-chatx-border">
            <div className="flex items-center justify-between text-chatx-text-secondary mb-2">
              <span className="text-xs font-medium">Total Messages</span>
              <MessageSquare className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-white tracking-tight">
              {isLoadingStats ? <Loader2 className="w-6 h-6 animate-spin text-blue-400" /> : stats?.totalMessages ?? 0}
            </div>
            <div className="text-[11px] text-chatx-text-secondary mt-1">Real-time messaging platform</div>
          </div>

          {/* Total Conversations */}
          <div className="p-4 sm:p-5 rounded-2xl glass-panel border border-chatx-border">
            <div className="flex items-center justify-between text-chatx-text-secondary mb-2">
              <span className="text-xs font-medium">Conversations</span>
              <Layers className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-white tracking-tight">
              {isLoadingStats ? <Loader2 className="w-6 h-6 animate-spin text-purple-400" /> : stats?.totalConversations ?? 0}
            </div>
            <div className="text-[11px] text-chatx-text-secondary mt-1">Direct & Group chat rooms</div>
          </div>

          {/* Pending Reports */}
          <div className="p-4 sm:p-5 rounded-2xl glass-panel border border-chatx-border">
            <div className="flex items-center justify-between text-chatx-text-secondary mb-2">
              <span className="text-xs font-medium">Pending Reports</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              {isLoadingStats ? (
                <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
              ) : (
                <>
                  <span>{stats?.pendingReports ?? 0}</span>
                  {(stats?.pendingReports ?? 0) > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse font-bold">
                      Needs Action
                    </span>
                  )}
                </>
              )}
            </div>
            <div className="text-[11px] text-chatx-text-secondary mt-1">
              <span className="text-emerald-400 font-semibold">{stats?.resolvedReports ?? 0} resolved</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-chatx-border gap-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'users'
                ? 'border-chatx-accent text-white'
                : 'border-transparent text-chatx-text-secondary hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Management</span>
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all relative ${
              activeTab === 'reports'
                ? 'border-chatx-accent text-white'
                : 'border-transparent text-chatx-text-secondary hover:text-white'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Moderation Queue</span>
            {(stats?.pendingReports ?? 0) > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-black font-extrabold text-[10px]">
                {stats?.pendingReports}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'audit'
                ? 'border-chatx-accent text-white'
                : 'border-transparent text-chatx-text-secondary hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Audit Logs</span>
          </button>
        </div>

        {/* Tab 1: Users Management */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-chatx-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by username, email, display name..."
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                  className="input-field pl-9 w-full text-xs"
                />
              </div>

              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="input-field text-xs sm:w-40"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="BANNED">Banned</option>
              </select>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="input-field text-xs sm:w-40"
              >
                <option value="">All Roles</option>
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>

              <button onClick={fetchUsers} className="btn-primary text-xs py-2 px-4 shrink-0">
                Filter
              </button>
            </div>

            {/* Users Table */}
            <div className="rounded-2xl glass-panel border border-chatx-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-chatx-surface border-b border-chatx-border text-chatx-text-secondary">
                    <tr>
                      <th className="px-5 py-3.5 font-semibold">User</th>
                      <th className="px-5 py-3.5 font-semibold">Email</th>
                      <th className="px-5 py-3.5 font-semibold">Role</th>
                      <th className="px-5 py-3.5 font-semibold">Status</th>
                      <th className="px-5 py-3.5 font-semibold">Joined</th>
                      <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-chatx-border/40">
                    {isLoadingUsers ? (
                      <tr>
                        <td colSpan={6} className="py-16 text-center">
                          <Loader2 className="w-6 h-6 text-chatx-accent animate-spin mx-auto mb-2" />
                          <span className="text-chatx-text-secondary text-xs">Loading user registry...</span>
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-16 text-center text-chatx-text-secondary text-xs">
                          No users found matching query.
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => {
                        const isSelf = u.id === currentUser?.id;
                        return (
                          <tr key={u.id} className="hover:bg-chatx-surface/40 transition-colors">
                            <td className="px-5 py-3.5 flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-chatx-accent to-purple-600 flex items-center justify-center font-bold text-white text-xs overflow-hidden shrink-0">
                                {u.avatarUrl ? (
                                  <img src={u.avatarUrl} alt={u.username} className="w-full h-full object-cover" />
                                ) : (
                                  u.username.charAt(0).toUpperCase()
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-white flex items-center gap-1.5 truncate">
                                  <span>{u.displayName}</span>
                                  {isSelf && (
                                    <span className="text-[10px] px-1.5 py-0.2 bg-chatx-accent/20 text-chatx-accent rounded font-bold">
                                      You
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-chatx-text-secondary font-mono truncate">
                                  @{u.username}
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-chatx-text-secondary">{u.email}</td>
                            <td className="px-5 py-3.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  u.role === 'SUPER_ADMIN'
                                    ? 'bg-purple-500/15 border border-purple-500/30 text-purple-400'
                                    : u.role === 'ADMIN'
                                    ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                                    : 'bg-chatx-card border border-chatx-border text-chatx-text-secondary'
                                }`}
                              >
                                {u.role}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  u.accountStatus === 'ACTIVE'
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                    : u.accountStatus === 'SUSPENDED'
                                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                }`}
                              >
                                {u.accountStatus}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-chatx-text-secondary">
                              {format(new Date(u.createdAt), 'MMM d, yyyy')}
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              {!isSelf && (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => {
                                      setEditingUser(u);
                                      setSelectedStatus(u.accountStatus);
                                      setStatusReason('');
                                    }}
                                    className="p-1.5 rounded-lg bg-chatx-card hover:bg-chatx-hover border border-chatx-border text-chatx-text-secondary hover:text-white transition-colors"
                                    title="Change Account Status"
                                  >
                                    <ShieldAlert className="w-3.5 h-3.5" />
                                  </button>
                                  {currentUser?.role === 'SUPER_ADMIN' && (
                                    <button
                                      onClick={() => handleToggleRole(u)}
                                      className="p-1.5 rounded-lg bg-chatx-card hover:bg-chatx-hover border border-chatx-border text-chatx-text-secondary hover:text-amber-400 transition-colors"
                                      title="Toggle Admin Role"
                                    >
                                      <Shield className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Moderation Queue */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            {/* Filter buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setReportStatusFilter('PENDING')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  reportStatusFilter === 'PENDING'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-chatx-card text-chatx-text-secondary border-chatx-border hover:text-white'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setReportStatusFilter('RESOLVED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  reportStatusFilter === 'RESOLVED'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-chatx-card text-chatx-text-secondary border-chatx-border hover:text-white'
                }`}
              >
                Resolved
              </button>
              <button
                onClick={() => setReportStatusFilter('DISMISSED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  reportStatusFilter === 'DISMISSED'
                    ? 'bg-chatx-accent/20 text-white border-chatx-accent/40'
                    : 'bg-chatx-card text-chatx-text-secondary border-chatx-border hover:text-white'
                }`}
              >
                Dismissed
              </button>
              <button
                onClick={() => setReportStatusFilter('')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  reportStatusFilter === ''
                    ? 'bg-white/10 text-white border-white/20'
                    : 'bg-chatx-card text-chatx-text-secondary border-chatx-border hover:text-white'
                }`}
              >
                All
              </button>
            </div>

            {/* Reports List */}
            <div className="space-y-3">
              {isLoadingReports ? (
                <div className="py-20 text-center glass-panel rounded-2xl border border-chatx-border">
                  <Loader2 className="w-6 h-6 text-chatx-accent animate-spin mx-auto mb-2" />
                  <span className="text-chatx-text-secondary text-xs">Loading reports queue...</span>
                </div>
              ) : reports.length === 0 ? (
                <div className="py-20 text-center glass-panel rounded-2xl border border-chatx-border text-chatx-text-secondary text-xs">
                  <CheckCircle className="w-8 h-8 text-emerald-500/50 mx-auto mb-2" />
                  No reports found for this filter. Moderation queue is clean.
                </div>
              ) : (
                reports.map((r) => (
                  <div
                    key={r.id}
                    className="p-5 rounded-2xl glass-panel border border-chatx-border flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400">
                          {r.reason}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-chatx-card border border-chatx-border text-chatx-text-secondary">
                          TARGET: {r.targetType} ({r.targetId})
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.status === 'PENDING'
                              ? 'bg-amber-500/15 text-amber-400'
                              : r.status === 'RESOLVED'
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-chatx-card text-chatx-text-secondary'
                          }`}
                        >
                          {r.status}
                        </span>
                      </div>
                      <p className="text-xs text-white">
                        <span className="text-chatx-text-secondary font-normal">Reported by: </span>
                        <span className="font-semibold text-chatx-accent">@{r.reporterUsername}</span>
                      </p>
                      {r.details && (
                        <p className="text-xs text-chatx-text-secondary bg-chatx-surface/60 p-2.5 rounded-xl border border-chatx-border/60">
                          "{r.details}"
                        </p>
                      )}
                      {r.resolutionNotes && (
                        <p className="text-xs text-emerald-400/90 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                          Resolution Note: {r.resolutionNotes} (by @{r.resolvedByUsername})
                        </p>
                      )}
                      <div className="text-[10px] text-chatx-text-secondary">
                        Submitted on {format(new Date(r.createdAt), 'PPP p')}
                      </div>
                    </div>

                    {r.status === 'PENDING' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            setResolvingReport(r);
                            setResolutionStatus('RESOLVED');
                            setResolutionNotes('');
                          }}
                          className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Resolve</span>
                        </button>
                        <button
                          onClick={() => {
                            setResolvingReport(r);
                            setResolutionStatus('DISMISSED');
                            setResolutionNotes('');
                          }}
                          className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Dismiss</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Audit Logs */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="rounded-2xl glass-panel border border-chatx-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-chatx-surface border-b border-chatx-border text-chatx-text-secondary">
                    <tr>
                      <th className="px-5 py-3.5 font-semibold">Timestamp</th>
                      <th className="px-5 py-3.5 font-semibold">Admin</th>
                      <th className="px-5 py-3.5 font-semibold">Action</th>
                      <th className="px-5 py-3.5 font-semibold">Target</th>
                      <th className="px-5 py-3.5 font-semibold">Details</th>
                      <th className="px-5 py-3.5 font-semibold">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-chatx-border/40">
                    {isLoadingAudit ? (
                      <tr>
                        <td colSpan={6} className="py-16 text-center">
                          <Loader2 className="w-6 h-6 text-chatx-accent animate-spin mx-auto mb-2" />
                          <span className="text-chatx-text-secondary text-xs">Loading audit trail...</span>
                        </td>
                      </tr>
                    ) : auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-16 text-center text-chatx-text-secondary text-xs">
                          No audit entries recorded yet.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-chatx-surface/40 transition-colors">
                          <td className="px-5 py-3.5 text-chatx-text-secondary whitespace-nowrap">
                            {format(new Date(log.createdAt), 'MMM d, HH:mm:ss')}
                          </td>
                          <td className="px-5 py-3.5 font-semibold text-white">@{log.adminUsername}</td>
                          <td className="px-5 py-3.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-chatx-accent/15 border border-chatx-accent/30 text-chatx-accent">
                              {log.action}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-chatx-text-secondary">
                            {log.targetType ? `${log.targetType} (${log.targetId?.slice(0, 8)}...)` : '—'}
                          </td>
                          <td className="px-5 py-3.5 text-chatx-text-secondary max-w-xs truncate" title={log.details || ''}>
                            {log.details || '—'}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-chatx-text-secondary">{log.ipAddress || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Report Resolution Modal */}
      {resolvingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl glass-panel border border-chatx-border p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">
              {resolutionStatus === 'RESOLVED' ? 'Resolve Report' : 'Dismiss Report'}
            </h3>
            <p className="text-xs text-chatx-text-secondary mb-4">
              Enter any notes or actions taken regarding this report for the audit record.
            </p>

            <form onSubmit={handleResolveReport} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">Resolution Notes (Optional)</label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g., User warned, message removed, or false report..."
                  className="input-field w-full text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setResolvingReport(null)}
                  className="btn-ghost text-xs py-2 px-4"
                  disabled={isSubmittingResolution}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingResolution}
                  className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
                >
                  {isSubmittingResolution && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm {resolutionStatus}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Status Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl glass-panel border border-chatx-border p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">
              Update Status for @{editingUser.username}
            </h3>
            <p className="text-xs text-chatx-text-secondary mb-4">
              Changing status affects the user's ability to log in and interact with ChatX.
            </p>

            <form onSubmit={handleUserStatusUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">Account Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="input-field w-full text-xs"
                >
                  <option value="ACTIVE">ACTIVE (Normal Access)</option>
                  <option value="SUSPENDED">SUSPENDED (Temporarily Blocked)</option>
                  <option value="BANNED">BANNED (Permanently Blocked)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">Reason for Action</label>
                <input
                  type="text"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="e.g. Terms of Service violation, spam..."
                  className="input-field w-full text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="btn-ghost text-xs py-2 px-4"
                  disabled={isSubmittingUserStatus}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUserStatus}
                  className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
                >
                  {isSubmittingUserStatus && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Status</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
