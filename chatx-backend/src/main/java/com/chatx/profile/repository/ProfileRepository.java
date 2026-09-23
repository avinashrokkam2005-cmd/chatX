package com.chatx.profile.repository;

import com.chatx.profile.entity.Profile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProfileRepository extends JpaRepository<Profile, UUID> {

    @Query("SELECT p FROM Profile p JOIN FETCH p.user WHERE p.user.id = :userId")
    Optional<Profile> findByUserIdWithUser(@Param("userId") UUID userId);

    @Query("SELECT p FROM Profile p JOIN FETCH p.user WHERE p.user.usernameLower = :usernameLower")
    Optional<Profile> findByUsernameLowerWithUser(@Param("usernameLower") String usernameLower);

    Optional<Profile> findByUserId(UUID userId);

    boolean existsByUserId(UUID userId);
}
