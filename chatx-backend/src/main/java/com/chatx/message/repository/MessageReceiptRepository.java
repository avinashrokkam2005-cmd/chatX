package com.chatx.message.repository;

import com.chatx.message.entity.MessageReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MessageReceiptRepository extends JpaRepository<MessageReceipt, UUID> {

    Optional<MessageReceipt> findByMessageIdAndUserId(UUID messageId, UUID userId);

    List<MessageReceipt> findByMessageId(UUID messageId);

    @Query("SELECT r FROM MessageReceipt r WHERE r.message.id IN :messageIds")
    List<MessageReceipt> findByMessageIdIn(@Param("messageIds") List<UUID> messageIds);
}
