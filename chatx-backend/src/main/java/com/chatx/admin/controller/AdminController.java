package com.chatx.admin.controller;

import com.chatx.admin.dto.*;
import com.chatx.admin.service.AdminService;
import com.chatx.common.dto.ApiResponse;
import com.chatx.common.dto.PagedResponse;
import com.chatx.report.dto.ReportDto;
import com.chatx.report.dto.ResolveReportRequest;
import com.chatx.report.enums.ReportStatus;
import com.chatx.report.service.ReportService;
import com.chatx.security.model.UserPrincipal;
import com.chatx.user.enums.AccountStatus;
import com.chatx.user.enums.UserRole;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
@Tag(name = "Admin", description = "Administration, moderation and system analytics APIs")
public class AdminController {

    private final AdminService adminService;
    private final ReportService reportService;

    public AdminController(AdminService adminService, ReportService reportService) {
        this.adminService = adminService;
        this.reportService = reportService;
    }

    @GetMapping("/stats")
    @Operation(summary = "Get platform metrics overview")
    public ResponseEntity<ApiResponse<AdminDashboardStatsDto>> getStats() {
        AdminDashboardStatsDto stats = adminService.getStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/users")
    @Operation(summary = "List and search users for administration")
    public ResponseEntity<ApiResponse<PagedResponse<AdminUserDto>>> getUsers(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) AccountStatus status,
            @RequestParam(required = false) UserRole role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<AdminUserDto> usersPage = adminService.getUsers(query, status, role, pageable);

        PagedResponse<AdminUserDto> paged = PagedResponse.<AdminUserDto>builder()
                .success(true)
                .data(usersPage.getContent())
                .pagination(new PagedResponse.PaginationInfo(
                        String.valueOf(page),
                        usersPage.hasNext(),
                        usersPage.getSize(),
                        usersPage.getTotalElements()))
                .build();

        return ResponseEntity.ok(ApiResponse.success(paged));
    }

    @PutMapping("/users/{id}/status")
    @Operation(summary = "Update user account status (ACTIVE, SUSPENDED, BANNED)")
    public ResponseEntity<ApiResponse<AdminUserDto>> updateUserStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserStatusRequest request,
            HttpServletRequest servletRequest) {

        String ipAddress = extractIpAddress(servletRequest);
        AdminUserDto updated = adminService.updateUserStatus(principal.getId(), id, request, ipAddress);
        return ResponseEntity.ok(ApiResponse.success(updated, "User status updated successfully"));
    }

    @PutMapping("/users/{id}/role")
    @Operation(summary = "Update user role (USER, ADMIN, SUPER_ADMIN)")
    public ResponseEntity<ApiResponse<AdminUserDto>> updateUserRole(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserRoleRequest request,
            HttpServletRequest servletRequest) {

        String ipAddress = extractIpAddress(servletRequest);
        AdminUserDto updated = adminService.updateUserRole(principal.getId(), id, request, ipAddress);
        return ResponseEntity.ok(ApiResponse.success(updated, "User role updated successfully"));
    }

    @GetMapping("/reports")
    @Operation(summary = "List moderation reports")
    public ResponseEntity<ApiResponse<PagedResponse<ReportDto>>> getReports(
            @RequestParam(required = false) ReportStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size);
        PagedResponse<ReportDto> reports = reportService.getReports(status, pageable);

        return ResponseEntity.ok(ApiResponse.success(reports));
    }

    @PutMapping("/reports/{id}/resolve")
    @Operation(summary = "Resolve or dismiss a moderation report")
    public ResponseEntity<ApiResponse<ReportDto>> resolveReport(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody ResolveReportRequest request,
            HttpServletRequest servletRequest) {

        String ipAddress = extractIpAddress(servletRequest);
        ReportDto report = adminService.resolveReport(principal.getId(), id, request, ipAddress);
        return ResponseEntity.ok(ApiResponse.success(report, "Report resolved successfully"));
    }

    @GetMapping("/audit-logs")
    @Operation(summary = "Get audit logs of all admin actions")
    public ResponseEntity<ApiResponse<PagedResponse<AuditLogDto>>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<AuditLogDto> logsPage = adminService.getAuditLogs(pageable);

        PagedResponse<AuditLogDto> paged = PagedResponse.<AuditLogDto>builder()
                .success(true)
                .data(logsPage.getContent())
                .pagination(new PagedResponse.PaginationInfo(
                        String.valueOf(page),
                        logsPage.hasNext(),
                        logsPage.getSize(),
                        logsPage.getTotalElements()))
                .build();

        return ResponseEntity.ok(ApiResponse.success(paged));
    }

    private String extractIpAddress(HttpServletRequest request) {
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            return xf.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
