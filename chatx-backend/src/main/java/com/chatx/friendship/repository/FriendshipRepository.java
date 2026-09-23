package com.chatx.friendship.repository;

import com.chatx.friendship.entity.Friendship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FriendshipRepository extends JpaRepository<Friendship, UUID> {

    @Query("SELECT f FROM Friendship f WHERE f.user1.id = :minId AND f.user2.id = :maxId")
    Optional<Friendship> findFriendship(@Param("minId") UUID minId, @Param("maxId") UUID maxId);

    default Optional<Friendship> findBetween(UUID userA, UUID userB) {
        if (userA.compareTo(userB) < 0) {
            return findFriendship(userA, userB);
        } else {
            return findFriendship(userB, userA);
        }
    }

    @Query("SELECT CASE WHEN COUNT(f) > 0 THEN true ELSE false END FROM Friendship f " +
           "WHERE f.user1.id = :minId AND f.user2.id = :maxId")
    boolean existsFriendship(@Param("minId") UUID minId, @Param("maxId") UUID maxId);

    default boolean areFriends(UUID userA, UUID userB) {
        if (userA.compareTo(userB) < 0) {
            return existsFriendship(userA, userB);
        } else {
            return existsFriendship(userB, userA);
        }
    }

    @Query("SELECT f FROM Friendship f JOIN FETCH f.user1 JOIN FETCH f.user2 " +
           "WHERE f.user1.id = :userId OR f.user2.id = :userId ORDER BY f.createdAt DESC")
    List<Friendship> findAllByUserId(@Param("userId") UUID userId);
}
