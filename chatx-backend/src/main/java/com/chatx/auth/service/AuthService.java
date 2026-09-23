package com.chatx.auth.service;

import com.chatx.auth.dto.AuthResponse;
import com.chatx.auth.dto.LoginRequest;
import com.chatx.auth.dto.RefreshTokenRequest;
import com.chatx.auth.dto.RegisterRequest;
import com.chatx.common.exception.AccessDeniedException;
import com.chatx.common.exception.BadRequestException;
import com.chatx.common.exception.ResourceNotFoundException;
import com.chatx.security.jwt.JwtTokenProvider;
import com.chatx.security.model.UserPrincipal;
import com.chatx.user.dto.UserSummaryDto;
import com.chatx.user.entity.User;
import com.chatx.user.enums.AccountStatus;
import com.chatx.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String username = request.getUsername().trim();
        String usernameLower = username.toLowerCase();
        String email = request.getEmail().trim();
        String emailLower = email.toLowerCase();

        if (userRepository.existsByUsernameLower(usernameLower)) {
            throw new BadRequestException("Username '@" + username + "' is already taken", "USERNAME_ALREADY_EXISTS");
        }

        if (userRepository.existsByEmailLower(emailLower)) {
            throw new BadRequestException("Email '" + email + "' is already registered", "EMAIL_ALREADY_EXISTS");
        }

        String passwordHash = passwordEncoder.encode(request.getPassword());
        User user = new User(username, email, passwordHash, request.getDisplayName());
        user.setLastSeenAt(Instant.now());

        User savedUser = userRepository.save(user);
        log.info("New user registered successfully: username='{}', id={}", savedUser.getUsername(), savedUser.getId());

        UserPrincipal principal = UserPrincipal.create(savedUser);
        String accessToken = tokenProvider.generateAccessToken(principal);
        String refreshToken = tokenProvider.generateRefreshToken(principal);

        return new AuthResponse(
                accessToken,
                refreshToken,
                tokenProvider.getAccessTokenExpirationMs(),
                UserSummaryDto.fromEntity(savedUser)
        );
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String identifier = request.getUsernameOrEmail().trim().toLowerCase();
        // Remove leading '@' if user entered @username
        if (identifier.startsWith("@")) {
            identifier = identifier.substring(1);
        }

        User user = userRepository.findByUsernameOrEmail(identifier)
                .orElseThrow(() -> new BadCredentialsException("Invalid username/email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            log.warn("Failed login attempt for identifier: {}", identifier);
            throw new BadCredentialsException("Invalid username/email or password");
        }

        if (user.getAccountStatus() == AccountStatus.BANNED) {
            throw new AccessDeniedException("This account has been permanently banned", "ACCOUNT_BANNED");
        }

        if (user.getAccountStatus() == AccountStatus.SUSPENDED) {
            throw new AccessDeniedException("This account is currently suspended", "ACCOUNT_SUSPENDED");
        }

        if (user.getAccountStatus() == AccountStatus.DELETED) {
            throw new BadRequestException("This account has been deleted", "ACCOUNT_DELETED");
        }

        user.setLastSeenAt(Instant.now());
        userRepository.save(user);

        log.info("User logged in successfully: username='{}', id={}", user.getUsername(), user.getId());

        UserPrincipal principal = UserPrincipal.create(user);
        String accessToken = tokenProvider.generateAccessToken(principal);
        String refreshToken = tokenProvider.generateRefreshToken(principal);

        return new AuthResponse(
                accessToken,
                refreshToken,
                tokenProvider.getAccessTokenExpirationMs(),
                UserSummaryDto.fromEntity(user)
        );
    }

    @Transactional(readOnly = true)
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String token = request.getRefreshToken();

        if (!tokenProvider.validateToken(token)) {
            throw new BadRequestException("Invalid or expired refresh token", "INVALID_REFRESH_TOKEN");
        }

        String tokenType = tokenProvider.getTokenType(token);
        if (!"REFRESH".equals(tokenType)) {
            throw new BadRequestException("Provided token is not a refresh token", "INVALID_TOKEN_TYPE");
        }

        UUID userId = tokenProvider.getUserIdFromToken(token);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (user.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new AccessDeniedException("Account is not active", "ACCOUNT_INACTIVE");
        }

        UserPrincipal principal = UserPrincipal.create(user);
        String newAccessToken = tokenProvider.generateAccessToken(principal);

        return new AuthResponse(
                newAccessToken,
                token, // keep existing refresh token
                tokenProvider.getAccessTokenExpirationMs(),
                UserSummaryDto.fromEntity(user)
        );
    }

    @Transactional(readOnly = true)
    public UserSummaryDto getCurrentUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        return UserSummaryDto.fromEntity(user);
    }
}
