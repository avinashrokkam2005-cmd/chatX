package com.chatx.profile;

import com.chatx.common.exception.ResourceNotFoundException;
import com.chatx.profile.dto.ProfileDto;
import com.chatx.profile.dto.UpdateProfileRequest;
import com.chatx.profile.entity.Profile;
import com.chatx.profile.repository.ProfileRepository;
import com.chatx.profile.service.ProfileService;
import com.chatx.user.entity.User;
import com.chatx.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProfileServiceTest {

    @Mock
    private ProfileRepository profileRepository;

    @Mock
    private UserRepository userRepository;

    private ProfileService profileService;

    @BeforeEach
    void setUp() {
        profileService = new ProfileService(profileRepository, userRepository);
    }

    @Test
    @DisplayName("Should return profile by userId")
    void getProfileByUserId_Success() {
        UUID userId = UUID.randomUUID();
        User user = new User("avinash", "avi@example.com", "pass", "Avinash");
        user.setId(userId);
        Profile profile = new Profile(user, "Avinash", "Software Architect", "https://avatar.png");
        profile.setId(UUID.randomUUID());

        when(profileRepository.findByUserIdWithUser(userId)).thenReturn(Optional.of(profile));

        ProfileDto result = profileService.getProfileByUserId(userId);

        assertNotNull(result);
        assertEquals("avinash", result.getUsername());
        assertEquals("Software Architect", result.getBio());
    }

    @Test
    @DisplayName("Should return profile by username ignoring case and '@' symbol")
    void getProfileByUsername_Success() {
        UUID userId = UUID.randomUUID();
        User user = new User("avinash", "avi@example.com", "pass", "Avinash");
        user.setId(userId);
        Profile profile = new Profile(user, "Avinash", "Tech lead", null);

        when(profileRepository.findByUsernameLowerWithUser("avinash")).thenReturn(Optional.of(profile));

        ProfileDto result = profileService.getProfileByUsername("@Avinash");

        assertNotNull(result);
        assertEquals("avinash", result.getUsername());
        assertEquals("Tech lead", result.getBio());
    }

    @Test
    @DisplayName("Should update profile bio and display name")
    void updateProfile_Success() {
        UUID userId = UUID.randomUUID();
        User user = new User("avinash", "avi@example.com", "pass", "Avinash");
        user.setId(userId);
        Profile profile = new Profile(user, "Avinash", "Old bio", null);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(profileRepository.findByUserId(userId)).thenReturn(Optional.of(profile));
        when(profileRepository.save(any(Profile.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateProfileRequest request = new UpdateProfileRequest("Avi S.", "New updated bio", "https://new-avatar.png");
        ProfileDto result = profileService.updateProfile(userId, request);

        assertNotNull(result);
        assertEquals("Avi S.", result.getDisplayName());
        assertEquals("New updated bio", result.getBio());
        assertEquals("https://new-avatar.png", result.getAvatarUrl());
        verify(profileRepository).save(any(Profile.class));
        verify(userRepository).save(user);
    }
}
