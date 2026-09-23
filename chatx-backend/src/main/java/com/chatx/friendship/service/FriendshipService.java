package com.chatx.friendship.service;

import com.chatx.block.repository.BlockRepository;
import com.chatx.common.exception.AccessDeniedException;
import com.chatx.common.exception.BadRequestException;
import com.chatx.common.exception.ResourceNotFoundException;
import com.chatx.friendship.dto.FriendDto;
import com.chatx.friendship.dto.FriendRequestDto;
import com.chatx.friendship.entity.FriendRequest;
import com.chatx.friendship.entity.Friendship;
import com.chatx.friendship.enums.FriendRequestStatus;
import com.chatx.friendship.repository.FriendRequestRepository;
import com.chatx.friendship.repository.FriendshipRepository;
import com.chatx.user.entity.User;
import com.chatx.user.enums.AccountStatus;
import com.chatx.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class FriendshipService {

    private static final Logger log = LoggerFactory.getLogger(FriendshipService.class);

    private final FriendRequestRepository friendRequestRepository;
    private final FriendshipRepository friendshipRepository;
    private final BlockRepository blockRepository;
    private final UserRepository userRepository;

    public FriendshipService(FriendRequestRepository friendRequestRepository,
                             FriendshipRepository friendshipRepository,
                             BlockRepository blockRepository,
                             UserRepository userRepository) {
        this.friendRequestRepository = friendRequestRepository;
        this.friendshipRepository = friendshipRepository;
        this.blockRepository = blockRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public FriendRequestDto sendFriendRequest(UUID senderId, UUID targetUserId) {
        if (senderId.equals(targetUserId)) {
            throw new BadRequestException("You cannot send a friend request to yourself", "CANNOT_FRIEND_SELF");
        }

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", senderId));
        User receiver = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", targetUserId));

        if (receiver.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new BadRequestException("Cannot send friend request to an inactive account", "USER_INACTIVE");
        }

        if (blockRepository.isBlockedEitherWay(senderId, targetUserId)) {
            throw new BadRequestException("Cannot send friend request to this user", "USER_BLOCKED");
        }

        if (friendshipRepository.areFriends(senderId, targetUserId)) {
            throw new BadRequestException("You are already friends with @" + receiver.getUsername(), "ALREADY_FRIENDS");
        }

        if (friendRequestRepository.findPendingBetween(senderId, targetUserId).isPresent()) {
            throw new BadRequestException("A friend request is already pending between you", "REQUEST_ALREADY_PENDING");
        }

        FriendRequest friendRequest = new FriendRequest(sender, receiver);
        FriendRequest saved = friendRequestRepository.save(friendRequest);
        log.info("Friend request sent from @{} to @{}", sender.getUsername(), receiver.getUsername());

        return FriendRequestDto.fromEntity(saved);
    }

    @Transactional
    public FriendDto acceptFriendRequest(UUID currentUserId, UUID requestId) {
        FriendRequest request = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("FriendRequest", "id", requestId));

        if (!request.getReceiver().getId().equals(currentUserId)) {
            throw new AccessDeniedException("You are not authorized to accept this friend request", "UNAUTHORIZED");
        }

        if (request.getStatus() != FriendRequestStatus.PENDING) {
            throw new BadRequestException("This friend request is no longer pending", "INVALID_REQUEST_STATUS");
        }

        request.setStatus(FriendRequestStatus.ACCEPTED);
        friendRequestRepository.save(request);

        User sender = request.getSender();
        User receiver = request.getReceiver();

        Friendship friendship = new Friendship(sender, receiver);
        Friendship savedFriendship = friendshipRepository.save(friendship);

        log.info("Friend request accepted: @{} and @{} are now friends", sender.getUsername(), receiver.getUsername());

        return new FriendDto(savedFriendship.getId(), sender, savedFriendship.getCreatedAt());
    }

    @Transactional
    public void rejectFriendRequest(UUID currentUserId, UUID requestId) {
        FriendRequest request = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("FriendRequest", "id", requestId));

        if (!request.getReceiver().getId().equals(currentUserId)) {
            throw new AccessDeniedException("You are not authorized to reject this friend request", "UNAUTHORIZED");
        }

        if (request.getStatus() != FriendRequestStatus.PENDING) {
            throw new BadRequestException("This friend request is no longer pending", "INVALID_REQUEST_STATUS");
        }

        request.setStatus(FriendRequestStatus.REJECTED);
        friendRequestRepository.save(request);
        log.info("Friend request rejected by user ID: {}", currentUserId);
    }

    @Transactional
    public void cancelFriendRequest(UUID currentUserId, UUID requestId) {
        FriendRequest request = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("FriendRequest", "id", requestId));

        if (!request.getSender().getId().equals(currentUserId)) {
            throw new AccessDeniedException("You can only cancel requests you have sent", "UNAUTHORIZED");
        }

        if (request.getStatus() != FriendRequestStatus.PENDING) {
            throw new BadRequestException("This friend request is no longer pending", "INVALID_REQUEST_STATUS");
        }

        request.setStatus(FriendRequestStatus.CANCELLED);
        friendRequestRepository.save(request);
        log.info("Friend request cancelled by sender ID: {}", currentUserId);
    }

    @Transactional(readOnly = true)
    public List<FriendDto> getFriends(UUID userId) {
        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        List<Friendship> friendships = friendshipRepository.findAllByUserId(userId);
        return friendships.stream()
                .map(f -> {
                    User other = f.getOtherUser(currentUser);
                    return new FriendDto(f.getId(), other, f.getCreatedAt());
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public void removeFriend(UUID currentUserId, UUID friendId) {
        Friendship friendship = friendshipRepository.findBetween(currentUserId, friendId)
                .orElseThrow(() -> new ResourceNotFoundException("Friendship", "friendId", friendId));

        friendshipRepository.delete(friendship);
        log.info("Friendship removed between user {} and user {}", currentUserId, friendId);
    }

    @Transactional(readOnly = true)
    public List<FriendRequestDto> getReceivedRequests(UUID userId) {
        return friendRequestRepository.findByReceiverIdAndStatus(userId, FriendRequestStatus.PENDING).stream()
                .map(FriendRequestDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FriendRequestDto> getSentRequests(UUID userId) {
        return friendRequestRepository.findBySenderIdAndStatus(userId, FriendRequestStatus.PENDING).stream()
                .map(FriendRequestDto::fromEntity)
                .collect(Collectors.toList());
    }
}
