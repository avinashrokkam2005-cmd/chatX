package com.chatx.block.service;

import com.chatx.block.dto.BlockDto;
import com.chatx.block.entity.Block;
import com.chatx.block.repository.BlockRepository;
import com.chatx.common.exception.BadRequestException;
import com.chatx.common.exception.ResourceNotFoundException;
import com.chatx.friendship.enums.FriendRequestStatus;
import com.chatx.friendship.repository.FriendRequestRepository;
import com.chatx.friendship.repository.FriendshipRepository;
import com.chatx.user.entity.User;
import com.chatx.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class BlockService {

    private static final Logger log = LoggerFactory.getLogger(BlockService.class);

    private final BlockRepository blockRepository;
    private final UserRepository userRepository;
    private final FriendshipRepository friendshipRepository;
    private final FriendRequestRepository friendRequestRepository;

    public BlockService(BlockRepository blockRepository,
                        UserRepository userRepository,
                        FriendshipRepository friendshipRepository,
                        FriendRequestRepository friendRequestRepository) {
        this.blockRepository = blockRepository;
        this.userRepository = userRepository;
        this.friendshipRepository = friendshipRepository;
        this.friendRequestRepository = friendRequestRepository;
    }

    @Transactional
    public BlockDto blockUser(UUID blockerId, UUID targetUserId) {
        if (blockerId.equals(targetUserId)) {
            throw new BadRequestException("You cannot block yourself", "CANNOT_BLOCK_SELF");
        }

        User blocker = userRepository.findById(blockerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", blockerId));
        User blocked = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", targetUserId));

        // Check if already blocked
        var existingBlock = blockRepository.findByBlockerIdAndBlockedId(blockerId, targetUserId);
        if (existingBlock.isPresent()) {
            return BlockDto.fromEntity(existingBlock.get());
        }

        // If friends, remove friendship
        friendshipRepository.findBetween(blockerId, targetUserId).ifPresent(friendshipRepository::delete);

        // Cancel any pending friend requests between them
        friendRequestRepository.findPendingBetween(blockerId, targetUserId).ifPresent(req -> {
            req.setStatus(FriendRequestStatus.CANCELLED);
            friendRequestRepository.save(req);
        });

        Block block = new Block(blocker, blocked);
        Block saved = blockRepository.save(block);
        log.info("User {} blocked user {}", blocker.getUsername(), blocked.getUsername());

        return BlockDto.fromEntity(saved);
    }

    @Transactional
    public void unblockUser(UUID blockerId, UUID targetUserId) {
        Block block = blockRepository.findByBlockerIdAndBlockedId(blockerId, targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Block", "blockedUserId", targetUserId));

        blockRepository.delete(block);
        log.info("User {} unblocked user with ID {}", blockerId, targetUserId);
    }

    @Transactional(readOnly = true)
    public List<BlockDto> getBlockedUsers(UUID blockerId) {
        return blockRepository.findByBlockerIdWithBlocked(blockerId).stream()
                .map(BlockDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public boolean isBlocked(UUID userA, UUID userB) {
        return blockRepository.isBlockedEitherWay(userA, userB);
    }
}
