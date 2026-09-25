package com.chatx.report.service;

import com.chatx.common.dto.PagedResponse;
import com.chatx.common.exception.ResourceNotFoundException;
import com.chatx.report.dto.CreateReportRequest;
import com.chatx.report.dto.ReportDto;
import com.chatx.report.dto.ResolveReportRequest;
import com.chatx.report.entity.Report;
import com.chatx.report.enums.ReportStatus;
import com.chatx.report.repository.ReportRepository;
import com.chatx.user.entity.User;
import com.chatx.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class ReportService {

    private static final Logger log = LoggerFactory.getLogger(ReportService.class);

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;

    public ReportService(ReportRepository reportRepository, UserRepository userRepository) {
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
    }

    public ReportDto createReport(UUID reporterId, CreateReportRequest request) {
        User reporter = userRepository.findById(reporterId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", reporterId));

        Report report = new Report(
                reporter,
                request.getTargetType(),
                request.getTargetId(),
                request.getReason(),
                request.getDetails()
        );

        Report saved = reportRepository.save(report);
        log.info("Report filed by @{} against {} (id: {}) for reason: {}",
                reporter.getUsername(), request.getTargetType(), request.getTargetId(), request.getReason());

        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public PagedResponse<ReportDto> getReports(ReportStatus status, Pageable pageable) {
        Page<Report> page = reportRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
        List<ReportDto> content = page.getContent().stream().map(this::mapToDto).collect(Collectors.toList());
        return PagedResponse.<ReportDto>builder()
                .success(true)
                .data(content)
                .pagination(new PagedResponse.PaginationInfo(null, !page.isLast(), page.getSize(), page.getTotalElements()))
                .build();
    }

    public ReportDto resolveReport(UUID adminId, UUID reportId, ResolveReportRequest request) {
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", adminId));

        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report", "id", reportId));

        report.setStatus(request.getStatus());
        report.setResolvedBy(admin);
        report.setResolutionNotes(request.getResolutionNotes());

        Report saved = reportRepository.save(report);
        log.info("Report {} resolved as {} by admin @{}", reportId, request.getStatus(), admin.getUsername());

        return mapToDto(saved);
    }

    private ReportDto mapToDto(Report entity) {
        ReportDto dto = new ReportDto();
        dto.setId(entity.getId());
        dto.setReporterId(entity.getReporter().getId());
        dto.setReporterUsername(entity.getReporter().getUsername());
        dto.setTargetType(entity.getTargetType());
        dto.setTargetId(entity.getTargetId());
        dto.setReason(entity.getReason());
        dto.setDetails(entity.getDetails());
        dto.setStatus(entity.getStatus());
        if (entity.getResolvedBy() != null) {
            dto.setResolvedByUsername(entity.getResolvedBy().getUsername());
        }
        dto.setResolutionNotes(entity.getResolutionNotes());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }
}
