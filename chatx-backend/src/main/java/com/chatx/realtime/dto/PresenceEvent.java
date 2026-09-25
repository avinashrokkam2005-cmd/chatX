package com.chatx.realtime.dto;

import java.time.Instant;
import java.util.UUID;

public class PresenceEvent {

    private UUID userId;
    private String status; // ONLINE, OFFLINE
    private Instant lastSeenAt;

    public PresenceEvent() {}

    public PresenceEvent(UUID userId, String status, Instant lastSeenAt) {
        this.userId = userId;
        this.status = status;
        this.lastSeenAt = lastSeenAt;
    }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Instant getLastSeenAt() { return lastSeenAt; }
    public void setLastSeenAt(Instant lastSeenAt) { this.lastSeenAt = lastSeenAt; }
}
