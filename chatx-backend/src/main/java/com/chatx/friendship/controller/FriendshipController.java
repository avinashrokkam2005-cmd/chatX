package com.chatx.friendship.controller;

import com.chatx.common.dto.ApiResponse;
import com.chatx.friendship.dto.FriendDto;
import com.chatx.friendship.dto.FriendRequestDto;
import com.chatx.friendship.dto.SendFriendRequest;
import com.chatx.friendship.service.FriendshipService;
import com.chatx.security.model.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/friends")
@Tag(name = "Friends", description = "Endpoints for friend requests, friendship management, and friend lists")
public class FriendshipController {

    private final FriendshipService friendshipService;

    public FriendshipController(FriendshipService friendshipService) {
        this.friendshipService = friendshipService;
    }

    @PostMapping("/requests")
    @Operation(summary = "Send a friend request to another user")
    public ResponseEntity<ApiResponse<FriendRequestDto>> sendFriendRequest(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody SendFriendRequest request) {
        FriendRequestDto result = friendshipService.sendFriendRequest(principal.getId(), request.getTargetUserId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(result, "Friend request sent successfully"));
    }

    @GetMapping("/requests/received")
    @Operation(summary = "Get all pending friend requests received by current user")
    public ResponseEntity<ApiResponse<List<FriendRequestDto>>> getReceivedRequests(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<FriendRequestDto> requests = friendshipService.getReceivedRequests(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(requests));
    }

    @GetMapping("/requests/sent")
    @Operation(summary = "Get all pending friend requests sent by current user")
    public ResponseEntity<ApiResponse<List<FriendRequestDto>>> getSentRequests(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<FriendRequestDto> requests = friendshipService.getSentRequests(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(requests));
    }

    @PutMapping("/requests/{requestId}/accept")
    @Operation(summary = "Accept a pending friend request")
    public ResponseEntity<ApiResponse<FriendDto>> acceptFriendRequest(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID requestId) {
        FriendDto friendship = friendshipService.acceptFriendRequest(principal.getId(), requestId);
        return ResponseEntity.ok(ApiResponse.success(friendship, "Friend request accepted"));
    }

    @PutMapping("/requests/{requestId}/reject")
    @Operation(summary = "Reject a pending friend request")
    public ResponseEntity<ApiResponse<Void>> rejectFriendRequest(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID requestId) {
        friendshipService.rejectFriendRequest(principal.getId(), requestId);
        return ResponseEntity.ok(ApiResponse.success(null, "Friend request rejected"));
    }

    @DeleteMapping("/requests/{requestId}")
    @Operation(summary = "Cancel a pending friend request sent by current user")
    public ResponseEntity<ApiResponse<Void>> cancelFriendRequest(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID requestId) {
        friendshipService.cancelFriendRequest(principal.getId(), requestId);
        return ResponseEntity.ok(ApiResponse.success(null, "Friend request cancelled"));
    }

    @GetMapping
    @Operation(summary = "Get list of confirmed friends for current user")
    public ResponseEntity<ApiResponse<List<FriendDto>>> getFriends(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<FriendDto> friends = friendshipService.getFriends(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(friends));
    }

    @DeleteMapping("/{friendId}")
    @Operation(summary = "Remove a friend relationship")
    public ResponseEntity<ApiResponse<Void>> removeFriend(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID friendId) {
        friendshipService.removeFriend(principal.getId(), friendId);
        return ResponseEntity.ok(ApiResponse.success(null, "Friend removed successfully"));
    }
}
