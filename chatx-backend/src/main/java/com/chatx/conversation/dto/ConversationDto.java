package com.chatx.conversation.dto;

import com.chatx.conversation.enums.ConversationMemberRole;
import com.chatx.conversation.enums.ConversationType;
import com.chatx.user.dto.UserSummaryDto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class ConversationDto {

    private UUID id;
    private ConversationType type;
    private String name;
    private String description;
    private String avatarUrl;
    private UserSummaryDto directParticipant;
    private List<ConversationMemberDto> members;
    private int memberCount;
    private UUID lastMessageId;
    private String lastMessageContent;
    private Instant lastMessageAt;
    private String lastMessageSenderUsername;
    private long unreadCount;
    private ConversationMemberRole myRole;
    private Instant createdAt;

    public ConversationDto() {
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public ConversationType getType() { return type; }
    public void setType(ConversationType type) { this.type = type; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public UserSummaryDto getDirectParticipant() { return directParticipant; }
    public void setDirectParticipant(UserSummaryDto directParticipant) { this.directParticipant = directParticipant; }

    public List<ConversationMemberDto> getMembers() { return members; }
    public void setMembers(List<ConversationMemberDto> members) { this.members = members; }

    public int getMemberCount() { return memberCount; }
    public void setMemberCount(int memberCount) { this.memberCount = memberCount; }

    public UUID getLastMessageId() { return lastMessageId; }
    public void setLastMessageId(UUID lastMessageId) { this.lastMessageId = lastMessageId; }

    public String getLastMessageContent() { return lastMessageContent; }
    public void setLastMessageContent(String lastMessageContent) { this.lastMessageContent = lastMessageContent; }

    public Instant getLastMessageAt() { return lastMessageAt; }
    public void setLastMessageAt(Instant lastMessageAt) { this.lastMessageAt = lastMessageAt; }

    public String getLastMessageSenderUsername() { return lastMessageSenderUsername; }
    public void setLastMessageSenderUsername(String lastMessageSenderUsername) { this.lastMessageSenderUsername = lastMessageSenderUsername; }

    public long getUnreadCount() { return unreadCount; }
    public void setUnreadCount(long unreadCount) { this.unreadCount = unreadCount; }

    public ConversationMemberRole getMyRole() { return myRole; }
    public void setMyRole(ConversationMemberRole myRole) { this.myRole = myRole; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
