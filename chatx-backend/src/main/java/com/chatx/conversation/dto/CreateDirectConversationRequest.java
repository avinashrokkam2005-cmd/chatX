package com.chatx.conversation.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public class CreateDirectConversationRequest {

    @NotNull(message = "Recipient user ID is required")
    private UUID recipientId;

    public CreateDirectConversationRequest() {
    }

    public CreateDirectConversationRequest(UUID recipientId) {
        this.recipientId = recipientId;
    }

    public UUID getRecipientId() {
        return recipientId;
    }

    public void setRecipientId(UUID recipientId) {
        this.recipientId = recipientId;
    }
}
