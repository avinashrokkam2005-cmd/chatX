package com.chatx.block.repository;

import com.chatx.block.entity.Block;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BlockRepository extends JpaRepository<Block, UUID> {

    Optional<Block> findByBlockerIdAndBlockedId(UUID blockerId, UUID blockedId);

    boolean existsByBlockerIdAndBlockedId(UUID blockerId, UUID blockedId);

    @Query("SELECT b FROM Block b JOIN FETCH b.blocked WHERE b.blocker.id = :blockerId ORDER BY b.createdAt DESC")
    List<Block> findByBlockerIdWithBlocked(@Param("blockerId") UUID blockerId);

    @Query("SELECT CASE WHEN COUNT(b) > 0 THEN true ELSE false END FROM Block b " +
           "WHERE (b.blocker.id = :userA AND b.blocked.id = :userB) OR " +
           "(b.blocker.id = :userB AND b.blocked.id = :userA)")
    boolean isBlockedEitherWay(@Param("userA") UUID userA, @Param("userB") UUID userB);
}
