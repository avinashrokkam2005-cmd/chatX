package com.chatx.user.controller;

import com.chatx.common.dto.ApiResponse;
import com.chatx.security.model.UserPrincipal;
import com.chatx.user.dto.UpdatePrivacyRequest;
import com.chatx.user.dto.UserSearchDto;
import com.chatx.user.dto.UserSummaryDto;
import com.chatx.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@Tag(name = "Users", description = "Endpoints for user search, profile discovery, and privacy configuration")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/search")
    @Operation(summary = "Search users by username handle (prefix matching)")
    public ResponseEntity<ApiResponse<List<UserSearchDto>>> searchUsers(
            @RequestParam(name = "q", required = false) String query,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        List<UserSearchDto> results = userService.searchUsers(query, page, size);
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    @GetMapping("/{userId}")
    @Operation(summary = "Get user summary by ID")
    public ResponseEntity<ApiResponse<UserSummaryDto>> getUserById(@PathVariable UUID userId) {
        UserSummaryDto user = userService.getUserById(userId);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @PutMapping("/me/privacy")
    @Operation(summary = "Update message privacy setting (EVERYONE or FRIENDS_ONLY)")
    public ResponseEntity<ApiResponse<UserSummaryDto>> updatePrivacy(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdatePrivacyRequest request) {
        UserSummaryDto updatedUser = userService.updatePrivacy(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(updatedUser, "Privacy setting updated successfully"));
    }
}
