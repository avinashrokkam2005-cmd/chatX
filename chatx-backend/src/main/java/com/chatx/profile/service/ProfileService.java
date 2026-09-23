package com.chatx.profile.service;

import com.chatx.common.exception.ResourceNotFoundException;
import com.chatx.profile.dto.ProfileDto;
import com.chatx.profile.dto.UpdateProfileRequest;
import com.chatx.profile.entity.Profile;
import com.chatx.profile.repository.ProfileRepository;
import com.chatx.user.entity.User;
import com.chatx.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class ProfileService {

    private static final Logger log = LoggerFactory.getLogger(ProfileService.class);

    private final ProfileRepository profileRepository;
    private final UserRepository userRepository;

    public ProfileService(ProfileRepository profileRepository, UserRepository userRepository) {
        this.profileRepository = profileRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public Profile createOrGetProfile(User user) {
        return profileRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    Profile newProfile = new Profile(user, user.getDisplayName(), user.getBio(), user.getAvatarUrl());
                    return profileRepository.save(newProfile);
                });
    }

    @Transactional(readOnly = true)
    public ProfileDto getProfileByUserId(UUID userId) {
        return profileRepository.findByUserIdWithUser(userId)
                .map(ProfileDto::fromEntity)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
                    return ProfileDto.fromUser(user);
                });
    }

    @Transactional(readOnly = true)
    public ProfileDto getProfileByUsername(String username) {
        String cleanUsername = username.trim().toLowerCase();
        if (cleanUsername.startsWith("@")) {
            cleanUsername = cleanUsername.substring(1);
        }

        final String targetUsername = cleanUsername;
        return profileRepository.findByUsernameLowerWithUser(targetUsername)
                .map(ProfileDto::fromEntity)
                .orElseGet(() -> {
                    User user = userRepository.findByUsernameLower(targetUsername)
                            .orElseThrow(() -> new ResourceNotFoundException("User", "username", targetUsername));
                    return ProfileDto.fromUser(user);
                });
    }

    @Transactional
    public ProfileDto updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Profile profile = profileRepository.findByUserId(userId)
                .orElseGet(() -> new Profile(user, user.getDisplayName(), user.getBio(), user.getAvatarUrl()));

        if (request.getDisplayName() != null) {
            String trimmedName = request.getDisplayName().trim();
            profile.setDisplayName(trimmedName.isEmpty() ? user.getUsername() : trimmedName);
            user.setDisplayName(profile.getDisplayName());
        }

        if (request.getBio() != null) {
            profile.setBio(request.getBio().trim());
            user.setBio(profile.getBio());
        }

        if (request.getAvatarUrl() != null) {
            profile.setAvatarUrl(request.getAvatarUrl().trim());
            user.setAvatarUrl(profile.getAvatarUrl());
        }

        profile = profileRepository.save(profile);
        userRepository.save(user);

        log.info("Profile updated for user: {} (id: {})", user.getUsername(), user.getId());

        return ProfileDto.fromEntity(profile);
    }
}
