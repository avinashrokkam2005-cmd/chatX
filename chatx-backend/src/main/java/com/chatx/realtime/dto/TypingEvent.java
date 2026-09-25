package com.chatx.realtime.dto;

import java.util.UUID;

public class TypingEvent {

    private UUID conversationId;
    private UUID userId;
    private String username;
    private boolean isTyping;

    public TypingEvent() {}

    public TypingEvent(UUID conversationId, UUID userId, String username, boolean isTyping) {
        this.conversationId = conversationId;
        this.userId = userId;
        this.username = username;
        this.isTyping = isTyping;
    }

    public UUID getConversationId() { return conversationId; }
    public void setConversationId(UUID conversationId) { this.conversationId = conversationId; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public boolean isTyping() { return isTyping; }
    public void setTyping(boolean typing) { isTyping = typing; }
}
