package com.chatx.friendship.repository;

import com.chatx.friendship.entity.FriendRequest;
import com.chatx.friendship.enums.FriendRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FriendRequestRepository extends JpaRepository<FriendRequest, UUID> {

    @Query("SELECT fr FROM FriendRequest fr JOIN FETCH fr.sender JOIN FETCH fr.receiver " +
           "WHERE fr.receiver.id = :receiverId AND fr.status = :status ORDER BY fr.createdAt DESC")
    List<FriendRequest> findByReceiverIdAndStatus(@Param("receiverId") UUID receiverId, @Param("status") FriendRequestStatus status);

    @Query("SELECT fr FROM FriendRequest fr JOIN FETCH fr.sender JOIN FETCH fr.receiver " +
           "WHERE fr.sender.id = :senderId AND fr.status = :status ORDER BY fr.createdAt DESC")
    List<FriendRequest> findBySenderIdAndStatus(@Param("senderId") UUID senderId, @Param("status") FriendRequestStatus status);

    @Query("SELECT fr FROM FriendRequest fr WHERE " +
           "((fr.sender.id = :userA AND fr.receiver.id = :userB) OR (fr.sender.id = :userB AND fr.receiver.id = :userA)) " +
           "AND fr.status = 'PENDING'")
    Optional<FriendRequest> findPendingBetween(@Param("userA") UUID userA, @Param("userB") UUID userB);
}
