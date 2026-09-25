package com.chatx.message.service;

import com.chatx.block.repository.BlockRepository;
import com.chatx.common.exception.AccessDeniedException;
import com.chatx.common.exception.BadRequestException;
import com.chatx.common.exception.ResourceNotFoundException;
import com.chatx.conversation.entity.Conversation;
import com.chatx.conversation.entity.ConversationMember;
import com.chatx.conversation.enums.ConversationMemberRole;
import com.chatx.conversation.enums.ConversationType;
import com.chatx.conversation.repository.ConversationMemberRepository;
import com.chatx.conversation.repository.ConversationRepository;
import com.chatx.friendship.repository.FriendshipRepository;
import com.chatx.message.dto.*;
import com.chatx.message.entity.Message;
import com.chatx.message.entity.MessageAttachment;
import com.chatx.message.entity.MessageReaction;
import com.chatx.message.entity.MessageReceipt;
import com.chatx.message.enums.MessageType;
import com.chatx.message.enums.ReceiptStatus;
import com.chatx.message.repository.MessageReactionRepository;
import com.chatx.message.repository.MessageReceiptRepository;
import com.chatx.message.repository.MessageRepository;
import com.chatx.user.entity.User;
import com.chatx.user.enums.MessagePrivacy;
import com.chatx.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class MessageService {

    private static final Logger log = LoggerFactory.getLogger(MessageService.class);

    private final MessageRepository messageRepository;
    private final MessageReactionRepository messageReactionRepository;
    private final MessageReceiptRepository messageReceiptRepository;
    private final ConversationRepository conversationRepository;
    private final ConversationMemberRepository conversationMemberRepository;
    private final UserRepository userRepository;
    private final BlockRepository blockRepository;
    private final FriendshipRepository friendshipRepository;

    public MessageService(MessageRepository messageRepository,
                          MessageReactionRepository messageReactionRepository,
                          MessageReceiptRepository messageReceiptRepository,
                          ConversationRepository conversationRepository,
                          ConversationMemberRepository conversationMemberRepository,
                          UserRepository userRepository,
                          BlockRepository blockRepository,
                          FriendshipRepository friendshipRepository) {
        this.messageRepository = messageRepository;
        this.messageReactionRepository = messageReactionRepository;
        this.messageReceiptRepository = messageReceiptRepository;
        this.conversationRepository = conversationRepository;
        this.conversationMemberRepository = conversationMemberRepository;
        this.userRepository = userRepository;
        this.blockRepository = blockRepository;
        this.friendshipRepository = friendshipRepository;
    }

    public MessageDto sendMessage(UUID currentUserId, SendMessageRequest request) {
        User sender = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        Conversation conversation = conversationRepository.findById(request.getConversationId())
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", "id", request.getConversationId()));

        ConversationMember member = conversationMemberRepository
                .findByConversationIdAndUserId(conversation.getId(), currentUserId)
                .orElseThrow(() -> new AccessDeniedException("You are not a member of this conversation"));

        // If direct conversation, verify block status & privacy
        if (conversation.getType() == ConversationType.DIRECT) {
            UUID otherUserId = conversation.getDirectUserAId().equals(currentUserId)
                    ? conversation.getDirectUserBId()
                    : conversation.getDirectUserAId();

            if (blockRepository.isBlockedEitherWay(currentUserId, otherUserId)) {
                throw new AccessDeniedException("Cannot send message: you or the other user has blocked communication");
            }

            User recipient = userRepository.findById(otherUserId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", otherUserId));

            if (recipient.getMessagePrivacy() == MessagePrivacy.FRIENDS_ONLY) {
                if (!friendshipRepository.areFriends(currentUserId, otherUserId)) {
                    throw new AccessDeniedException("This user only accepts direct messages from friends");
                }
            }
        }

        MessageType type = request.getType() != null ? request.getType() : MessageType.TEXT;

        // Content or attachments required
        boolean hasContent = request.getContent() != null && !request.getContent().trim().isEmpty();
        boolean hasAttachments = request.getAttachments() != null && !request.getAttachments().isEmpty();
        if (!hasContent && !hasAttachments && type != MessageType.SYSTEM) {
            throw new BadRequestException("Message must have content or attachments");
        }

        Message message = new Message();
        message.setConversation(conversation);
        message.setSender(sender);
        message.setType(type);
        message.setContent(request.getContent() != null ? request.getContent().trim() : "");

        // Handle reply
        if (request.getReplyToMessageId() != null) {
            Message replyTo = messageRepository.findById(request.getReplyToMessageId())
                    .orElseThrow(() -> new ResourceNotFoundException("Message", "id", request.getReplyToMessageId()));
            if (!replyTo.getConversation().getId().equals(conversation.getId())) {
                throw new BadRequestException("Cannot reply to a message from a different conversation");
            }
            message.setReplyTo(replyTo);
        }

        // Attachments
        if (hasAttachments) {
            for (MessageAttachmentDto attDto : request.getAttachments()) {
                MessageAttachment att = new MessageAttachment(
                        message,
                        attDto.getFileName(),
                        attDto.getFileUrl(),
                        attDto.getFileType(),
                        attDto.getFileSize()
                );
                message.getAttachments().add(att);
            }
        }

        Message savedMessage = messageRepository.save(message);

        // Update conversation last message acceleration fields
        String snippet = savedMessage.getContent();
        if (snippet == null || snippet.isEmpty()) {
            snippet = "[" + type.name() + "]";
        } else if (snippet.length() > 200) {
            snippet = snippet.substring(0, 200) + "...";
        }
        conversation.setLastMessageId(savedMessage.getId());
        conversation.setLastMessageContent(snippet);
        conversation.setLastMessageAt(savedMessage.getCreatedAt());
        conversation.setLastMessageSenderUsername(sender.getUsername());
        conversationRepository.save(conversation);

        // Update sender's read marker
        member.setLastReadMessageId(savedMessage.getId());
        member.setLastReadAt(savedMessage.getCreatedAt());
        conversationMemberRepository.save(member);

        log.info("Message sent in conversation {} by user {} (ID: {})",
                conversation.getId(), sender.getUsername(), savedMessage.getId());

        return mapToDto(savedMessage, currentUserId, Collections.emptyList(), Collections.emptyList());
    }

    @Transactional(readOnly = true)
    public List<MessageDto> getConversationMessages(UUID currentUserId, UUID conversationId, Instant cursor, int limit) {
        if (!conversationMemberRepository.existsByConversationIdAndUserId(conversationId, currentUserId)) {
            throw new AccessDeniedException("You are not a member of this conversation");
        }

        int pageSize = Math.min(Math.max(limit, 1), 100);
        Pageable pageable = PageRequest.of(0, pageSize);

        List<Message> messages;
        if (cursor != null) {
            messages = messageRepository.findByConversationIdAndCursor(conversationId, cursor, pageable);
        } else {
            messages = messageRepository.findByConversationId(conversationId, pageable).getContent();
        }

        if (messages.isEmpty()) {
            return Collections.emptyList();
        }

        List<UUID> messageIds = messages.stream().map(Message::getId).collect(Collectors.toList());
        List<MessageReaction> allReactions = messageReactionRepository.findByMessageIdInWithUser(messageIds);
        List<MessageReceipt> allReceipts = messageReceiptRepository.findByMessageIdIn(messageIds);

        Map<UUID, List<MessageReaction>> reactionsByMsg = allReactions.stream()
                .collect(Collectors.groupingBy(r -> r.getMessage().getId()));
        Map<UUID, List<MessageReceipt>> receiptsByMsg = allReceipts.stream()
                .collect(Collectors.groupingBy(r -> r.getMessage().getId()));

        return messages.stream()
                .map(msg -> mapToDto(
                        msg,
                        currentUserId,
                        reactionsByMsg.getOrDefault(msg.getId(), Collections.emptyList()),
                        receiptsByMsg.getOrDefault(msg.getId(), Collections.emptyList())
                ))
                .collect(Collectors.toList());
    }

    public MessageDto editMessage(UUID currentUserId, UUID messageId, EditMessageRequest request) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message", "id", messageId));

        if (!message.getSender().getId().equals(currentUserId)) {
            throw new AccessDeniedException("You can only edit your own messages");
        }

        if (message.isDeleted()) {
            throw new BadRequestException("Cannot edit a deleted message");
        }

        message.setContent(request.getContent().trim());
        message.setEdited(true);
        Message saved = messageRepository.save(message);

        // Update conversation lastMessageContent if this was the last message
        Conversation conv = message.getConversation();
        if (message.getId().equals(conv.getLastMessageId())) {
            String snippet = saved.getContent();
            if (snippet.length() > 200) snippet = snippet.substring(0, 200) + "...";
            conv.setLastMessageContent(snippet);
            conversationRepository.save(conv);
        }

        List<MessageReaction> reactions = messageReactionRepository.findByMessageIdWithUser(messageId);
        List<MessageReceipt> receipts = messageReceiptRepository.findByMessageId(messageId);
        return mapToDto(saved, currentUserId, reactions, receipts);
    }

    public MessageDto deleteMessage(UUID currentUserId, UUID messageId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message", "id", messageId));

        ConversationMember member = conversationMemberRepository
                .findByConversationIdAndUserId(message.getConversation().getId(), currentUserId)
                .orElseThrow(() -> new AccessDeniedException("You are not a member of this conversation"));

        boolean isSender = message.getSender().getId().equals(currentUserId);
        boolean isOwnerOrAdmin = member.getRole() == ConversationMemberRole.ADMIN;

        if (!isSender && !isOwnerOrAdmin) {
            throw new AccessDeniedException("You do not have permission to delete this message");
        }

        message.setDeleted(true);
        message.setContent("This message was deleted");
        message.getAttachments().clear();
        Message saved = messageRepository.save(message);

        // Update conversation snippet if this was the last message
        Conversation conv = message.getConversation();
        if (message.getId().equals(conv.getLastMessageId())) {
            conv.setLastMessageContent("This message was deleted");
            conversationRepository.save(conv);
        }

        List<MessageReaction> reactions = messageReactionRepository.findByMessageIdWithUser(messageId);
        List<MessageReceipt> receipts = messageReceiptRepository.findByMessageId(messageId);
        return mapToDto(saved, currentUserId, reactions, receipts);
    }

    public List<MessageReactionDto> toggleReaction(UUID currentUserId, UUID messageId, String emoji) {
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message", "id", messageId));

        if (!conversationMemberRepository.existsByConversationIdAndUserId(message.getConversation().getId(), currentUserId)) {
            throw new AccessDeniedException("You are not a member of this conversation");
        }

        Optional<MessageReaction> existing = messageReactionRepository
                .findByMessageIdAndUserIdAndEmoji(messageId, currentUserId, emoji);

        if (existing.isPresent()) {
            messageReactionRepository.delete(existing.get());
        } else {
            MessageReaction reaction = new MessageReaction(message, user, emoji);
            messageReactionRepository.save(reaction);
        }

        List<MessageReaction> updatedReactions = messageReactionRepository.findByMessageIdWithUser(messageId);
        return groupReactions(updatedReactions, currentUserId);
    }

    public void markConversationAsRead(UUID currentUserId, UUID conversationId) {
        ConversationMember member = conversationMemberRepository
                .findByConversationIdAndUserId(conversationId, currentUserId)
                .orElseThrow(() -> new AccessDeniedException("You are not a member of this conversation"));

        Conversation conv = member.getConversation();
        member.setLastReadAt(Instant.now());
        if (conv.getLastMessageId() != null) {
            member.setLastReadMessageId(conv.getLastMessageId());
        }
        conversationMemberRepository.save(member);
    }

    private MessageDto mapToDto(Message message, UUID currentUserId,
                                List<MessageReaction> reactions,
                                List<MessageReceipt> receipts) {
        MessageDto dto = new MessageDto();
        dto.setId(message.getId());
        dto.setConversationId(message.getConversation().getId());
        dto.setSenderId(message.getSender().getId());
        dto.setSenderUsername(message.getSender().getUsername());
        dto.setSenderDisplayName(message.getSender().getDisplayName() != null ? message.getSender().getDisplayName() : message.getSender().getUsername());
        dto.setSenderAvatarUrl(message.getSender().getAvatarUrl());
        dto.setType(message.getType());
        dto.setContent(message.isDeleted() ? "This message was deleted" : message.getContent());
        dto.setEdited(message.isEdited());
        dto.setDeleted(message.isDeleted());
        dto.setCreatedAt(message.getCreatedAt());
        dto.setUpdatedAt(message.getUpdatedAt());

        // Reply summary
        if (message.getReplyTo() != null) {
            Message reply = message.getReplyTo();
            MessageReplySummaryDto replyDto = new MessageReplySummaryDto();
            replyDto.setId(reply.getId());
            replyDto.setSenderUsername(reply.getSender().getUsername());
            replyDto.setSenderDisplayName(reply.getSender().getDisplayName() != null ? reply.getSender().getDisplayName() : reply.getSender().getUsername());
            replyDto.setType(reply.getType());
            replyDto.setContent(reply.isDeleted() ? "This message was deleted" : reply.getContent());
            dto.setReplyTo(replyDto);
        }

        // Attachments
        if (!message.isDeleted() && message.getAttachments() != null) {
            dto.setAttachments(message.getAttachments().stream().map(att ->
                    new MessageAttachmentDto(
                            att.getId(),
                            att.getFileName(),
                            att.getFileUrl(),
                            att.getFileType(),
                            att.getFileSize()
                    )
            ).collect(Collectors.toList()));
        }

        // Reactions
        dto.setReactions(groupReactions(reactions, currentUserId));

        // Delivery / Read status
        dto.setReadCount((int) receipts.stream().filter(r -> r.getStatus() == ReceiptStatus.READ).count());
        dto.setDeliveryStatus(receipts.stream().anyMatch(r -> r.getStatus() == ReceiptStatus.READ)
                ? ReceiptStatus.READ
                : (receipts.stream().anyMatch(r -> r.getStatus() == ReceiptStatus.DELIVERED)
                ? ReceiptStatus.DELIVERED
                : ReceiptStatus.SENT));

        return dto;
    }

    private List<MessageReactionDto> groupReactions(List<MessageReaction> reactions, UUID currentUserId) {
        if (reactions == null || reactions.isEmpty()) {
            return Collections.emptyList();
        }

        Map<String, List<MessageReaction>> byEmoji = reactions.stream()
                .collect(Collectors.groupingBy(MessageReaction::getEmoji));

        List<MessageReactionDto> result = new ArrayList<>();
        for (Map.Entry<String, List<MessageReaction>> entry : byEmoji.entrySet()) {
            String emoji = entry.getKey();
            List<MessageReaction> list = entry.getValue();
            boolean hasReacted = list.stream().anyMatch(r -> r.getUser().getId().equals(currentUserId));
            List<String> usernames = list.stream().map(r -> r.getUser().getUsername()).collect(Collectors.toList());
            result.add(new MessageReactionDto(emoji, list.size(), hasReacted, usernames));
        }

        return result;
    }
}
