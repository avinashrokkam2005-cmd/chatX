package com.chatx.conversation.controller;

import com.chatx.common.dto.ApiResponse;
import com.chatx.conversation.dto.*;
import com.chatx.conversation.service.ConversationService;
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
@RequestMapping("/api/conversations")
@Tag(name = "Conversations", description = "Endpoints for direct and group chat conversations and membership")
public class ConversationController {

    private final ConversationService conversationService;

    public ConversationController(ConversationService conversationService) {
        this.conversationService = conversationService;
    }

    @PostMapping("/direct")
    @Operation(summary = "Start or retrieve an existing direct conversation with another user")
    public ResponseEntity<ApiResponse<ConversationDto>> getOrCreateDirectConversation(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateDirectConversationRequest request) {
        ConversationDto conv = conversationService.getOrCreateDirectConversation(principal.getId(), request.getRecipientId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(conv));
    }

    @PostMapping("/group")
    @Operation(summary = "Create a new group conversation")
    public ResponseEntity<ApiResponse<ConversationDto>> createGroupConversation(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateGroupConversationRequest request) {
        ConversationDto conv = conversationService.createGroupConversation(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(conv));
    }

    @GetMapping
    @Operation(summary = "Get list of all conversations for the current authenticated user")
    public ResponseEntity<ApiResponse<List<ConversationDto>>> getUserConversations(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<ConversationDto> conversations = conversationService.getUserConversations(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(conversations));
    }

    @GetMapping("/{conversationId}")
    @Operation(summary = "Get conversation details and full member list")
    public ResponseEntity<ApiResponse<ConversationDto>> getConversationById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID conversationId) {
        ConversationDto conv = conversationService.getConversationById(principal.getId(), conversationId);
        return ResponseEntity.ok(ApiResponse.success(conv));
    }

    @PostMapping("/{conversationId}/members")
    @Operation(summary = "Add new members to a group conversation (admin only)")
    public ResponseEntity<ApiResponse<ConversationDto>> addMembers(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID conversationId,
            @Valid @RequestBody AddMembersRequest request) {
        ConversationDto conv = conversationService.addMembers(principal.getId(), conversationId, request);
        return ResponseEntity.ok(ApiResponse.success(conv, "Members added successfully"));
    }

    @DeleteMapping("/{conversationId}/members/{memberId}")
    @Operation(summary = "Remove a member from a group (admin only, or user leaving)")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID conversationId,
            @PathVariable UUID memberId) {
        conversationService.removeMember(principal.getId(), conversationId, memberId);
        return ResponseEntity.ok(ApiResponse.success(null, "Member removed successfully"));
    }

    @PutMapping("/{conversationId}")
    @Operation(summary = "Update group conversation name, description, or avatar (admin only)")
    public ResponseEntity<ApiResponse<ConversationDto>> updateGroup(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID conversationId,
            @Valid @RequestBody UpdateGroupRequest request) {
        ConversationDto conv = conversationService.updateGroup(principal.getId(), conversationId, request);
        return ResponseEntity.ok(ApiResponse.success(conv, "Group updated successfully"));
    }
}
