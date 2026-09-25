package com.chatx.realtime.service;

import com.chatx.message.dto.MessageDto;
import com.chatx.message.dto.MessageReactionDto;
import com.chatx.realtime.dto.RealtimeEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class RealtimeMessagingService {

    private static final Logger log = LoggerFactory.getLogger(RealtimeMessagingService.class);

    private final SimpMessagingTemplate messagingTemplate;

    public RealtimeMessagingService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void broadcastNewMessage(UUID conversationId, MessageDto message) {
        String destination = "/topic/conversations/" + conversationId;
        log.info("Broadcasting new message {} to {}", message.getId(), destination);
        messagingTemplate.convertAndSend(destination, new RealtimeEvent<>("NEW_MESSAGE", message));
    }

    public void broadcastMessageEdited(UUID conversationId, MessageDto message) {
        String destination = "/topic/conversations/" + conversationId;
        log.info("Broadcasting edited message {} to {}", message.getId(), destination);
        messagingTemplate.convertAndSend(destination, new RealtimeEvent<>("MESSAGE_EDITED", message));
    }

    public void broadcastMessageDeleted(UUID conversationId, MessageDto message) {
        String destination = "/topic/conversations/" + conversationId;
        log.info("Broadcasting deleted message {} to {}", message.getId(), destination);
        messagingTemplate.convertAndSend(destination, new RealtimeEvent<>("MESSAGE_DELETED", message));
    }

    public void broadcastReactionUpdated(UUID conversationId, UUID messageId, List<MessageReactionDto> reactions) {
        String destination = "/topic/conversations/" + conversationId;
        log.info("Broadcasting reaction update on message {} to {}", messageId, destination);
        Map<String, Object> payload = new HashMap<>();
        payload.put("messageId", messageId);
        payload.put("reactions", reactions);
        messagingTemplate.convertAndSend(destination, new RealtimeEvent<>("REACTION_UPDATED", payload));
    }

    public void sendToUser(String username, String eventType, Object payload) {
        messagingTemplate.convertAndSendToUser(username, "/queue/notifications", new RealtimeEvent<>(eventType, payload));
    }
}
