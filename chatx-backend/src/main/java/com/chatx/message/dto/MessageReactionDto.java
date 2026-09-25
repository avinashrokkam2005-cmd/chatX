package com.chatx.message.dto;

import java.util.List;
import java.util.UUID;

public class MessageReactionDto {
    private String emoji;
    private int count;
    private boolean hasReacted;
    private List<String> usernames;

    public MessageReactionDto() {}

    public MessageReactionDto(String emoji, int count, boolean hasReacted, List<String> usernames) {
        this.emoji = emoji;
        this.count = count;
        this.hasReacted = hasReacted;
        this.usernames = usernames;
    }

    public String getEmoji() { return emoji; }
    public void setEmoji(String emoji) { this.emoji = emoji; }

    public int getCount() { return count; }
    public void setCount(int count) { this.count = count; }

    public boolean isHasReacted() { return hasReacted; }
    public void setHasReacted(boolean hasReacted) { this.hasReacted = hasReacted; }

    public List<String> getUsernames() { return usernames; }
    public void setUsernames(List<String> usernames) { this.usernames = usernames; }
}
