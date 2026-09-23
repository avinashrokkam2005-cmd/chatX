package com.chatx.user.dto;

import com.chatx.user.entity.User;
import com.chatx.user.enums.MessagePrivacy;

import java.util.UUID;

public class UserSearchDto {

    private UUID id;
    private String username;
    private String displayName;
    private String avatarUrl;
    private String bio;
    private MessagePrivacy messagePrivacy;

    public UserSearchDto() {
    }

    public UserSearchDto(UUID id, String username, String displayName, String avatarUrl, String bio, MessagePrivacy messagePrivacy) {
        this.id = id;
        this.username = username;
        this.displayName = displayName;
        this.avatarUrl = avatarUrl;
        this.bio = bio;
        this.messagePrivacy = messagePrivacy;
    }

    public static UserSearchDto fromEntity(User user) {
        return new UserSearchDto(
                user.getId(),
                user.getUsername(),
                user.getDisplayName(),
                user.getAvatarUrl(),
                user.getBio(),
                user.getMessagePrivacy()
        );
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public MessagePrivacy getMessagePrivacy() { return messagePrivacy; }
    public void setMessagePrivacy(MessagePrivacy messagePrivacy) { this.messagePrivacy = messagePrivacy; }
}
