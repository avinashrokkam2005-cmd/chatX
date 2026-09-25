package com.chatx.report;

import com.chatx.report.dto.CreateReportRequest;
import com.chatx.report.dto.ReportDto;
import com.chatx.report.dto.ResolveReportRequest;
import com.chatx.report.entity.Report;
import com.chatx.report.enums.ReportReason;
import com.chatx.report.enums.ReportStatus;
import com.chatx.report.enums.ReportTargetType;
import com.chatx.report.repository.ReportRepository;
import com.chatx.report.service.ReportService;
import com.chatx.user.entity.User;
import com.chatx.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {

    @Mock
    private ReportRepository reportRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ReportService reportService;

    private User reporter;
    private User admin;

    @BeforeEach
    void setUp() {
        reporter = new User("reporter", "rep@example.com", "pass", "Reporter");
        ReflectionTestUtils.setField(reporter, "id", UUID.randomUUID());

        admin = new User("admin", "admin@example.com", "pass", "Admin");
        ReflectionTestUtils.setField(admin, "id", UUID.randomUUID());
    }

    @Test
    @DisplayName("Create report saves report with PENDING status")
    void createReport_Success() {
        UUID targetId = UUID.randomUUID();
        CreateReportRequest request = new CreateReportRequest(
                ReportTargetType.USER,
                targetId,
                ReportReason.SPAM,
                "User sending automated spam messages"
        );

        when(userRepository.findById(reporter.getId())).thenReturn(Optional.of(reporter));

        Report savedReport = new Report(reporter, ReportTargetType.USER, targetId, ReportReason.SPAM, request.getDetails());
        ReflectionTestUtils.setField(savedReport, "id", UUID.randomUUID());
        ReflectionTestUtils.setField(savedReport, "createdAt", Instant.now());
        ReflectionTestUtils.setField(savedReport, "updatedAt", Instant.now());

        when(reportRepository.save(any(Report.class))).thenReturn(savedReport);

        ReportDto result = reportService.createReport(reporter.getId(), request);

        assertThat(result).isNotNull();
        assertThat(result.getTargetType()).isEqualTo(ReportTargetType.USER);
        assertThat(result.getReason()).isEqualTo(ReportReason.SPAM);
        assertThat(result.getStatus()).isEqualTo(ReportStatus.PENDING);
        assertThat(result.getReporterUsername()).isEqualTo("reporter");
        verify(reportRepository).save(any(Report.class));
    }

    @Test
    @DisplayName("Resolve report updates status, resolution notes, and admin")
    void resolveReport_Success() {
        UUID reportId = UUID.randomUUID();
        Report report = new Report(reporter, ReportTargetType.MESSAGE, UUID.randomUUID(), ReportReason.HARASSMENT, "Harassment details");
        ReflectionTestUtils.setField(report, "id", reportId);
        ReflectionTestUtils.setField(report, "createdAt", Instant.now());
        ReflectionTestUtils.setField(report, "updatedAt", Instant.now());

        ResolveReportRequest request = new ResolveReportRequest(ReportStatus.RESOLVED, "User warned and message deleted");

        when(userRepository.findById(admin.getId())).thenReturn(Optional.of(admin));
        when(reportRepository.findById(reportId)).thenReturn(Optional.of(report));
        when(reportRepository.save(any(Report.class))).thenAnswer(i -> i.getArgument(0));

        ReportDto result = reportService.resolveReport(admin.getId(), reportId, request);

        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo(ReportStatus.RESOLVED);
        assertThat(result.getResolvedByUsername()).isEqualTo("admin");
        assertThat(result.getResolutionNotes()).isEqualTo("User warned and message deleted");
    }
}
