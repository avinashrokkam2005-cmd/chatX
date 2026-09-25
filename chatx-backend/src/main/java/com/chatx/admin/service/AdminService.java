package com.chatx.admin.service;

import com.chatx.admin.dto.*;
import com.chatx.admin.entity.AuditLog;
import com.chatx.admin.repository.AuditLogRepository;
import com.chatx.common.exception.AccessDeniedException;
import com.chatx.common.exception.BadRequestException;
import com.chatx.common.exception.ResourceNotFoundException;
import com.chatx.conversation.repository.ConversationRepository;
import com.chatx.message.repository.MessageRepository;
import com.chatx.report.dto.ReportDto;
import com.chatx.report.dto.ResolveReportRequest;
import com.chatx.report.enums.ReportStatus;
import com.chatx.report.repository.ReportRepository;
import com.chatx.report.service.ReportService;
import com.chatx.user.entity.User;
import com.chatx.user.enums.AccountStatus;
import com.chatx.user.enums.UserRole;
import com.chatx.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AdminService {

    private static final Logger log = LoggerFactory.getLogger(AdminService.class);

    private final UserRepository userRepository;
    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final ReportRepository reportRepository;
    private final ReportService reportService;
    private final AuditLogRepository auditLogRepository;

    public AdminService(UserRepository userRepository,
                        MessageRepository messageRepository,
                        ConversationRepository conversationRepository,
                        ReportRepository reportRepository,
                        ReportService reportService,
                        AuditLogRepository auditLogRepository) {
        this.userRepository = userRepository;
        this.messageRepository = messageRepository;
        this.conversationRepository = conversationRepository;
        this.reportRepository = reportRepository;
        this.reportService = reportService;
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(readOnly = true)
    public AdminDashboardStatsDto getStats() {
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByAccountStatus(AccountStatus.ACTIVE);
        long suspendedUsers = userRepository.countByAccountStatus(AccountStatus.SUSPENDED);
        long bannedUsers = userRepository.countByAccountStatus(AccountStatus.BANNED);

        long totalMessages = messageRepository.count();
        long totalConversations = conversationRepository.count();

        long pendingReports = reportRepository.countByStatus(ReportStatus.PENDING);
        long resolvedReports = reportRepository.countByStatus(ReportStatus.RESOLVED);

        return new AdminDashboardStatsDto(
                totalUsers,
                activeUsers,
                suspendedUsers,
                bannedUsers,
                totalMessages,
                totalConversations,
                pendingReports,
                resolvedReports
        );
    }

    @Transactional(readOnly = true)
    public Page<AdminUserDto> getUsers(String query, AccountStatus status, UserRole role, Pageable pageable) {
        String cleanQuery = (query != null && !query.trim().isEmpty()) ? query.trim() : null;
        Page<User> users = userRepository.findUsersByAdminCriteria(cleanQuery, status, role, pageable);
        return users.map(AdminUserDto::fromUser);
    }

    @Transactional
    public AdminUserDto updateUserStatus(UUID adminId, UUID targetUserId, UpdateUserStatusRequest request, String ipAddress) {
        if (adminId.equals(targetUserId)) {
            throw new BadRequestException("You cannot change your own account status");
        }

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", adminId));

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", targetUserId));

        // Protect SUPER_ADMIN from non-SUPER_ADMIN tampering
        if (targetUser.getRole() == UserRole.SUPER_ADMIN && admin.getRole() != UserRole.SUPER_ADMIN) {
            throw new AccessDeniedException("Only SUPER_ADMIN can modify a SUPER_ADMIN account status");
        }

        AccountStatus previousStatus = targetUser.getAccountStatus();
        targetUser.setAccountStatus(request.getStatus());
        User savedUser = userRepository.save(targetUser);

        // Record audit log
        String action = "USER_STATUS_" + request.getStatus().name();
        String details = "Status changed from " + previousStatus.name() + " to " + request.getStatus().name() +
                (request.getReason() != null ? ". Reason: " + request.getReason() : "");
        recordAudit(admin, action, "USER", targetUserId.toString(), details, ipAddress);

        log.info("Admin @{} updated status of user @{} from {} to {}",
                admin.getUsername(), targetUser.getUsername(), previousStatus, request.getStatus());

        return AdminUserDto.fromUser(savedUser);
    }

    @Transactional
    public AdminUserDto updateUserRole(UUID adminId, UUID targetUserId, UpdateUserRoleRequest request, String ipAddress) {
        if (adminId.equals(targetUserId)) {
            throw new BadRequestException("You cannot change your own role");
        }

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", adminId));

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", targetUserId));

        // Only SUPER_ADMIN can promote to or demote from SUPER_ADMIN
        if ((request.getRole() == UserRole.SUPER_ADMIN || targetUser.getRole() == UserRole.SUPER_ADMIN)
                && admin.getRole() != UserRole.SUPER_ADMIN) {
            throw new AccessDeniedException("Only SUPER_ADMIN can assign or modify the SUPER_ADMIN role");
        }

        UserRole previousRole = targetUser.getRole();
        targetUser.setRole(request.getRole());
        User savedUser = userRepository.save(targetUser);

        // Record audit log
        String action = "USER_ROLE_" + request.getRole().name();
        String details = "Role changed from " + previousRole.name() + " to " + request.getRole().name() +
                (request.getReason() != null ? ". Reason: " + request.getReason() : "");
        recordAudit(admin, action, "USER", targetUserId.toString(), details, ipAddress);

        log.info("Admin @{} updated role of user @{} from {} to {}",
                admin.getUsername(), targetUser.getUsername(), previousRole, request.getRole());

        return AdminUserDto.fromUser(savedUser);
    }

    @Transactional
    public ReportDto resolveReport(UUID adminId, UUID reportId, ResolveReportRequest request, String ipAddress) {
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", adminId));

        ReportDto resolved = reportService.resolveReport(adminId, reportId, request);

        // Record audit log
        recordAudit(admin, "REPORT_" + request.getStatus().name(), "REPORT", reportId.toString(),
                "Report resolved with status " + request.getStatus().name() +
                        (request.getResolutionNotes() != null ? ". Notes: " + request.getResolutionNotes() : ""),
                ipAddress);

        return resolved;
    }

    @Transactional(readOnly = true)
    public Page<AuditLogDto> getAuditLogs(Pageable pageable) {
        return auditLogRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(AuditLogDto::fromEntity);
    }

    private void recordAudit(User admin, String action, String targetType, String targetId, String details, String ipAddress) {
        AuditLog auditLog = new AuditLog(
                admin,
                admin.getUsername(),
                action,
                targetType,
                targetId,
                details,
                ipAddress
        );
        auditLogRepository.save(auditLog);
    }
}
