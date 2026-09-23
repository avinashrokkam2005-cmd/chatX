package com.chatx.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.FORBIDDEN)
public class AccessDeniedException extends RuntimeException {

    private final String errorCode;

    public AccessDeniedException(String message) {
        super(message);
        this.errorCode = "ACCESS_DENIED";
    }

    public AccessDeniedException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() { return errorCode; }
}
