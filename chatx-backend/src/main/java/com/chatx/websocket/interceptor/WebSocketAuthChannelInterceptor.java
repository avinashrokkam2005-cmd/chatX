package com.chatx.websocket.interceptor;

import com.chatx.security.jwt.JwtTokenProvider;
import com.chatx.security.service.CustomUserDetailsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

    private static final Logger log = LoggerFactory.getLogger(WebSocketAuthChannelInterceptor.class);

    private final JwtTokenProvider jwtTokenProvider;
    private final CustomUserDetailsService userDetailsService;

    public WebSocketAuthChannelInterceptor(JwtTokenProvider jwtTokenProvider,
                                           CustomUserDetailsService userDetailsService) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.userDetailsService = userDetailsService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String token = extractToken(accessor);

            if (token != null && jwtTokenProvider.validateToken(token)) {
                try {
                    UUID userId = jwtTokenProvider.getUserIdFromToken(token);
                    UserDetails userDetails = userDetailsService.loadUserById(userId);

                    UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());

                    accessor.setUser(auth);
                    log.info("WebSocket authenticated user: {}", userDetails.getUsername());
                } catch (Exception e) {
                    log.error("Failed to authenticate user for WebSocket connection: {}", e.getMessage());
                }
            } else {
                log.warn("WebSocket CONNECT attempted without valid JWT token");
            }
        }

        return message;
    }

    private String extractToken(StompHeaderAccessor accessor) {
        // Check Authorization header
        List<String> authHeaders = accessor.getNativeHeader("Authorization");
        if (authHeaders != null && !authHeaders.isEmpty()) {
            String authHeader = authHeaders.get(0);
            if (authHeader.startsWith("Bearer ")) {
                return authHeader.substring(7);
            }
            return authHeader;
        }

        // Check 'token' or 'passcode' native header
        List<String> tokenHeaders = accessor.getNativeHeader("token");
        if (tokenHeaders != null && !tokenHeaders.isEmpty()) {
            return tokenHeaders.get(0);
        }

        if (accessor.getPasscode() != null) {
            return accessor.getPasscode();
        }

        return null;
    }
}
