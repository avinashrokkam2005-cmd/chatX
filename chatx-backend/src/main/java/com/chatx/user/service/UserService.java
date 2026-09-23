package com.chatx.user.service;

import com.chatx.common.constants.AppConstants;
import com.chatx.common.exception.ResourceNotFoundException;
import com.chatx.user.dto.UpdatePrivacyRequest;
import com.chatx.user.dto.UserSearchDto;
import com.chatx.user.dto.UserSummaryDto;
import com.chatx.user.entity.User;
import com.chatx.user.enums.AccountStatus;
import com.chatx.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<UserSearchDto> searchUsers(String query, int page, int size) {
        if (query == null || query.trim().isEmpty()) {
            return Collections.emptyList();
        }

        String cleanQuery = query.trim().toLowerCase();
        if (cleanQuery.startsWith("@")) {
            cleanQuery = cleanQuery.substring(1);
        }

        if (cleanQuery.isEmpty()) {
            return Collections.emptyList();
        }

        int pageSize = (size <= 0) ? AppConstants.DEFAULT_PAGE_SIZE : Math.min(size, AppConstants.MAX_PAGE_SIZE);
        int pageIndex = Math.max(page, 0);

        Pageable pageable = PageRequest.of(pageIndex, pageSize, Sort.by("usernameLower").ascending());
        List<User> users = userRepository.searchByUsernamePrefix(cleanQuery, AccountStatus.ACTIVE, pageable);

        return users.stream()
                .map(UserSearchDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserSummaryDto updatePrivacy(UUID userId, UpdatePrivacyRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        user.setMessagePrivacy(request.getMessagePrivacy());
        User savedUser = userRepository.save(user);

        log.info("Privacy updated for user: {} to {}", user.getUsername(), request.getMessagePrivacy());
        return UserSummaryDto.fromEntity(savedUser);
    }

    @Transactional(readOnly = true)
    public UserSummaryDto getUserById(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        return UserSummaryDto.fromEntity(user);
    }
}
