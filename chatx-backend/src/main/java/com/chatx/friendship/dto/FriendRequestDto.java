package com.chatx.friendship.dto;

import com.chatx.friendship.entity.FriendRequest;
import com.chatx.friendship.enums.FriendRequestStatus;
import com.chatx.user.dto.UserSummaryDto;

import java.time.Instant;
import java.util.UUID;

public class FriendRequestDto {

    private UUID requestId;
    private UserSummaryDto sender;
    private UserSummaryDto receiver;
    private FriendRequestStatus status;
    private Instant createdAt;

    public FriendRequestDto() {
    }

    public FriendRequestDto(UUID requestId, UserSummaryDto sender, UserSummaryDto receiver,
                            FriendRequestStatus status, Instant createdAt) {
        this.requestId = requestId;
        this.sender = sender;
        this.receiver = receiver;
        this.status = status;
        this.createdAt = createdAt;
    }

    public static FriendRequestDto fromEntity(FriendRequest request) {
        return new FriendRequestDto(
                request.getId(),
                UserSummaryDto.fromEntity(request.getSender()),
                UserSummaryDto.fromEntity(request.getReceiver()),
                request.getStatus(),
                request.getCreatedAt()
        );
    }

    public UUID getRequestId() { return requestId; }
    public void setRequestId(UUID requestId) { this.requestId = requestId; }

    public UserSummaryDto getSender() { return sender; }
    public void setSender(UserSummaryDto sender) { this.sender = sender; }

    public UserSummaryDto getReceiver() { return receiver; }
    public void setReceiver(UserSummaryDto receiver) { this.receiver = receiver; }

    public FriendRequestStatus getStatus() { return status; }
    public void setStatus(FriendRequestStatus status) { this.status = status; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
