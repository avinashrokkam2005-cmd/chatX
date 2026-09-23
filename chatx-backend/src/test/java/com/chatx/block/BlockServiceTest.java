package com.chatx.block;

import com.chatx.block.dto.BlockDto;
import com.chatx.block.entity.Block;
import com.chatx.block.repository.BlockRepository;
import com.chatx.block.service.BlockService;
import com.chatx.common.exception.BadRequestException;
import com.chatx.friendship.entity.Friendship;
import com.chatx.friendship.repository.FriendRequestRepository;
import com.chatx.friendship.repository.FriendshipRepository;
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
class BlockServiceTest {

    @Mock
    private BlockRepository blockRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private FriendshipRepository friendshipRepository;

    @Mock
    private FriendRequestRepository friendRequestRepository;

    private BlockService blockService;

    private User userA;
    private User userB;

    @BeforeEach
    void setUp() {
        blockService = new BlockService(blockRepository, userRepository, friendshipRepository, friendRequestRepository);

        userA = new User("alice", "alice@example.com", "pass", "Alice");
        userA.setId(UUID.fromString("11111111-1111-1111-1111-111111111111"));

        userB = new User("bob", "bob@example.com", "pass", "Bob");
        userB.setId(UUID.fromString("22222222-2222-2222-2222-222222222222"));
    }

    @Test
    @DisplayName("Should successfully block user and sever existing friendship")
    void blockUser_Success() {
        when(userRepository.findById(userA.getId())).thenReturn(Optional.of(userA));
        when(userRepository.findById(userB.getId())).thenReturn(Optional.of(userB));
        when(blockRepository.findByBlockerIdAndBlockedId(userA.getId(), userB.getId())).thenReturn(Optional.empty());

        Friendship friendship = new Friendship(userA, userB);
        when(friendshipRepository.findBetween(userA.getId(), userB.getId())).thenReturn(Optional.of(friendship));
        when(friendRequestRepository.findPendingBetween(userA.getId(), userB.getId())).thenReturn(Optional.empty());

        Block block = new Block(userA, userB);
        block.setId(UUID.randomUUID());
        when(blockRepository.save(any(Block.class))).thenReturn(block);

        BlockDto result = blockService.blockUser(userA.getId(), userB.getId());

        assertNotNull(result);
        assertEquals("bob", result.getBlockedUser().getUsername());
        verify(friendshipRepository).delete(friendship);
        verify(blockRepository).save(any(Block.class));
    }

    @Test
    @DisplayName("Should reject blocking oneself")
    void blockUser_Self_ThrowsException() {
        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> blockService.blockUser(userA.getId(), userA.getId()));
        assertEquals("CANNOT_BLOCK_SELF", ex.getErrorCode());
    }

    @Test
    @DisplayName("Should unblock user successfully")
    void unblockUser_Success() {
        Block block = new Block(userA, userB);
        when(blockRepository.findByBlockerIdAndBlockedId(userA.getId(), userB.getId())).thenReturn(Optional.of(block));

        blockService.unblockUser(userA.getId(), userB.getId());

        verify(blockRepository).delete(block);
    }
}
