package com.chatx.message;

import com.chatx.block.repository.BlockRepository;
import com.chatx.common.exception.AccessDeniedException;
import com.chatx.conversation.entity.Conversation;
import com.chatx.conversation.entity.ConversationMember;
import com.chatx.conversation.enums.ConversationMemberRole;
import com.chatx.conversation.repository.ConversationMemberRepository;
import com.chatx.conversation.repository.ConversationRepository;
import com.chatx.friendship.repository.FriendshipRepository;
import com.chatx.message.dto.EditMessageRequest;
import com.chatx.message.dto.MessageDto;
import com.chatx.message.dto.MessageReactionDto;
import com.chatx.message.dto.SendMessageRequest;
import com.chatx.message.entity.Message;
import com.chatx.message.entity.MessageReaction;
import com.chatx.message.enums.MessageType;
import com.chatx.message.repository.MessageReactionRepository;
import com.chatx.message.repository.MessageReceiptRepository;
import com.chatx.message.repository.MessageRepository;
import com.chatx.message.service.MessageService;
import com.chatx.user.entity.User;
import com.chatx.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MessageServiceTest {

    @Mock private MessageRepository messageRepository;
    @Mock private MessageReactionRepository messageReactionRepository;
    @Mock private MessageReceiptRepository messageReceiptRepository;
    @Mock private ConversationRepository conversationRepository;
    @Mock private ConversationMemberRepository conversationMemberRepository;
    @Mock private UserRepository userRepository;
    @Mock private BlockRepository blockRepository;
    @Mock private FriendshipRepository friendshipRepository;

    @InjectMocks
    private MessageService messageService;

    private User alice;
    private User bob;
    private Conversation groupConv;
    private ConversationMember aliceMember;

    @BeforeEach
    void setUp() {
        alice = new User("alice", "alice@example.com", "hashPass", "Alice");
        ReflectionTestUtils.setField(alice, "id", UUID.fromString("11111111-1111-1111-1111-111111111111"));

        bob = new User("bob", "bob@example.com", "hashPass", "Bob");
        ReflectionTestUtils.setField(bob, "id", UUID.fromString("22222222-2222-2222-2222-222222222222"));

        groupConv = Conversation.createGroup("Dev Team", "Desc", null, alice);
        ReflectionTestUtils.setField(groupConv, "id", UUID.fromString("33333333-3333-3333-3333-333333333333"));

        aliceMember = new ConversationMember(groupConv, alice, ConversationMemberRole.ADMIN);
        ReflectionTestUtils.setField(aliceMember, "id", UUID.randomUUID());
    }

    @Test
    @DisplayName("Send message succeeds when user is a conversation member")
    void sendMessage_Success() {
        SendMessageRequest request = new SendMessageRequest(groupConv.getId(), "Hello team!");
        request.setType(MessageType.TEXT);

        when(userRepository.findById(alice.getId())).thenReturn(Optional.of(alice));
        when(conversationRepository.findById(groupConv.getId())).thenReturn(Optional.of(groupConv));
        when(conversationMemberRepository.findByConversationIdAndUserId(groupConv.getId(), alice.getId()))
                .thenReturn(Optional.of(aliceMember));

        Message savedMsg = new Message(groupConv, alice, MessageType.TEXT, "Hello team!");
        ReflectionTestUtils.setField(savedMsg, "id", UUID.randomUUID());
        ReflectionTestUtils.setField(savedMsg, "createdAt", Instant.now());
        ReflectionTestUtils.setField(savedMsg, "updatedAt", Instant.now());

        when(messageRepository.save(any(Message.class))).thenReturn(savedMsg);

        MessageDto result = messageService.sendMessage(alice.getId(), request);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).isEqualTo("Hello team!");
        assertThat(result.getSenderUsername()).isEqualTo("alice");
        verify(conversationRepository).save(groupConv);
        verify(conversationMemberRepository).save(aliceMember);
    }

    @Test
    @DisplayName("Send message fails when user is not a conversation member")
    void sendMessage_Forbidden_NotMember() {
        SendMessageRequest request = new SendMessageRequest(groupConv.getId(), "Hello!");

        when(userRepository.findById(alice.getId())).thenReturn(Optional.of(alice));
        when(conversationRepository.findById(groupConv.getId())).thenReturn(Optional.of(groupConv));
        when(conversationMemberRepository.findByConversationIdAndUserId(groupConv.getId(), alice.getId()))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> messageService.sendMessage(alice.getId(), request))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("not a member");
    }

    @Test
    @DisplayName("Edit message succeeds when user is the sender")
    void editMessage_Success() {
        UUID msgId = UUID.randomUUID();
        Message original = new Message(groupConv, alice, MessageType.TEXT, "Original message");
        ReflectionTestUtils.setField(original, "id", msgId);
        ReflectionTestUtils.setField(original, "createdAt", Instant.now());

        EditMessageRequest request = new EditMessageRequest("Updated message text");

        when(messageRepository.findById(msgId)).thenReturn(Optional.of(original));
        when(messageRepository.save(any(Message.class))).thenAnswer(i -> i.getArgument(0));

        MessageDto result = messageService.editMessage(alice.getId(), msgId, request);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).isEqualTo("Updated message text");
        assertThat(result.isEdited()).isTrue();
    }

    @Test
    @DisplayName("Delete message soft-deletes and masks content")
    void deleteMessage_Success() {
        UUID msgId = UUID.randomUUID();
        Message original = new Message(groupConv, alice, MessageType.TEXT, "Secret message");
        ReflectionTestUtils.setField(original, "id", msgId);
        ReflectionTestUtils.setField(original, "createdAt", Instant.now());

        when(messageRepository.findById(msgId)).thenReturn(Optional.of(original));
        when(conversationMemberRepository.findByConversationIdAndUserId(groupConv.getId(), alice.getId()))
                .thenReturn(Optional.of(aliceMember));
        when(messageRepository.save(any(Message.class))).thenAnswer(i -> i.getArgument(0));

        MessageDto result = messageService.deleteMessage(alice.getId(), msgId);

        assertThat(result).isNotNull();
        assertThat(result.isDeleted()).isTrue();
        assertThat(result.getContent()).isEqualTo("This message was deleted");
    }

    @Test
    @DisplayName("Toggle reaction adds reaction when not existing, and removes when existing")
    void toggleReaction_AddAndRemove() {
        UUID msgId = UUID.randomUUID();
        Message msg = new Message(groupConv, bob, MessageType.TEXT, "Check this out");
        ReflectionTestUtils.setField(msg, "id", msgId);

        when(userRepository.findById(alice.getId())).thenReturn(Optional.of(alice));
        when(messageRepository.findById(msgId)).thenReturn(Optional.of(msg));
        when(conversationMemberRepository.existsByConversationIdAndUserId(groupConv.getId(), alice.getId()))
                .thenReturn(true);

        // First toggle: doesn't exist -> should save
        when(messageReactionRepository.findByMessageIdAndUserIdAndEmoji(msgId, alice.getId(), "👍"))
                .thenReturn(Optional.empty());

        MessageReaction newReaction = new MessageReaction(msg, alice, "👍");
        when(messageReactionRepository.findByMessageIdWithUser(msgId))
                .thenReturn(List.of(newReaction));

        List<MessageReactionDto> result1 = messageService.toggleReaction(alice.getId(), msgId, "👍");
        assertThat(result1).hasSize(1);
        assertThat(result1.get(0).getEmoji()).isEqualTo("👍");
        assertThat(result1.get(0).getCount()).isEqualTo(1);
        assertThat(result1.get(0).isHasReacted()).isTrue();
        verify(messageReactionRepository).save(any(MessageReaction.class));

        // Second toggle: exists -> should delete
        when(messageReactionRepository.findByMessageIdAndUserIdAndEmoji(msgId, alice.getId(), "👍"))
                .thenReturn(Optional.of(newReaction));
        when(messageReactionRepository.findByMessageIdWithUser(msgId))
                .thenReturn(Collections.emptyList());

        List<MessageReactionDto> result2 = messageService.toggleReaction(alice.getId(), msgId, "👍");
        assertThat(result2).isEmpty();
        verify(messageReactionRepository).delete(newReaction);
    }
}
