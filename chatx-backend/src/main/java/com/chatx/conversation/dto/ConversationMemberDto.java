package com.chatx.conversation.dto;

import com.chatx.conversation.entity.ConversationMember;
import com.chatx.conversation.enums.ConversationMemberRole;
import com.chatx.user.entity.User;

import java.time.Instant;
import java.util.UUID;

public class ConversationMemberDto {

    private UUID userId;
    private String username;
    private String displayName;
    private String avatarUrl;
    private ConversationMemberRole role;
    private Instant joinedAt;

    public ConversationMemberDto() {
    }

    public ConversationMemberDto(UUID userId, String username, String displayName, String avatarUrl,
                                 ConversationMemberRole role, Instant joinedAt) {
        this.userId = userId;
        this.username = username;
        this.displayName = displayName;
        this.avatarUrl = avatarUrl;
        this.role = role;
        this.joinedAt = joinedAt;
    }

    public static ConversationMemberDto fromEntity(ConversationMember member) {
        User user = member.getUser();
        return new ConversationMemberDto(
                user.getId(),
                user.getUsername(),
                user.getDisplayName(),
                user.getAvatarUrl(),
                member.getRole(),
                member.getJoinedAt()
        );
    }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public ConversationMemberRole getRole() { return role; }
    public void setRole(ConversationMemberRole role) { this.role = role; }

    public Instant getJoinedAt() { return joinedAt; }
    public void setJoinedAt(Instant joinedAt) { this.joinedAt = joinedAt; }
}
