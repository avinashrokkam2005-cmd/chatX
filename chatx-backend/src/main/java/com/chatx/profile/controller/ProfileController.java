package com.chatx.profile.controller;

import com.chatx.common.dto.ApiResponse;
import com.chatx.profile.dto.ProfileDto;
import com.chatx.profile.dto.UpdateProfileRequest;
import com.chatx.profile.service.ProfileService;
import com.chatx.security.model.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/profiles")
@Tag(name = "Profiles", description = "Endpoints for viewing and editing user profiles")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user profile")
    public ResponseEntity<ApiResponse<ProfileDto>> getMyProfile(@AuthenticationPrincipal UserPrincipal principal) {
        ProfileDto profile = profileService.getProfileByUserId(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @PutMapping("/me")
    @Operation(summary = "Update current user profile (displayName, bio, avatarUrl)")
    public ResponseEntity<ApiResponse<ProfileDto>> updateMyProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateProfileRequest request) {
        ProfileDto updatedProfile = profileService.updateProfile(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(updatedProfile, "Profile updated successfully"));
    }

    @GetMapping("/{userId}")
    @Operation(summary = "Get public profile by user ID")
    public ResponseEntity<ApiResponse<ProfileDto>> getProfileById(@PathVariable UUID userId) {
        ProfileDto profile = profileService.getProfileByUserId(userId);
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @GetMapping("/by-username/{username}")
    @Operation(summary = "Get public profile by unique username handle")
    public ResponseEntity<ApiResponse<ProfileDto>> getProfileByUsername(@PathVariable String username) {
        ProfileDto profile = profileService.getProfileByUsername(username);
        return ResponseEntity.ok(ApiResponse.success(profile));
    }
}
