package com.chatx.message.dto;

import com.chatx.message.enums.MessageType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public class SendMessageRequest {

    @NotNull(message = "Conversation ID is required")
    private UUID conversationId;

    private MessageType type = MessageType.TEXT;

    @Size(max = 10000, message = "Message content must not exceed 10000 characters")
    private String content;

    private UUID replyToMessageId;

    private List<MessageAttachmentDto> attachments;

    public SendMessageRequest() {}

    public SendMessageRequest(UUID conversationId, String content) {
        this.conversationId = conversationId;
        this.content = content;
        this.type = MessageType.TEXT;
    }

    public UUID getConversationId() { return conversationId; }
    public void setConversationId(UUID conversationId) { this.conversationId = conversationId; }

    public MessageType getType() { return type; }
    public void setType(MessageType type) { this.type = type; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public UUID getReplyToMessageId() { return replyToMessageId; }
    public void setReplyToMessageId(UUID replyToMessageId) { this.replyToMessageId = replyToMessageId; }

    public List<MessageAttachmentDto> getAttachments() { return attachments; }
    public void setAttachments(List<MessageAttachmentDto> attachments) { this.attachments = attachments; }
}
