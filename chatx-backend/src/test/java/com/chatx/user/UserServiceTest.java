package com.chatx.user;

import com.chatx.user.dto.UpdatePrivacyRequest;
import com.chatx.user.dto.UserSearchDto;
import com.chatx.user.dto.UserSummaryDto;
import com.chatx.user.entity.User;
import com.chatx.user.enums.AccountStatus;
import com.chatx.user.enums.MessagePrivacy;
import com.chatx.user.repository.UserRepository;
import com.chatx.user.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    private UserService userService;

    @BeforeEach
    void setUp() {
        userService = new UserService(userRepository);
    }

    @Test
    @DisplayName("Should search users by prefix stripping '@' symbol")
    void searchUsers_Success() {
        User user1 = new User("avinash123", "avi@example.com", "pass", "Avinash");
        user1.setId(UUID.randomUUID());
        User user2 = new User("avitech", "tech@example.com", "pass", "Avi Tech");
        user2.setId(UUID.randomUUID());

        when(userRepository.searchByUsernamePrefix(eq("avi"), eq(AccountStatus.ACTIVE), any(Pageable.class)))
                .thenReturn(List.of(user1, user2));

        List<UserSearchDto> results = userService.searchUsers("@avi", 0, 20);

        assertEquals(2, results.size());
        assertEquals("avinash123", results.get(0).getUsername());
        assertEquals("avitech", results.get(1).getUsername());
    }

    @Test
    @DisplayName("Should return empty list for blank query")
    void searchUsers_BlankQuery_ReturnsEmpty() {
        List<UserSearchDto> results = userService.searchUsers("   ", 0, 20);
        assertTrue(results.isEmpty());
        verify(userRepository, never()).searchByUsernamePrefix(any(), any(), any());
    }

    @Test
    @DisplayName("Should successfully update message privacy setting")
    void updatePrivacy_Success() {
        UUID userId = UUID.randomUUID();
        User user = new User("avinash", "avi@example.com", "pass", "Avinash");
        user.setId(userId);
        user.setMessagePrivacy(MessagePrivacy.EVERYONE);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdatePrivacyRequest request = new UpdatePrivacyRequest(MessagePrivacy.FRIENDS_ONLY);
        UserSummaryDto result = userService.updatePrivacy(userId, request);

        assertNotNull(result);
        assertEquals(MessagePrivacy.FRIENDS_ONLY, result.getMessagePrivacy());
        verify(userRepository).save(user);
    }
}
