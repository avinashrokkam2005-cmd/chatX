package com.chatx.message.dto;

import com.chatx.message.enums.MessageType;
import com.chatx.message.enums.ReceiptStatus;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class MessageDto {
    private UUID id;
    private UUID conversationId;
    private UUID senderId;
    private String senderUsername;
    private String senderDisplayName;
    private String senderAvatarUrl;
    private MessageType type;
    private String content;
    private boolean isEdited;
    private boolean isDeleted;
    private MessageReplySummaryDto replyTo;
    private List<MessageReactionDto> reactions = new ArrayList<>();
    private List<MessageAttachmentDto> attachments = new ArrayList<>();
    private ReceiptStatus deliveryStatus = ReceiptStatus.SENT;
    private int readCount = 0;
    private Instant createdAt;
    private Instant updatedAt;

    public MessageDto() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getConversationId() { return conversationId; }
    public void setConversationId(UUID conversationId) { this.conversationId = conversationId; }

    public UUID getSenderId() { return senderId; }
    public void setSenderId(UUID senderId) { this.senderId = senderId; }

    public String getSenderUsername() { return senderUsername; }
    public void setSenderUsername(String senderUsername) { this.senderUsername = senderUsername; }

    public String getSenderDisplayName() { return senderDisplayName; }
    public void setSenderDisplayName(String senderDisplayName) { this.senderDisplayName = senderDisplayName; }

    public String getSenderAvatarUrl() { return senderAvatarUrl; }
    public void setSenderAvatarUrl(String senderAvatarUrl) { this.senderAvatarUrl = senderAvatarUrl; }

    public MessageType getType() { return type; }
    public void setType(MessageType type) { this.type = type; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public boolean isEdited() { return isEdited; }
    public void setEdited(boolean edited) { isEdited = edited; }

    public boolean isDeleted() { return isDeleted; }
    public void setDeleted(boolean deleted) { isDeleted = deleted; }

    public MessageReplySummaryDto getReplyTo() { return replyTo; }
    public void setReplyTo(MessageReplySummaryDto replyTo) { this.replyTo = replyTo; }

    public List<MessageReactionDto> getReactions() { return reactions; }
    public void setReactions(List<MessageReactionDto> reactions) { this.reactions = reactions; }

    public List<MessageAttachmentDto> getAttachments() { return attachments; }
    public void setAttachments(List<MessageAttachmentDto> attachments) { this.attachments = attachments; }

    public ReceiptStatus getDeliveryStatus() { return deliveryStatus; }
    public void setDeliveryStatus(ReceiptStatus deliveryStatus) { this.deliveryStatus = deliveryStatus; }

    public int getReadCount() { return readCount; }
    public void setReadCount(int readCount) { this.readCount = readCount; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
