package com.aylzz.security.auth;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(UserAlreadyExistsException.class)
    ResponseEntity<ErrorResponse> userAlreadyExists() {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErrorResponse("email_already_registered"));
    }

    @ExceptionHandler(BadCredentialsException.class)
    ResponseEntity<ErrorResponse> invalidCredentials() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ErrorResponse("invalid_credentials"));
    }

    @ExceptionHandler(InvalidPasswordException.class)
    ResponseEntity<ErrorResponse> invalidPassword() {
        return ResponseEntity.badRequest().body(new ErrorResponse("invalid_password"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ErrorResponse> invalidRequest() {
        return ResponseEntity.badRequest().body(new ErrorResponse("invalid_request"));
    }

    public record ErrorResponse(String error) {
    }
}
