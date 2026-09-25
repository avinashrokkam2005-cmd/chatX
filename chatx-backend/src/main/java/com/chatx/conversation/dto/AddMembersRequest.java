package com.chatx.conversation.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;
import java.util.UUID;

public class AddMembersRequest {

    @NotEmpty(message = "At least one member ID must be provided")
    private List<UUID> memberIds;

    public AddMembersRequest() {
    }

    public AddMembersRequest(List<UUID> memberIds) {
        this.memberIds = memberIds;
    }

    public List<UUID> getMemberIds() { return memberIds; }
    public void setMemberIds(List<UUID> memberIds) { this.memberIds = memberIds; }
}
