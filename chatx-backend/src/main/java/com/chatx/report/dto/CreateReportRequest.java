package com.chatx.report.dto;

import com.chatx.report.enums.ReportReason;
import com.chatx.report.enums.ReportTargetType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public class CreateReportRequest {

    @NotNull(message = "Target type is required")
    private ReportTargetType targetType;

    @NotNull(message = "Target ID is required")
    private UUID targetId;

    @NotNull(message = "Report reason is required")
    private ReportReason reason;

    @Size(max = 1000, message = "Details must not exceed 1000 characters")
    private String details;

    public CreateReportRequest() {}

    public CreateReportRequest(ReportTargetType targetType, UUID targetId, ReportReason reason, String details) {
        this.targetType = targetType;
        this.targetId = targetId;
        this.reason = reason;
        this.details = details;
    }

    public ReportTargetType getTargetType() { return targetType; }
    public void setTargetType(ReportTargetType targetType) { this.targetType = targetType; }

    public UUID getTargetId() { return targetId; }
    public void setTargetId(UUID targetId) { this.targetId = targetId; }

    public ReportReason getReason() { return reason; }
    public void setReason(ReportReason reason) { this.reason = reason; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
}
