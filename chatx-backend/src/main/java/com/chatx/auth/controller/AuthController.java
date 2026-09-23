package com.chatx.auth.controller;

import com.chatx.auth.dto.AuthResponse;
import com.chatx.auth.dto.LoginRequest;
import com.chatx.auth.dto.RefreshTokenRequest;
import com.chatx.auth.dto.RegisterRequest;
import com.chatx.auth.service.AuthService;
import com.chatx.common.dto.ApiResponse;
import com.chatx.security.model.UserPrincipal;
import com.chatx.user.dto.UserSummaryDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Endpoints for user registration, login, and token management")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new user account")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Account registered successfully"));
    }

    @PostMapping("/login")
    @Operation(summary = "Login with username or email and password")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Login successful"));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh expired access token using a valid refresh token")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Token refreshed successfully"));
    }

    @GetMapping("/me")
    @Operation(summary = "Get currently authenticated user details")
    public ResponseEntity<ApiResponse<UserSummaryDto>> getCurrentUser(@AuthenticationPrincipal UserPrincipal principal) {
        UserSummaryDto user = authService.getCurrentUser(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(user));
    }
}
