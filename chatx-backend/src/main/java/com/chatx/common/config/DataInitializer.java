package com.chatx.common.config;

import com.chatx.user.entity.User;
import com.chatx.user.enums.AccountStatus;
import com.chatx.user.enums.UserRole;
import com.chatx.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        // 1. Seed dedicated Super Admin account if not present
        if (!userRepository.existsByUsernameLower("admin")) {
            User admin = new User(
                    "admin",
                    "admin@chatx.com",
                    passwordEncoder.encode("Admin@1234"),
                    "System Administrator"
            );
            admin.setRole(UserRole.SUPER_ADMIN);
            admin.setAccountStatus(AccountStatus.ACTIVE);
            admin.setBio("Lead System Administrator & Platform Overseer");
            admin.setLastSeenAt(Instant.now());

            userRepository.save(admin);
            log.info("Default Super Admin account initialized: username='admin', email='admin@chatx.com'");
        }

        // 2. Grant ADMIN role to avinash123 test account if present
        userRepository.findByUsernameLower("avinash123").ifPresent(user -> {
            if (user.getRole() == UserRole.USER) {
                user.setRole(UserRole.ADMIN);
                userRepository.save(user);
                log.info("Promoted user '@avinash123' to ADMIN role");
            }
        });
    }
}
