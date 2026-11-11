package com.aylzz.security.auth;

public class UserAlreadyExistsException extends RuntimeException {
    public UserAlreadyExistsException() {
        super("An account already exists for this email");
    }

    public UserAlreadyExistsException(Throwable cause) {
        super("An account already exists for this email", cause);
    }
}
