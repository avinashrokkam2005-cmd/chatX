package com.chatx.message.controller;

import com.chatx.common.dto.ApiResponse;
import com.chatx.message.dto.EditMessageRequest;
import com.chatx.message.dto.MessageDto;
import com.chatx.message.dto.MessageReactionDto;
import com.chatx.message.dto.ReactionRequest;
import com.chatx.message.dto.SendMessageRequest;
import com.chatx.message.service.MessageService;
import com.chatx.security.model.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/messages")
@Tag(name = "Messages", description = "Messaging, history, reactions, and receipts API")
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @PostMapping
    @Operation(summary = "Send a message to a conversation")
    public ResponseEntity<ApiResponse<MessageDto>> sendMessage(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody SendMessageRequest request) {
        MessageDto message = messageService.sendMessage(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(message, "Message sent successfully"));
    }

    @GetMapping("/conversations/{conversationId}")
    @Operation(summary = "Get messages for a conversation with cursor pagination")
    public ResponseEntity<ApiResponse<List<MessageDto>>> getConversationMessages(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID conversationId,
            @RequestParam(required = false) Instant cursor,
            @RequestParam(defaultValue = "50") int limit) {
        List<MessageDto> messages = messageService.getConversationMessages(principal.getId(), conversationId, cursor, limit);
        return ResponseEntity.ok(ApiResponse.success(messages));
    }

    @PutMapping("/{messageId}")
    @Operation(summary = "Edit a previously sent message")
    public ResponseEntity<ApiResponse<MessageDto>> editMessage(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID messageId,
            @Valid @RequestBody EditMessageRequest request) {
        MessageDto updated = messageService.editMessage(principal.getId(), messageId, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Message updated"));
    }

    @DeleteMapping("/{messageId}")
    @Operation(summary = "Delete (soft-delete) a message")
    public ResponseEntity<ApiResponse<MessageDto>> deleteMessage(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID messageId) {
        MessageDto deleted = messageService.deleteMessage(principal.getId(), messageId);
        return ResponseEntity.ok(ApiResponse.success(deleted, "Message deleted"));
    }

    @PostMapping("/{messageId}/reactions")
    @Operation(summary = "Toggle a reaction on a message")
    public ResponseEntity<ApiResponse<List<MessageReactionDto>>> toggleReaction(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID messageId,
            @Valid @RequestBody ReactionRequest request) {
        List<MessageReactionDto> reactions = messageService.toggleReaction(principal.getId(), messageId, request.getEmoji());
        return ResponseEntity.ok(ApiResponse.success(reactions, "Reaction updated"));
    }

    @PostMapping("/conversations/{conversationId}/read")
    @Operation(summary = "Mark all conversation messages as read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID conversationId) {
        messageService.markConversationAsRead(principal.getId(), conversationId);
        return ResponseEntity.ok(ApiResponse.success(null, "Conversation marked as read"));
    }
}
