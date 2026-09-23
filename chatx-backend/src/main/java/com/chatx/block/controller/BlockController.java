package com.chatx.block.controller;

import com.chatx.block.dto.BlockDto;
import com.chatx.block.service.BlockService;
import com.chatx.common.dto.ApiResponse;
import com.chatx.security.model.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/blocks")
@Tag(name = "Blocks", description = "Endpoints for blocking and unblocking users")
public class BlockController {

    private final BlockService blockService;

    public BlockController(BlockService blockService) {
        this.blockService = blockService;
    }

    @PostMapping("/{userId}")
    @Operation(summary = "Block a user by their ID")
    public ResponseEntity<ApiResponse<BlockDto>> blockUser(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID userId) {
        BlockDto block = blockService.blockUser(principal.getId(), userId);
        return ResponseEntity.ok(ApiResponse.success(block, "User blocked successfully"));
    }

    @DeleteMapping("/{userId}")
    @Operation(summary = "Unblock a user by their ID")
    public ResponseEntity<ApiResponse<Void>> unblockUser(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID userId) {
        blockService.unblockUser(principal.getId(), userId);
        return ResponseEntity.ok(ApiResponse.success(null, "User unblocked successfully"));
    }

    @GetMapping
    @Operation(summary = "Get list of all users blocked by the current user")
    public ResponseEntity<ApiResponse<List<BlockDto>>> getBlockedUsers(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<BlockDto> blockedUsers = blockService.getBlockedUsers(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(blockedUsers));
    }
}
