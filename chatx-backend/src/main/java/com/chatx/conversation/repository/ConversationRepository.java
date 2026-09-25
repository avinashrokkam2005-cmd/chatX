package com.chatx.conversation.repository;

import com.chatx.conversation.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

    @Query("SELECT c FROM Conversation c WHERE c.type = 'DIRECT' AND c.directUserAId = :minId AND c.directUserBId = :maxId")
    Optional<Conversation> findDirectConversation(@Param("minId") UUID minId, @Param("maxId") UUID maxId);

    default Optional<Conversation> findDirect(UUID userA, UUID userB) {
        if (userA.compareTo(userB) < 0) {
            return findDirectConversation(userA, userB);
        } else {
            return findDirectConversation(userB, userA);
        }
    }

    @Query("SELECT c FROM Conversation c JOIN ConversationMember cm ON cm.conversation.id = c.id " +
           "WHERE cm.user.id = :userId ORDER BY COALESCE(c.lastMessageAt, c.createdAt) DESC")
    List<Conversation> findUserConversations(@Param("userId") UUID userId);
}
