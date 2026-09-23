package com.chatx.user.entity;

import com.chatx.common.entity.BaseEntity;
import com.chatx.user.enums.AccountStatus;
import com.chatx.user.enums.MessagePrivacy;
import com.chatx.user.enums.UserRole;
import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "users", indexes = {
        @Index(name = "idx_users_username_lower", columnList = "username_lower", unique = true),
        @Index(name = "idx_users_email_lower", columnList = "email_lower", unique = true),
        @Index(name = "idx_users_status_role", columnList = "account_status, role")
})
public class User extends BaseEntity {

    @Column(name = "username", nullable = false, length = 30)
    private String username;

    @Column(name = "username_lower", nullable = false, unique = true, length = 30)
    private String usernameLower;

    @Column(name = "email", nullable = false, length = 255)
    private String email;

    @Column(name = "email_lower", nullable = false, unique = true, length = 255)
    private String emailLower;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "display_name", length = 100)
    private String displayName;

    @Column(name = "bio", length = 500)
    private String bio;

    @Column(name = "avatar_url", length = 2048)
    private String avatarUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private UserRole role = UserRole.USER;

    @Enumerated(EnumType.STRING)
    @Column(name = "account_status", nullable = false, length = 20)
    private AccountStatus accountStatus = AccountStatus.ACTIVE;

    @Enumerated(EnumType.STRING)
    @Column(name = "message_privacy", nullable = false, length = 20)
    private MessagePrivacy messagePrivacy = MessagePrivacy.EVERYONE;

    @Column(name = "last_seen_at")
    private Instant lastSeenAt;

    public User() {
    }

    public User(String username, String email, String passwordHash, String displayName) {
        this.username = username;
        this.usernameLower = username != null ? username.toLowerCase() : null;
        this.email = email;
        this.emailLower = email != null ? email.toLowerCase() : null;
        this.passwordHash = passwordHash;
        this.displayName = displayName != null && !displayName.isBlank() ? displayName : username;
        this.role = UserRole.USER;
        this.accountStatus = AccountStatus.ACTIVE;
        this.messagePrivacy = MessagePrivacy.EVERYONE;
    }

    // Getters and Setters
    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
        this.usernameLower = username != null ? username.toLowerCase() : null;
    }

    public String getUsernameLower() {
        return usernameLower;
    }

    public void setUsernameLower(String usernameLower) {
        this.usernameLower = usernameLower;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
        this.emailLower = email != null ? email.toLowerCase() : null;
    }

    public String getEmailLower() {
        return emailLower;
    }

    public void setEmailLower(String emailLower) {
        this.emailLower = emailLower;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public AccountStatus getAccountStatus() {
        return accountStatus;
    }

    public void setAccountStatus(AccountStatus accountStatus) {
        this.accountStatus = accountStatus;
    }

    public MessagePrivacy getMessagePrivacy() {
        return messagePrivacy;
    }

    public void setMessagePrivacy(MessagePrivacy messagePrivacy) {
        this.messagePrivacy = messagePrivacy;
    }

    public Instant getLastSeenAt() {
        return lastSeenAt;
    }

    public void setLastSeenAt(Instant lastSeenAt) {
        this.lastSeenAt = lastSeenAt;
    }
}
