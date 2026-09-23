package com.chatx.friendship.dto;

import com.chatx.user.entity.User;
import com.chatx.user.enums.MessagePrivacy;

import java.time.Instant;
import java.util.UUID;

public class FriendDto {

    private UUID friendshipId;
    private UUID friendId;
    private String username;
    private String displayName;
    private String avatarUrl;
    private String bio;
    private MessagePrivacy messagePrivacy;
    private Instant friendsSince;

    public FriendDto() {
    }

    public FriendDto(UUID friendshipId, User friend, Instant friendsSince) {
        this.friendshipId = friendshipId;
        this.friendId = friend.getId();
        this.username = friend.getUsername();
        this.displayName = friend.getDisplayName();
        this.avatarUrl = friend.getAvatarUrl();
        this.bio = friend.getBio();
        this.messagePrivacy = friend.getMessagePrivacy();
        this.friendsSince = friendsSince;
    }

    public UUID getFriendshipId() { return friendshipId; }
    public void setFriendshipId(UUID friendshipId) { this.friendshipId = friendshipId; }

    public UUID getFriendId() { return friendId; }
    public void setFriendId(UUID friendId) { this.friendId = friendId; }

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

    public Instant getFriendsSince() { return friendsSince; }
    public void setFriendsSince(Instant friendsSince) { this.friendsSince = friendsSince; }
}
