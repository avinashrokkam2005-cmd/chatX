package com.chatx.conversation.repository;

import com.chatx.conversation.entity.ConversationMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConversationMemberRepository extends JpaRepository<ConversationMember, UUID> {

    Optional<ConversationMember> findByConversationIdAndUserId(UUID conversationId, UUID userId);

    boolean existsByConversationIdAndUserId(UUID conversationId, UUID userId);

    @Query("SELECT cm FROM ConversationMember cm JOIN FETCH cm.user WHERE cm.conversation.id = :conversationId")
    List<ConversationMember> findByConversationIdWithUsers(@Param("conversationId") UUID conversationId);

    @Query("SELECT cm FROM ConversationMember cm JOIN FETCH cm.user WHERE cm.conversation.id = :conversationId AND cm.user.id != :currentUserId")
    Optional<ConversationMember> findOtherMember(@Param("conversationId") UUID conversationId, @Param("currentUserId") UUID currentUserId);

    long countByConversationId(UUID conversationId);

    void deleteByConversationIdAndUserId(UUID conversationId, UUID userId);
}
