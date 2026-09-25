package com.chatx.message.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ReactionRequest {

    @NotBlank(message = "Emoji is required")
    @Size(max = 32, message = "Emoji code too long")
    private String emoji;

    public ReactionRequest() {}

    public ReactionRequest(String emoji) {
        this.emoji = emoji;
    }

    public String getEmoji() { return emoji; }
    public void setEmoji(String emoji) { this.emoji = emoji; }
}
