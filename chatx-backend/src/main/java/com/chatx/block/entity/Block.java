package com.chatx.block.entity;

import com.chatx.common.entity.BaseEntity;
import com.chatx.user.entity.User;
import jakarta.persistence.*;

@Entity
@Table(name = "blocks", indexes = {
        @Index(name = "idx_block_pair", columnList = "blocker_id, blocked_id", unique = true),
        @Index(name = "idx_block_blocker", columnList = "blocker_id"),
        @Index(name = "idx_block_blocked", columnList = "blocked_id")
})
public class Block extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "blocker_id", nullable = false)
    private User blocker;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "blocked_id", nullable = false)
    private User blocked;

    public Block() {
    }

    public Block(User blocker, User blocked) {
        this.blocker = blocker;
        this.blocked = blocked;
    }

    public User getBlocker() {
        return blocker;
    }

    public void setBlocker(User blocker) {
        this.blocker = blocker;
    }

    public User getBlocked() {
        return blocked;
    }

    public void setBlocked(User blocked) {
        this.blocked = blocked;
    }
}
