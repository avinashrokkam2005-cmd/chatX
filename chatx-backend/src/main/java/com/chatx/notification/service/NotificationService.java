package com.chatx.notification.service;

import com.chatx.common.dto.PagedResponse;
import com.chatx.common.exception.ResourceNotFoundException;
import com.chatx.notification.dto.NotificationDto;
import com.chatx.notification.entity.Notification;
import com.chatx.notification.enums.NotificationType;
import com.chatx.notification.repository.NotificationRepository;
import com.chatx.realtime.service.RealtimeMessagingService;
import com.chatx.user.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;
    private final RealtimeMessagingService realtimeMessagingService;

    public NotificationService(NotificationRepository notificationRepository,
                               RealtimeMessagingService realtimeMessagingService) {
        this.notificationRepository = notificationRepository;
        this.realtimeMessagingService = realtimeMessagingService;
    }

    public NotificationDto createNotification(User recipient, User actor, NotificationType type,
                                              String title, String content, UUID referenceId, String referenceType) {
        Notification notification = new Notification(recipient, actor, type, title, content, referenceId, referenceType);
        Notification saved = notificationRepository.save(notification);

        NotificationDto dto = mapToDto(saved);
        try {
            realtimeMessagingService.sendToUser(recipient.getUsername(), "NOTIFICATION", dto);
        } catch (Exception e) {
            log.warn("Failed to deliver real-time notification to user {}: {}", recipient.getUsername(), e.getMessage());
        }

        return dto;
    }

    @Transactional(readOnly = true)
    public PagedResponse<NotificationDto> getUserNotifications(UUID recipientId, Pageable pageable) {
        Page<Notification> page = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(recipientId, pageable);
        List<NotificationDto> content = page.getContent().stream().map(this::mapToDto).collect(Collectors.toList());
        return PagedResponse.<NotificationDto>builder()
                .success(true)
                .data(content)
                .pagination(new PagedResponse.PaginationInfo(null, !page.isLast(), page.getSize(), page.getTotalElements()))
                .build();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(UUID recipientId) {
        return notificationRepository.countByRecipientIdAndIsReadFalse(recipientId);
    }

    public NotificationDto markAsRead(UUID recipientId, UUID notificationId) {
        Notification notification = notificationRepository.findByIdAndRecipientId(notificationId, recipientId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", notificationId));

        notification.setRead(true);
        Notification saved = notificationRepository.save(notification);
        return mapToDto(saved);
    }

    public void markAllAsRead(UUID recipientId) {
        notificationRepository.markAllAsRead(recipientId);
    }

    private NotificationDto mapToDto(Notification entity) {
        NotificationDto dto = new NotificationDto();
        dto.setId(entity.getId());
        dto.setType(entity.getType());
        dto.setTitle(entity.getTitle());
        dto.setContent(entity.getContent());
        if (entity.getActor() != null) {
            dto.setActorUsername(entity.getActor().getUsername());
            dto.setActorDisplayName(entity.getActor().getDisplayName());
            dto.setActorAvatarUrl(entity.getActor().getAvatarUrl());
        }
        dto.setReferenceId(entity.getReferenceId());
        dto.setReferenceType(entity.getReferenceType());
        dto.setRead(entity.isRead());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }
}
