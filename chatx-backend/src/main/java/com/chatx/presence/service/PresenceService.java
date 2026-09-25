package com.chatx.presence.service;

import com.chatx.realtime.dto.PresenceEvent;
import com.chatx.realtime.dto.RealtimeEvent;
import com.chatx.realtime.dto.TypingEvent;
import com.chatx.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PresenceService {

    private static final Logger log = LoggerFactory.getLogger(PresenceService.class);
    private static final String PRESENCE_KEY_PREFIX = "chatx:presence:";
    private static final String TYPING_KEY_PREFIX = "chatx:typing:";

    private final StringRedisTemplate redisTemplate;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;

    // Resilient local fallback if Redis is unavailable
    private final Map<UUID, Instant> localOnlineUsers = new ConcurrentHashMap<>();

    public PresenceService(
            @Autowired(required = false) StringRedisTemplate redisTemplate,
            SimpMessagingTemplate messagingTemplate,
            UserRepository userRepository) {
        this.redisTemplate = redisTemplate;
        this.messagingTemplate = messagingTemplate;
        this.userRepository = userRepository;
    }

    public void setUserOnline(UUID userId) {
        Instant now = Instant.now();
        localOnlineUsers.put(userId, now);

        if (redisTemplate != null) {
            try {
                redisTemplate.opsForValue().set(PRESENCE_KEY_PREFIX + userId, "ONLINE", Duration.ofMinutes(5));
            } catch (Exception e) {
                log.warn("Redis unavailable for setUserOnline, using local state: {}", e.getMessage());
            }
        }

        PresenceEvent event = new PresenceEvent(userId, "ONLINE", now);
        messagingTemplate.convertAndSend("/topic/presence", new RealtimeEvent<>("PRESENCE_CHANGE", event));
        log.info("User {} is now ONLINE", userId);
    }

    public void setUserOffline(UUID userId) {
        Instant now = Instant.now();
        localOnlineUsers.remove(userId);

        if (redisTemplate != null) {
            try {
                redisTemplate.delete(PRESENCE_KEY_PREFIX + userId);
            } catch (Exception e) {
                log.warn("Redis unavailable for setUserOffline, using local state: {}", e.getMessage());
            }
        }

        // Update last seen in DB
        try {
            userRepository.findById(userId).ifPresent(u -> {
                u.setLastSeenAt(now);
                userRepository.save(u);
            });
        } catch (Exception e) {
            log.error("Failed to update lastSeenAt for user {}: {}", userId, e.getMessage());
        }

        PresenceEvent event = new PresenceEvent(userId, "OFFLINE", now);
        messagingTemplate.convertAndSend("/topic/presence", new RealtimeEvent<>("PRESENCE_CHANGE", event));
        log.info("User {} is now OFFLINE", userId);
    }

    public boolean isUserOnline(UUID userId) {
        if (redisTemplate != null) {
            try {
                String val = redisTemplate.opsForValue().get(PRESENCE_KEY_PREFIX + userId);
                return "ONLINE".equals(val);
            } catch (Exception e) {
                log.warn("Redis check failed, falling back to local: {}", e.getMessage());
            }
        }
        return localOnlineUsers.containsKey(userId);
    }

    public Map<UUID, Boolean> getOnlineStatusBatch(List<UUID> userIds) {
        Map<UUID, Boolean> result = new HashMap<>();
        for (UUID uid : userIds) {
            result.put(uid, isUserOnline(uid));
        }
        return result;
    }

    public void handleTyping(UUID conversationId, UUID userId, String username, boolean isTyping) {
        if (redisTemplate != null) {
            try {
                String key = TYPING_KEY_PREFIX + conversationId + ":" + userId;
                if (isTyping) {
                    redisTemplate.opsForValue().set(key, username, Duration.ofSeconds(4));
                } else {
                    redisTemplate.delete(key);
                }
            } catch (Exception e) {
                log.warn("Redis typing error: {}", e.getMessage());
            }
        }

        TypingEvent event = new TypingEvent(conversationId, userId, username, isTyping);
        messagingTemplate.convertAndSend("/topic/conversations/" + conversationId + "/typing",
                new RealtimeEvent<>("TYPING", event));
    }
}
