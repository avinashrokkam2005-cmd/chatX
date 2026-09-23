package com.chatx.common.constants;

public final class AppConstants {

    private AppConstants() {
        // Prevent instantiation
    }

    // Pagination
    public static final int DEFAULT_PAGE_SIZE = 20;
    public static final int MAX_PAGE_SIZE = 100;

    // Username constraints
    public static final int USERNAME_MIN_LENGTH = 3;
    public static final int USERNAME_MAX_LENGTH = 30;
    public static final String USERNAME_PATTERN = "^[a-zA-Z0-9._]+$";

    // Password constraints
    public static final int PASSWORD_MIN_LENGTH = 8;
    public static final int PASSWORD_MAX_LENGTH = 128;

    // Profile constraints
    public static final int DISPLAY_NAME_MAX_LENGTH = 100;
    public static final int BIO_MAX_LENGTH = 500;

    // Group constraints
    public static final int GROUP_NAME_MAX_LENGTH = 100;
    public static final int GROUP_DESCRIPTION_MAX_LENGTH = 500;
    public static final int GROUP_MAX_MEMBERS = 256;

    // Message constraints
    public static final int MESSAGE_MAX_LENGTH = 5000;

    // File upload
    public static final long MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

    // Redis key prefixes
    public static final String REDIS_PRESENCE_PREFIX = "presence:";
    public static final String REDIS_TYPING_PREFIX = "typing:";
    public static final String REDIS_RATE_LIMIT_PREFIX = "ratelimit:";

    // Redis TTLs (seconds)
    public static final long PRESENCE_TTL_SECONDS = 60;
    public static final long TYPING_TTL_SECONDS = 5;
}
