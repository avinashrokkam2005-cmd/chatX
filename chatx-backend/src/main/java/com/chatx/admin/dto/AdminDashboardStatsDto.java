package com.chatx.admin.dto;

public class AdminDashboardStatsDto {

    private long totalUsers;
    private long activeUsers;
    private long suspendedUsers;
    private long bannedUsers;
    private long totalMessages;
    private long totalConversations;
    private long pendingReports;
    private long resolvedReports;

    public AdminDashboardStatsDto() {
    }

    public AdminDashboardStatsDto(long totalUsers, long activeUsers, long suspendedUsers, long bannedUsers,
                                  long totalMessages, long totalConversations, long pendingReports, long resolvedReports) {
        this.totalUsers = totalUsers;
        this.activeUsers = activeUsers;
        this.suspendedUsers = suspendedUsers;
        this.bannedUsers = bannedUsers;
        this.totalMessages = totalMessages;
        this.totalConversations = totalConversations;
        this.pendingReports = pendingReports;
        this.resolvedReports = resolvedReports;
    }

    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public long getActiveUsers() {
        return activeUsers;
    }

    public void setActiveUsers(long activeUsers) {
        this.activeUsers = activeUsers;
    }

    public long getSuspendedUsers() {
        return suspendedUsers;
    }

    public void setSuspendedUsers(long suspendedUsers) {
        this.suspendedUsers = suspendedUsers;
    }

    public long getBannedUsers() {
        return bannedUsers;
    }

    public void setBannedUsers(long bannedUsers) {
        this.bannedUsers = bannedUsers;
    }

    public long getTotalMessages() {
        return totalMessages;
    }

    public void setTotalMessages(long totalMessages) {
        this.totalMessages = totalMessages;
    }

    public long getTotalConversations() {
        return totalConversations;
    }

    public void setTotalConversations(long totalConversations) {
        this.totalConversations = totalConversations;
    }

    public long getPendingReports() {
        return pendingReports;
    }

    public void setPendingReports(long pendingReports) {
        this.pendingReports = pendingReports;
    }

    public long getResolvedReports() {
        return resolvedReports;
    }

    public void setResolvedReports(long resolvedReports) {
        this.resolvedReports = resolvedReports;
    }
}
