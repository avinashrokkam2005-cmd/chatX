package com.chatx.message.entity;

import com.chatx.common.entity.BaseEntity;
import com.chatx.message.enums.ReceiptStatus;
import com.chatx.user.entity.User;
import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "message_receipts", uniqueConstraints = {
        @UniqueConstraint(name = "uk_message_user_receipt", columnNames = {"message_id", "user_id"})
}, indexes = {
        @Index(name = "idx_receipts_message", columnList = "message_id"),
        @Index(name = "idx_receipts_user", columnList = "user_id")
})
public class MessageReceipt extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "message_id", nullable = false)
    private Message message;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ReceiptStatus status = ReceiptStatus.SENT;

    @Column(name = "read_at")
    private Instant readAt;

    public MessageReceipt() {
    }

    public MessageReceipt(Message message, User user, ReceiptStatus status) {
        this.message = message;
        this.user = user;
        this.status = status;
        if (status == ReceiptStatus.READ) {
            this.readAt = Instant.now();
        }
    }

    public Message getMessage() { return message; }
    public void setMessage(Message message) { this.message = message; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public ReceiptStatus getStatus() { return status; }
    public void setStatus(ReceiptStatus status) {
        this.status = status;
        if (status == ReceiptStatus.READ && this.readAt == null) {
            this.readAt = Instant.now();
        }
    }

    public Instant getReadAt() { return readAt; }
    public void setReadAt(Instant readAt) { this.readAt = readAt; }
}
