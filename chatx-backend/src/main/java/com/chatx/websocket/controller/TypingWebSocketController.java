package com.chatx.websocket.controller;

import com.chatx.presence.service.PresenceService;
import com.chatx.security.model.UserPrincipal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;

import java.util.Map;
import java.util.UUID;

@Controller
public class TypingWebSocketController {

    private static final Logger log = LoggerFactory.getLogger(TypingWebSocketController.class);

    private final PresenceService presenceService;

    public TypingWebSocketController(PresenceService presenceService) {
        this.presenceService = presenceService;
    }

    @MessageMapping("/conversations/{conversationId}/typing")
    public void handleTyping(
            @DestinationVariable UUID conversationId,
            @Payload Map<String, Object> payload,
            @AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            log.warn("Anonymous typing indicator received for conversation {}", conversationId);
            return;
        }

        boolean isTyping = Boolean.TRUE.equals(payload.get("isTyping"));
        presenceService.handleTyping(conversationId, principal.getId(), principal.getUsername(), isTyping);
    }
}
