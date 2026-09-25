package com.chatx.admin;

import com.chatx.admin.dto.AdminDashboardStatsDto;
import com.chatx.admin.dto.AdminUserDto;
import com.chatx.admin.dto.UpdateUserRoleRequest;
import com.chatx.admin.dto.UpdateUserStatusRequest;
import com.chatx.admin.entity.AuditLog;
import com.chatx.admin.repository.AuditLogRepository;
import com.chatx.admin.service.AdminService;
import com.chatx.common.exception.AccessDeniedException;
import com.chatx.common.exception.BadRequestException;
import com.chatx.conversation.repository.ConversationRepository;
import com.chatx.message.repository.MessageRepository;
import com.chatx.report.enums.ReportStatus;
import com.chatx.report.repository.ReportRepository;
import com.chatx.report.service.ReportService;
import com.chatx.user.entity.User;
import com.chatx.user.enums.AccountStatus;
import com.chatx.user.enums.UserRole;
import com.chatx.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private ReportRepository reportRepository;

    @Mock
    private ReportService reportService;

    @Mock
    private AuditLogRepository auditLogRepository;

    private AdminService adminService;

    private User admin;
    private User regularUser;
    private User superAdmin;

    @BeforeEach
    void setUp() {
        adminService = new AdminService(
                userRepository,
                messageRepository,
                conversationRepository,
                reportRepository,
                reportService,
                auditLogRepository
        );

        admin = new User("admin", "admin@chatx.com", "hash", "Admin User");
        admin.setId(UUID.randomUUID());
        admin.setRole(UserRole.ADMIN);
        admin.setAccountStatus(AccountStatus.ACTIVE);

        regularUser = new User("baduser", "bad@chatx.com", "hash", "Bad User");
        regularUser.setId(UUID.randomUUID());
        regularUser.setRole(UserRole.USER);
        regularUser.setAccountStatus(AccountStatus.ACTIVE);

        superAdmin = new User("superadmin", "super@chatx.com", "hash", "Super Admin");
        superAdmin.setId(UUID.randomUUID());
        superAdmin.setRole(UserRole.SUPER_ADMIN);
        superAdmin.setAccountStatus(AccountStatus.ACTIVE);
    }

    @Test
    @DisplayName("Should return platform statistics accurately")
    void testGetStats() {
        when(userRepository.count()).thenReturn(100L);
        when(userRepository.countByAccountStatus(AccountStatus.ACTIVE)).thenReturn(90L);
        when(userRepository.countByAccountStatus(AccountStatus.SUSPENDED)).thenReturn(8L);
        when(userRepository.countByAccountStatus(AccountStatus.BANNED)).thenReturn(2L);
        when(messageRepository.count()).thenReturn(5420L);
        when(conversationRepository.count()).thenReturn(120L);
        when(reportRepository.countByStatus(ReportStatus.PENDING)).thenReturn(5L);
        when(reportRepository.countByStatus(ReportStatus.RESOLVED)).thenReturn(25L);

        AdminDashboardStatsDto stats = adminService.getStats();

        assertThat(stats.getTotalUsers()).isEqualTo(100L);
        assertThat(stats.getActiveUsers()).isEqualTo(90L);
        assertThat(stats.getSuspendedUsers()).isEqualTo(8L);
        assertThat(stats.getBannedUsers()).isEqualTo(2L);
        assertThat(stats.getTotalMessages()).isEqualTo(5420L);
        assertThat(stats.getTotalConversations()).isEqualTo(120L);
        assertThat(stats.getPendingReports()).isEqualTo(5L);
        assertThat(stats.getResolvedReports()).isEqualTo(25L);
    }

    @Test
    @DisplayName("Should successfully suspend user and record audit log")
    void testUpdateUserStatus_Success() {
        when(userRepository.findById(admin.getId())).thenReturn(Optional.of(admin));
        when(userRepository.findById(regularUser.getId())).thenReturn(Optional.of(regularUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateUserStatusRequest request = new UpdateUserStatusRequest(AccountStatus.SUSPENDED, "Spamming in public chat");
        AdminUserDto result = adminService.updateUserStatus(admin.getId(), regularUser.getId(), request, "127.0.0.1");

        assertThat(result.getAccountStatus()).isEqualTo(AccountStatus.SUSPENDED);
        assertThat(regularUser.getAccountStatus()).isEqualTo(AccountStatus.SUSPENDED);

        ArgumentCaptor<AuditLog> auditCaptor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(auditCaptor.capture());
        AuditLog savedAudit = auditCaptor.getValue();
        assertThat(savedAudit.getAdmin().getId()).isEqualTo(admin.getId());
        assertThat(savedAudit.getAction()).isEqualTo("USER_STATUS_SUSPENDED");
        assertThat(savedAudit.getTargetId()).isEqualTo(regularUser.getId().toString());
        assertThat(savedAudit.getDetails()).contains("Spamming in public chat");
    }

    @Test
    @DisplayName("Should reject admin modifying their own status")
    void testUpdateUserStatus_SelfModificationRejected() {
        UpdateUserStatusRequest request = new UpdateUserStatusRequest(AccountStatus.SUSPENDED, "Self ban");

        assertThatThrownBy(() -> adminService.updateUserStatus(admin.getId(), admin.getId(), request, "127.0.0.1"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("cannot change your own account status");
    }

    @Test
    @DisplayName("Should reject regular admin tampering with super admin status")
    void testUpdateUserStatus_SuperAdminProtected() {
        when(userRepository.findById(admin.getId())).thenReturn(Optional.of(admin));
        when(userRepository.findById(superAdmin.getId())).thenReturn(Optional.of(superAdmin));

        UpdateUserStatusRequest request = new UpdateUserStatusRequest(AccountStatus.BANNED, "Tampering attempt");

        assertThatThrownBy(() -> adminService.updateUserStatus(admin.getId(), superAdmin.getId(), request, "127.0.0.1"))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Only SUPER_ADMIN can modify a SUPER_ADMIN account status");
    }

    @Test
    @DisplayName("Should successfully promote user to admin and record audit log")
    void testUpdateUserRole_Success() {
        when(userRepository.findById(admin.getId())).thenReturn(Optional.of(admin));
        when(userRepository.findById(regularUser.getId())).thenReturn(Optional.of(regularUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateUserRoleRequest request = new UpdateUserRoleRequest(UserRole.ADMIN, "Promoted to moderator");
        AdminUserDto result = adminService.updateUserRole(admin.getId(), regularUser.getId(), request, "127.0.0.1");

        assertThat(result.getRole()).isEqualTo(UserRole.ADMIN);
        assertThat(regularUser.getRole()).isEqualTo(UserRole.ADMIN);

        verify(auditLogRepository).save(any(AuditLog.class));
    }

    @Test
    @DisplayName("Should reject regular admin assigning SUPER_ADMIN role")
    void testUpdateUserRole_SuperAdminAssignmentRestricted() {
        when(userRepository.findById(admin.getId())).thenReturn(Optional.of(admin));
        when(userRepository.findById(regularUser.getId())).thenReturn(Optional.of(regularUser));

        UpdateUserRoleRequest request = new UpdateUserRoleRequest(UserRole.SUPER_ADMIN, "Attempt promote to super admin");

        assertThatThrownBy(() -> adminService.updateUserRole(admin.getId(), regularUser.getId(), request, "127.0.0.1"))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Only SUPER_ADMIN can assign or modify the SUPER_ADMIN role");
    }

    @Test
    @DisplayName("Should retrieve audit logs with pagination")
    void testGetAuditLogs() {
        Pageable pageable = PageRequest.of(0, 10);
        AuditLog log1 = new AuditLog(admin, "admin", "USER_STATUS_BANNED", "USER", regularUser.getId().toString(), "Banned", "127.0.0.1");
        log1.setId(UUID.randomUUID());
        Page<AuditLog> page = new PageImpl<>(List.of(log1), pageable, 1);

        when(auditLogRepository.findAllByOrderByCreatedAtDesc(pageable)).thenReturn(page);

        var result = adminService.getAuditLogs(pageable);
        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).getAction()).isEqualTo("USER_STATUS_BANNED");
    }
}
