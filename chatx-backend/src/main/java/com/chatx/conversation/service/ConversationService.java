package com.chatx.conversation.service;

import com.chatx.block.repository.BlockRepository;
import com.chatx.common.exception.AccessDeniedException;
import com.chatx.common.exception.BadRequestException;
import com.chatx.common.exception.ResourceNotFoundException;
import com.chatx.conversation.dto.*;
import com.chatx.conversation.entity.Conversation;
import com.chatx.conversation.entity.ConversationMember;
import com.chatx.conversation.enums.ConversationMemberRole;
import com.chatx.conversation.enums.ConversationType;
import com.chatx.conversation.repository.ConversationMemberRepository;
import com.chatx.conversation.repository.ConversationRepository;
import com.chatx.friendship.repository.FriendshipRepository;
import com.chatx.user.dto.UserSummaryDto;
import com.chatx.user.entity.User;
import com.chatx.user.enums.AccountStatus;
import com.chatx.user.enums.MessagePrivacy;
import com.chatx.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ConversationService {

    private static final Logger log = LoggerFactory.getLogger(ConversationService.class);

    private final ConversationRepository conversationRepository;
    private final ConversationMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final BlockRepository blockRepository;
    private final FriendshipRepository friendshipRepository;

    public ConversationService(ConversationRepository conversationRepository,
                               ConversationMemberRepository memberRepository,
                               UserRepository userRepository,
                               BlockRepository blockRepository,
                               FriendshipRepository friendshipRepository) {
        this.conversationRepository = conversationRepository;
        this.memberRepository = memberRepository;
        this.userRepository = userRepository;
        this.blockRepository = blockRepository;
        this.friendshipRepository = friendshipRepository;
    }

    @Transactional
    public ConversationDto getOrCreateDirectConversation(UUID currentUserId, UUID recipientId) {
        if (currentUserId.equals(recipientId)) {
            throw new BadRequestException("You cannot start a direct conversation with yourself", "CANNOT_CHAT_SELF");
        }

        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));
        User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", recipientId));

        if (recipient.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new BadRequestException("Cannot message an inactive user account", "USER_INACTIVE");
        }

        // 1. Block Check: Either user has blocked the other
        if (blockRepository.isBlockedEitherWay(currentUserId, recipientId)) {
            throw new BadRequestException("You cannot communicate with this user", "USER_BLOCKED");
        }

        // 2. Privacy Check: If recipient set FRIENDS_ONLY, must be confirmed friends
        if (recipient.getMessagePrivacy() == MessagePrivacy.FRIENDS_ONLY) {
            boolean areFriends = friendshipRepository.areFriends(currentUserId, recipientId);
            if (!areFriends) {
                throw new BadRequestException("@" + recipient.getUsername() + " only accepts messages from friends", "PRIVACY_RESTRICTION");
            }
        }

        // 3. Deduplication Check: Check if direct conversation already exists
        Optional<Conversation> existing = conversationRepository.findDirect(currentUserId, recipientId);
        if (existing.isPresent()) {
            return mapToDto(existing.get(), currentUserId);
        }

        // 4. Create new direct conversation
        Conversation conv = Conversation.createDirect(currentUserId, recipientId);
        Conversation savedConv = conversationRepository.save(conv);

        ConversationMember member1 = new ConversationMember(savedConv, currentUser, ConversationMemberRole.MEMBER);
        ConversationMember member2 = new ConversationMember(savedConv, recipient, ConversationMemberRole.MEMBER);
        memberRepository.save(member1);
        memberRepository.save(member2);

        log.info("Direct conversation created between @{} and @{} (ID: {})",
                currentUser.getUsername(), recipient.getUsername(), savedConv.getId());

        return mapToDto(savedConv, currentUserId);
    }

    @Transactional
    public ConversationDto createGroupConversation(UUID currentUserId, CreateGroupConversationRequest request) {
        User creator = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        Conversation conv = Conversation.createGroup(
                request.getName().trim(),
                request.getDescription() != null ? request.getDescription().trim() : null,
                request.getAvatarUrl() != null ? request.getAvatarUrl().trim() : null,
                creator
        );
        Conversation savedConv = conversationRepository.save(conv);

        // Add creator as ADMIN
        ConversationMember creatorMember = new ConversationMember(savedConv, creator, ConversationMemberRole.ADMIN);
        memberRepository.save(creatorMember);

        // Add initial members
        if (request.getMemberIds() != null && !request.getMemberIds().isEmpty()) {
            for (UUID memberId : request.getMemberIds()) {
                if (memberId.equals(currentUserId)) continue;

                userRepository.findById(memberId).ifPresent(user -> {
                    if (user.getAccountStatus() == AccountStatus.ACTIVE &&
                        !blockRepository.isBlockedEitherWay(currentUserId, memberId)) {
                        ConversationMember member = new ConversationMember(savedConv, user, ConversationMemberRole.MEMBER);
                        memberRepository.save(member);
                    }
                });
            }
        }

        log.info("Group conversation '{}' created by @{} (ID: {})",
                savedConv.getName(), creator.getUsername(), savedConv.getId());

        return mapToDto(savedConv, currentUserId);
    }

    @Transactional(readOnly = true)
    public List<ConversationDto> getUserConversations(UUID currentUserId) {
        List<Conversation> conversations = conversationRepository.findUserConversations(currentUserId);
        return conversations.stream()
                .map(conv -> mapToDto(conv, currentUserId))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ConversationDto getConversationById(UUID currentUserId, UUID conversationId) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", "id", conversationId));

        if (!memberRepository.existsByConversationIdAndUserId(conversationId, currentUserId)) {
            throw new AccessDeniedException("You are not a member of this conversation", "UNAUTHORIZED");
        }

        return mapToDtoWithMembers(conv, currentUserId);
    }

    @Transactional
    public ConversationDto addMembers(UUID currentUserId, UUID conversationId, AddMembersRequest request) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", "id", conversationId));

        if (conv.getType() != ConversationType.GROUP) {
            throw new BadRequestException("Cannot add members to a direct conversation", "INVALID_CONVERSATION_TYPE");
        }

        ConversationMember currentMember = memberRepository.findByConversationIdAndUserId(conversationId, currentUserId)
                .orElseThrow(() -> new AccessDeniedException("You are not a member of this conversation", "UNAUTHORIZED"));

        if (currentMember.getRole() != ConversationMemberRole.ADMIN) {
            throw new AccessDeniedException("Only group admins can add new members", "ADMIN_REQUIRED");
        }

        for (UUID memberId : request.getMemberIds()) {
            if (!memberRepository.existsByConversationIdAndUserId(conversationId, memberId)) {
                userRepository.findById(memberId).ifPresent(user -> {
                    if (user.getAccountStatus() == AccountStatus.ACTIVE) {
                        ConversationMember member = new ConversationMember(conv, user, ConversationMemberRole.MEMBER);
                        memberRepository.save(member);
                    }
                });
            }
        }

        return mapToDtoWithMembers(conv, currentUserId);
    }

    @Transactional
    public void removeMember(UUID currentUserId, UUID conversationId, UUID memberIdToRemove) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", "id", conversationId));

        if (conv.getType() != ConversationType.GROUP) {
            throw new BadRequestException("Cannot remove members from a direct conversation", "INVALID_CONVERSATION_TYPE");
        }

        ConversationMember currentMember = memberRepository.findByConversationIdAndUserId(conversationId, currentUserId)
                .orElseThrow(() -> new AccessDeniedException("You are not a member of this conversation", "UNAUTHORIZED"));

        boolean isSelfLeaving = currentUserId.equals(memberIdToRemove);
        boolean isAdmin = currentMember.getRole() == ConversationMemberRole.ADMIN;

        if (!isSelfLeaving && !isAdmin) {
            throw new AccessDeniedException("Only group admins can remove other members", "ADMIN_REQUIRED");
        }

        memberRepository.deleteByConversationIdAndUserId(conversationId, memberIdToRemove);
        log.info("User {} removed from group conversation {}", memberIdToRemove, conversationId);
    }

    @Transactional
    public ConversationDto updateGroup(UUID currentUserId, UUID conversationId, UpdateGroupRequest request) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", "id", conversationId));

        if (conv.getType() != ConversationType.GROUP) {
            throw new BadRequestException("Cannot update settings of a direct conversation", "INVALID_CONVERSATION_TYPE");
        }

        ConversationMember currentMember = memberRepository.findByConversationIdAndUserId(conversationId, currentUserId)
                .orElseThrow(() -> new AccessDeniedException("You are not a member of this conversation", "UNAUTHORIZED"));

        if (currentMember.getRole() != ConversationMemberRole.ADMIN) {
            throw new AccessDeniedException("Only group admins can update group settings", "ADMIN_REQUIRED");
        }

        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            conv.setName(request.getName().trim());
        }
        if (request.getDescription() != null) {
            conv.setDescription(request.getDescription().trim());
        }
        if (request.getAvatarUrl() != null) {
            conv.setAvatarUrl(request.getAvatarUrl().trim());
        }

        Conversation saved = conversationRepository.save(conv);
        return mapToDto(saved, currentUserId);
    }

    private ConversationDto mapToDto(Conversation conv, UUID currentUserId) {
        ConversationDto dto = new ConversationDto();
        dto.setId(conv.getId());
        dto.setType(conv.getType());
        dto.setLastMessageId(conv.getLastMessageId());
        dto.setLastMessageContent(conv.getLastMessageContent());
        dto.setLastMessageAt(conv.getLastMessageAt());
        dto.setLastMessageSenderUsername(conv.getLastMessageSenderUsername());
        dto.setCreatedAt(conv.getCreatedAt());

        long memberCount = memberRepository.countByConversationId(conv.getId());
        dto.setMemberCount((int) memberCount);

        memberRepository.findByConversationIdAndUserId(conv.getId(), currentUserId)
                .ifPresent(m -> dto.setMyRole(m.getRole()));

        if (conv.getType() == ConversationType.DIRECT) {
            memberRepository.findOtherMember(conv.getId(), currentUserId)
                    .ifPresent(other -> {
                        User user = other.getUser();
                        dto.setName(user.getDisplayName() != null ? user.getDisplayName() : user.getUsername());
                        dto.setAvatarUrl(user.getAvatarUrl());
                        dto.setDirectParticipant(UserSummaryDto.fromEntity(user));
                    });
        } else {
            dto.setName(conv.getName());
            dto.setDescription(conv.getDescription());
            dto.setAvatarUrl(conv.getAvatarUrl());
        }

        return dto;
    }

    private ConversationDto mapToDtoWithMembers(Conversation conv, UUID currentUserId) {
        ConversationDto dto = mapToDto(conv, currentUserId);
        List<ConversationMember> members = memberRepository.findByConversationIdWithUsers(conv.getId());
        dto.setMembers(members.stream().map(ConversationMemberDto::fromEntity).collect(Collectors.toList()));
        return dto;
    }
}
