package com.chatx.friendship.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public class SendFriendRequest {

    @NotNull(message = "Target user ID is required")
    private UUID targetUserId;

    public SendFriendRequest() {
    }

    public SendFriendRequest(UUID targetUserId) {
        this.targetUserId = targetUserId;
    }

    public UUID getTargetUserId() {
        return targetUserId;
    }

    public void setTargetUserId(UUID targetUserId) {
        this.targetUserId = targetUserId;
    }
}
