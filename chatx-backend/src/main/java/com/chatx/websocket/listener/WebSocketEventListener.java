package com.chatx.websocket.listener;

import com.chatx.presence.service.PresenceService;
import com.chatx.security.model.UserPrincipal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;

@Component
public class WebSocketEventListener {

    private static final Logger log = LoggerFactory.getLogger(WebSocketEventListener.class);

    private final PresenceService presenceService;

    public WebSocketEventListener(PresenceService presenceService) {
        this.presenceService = presenceService;
    }

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        Principal principal = event.getUser();
        if (principal instanceof UsernamePasswordAuthenticationToken authToken) {
            if (authToken.getPrincipal() instanceof UserPrincipal userPrincipal) {
                log.info("WebSocket connected: user='{}', id='{}'", userPrincipal.getUsername(), userPrincipal.getId());
                presenceService.setUserOnline(userPrincipal.getId());
            }
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        Principal principal = event.getUser();
        if (principal instanceof UsernamePasswordAuthenticationToken authToken) {
            if (authToken.getPrincipal() instanceof UserPrincipal userPrincipal) {
                log.info("WebSocket disconnected: user='{}', id='{}'", userPrincipal.getUsername(), userPrincipal.getId());
                presenceService.setUserOffline(userPrincipal.getId());
            }
        }
    }
}
