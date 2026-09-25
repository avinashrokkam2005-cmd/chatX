package com.chatx.message.dto;

import com.chatx.message.enums.MessageType;

import java.util.UUID;

public class MessageReplySummaryDto {
    private UUID id;
    private String senderUsername;
    private String senderDisplayName;
    private MessageType type;
    private String content;

    public MessageReplySummaryDto() {}

    public MessageReplySummaryDto(UUID id, String senderUsername, String senderDisplayName, MessageType type, String content) {
        this.id = id;
        this.senderUsername = senderUsername;
        this.senderDisplayName = senderDisplayName;
        this.type = type;
        this.content = content;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getSenderUsername() { return senderUsername; }
    public void setSenderUsername(String senderUsername) { this.senderUsername = senderUsername; }

    public String getSenderDisplayName() { return senderDisplayName; }
    public void setSenderDisplayName(String senderDisplayName) { this.senderDisplayName = senderDisplayName; }

    public MessageType getType() { return type; }
    public void setType(MessageType type) { this.type = type; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}
