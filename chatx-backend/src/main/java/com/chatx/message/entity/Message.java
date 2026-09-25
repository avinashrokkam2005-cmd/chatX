package com.chatx.message.entity;

import com.chatx.common.entity.BaseEntity;
import com.chatx.conversation.entity.Conversation;
import com.chatx.message.enums.MessageType;
import com.chatx.user.entity.User;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "messages", indexes = {
        @Index(name = "idx_messages_conv_created", columnList = "conversation_id, created_at, id"),
        @Index(name = "idx_messages_sender", columnList = "sender_id")
})
public class Message extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private MessageType type = MessageType.TEXT;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Column(name = "is_edited", nullable = false)
    private boolean isEdited = false;

    @Column(name = "is_deleted", nullable = false)
    private boolean isDeleted = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reply_to_id")
    private Message replyTo;

    @OneToMany(mappedBy = "message", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MessageReaction> reactions = new ArrayList<>();

    @OneToMany(mappedBy = "message", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MessageAttachment> attachments = new ArrayList<>();

    @OneToMany(mappedBy = "message", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MessageReceipt> receipts = new ArrayList<>();

    public Message() {
    }

    public Message(Conversation conversation, User sender, MessageType type, String content) {
        this.conversation = conversation;
        this.sender = sender;
        this.type = type;
        this.content = content;
    }

    public Conversation getConversation() { return conversation; }
    public void setConversation(Conversation conversation) { this.conversation = conversation; }

    public User getSender() { return sender; }
    public void setSender(User sender) { this.sender = sender; }

    public MessageType getType() { return type; }
    public void setType(MessageType type) { this.type = type; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public boolean isEdited() { return isEdited; }
    public void setEdited(boolean edited) { isEdited = edited; }

    public boolean isDeleted() { return isDeleted; }
    public void setDeleted(boolean deleted) { isDeleted = deleted; }

    public Message getReplyTo() { return replyTo; }
    public void setReplyTo(Message replyTo) { this.replyTo = replyTo; }

    public List<MessageReaction> getReactions() { return reactions; }
    public void setReactions(List<MessageReaction> reactions) { this.reactions = reactions; }

    public List<MessageAttachment> getAttachments() { return attachments; }
    public void setAttachments(List<MessageAttachment> attachments) { this.attachments = attachments; }

    public List<MessageReceipt> getReceipts() { return receipts; }
    public void setReceipts(List<MessageReceipt> receipts) { this.receipts = receipts; }
}
