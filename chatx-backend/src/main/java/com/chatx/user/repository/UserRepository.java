package com.chatx.user.repository;

import com.chatx.user.entity.User;
import com.chatx.user.enums.AccountStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByUsernameLower(String usernameLower);

    Optional<User> findByEmailLower(String emailLower);

    @Query("SELECT u FROM User u WHERE u.usernameLower = :identifier OR u.emailLower = :identifier")
    Optional<User> findByUsernameOrEmail(@Param("identifier") String identifier);

    boolean existsByUsernameLower(String usernameLower);

    boolean existsByEmailLower(String emailLower);

    @Query("SELECT u FROM User u WHERE u.usernameLower LIKE CONCAT(:prefix, '%') AND u.accountStatus = :status")
    List<User> searchByUsernamePrefix(@Param("prefix") String prefix, @Param("status") AccountStatus status, Pageable pageable);
}
