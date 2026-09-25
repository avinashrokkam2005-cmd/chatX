package com.chatx.conversation;

import com.chatx.block.repository.BlockRepository;
import com.chatx.common.exception.AccessDeniedException;
import com.chatx.common.exception.BadRequestException;
import com.chatx.conversation.dto.AddMembersRequest;
import com.chatx.conversation.dto.ConversationDto;
import com.chatx.conversation.dto.CreateGroupConversationRequest;
import com.chatx.conversation.entity.Conversation;
import com.chatx.conversation.entity.ConversationMember;
import com.chatx.conversation.enums.ConversationMemberRole;
import com.chatx.conversation.enums.ConversationType;
import com.chatx.conversation.repository.ConversationMemberRepository;
import com.chatx.conversation.repository.ConversationRepository;
import com.chatx.conversation.service.ConversationService;
import com.chatx.friendship.repository.FriendshipRepository;
import com.chatx.user.entity.User;
import com.chatx.user.enums.MessagePrivacy;
import com.chatx.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ConversationServiceTest {

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private ConversationMemberRepository memberRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private BlockRepository blockRepository;

    @Mock
    private FriendshipRepository friendshipRepository;

    private ConversationService conversationService;

    private User userA;
    private User userB;

    @BeforeEach
    void setUp() {
        conversationService = new ConversationService(
                conversationRepository,
                memberRepository,
                userRepository,
                blockRepository,
                friendshipRepository
        );

        userA = new User("alice", "alice@example.com", "pass", "Alice");
        userA.setId(UUID.fromString("11111111-1111-1111-1111-111111111111"));

        userB = new User("bob", "bob@example.com", "pass", "Bob");
        userB.setId(UUID.fromString("22222222-2222-2222-2222-222222222222"));
    }

    @Test
    @DisplayName("Should return existing direct conversation if already created")
    void getOrCreateDirectConversation_Existing_ReturnsExisting() {
        when(userRepository.findById(userA.getId())).thenReturn(Optional.of(userA));
        when(userRepository.findById(userB.getId())).thenReturn(Optional.of(userB));
        when(blockRepository.isBlockedEitherWay(userA.getId(), userB.getId())).thenReturn(false);

        Conversation existing = Conversation.createDirect(userA.getId(), userB.getId());
        existing.setId(UUID.randomUUID());
        when(conversationRepository.findDirect(userA.getId(), userB.getId())).thenReturn(Optional.of(existing));

        ConversationMember otherMember = new ConversationMember(existing, userB, ConversationMemberRole.MEMBER);
        when(memberRepository.findOtherMember(existing.getId(), userA.getId())).thenReturn(Optional.of(otherMember));

        ConversationDto result = conversationService.getOrCreateDirectConversation(userA.getId(), userB.getId());

        assertNotNull(result);
        assertEquals(existing.getId(), result.getId());
        assertEquals("Bob", result.getName());
        verify(conversationRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should create new direct conversation when none exists")
    void getOrCreateDirectConversation_New_Success() {
        when(userRepository.findById(userA.getId())).thenReturn(Optional.of(userA));
        when(userRepository.findById(userB.getId())).thenReturn(Optional.of(userB));
        when(blockRepository.isBlockedEitherWay(userA.getId(), userB.getId())).thenReturn(false);
        when(conversationRepository.findDirect(userA.getId(), userB.getId())).thenReturn(Optional.empty());

        Conversation newConv = Conversation.createDirect(userA.getId(), userB.getId());
        newConv.setId(UUID.randomUUID());
        when(conversationRepository.save(any(Conversation.class))).thenReturn(newConv);

        ConversationMember otherMember = new ConversationMember(newConv, userB, ConversationMemberRole.MEMBER);
        when(memberRepository.findOtherMember(newConv.getId(), userA.getId())).thenReturn(Optional.of(otherMember));

        ConversationDto result = conversationService.getOrCreateDirectConversation(userA.getId(), userB.getId());

        assertNotNull(result);
        assertEquals(ConversationType.DIRECT, result.getType());
        verify(conversationRepository).save(any(Conversation.class));
        verify(memberRepository, times(2)).save(any(ConversationMember.class));
    }

    @Test
    @DisplayName("Should enforce FRIENDS_ONLY privacy setting when initiating conversation")
    void getOrCreateDirectConversation_FriendsOnlyNotFriends_ThrowsException() {
        userB.setMessagePrivacy(MessagePrivacy.FRIENDS_ONLY);

        when(userRepository.findById(userA.getId())).thenReturn(Optional.of(userA));
        when(userRepository.findById(userB.getId())).thenReturn(Optional.of(userB));
        when(blockRepository.isBlockedEitherWay(userA.getId(), userB.getId())).thenReturn(false);
        when(friendshipRepository.areFriends(userA.getId(), userB.getId())).thenReturn(false);

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> conversationService.getOrCreateDirectConversation(userA.getId(), userB.getId()));
        assertEquals("PRIVACY_RESTRICTION", ex.getErrorCode());
    }

    @Test
    @DisplayName("Should create group conversation and set creator as ADMIN")
    void createGroupConversation_Success() {
        when(userRepository.findById(userA.getId())).thenReturn(Optional.of(userA));

        Conversation group = Conversation.createGroup("Dev Team", "Engineering discussion", null, userA);
        group.setId(UUID.randomUUID());
        when(conversationRepository.save(any(Conversation.class))).thenReturn(group);

        CreateGroupConversationRequest request = new CreateGroupConversationRequest(
                "Dev Team", "Engineering discussion", null, List.of(userB.getId())
        );

        when(userRepository.findById(userB.getId())).thenReturn(Optional.of(userB));
        when(blockRepository.isBlockedEitherWay(userA.getId(), userB.getId())).thenReturn(false);

        ConversationDto result = conversationService.createGroupConversation(userA.getId(), request);

        assertNotNull(result);
        assertEquals("Dev Team", result.getName());
        verify(memberRepository, atLeastOnce()).save(any(ConversationMember.class));
    }

    @Test
    @DisplayName("Should reject non-admin from adding members to a group")
    void addMembers_NonAdmin_ThrowsException() {
        UUID convId = UUID.randomUUID();
        Conversation group = new Conversation();
        group.setType(ConversationType.GROUP);

        when(conversationRepository.findById(convId)).thenReturn(Optional.of(group));

        ConversationMember nonAdmin = new ConversationMember(group, userA, ConversationMemberRole.MEMBER);
        when(memberRepository.findByConversationIdAndUserId(convId, userA.getId())).thenReturn(Optional.of(nonAdmin));

        AddMembersRequest request = new AddMembersRequest(List.of(userB.getId()));

        assertThrows(AccessDeniedException.class,
                () -> conversationService.addMembers(userA.getId(), convId, request));
    }
}
