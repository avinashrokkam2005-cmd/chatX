package com.chatx.profile.dto;

import com.chatx.profile.entity.Profile;
import com.chatx.user.entity.User;
import com.chatx.user.enums.MessagePrivacy;
import com.chatx.user.enums.UserRole;

import java.time.Instant;
import java.util.UUID;

public class ProfileDto {

    private UUID userId;
    private String username;
    private String displayName;
    private String bio;
    private String avatarUrl;
    private UserRole role;
    private MessagePrivacy messagePrivacy;
    private Instant lastSeenAt;
    private Instant createdAt;

    public ProfileDto() {
    }

    public ProfileDto(UUID userId, String username, String displayName, String bio, String avatarUrl,
                      UserRole role, MessagePrivacy messagePrivacy, Instant lastSeenAt, Instant createdAt) {
        this.userId = userId;
        this.username = username;
        this.displayName = displayName;
        this.bio = bio;
        this.avatarUrl = avatarUrl;
        this.role = role;
        this.messagePrivacy = messagePrivacy;
        this.lastSeenAt = lastSeenAt;
        this.createdAt = createdAt;
    }

    public static ProfileDto fromEntity(Profile profile) {
        User user = profile.getUser();
        return new ProfileDto(
                user.getId(),
                user.getUsername(),
                profile.getDisplayName(),
                profile.getBio(),
                profile.getAvatarUrl(),
                user.getRole(),
                user.getMessagePrivacy(),
                user.getLastSeenAt(),
                user.getCreatedAt()
        );
    }

    public static ProfileDto fromUser(User user) {
        return new ProfileDto(
                user.getId(),
                user.getUsername(),
                user.getDisplayName(),
                user.getBio(),
                user.getAvatarUrl(),
                user.getRole(),
                user.getMessagePrivacy(),
                user.getLastSeenAt(),
                user.getCreatedAt()
        );
    }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public UserRole getRole() { return role; }
    public void setRole(UserRole role) { this.role = role; }

    public MessagePrivacy getMessagePrivacy() { return messagePrivacy; }
    public void setMessagePrivacy(MessagePrivacy messagePrivacy) { this.messagePrivacy = messagePrivacy; }

    public Instant getLastSeenAt() { return lastSeenAt; }
    public void setLastSeenAt(Instant lastSeenAt) { this.lastSeenAt = lastSeenAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
