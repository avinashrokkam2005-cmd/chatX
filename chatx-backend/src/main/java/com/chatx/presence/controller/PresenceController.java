package com.chatx.presence.controller;

import com.chatx.common.dto.ApiResponse;
import com.chatx.presence.service.PresenceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/presence")
@Tag(name = "Presence", description = "User presence and online status API")
public class PresenceController {

    private final PresenceService presenceService;

    public PresenceController(PresenceService presenceService) {
        this.presenceService = presenceService;
    }

    @GetMapping("/users/{userId}")
    @Operation(summary = "Check if a specific user is currently online")
    public ResponseEntity<ApiResponse<Boolean>> isUserOnline(@PathVariable UUID userId) {
        boolean online = presenceService.isUserOnline(userId);
        return ResponseEntity.ok(ApiResponse.success(online));
    }

    @PostMapping("/batch")
    @Operation(summary = "Check online status for multiple users at once")
    public ResponseEntity<ApiResponse<Map<UUID, Boolean>>> getOnlineStatusBatch(@RequestBody List<UUID> userIds) {
        Map<UUID, Boolean> result = presenceService.getOnlineStatusBatch(userIds);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
