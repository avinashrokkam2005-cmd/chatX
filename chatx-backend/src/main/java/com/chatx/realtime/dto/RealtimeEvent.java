package com.chatx.realtime.dto;

import java.time.Instant;

public class RealtimeEvent<T> {

    private String type;
    private T payload;
    private Instant timestamp;

    public RealtimeEvent() {
        this.timestamp = Instant.now();
    }

    public RealtimeEvent(String type, T payload) {
        this.type = type;
        this.payload = payload;
        this.timestamp = Instant.now();
    }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public T getPayload() { return payload; }
    public void setPayload(T payload) { this.payload = payload; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
}
