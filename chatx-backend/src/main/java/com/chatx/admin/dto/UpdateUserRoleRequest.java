package com.chatx.admin.dto;

import com.chatx.user.enums.UserRole;
import jakarta.validation.constraints.NotNull;

public class UpdateUserRoleRequest {

    @NotNull(message = "Role is required")
    private UserRole role;

    private String reason;

    public UpdateUserRoleRequest() {
    }

    public UpdateUserRoleRequest(UserRole role, String reason) {
        this.role = role;
        this.reason = reason;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
