package com.chatx.block.dto;

import com.chatx.block.entity.Block;
import com.chatx.user.dto.UserSummaryDto;

import java.time.Instant;
import java.util.UUID;

public class BlockDto {

    private UUID blockId;
    private UserSummaryDto blockedUser;
    private Instant blockedAt;

    public BlockDto() {
    }

    public BlockDto(UUID blockId, UserSummaryDto blockedUser, Instant blockedAt) {
        this.blockId = blockId;
        this.blockedUser = blockedUser;
        this.blockedAt = blockedAt;
    }

    public static BlockDto fromEntity(Block block) {
        return new BlockDto(
                block.getId(),
                UserSummaryDto.fromEntity(block.getBlocked()),
                block.getCreatedAt()
        );
    }

    public UUID getBlockId() { return blockId; }
    public void setBlockId(UUID blockId) { this.blockId = blockId; }

    public UserSummaryDto getBlockedUser() { return blockedUser; }
    public void setBlockedUser(UserSummaryDto blockedUser) { this.blockedUser = blockedUser; }

    public Instant getBlockedAt() { return blockedAt; }
    public void setBlockedAt(Instant blockedAt) { this.blockedAt = blockedAt; }
}
