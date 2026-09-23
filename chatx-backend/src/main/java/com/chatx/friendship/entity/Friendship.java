package com.chatx.friendship.entity;

import com.chatx.common.entity.BaseEntity;
import com.chatx.user.entity.User;
import jakarta.persistence.*;

@Entity
@Table(name = "friendships", indexes = {
        @Index(name = "idx_friendship_pair", columnList = "user_id_1, user_id_2", unique = true),
        @Index(name = "idx_friendship_user_1", columnList = "user_id_1"),
        @Index(name = "idx_friendship_user_2", columnList = "user_id_2")
})
public class Friendship extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id_1", nullable = false)
    private User user1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id_2", nullable = false)
    private User user2;

    public Friendship() {
    }

    public Friendship(User u1, User u2) {
        // Enforce canonical order: smaller UUID first to eliminate duplicate relationships
        if (u1.getId().compareTo(u2.getId()) < 0) {
            this.user1 = u1;
            this.user2 = u2;
        } else {
            this.user1 = u2;
            this.user2 = u1;
        }
    }

    public User getUser1() {
        return user1;
    }

    public void setUser1(User user1) {
        this.user1 = user1;
    }

    public User getUser2() {
        return user2;
    }

    public void setUser2(User user2) {
        this.user2 = user2;
    }

    /**
     * Given one participant of this friendship, returns the other friend.
     */
    public User getOtherUser(User currentUser) {
        if (currentUser.getId().equals(user1.getId())) {
            return user2;
        }
        return user1;
    }
}
