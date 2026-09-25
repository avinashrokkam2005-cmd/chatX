package com.chatx.message.repository;

import com.chatx.message.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {

    @Query("SELECT m FROM Message m LEFT JOIN FETCH m.sender s " +
           "WHERE m.conversation.id = :conversationId ORDER BY m.createdAt DESC, m.id DESC")
    Page<Message> findByConversationId(@Param("conversationId") UUID conversationId, Pageable pageable);

    @Query("SELECT m FROM Message m LEFT JOIN FETCH m.sender s " +
           "WHERE m.conversation.id = :conversationId AND m.createdAt < :cursor " +
           "ORDER BY m.createdAt DESC, m.id DESC")
    List<Message> findByConversationIdAndCursor(
            @Param("conversationId") UUID conversationId,
            @Param("cursor") Instant cursor,
            Pageable pageable);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.conversation.id = :conversationId AND m.createdAt > :after")
    long countUnreadMessages(@Param("conversationId") UUID conversationId, @Param("after") Instant after);
}
