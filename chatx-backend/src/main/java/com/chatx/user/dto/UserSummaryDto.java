package com.chatx.user.dto;

import com.chatx.user.entity.User;
import com.chatx.user.enums.AccountStatus;
import com.chatx.user.enums.MessagePrivacy;
import com.chatx.user.enums.UserRole;

import java.util.UUID;

public class UserSummaryDto {

    private UUID id;
    private String username;
    private String email;
    private String displayName;
    private String bio;
    private String avatarUrl;
    private UserRole role;
    private AccountStatus accountStatus;
    private MessagePrivacy messagePrivacy;

    public UserSummaryDto() {
    }

    public UserSummaryDto(UUID id, String username, String email, String displayName, String bio,
                          String avatarUrl, UserRole role, AccountStatus accountStatus, MessagePrivacy messagePrivacy) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.displayName = displayName;
        this.bio = bio;
        this.avatarUrl = avatarUrl;
        this.role = role;
        this.accountStatus = accountStatus;
        this.messagePrivacy = messagePrivacy;
    }

    public static UserSummaryDto fromEntity(User user) {
        return new UserSummaryDto(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getDisplayName(),
                user.getBio(),
                user.getAvatarUrl(),
                user.getRole(),
                user.getAccountStatus(),
                user.getMessagePrivacy()
        );
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public UserRole getRole() { return role; }
    public void setRole(UserRole role) { this.role = role; }

    public AccountStatus getAccountStatus() { return accountStatus; }
    public void setAccountStatus(AccountStatus accountStatus) { this.accountStatus = accountStatus; }

    public MessagePrivacy getMessagePrivacy() { return messagePrivacy; }
    public void setMessagePrivacy(MessagePrivacy messagePrivacy) { this.messagePrivacy = messagePrivacy; }
}
