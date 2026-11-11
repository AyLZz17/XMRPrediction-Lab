package com.aylzz.security.auth;

import com.aylzz.security.user.AppUser;
import com.aylzz.security.user.AppUserRepository;
import com.aylzz.security.audit.AuthAuditEventType;
import com.aylzz.security.audit.AuthAuditService;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final AppUserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthAuditService audit;

    public AuthService(
            AppUserRepository users,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthAuditService audit) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.audit = audit;
    }

    @Transactional
    public AuthResult register(String email, String password) {
        String normalizedEmail = normalizeEmail(email);
        if (users.existsByEmail(normalizedEmail)) {
            audit.recordFailure(AuthAuditEventType.REGISTRATION_REJECTED);
            throw new UserAlreadyExistsException();
        }
        if (password.getBytes(StandardCharsets.UTF_8).length > 72) {
            audit.recordFailure(AuthAuditEventType.REGISTRATION_REJECTED);
            throw new InvalidPasswordException();
        }

        AppUser user;
        try {
            user = users.saveAndFlush(
                    new AppUser(normalizedEmail, passwordEncoder.encode(password)));
        } catch (DataIntegrityViolationException exception) {
            audit.recordFailure(AuthAuditEventType.REGISTRATION_REJECTED);
            throw new UserAlreadyExistsException(exception);
        }
        audit.recordSuccess(AuthAuditEventType.REGISTRATION_SUCCEEDED, user.getId());
        return createResult(user);
    }

    @Transactional
    public AuthResult login(String email, String password) {
        if (password.getBytes(StandardCharsets.UTF_8).length > 72) {
            audit.recordFailure(AuthAuditEventType.LOGIN_FAILED);
            throw new BadCredentialsException("Invalid email or password");
        }
        AppUser user;
        try {
            user = users.findByEmail(normalizeEmail(email))
                    .filter(account -> passwordEncoder.matches(password, account.getPasswordHash()))
                    .orElseThrow(() -> new BadCredentialsException(
                            "Invalid email or password"));
        } catch (BadCredentialsException exception) {
            audit.recordFailure(AuthAuditEventType.LOGIN_FAILED);
            throw exception;
        }
        audit.recordSuccess(AuthAuditEventType.LOGIN_SUCCEEDED, user.getId());
        return createResult(user);
    }

    private AuthResult createResult(AppUser user) {
        return new AuthResult(
                new AuthenticatedUser(user.getId(), user.getEmail()),
                jwtService.createToken(user.getId(), user.getEmail()),
                jwtService.getTtlSeconds());
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    public record AuthResult(AuthenticatedUser user, String token, long expiresInSeconds) {
    }
}
