package com.chatx.conversation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public class CreateGroupConversationRequest {

    @NotBlank(message = "Group name is required")
    @Size(min = 1, max = 100, message = "Group name must be between 1 and 100 characters")
    private String name;

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;

    @Size(max = 2048, message = "Avatar URL cannot exceed 2048 characters")
    private String avatarUrl;

    private List<UUID> memberIds;

    public CreateGroupConversationRequest() {
    }

    public CreateGroupConversationRequest(String name, String description, String avatarUrl, List<UUID> memberIds) {
        this.name = name;
        this.description = description;
        this.avatarUrl = avatarUrl;
        this.memberIds = memberIds;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public List<UUID> getMemberIds() { return memberIds; }
    public void setMemberIds(List<UUID> memberIds) { this.memberIds = memberIds; }
}
