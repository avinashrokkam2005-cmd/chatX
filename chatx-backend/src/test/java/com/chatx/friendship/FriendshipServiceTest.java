package com.chatx.friendship;

import com.chatx.block.repository.BlockRepository;
import com.chatx.common.exception.BadRequestException;
import com.chatx.friendship.dto.FriendDto;
import com.chatx.friendship.dto.FriendRequestDto;
import com.chatx.friendship.entity.FriendRequest;
import com.chatx.friendship.entity.Friendship;
import com.chatx.friendship.enums.FriendRequestStatus;
import com.chatx.friendship.repository.FriendRequestRepository;
import com.chatx.friendship.repository.FriendshipRepository;
import com.chatx.friendship.service.FriendshipService;
import com.chatx.user.entity.User;
import com.chatx.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FriendshipServiceTest {

    @Mock
    private FriendRequestRepository friendRequestRepository;

    @Mock
    private FriendshipRepository friendshipRepository;

    @Mock
    private BlockRepository blockRepository;

    @Mock
    private UserRepository userRepository;

    private FriendshipService friendshipService;

    private User userA;
    private User userB;

    @BeforeEach
    void setUp() {
        friendshipService = new FriendshipService(
                friendRequestRepository,
                friendshipRepository,
                blockRepository,
                userRepository
        );

        userA = new User("alice", "alice@example.com", "pass", "Alice");
        userA.setId(UUID.fromString("11111111-1111-1111-1111-111111111111"));

        userB = new User("bob", "bob@example.com", "pass", "Bob");
        userB.setId(UUID.fromString("22222222-2222-2222-2222-222222222222"));
    }

    @Test
    @DisplayName("Should successfully send friend request")
    void sendFriendRequest_Success() {
        when(userRepository.findById(userA.getId())).thenReturn(Optional.of(userA));
        when(userRepository.findById(userB.getId())).thenReturn(Optional.of(userB));
        when(blockRepository.isBlockedEitherWay(userA.getId(), userB.getId())).thenReturn(false);
        when(friendshipRepository.areFriends(userA.getId(), userB.getId())).thenReturn(false);
        when(friendRequestRepository.findPendingBetween(userA.getId(), userB.getId())).thenReturn(Optional.empty());

        FriendRequest request = new FriendRequest(userA, userB);
        request.setId(UUID.randomUUID());
        when(friendRequestRepository.save(any(FriendRequest.class))).thenReturn(request);

        FriendRequestDto result = friendshipService.sendFriendRequest(userA.getId(), userB.getId());

        assertNotNull(result);
        assertEquals(FriendRequestStatus.PENDING, result.getStatus());
        assertEquals("alice", result.getSender().getUsername());
        assertEquals("bob", result.getReceiver().getUsername());
    }

    @Test
    @DisplayName("Should reject friend request to self")
    void sendFriendRequest_ToSelf_ThrowsException() {
        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> friendshipService.sendFriendRequest(userA.getId(), userA.getId()));
        assertEquals("CANNOT_FRIEND_SELF", ex.getErrorCode());
    }

    @Test
    @DisplayName("Should reject friend request if user is blocked")
    void sendFriendRequest_BlockedUser_ThrowsException() {
        when(userRepository.findById(userA.getId())).thenReturn(Optional.of(userA));
        when(userRepository.findById(userB.getId())).thenReturn(Optional.of(userB));
        when(blockRepository.isBlockedEitherWay(userA.getId(), userB.getId())).thenReturn(true);

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> friendshipService.sendFriendRequest(userA.getId(), userB.getId()));
        assertEquals("USER_BLOCKED", ex.getErrorCode());
    }

    @Test
    @DisplayName("Should accept friend request and create friendship")
    void acceptFriendRequest_Success() {
        UUID requestId = UUID.randomUUID();
        FriendRequest request = new FriendRequest(userA, userB);
        request.setId(requestId);

        when(friendRequestRepository.findById(requestId)).thenReturn(Optional.of(request));
        Friendship friendship = new Friendship(userA, userB);
        friendship.setId(UUID.randomUUID());
        when(friendshipRepository.save(any(Friendship.class))).thenReturn(friendship);

        FriendDto result = friendshipService.acceptFriendRequest(userB.getId(), requestId);

        assertNotNull(result);
        assertEquals(FriendRequestStatus.ACCEPTED, request.getStatus());
        assertEquals("alice", result.getUsername());
        verify(friendshipRepository).save(any(Friendship.class));
    }

    @Test
    @DisplayName("Should remove friend successfully")
    void removeFriend_Success() {
        Friendship friendship = new Friendship(userA, userB);
        when(friendshipRepository.findBetween(userA.getId(), userB.getId())).thenReturn(Optional.of(friendship));

        friendshipService.removeFriend(userA.getId(), userB.getId());

        verify(friendshipRepository).delete(friendship);
    }
}
