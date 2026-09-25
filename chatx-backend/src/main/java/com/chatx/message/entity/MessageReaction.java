package com.chatx.message.entity;

import com.chatx.common.entity.BaseEntity;
import com.chatx.user.entity.User;
import jakarta.persistence.*;

@Entity
@Table(name = "message_reactions", uniqueConstraints = {
        @UniqueConstraint(name = "uk_message_user_emoji", columnNames = {"message_id", "user_id", "emoji"})
}, indexes = {
        @Index(name = "idx_reactions_message", columnList = "message_id"),
        @Index(name = "idx_reactions_user", columnList = "user_id")
})
public class MessageReaction extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "message_id", nullable = false)
    private Message message;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "emoji", nullable = false, length = 32)
    private String emoji;

    public MessageReaction() {
    }

    public MessageReaction(Message message, User user, String emoji) {
        this.message = message;
        this.user = user;
        this.emoji = emoji;
    }

    public Message getMessage() { return message; }
    public void setMessage(Message message) { this.message = message; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getEmoji() { return emoji; }
    public void setEmoji(String emoji) { this.emoji = emoji; }
}
