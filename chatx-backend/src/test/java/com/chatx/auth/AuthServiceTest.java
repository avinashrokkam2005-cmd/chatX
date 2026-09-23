package com.chatx.auth;

import com.chatx.auth.dto.AuthResponse;
import com.chatx.auth.dto.LoginRequest;
import com.chatx.auth.dto.RegisterRequest;
import com.chatx.auth.service.AuthService;
import com.chatx.common.exception.AccessDeniedException;
import com.chatx.common.exception.BadRequestException;
import com.chatx.security.jwt.JwtTokenProvider;
import com.chatx.user.entity.User;
import com.chatx.user.enums.AccountStatus;
import com.chatx.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider tokenProvider;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, passwordEncoder, tokenProvider);
    }

    @Test
    @DisplayName("Should successfully register a new user")
    void register_Success() {
        RegisterRequest request = new RegisterRequest("avinash123", "avinash@example.com", "SecurePass123!", "Avinash");

        when(userRepository.existsByUsernameLower("avinash123")).thenReturn(false);
        when(userRepository.existsByEmailLower("avinash@example.com")).thenReturn(false);
        when(passwordEncoder.encode("SecurePass123!")).thenReturn("hashedPassword123");

        User savedUser = new User("avinash123", "avinash@example.com", "hashedPassword123", "Avinash");
        savedUser.setId(UUID.randomUUID());

        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(tokenProvider.generateAccessToken(any())).thenReturn("mock-access-token");
        when(tokenProvider.generateRefreshToken(any())).thenReturn("mock-refresh-token");
        when(tokenProvider.getAccessTokenExpirationMs()).thenReturn(900000L);

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("mock-access-token", response.getAccessToken());
        assertEquals("mock-refresh-token", response.getRefreshToken());
        assertEquals("avinash123", response.getUser().getUsername());
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Should reject registration with duplicate username")
    void register_DuplicateUsername_ThrowsException() {
        RegisterRequest request = new RegisterRequest("avinash123", "avi@example.com", "SecurePass123!", "Avinash");
        when(userRepository.existsByUsernameLower("avinash123")).thenReturn(true);

        BadRequestException ex = assertThrows(BadRequestException.class, () -> authService.register(request));
        assertEquals("USERNAME_ALREADY_EXISTS", ex.getErrorCode());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should reject registration with duplicate email")
    void register_DuplicateEmail_ThrowsException() {
        RegisterRequest request = new RegisterRequest("newuser", "existing@example.com", "SecurePass123!", "New User");
        when(userRepository.existsByUsernameLower("newuser")).thenReturn(false);
        when(userRepository.existsByEmailLower("existing@example.com")).thenReturn(true);

        BadRequestException ex = assertThrows(BadRequestException.class, () -> authService.register(request));
        assertEquals("EMAIL_ALREADY_EXISTS", ex.getErrorCode());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should successfully login with username or email")
    void login_Success() {
        LoginRequest request = new LoginRequest("avinash123", "SecurePass123!");
        User user = new User("avinash123", "avinash@example.com", "hashedPass", "Avinash");
        user.setId(UUID.randomUUID());

        when(userRepository.findByUsernameOrEmail("avinash123")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("SecurePass123!", "hashedPass")).thenReturn(true);
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(tokenProvider.generateAccessToken(any())).thenReturn("mock-access-token");
        when(tokenProvider.generateRefreshToken(any())).thenReturn("mock-refresh-token");
        when(tokenProvider.getAccessTokenExpirationMs()).thenReturn(900000L);

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("mock-access-token", response.getAccessToken());
        assertEquals("avinash123", response.getUser().getUsername());
    }

    @Test
    @DisplayName("Should reject login with wrong password")
    void login_WrongPassword_ThrowsException() {
        LoginRequest request = new LoginRequest("avinash123", "wrongPassword");
        User user = new User("avinash123", "avinash@example.com", "hashedPass", "Avinash");

        when(userRepository.findByUsernameOrEmail("avinash123")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongPassword", "hashedPass")).thenReturn(false);

        assertThrows(BadCredentialsException.class, () -> authService.login(request));
    }

    @Test
    @DisplayName("Should block login for banned account")
    void login_BannedAccount_ThrowsException() {
        LoginRequest request = new LoginRequest("banned_user", "password");
        User user = new User("banned_user", "banned@example.com", "hashedPass", "Banned");
        user.setAccountStatus(AccountStatus.BANNED);

        when(userRepository.findByUsernameOrEmail("banned_user")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password", "hashedPass")).thenReturn(true);

        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () -> authService.login(request));
        assertEquals("ACCOUNT_BANNED", ex.getErrorCode());
    }
}
