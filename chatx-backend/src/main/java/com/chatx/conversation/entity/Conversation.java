package com.chatx.conversation.entity;

import com.chatx.common.entity.BaseEntity;
import com.chatx.conversation.enums.ConversationType;
import com.chatx.user.entity.User;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "conversations", indexes = {
        @Index(name = "idx_conv_direct_pair", columnList = "direct_user_a_id, direct_user_b_id", unique = true),
        @Index(name = "idx_conv_last_message_at", columnList = "last_message_at")
})
public class Conversation extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private ConversationType type;

    @Column(name = "name", length = 100)
    private String name;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "avatar_url", length = 2048)
    private String avatarUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    // Canonical direct pair (userA < userB) for unique DIRECT conversations
    @Column(name = "direct_user_a_id", columnDefinition = "CHAR(36)")
    private UUID directUserAId;

    @Column(name = "direct_user_b_id", columnDefinition = "CHAR(36)")
    private UUID directUserBId;

    // Denormalized inbox acceleration columns
    @Column(name = "last_message_id", columnDefinition = "CHAR(36)")
    private UUID lastMessageId;

    @Column(name = "last_message_content", length = 1000)
    private String lastMessageContent;

    @Column(name = "last_message_at")
    private Instant lastMessageAt;

    @Column(name = "last_message_sender_username", length = 50)
    private String lastMessageSenderUsername;

    public Conversation() {
    }

    public static Conversation createDirect(UUID userA, UUID userB) {
        Conversation conv = new Conversation();
        conv.setType(ConversationType.DIRECT);
        if (userA.compareTo(userB) < 0) {
            conv.setDirectUserAId(userA);
            conv.setDirectUserBId(userB);
        } else {
            conv.setDirectUserAId(userB);
            conv.setDirectUserBId(userA);
        }
        return conv;
    }

    public static Conversation createGroup(String name, String description, String avatarUrl, User creator) {
        Conversation conv = new Conversation();
        conv.setType(ConversationType.GROUP);
        conv.setName(name);
        conv.setDescription(description);
        conv.setAvatarUrl(avatarUrl);
        conv.setCreatedBy(creator);
        return conv;
    }

    public ConversationType getType() { return type; }
    public void setType(ConversationType type) { this.type = type; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }

    public UUID getDirectUserAId() { return directUserAId; }
    public void setDirectUserAId(UUID directUserAId) { this.directUserAId = directUserAId; }

    public UUID getDirectUserBId() { return directUserBId; }
    public void setDirectUserBId(UUID directUserBId) { this.directUserBId = directUserBId; }

    public UUID getLastMessageId() { return lastMessageId; }
    public void setLastMessageId(UUID lastMessageId) { this.lastMessageId = lastMessageId; }

    public String getLastMessageContent() { return lastMessageContent; }
    public void setLastMessageContent(String lastMessageContent) { this.lastMessageContent = lastMessageContent; }

    public Instant getLastMessageAt() { return lastMessageAt; }
    public void setLastMessageAt(Instant lastMessageAt) { this.lastMessageAt = lastMessageAt; }

    public String getLastMessageSenderUsername() { return lastMessageSenderUsername; }
    public void setLastMessageSenderUsername(String lastMessageSenderUsername) { this.lastMessageSenderUsername = lastMessageSenderUsername; }
}
