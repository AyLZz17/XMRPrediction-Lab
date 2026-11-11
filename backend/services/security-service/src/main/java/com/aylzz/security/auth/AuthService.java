package com.aylzz.security.auth;

import com.aylzz.security.user.AppUser;
import com.aylzz.security.user.AppUserRepository;
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

    public AuthService(
            AppUserRepository users,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResult register(String email, String password) {
        String normalizedEmail = normalizeEmail(email);
        if (users.existsByEmail(normalizedEmail)) {
            throw new UserAlreadyExistsException();
        }
        if (password.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new InvalidPasswordException();
        }

        AppUser user;
        try {
            user = users.saveAndFlush(
                    new AppUser(normalizedEmail, passwordEncoder.encode(password)));
        } catch (DataIntegrityViolationException exception) {
            throw new UserAlreadyExistsException(exception);
        }
        return createResult(user);
    }

    @Transactional(readOnly = true)
    public AuthResult login(String email, String password) {
        if (password.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new BadCredentialsException("Invalid email or password");
        }
        AppUser user = users.findByEmail(normalizeEmail(email))
                .filter(account -> passwordEncoder.matches(password, account.getPasswordHash()))
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));
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
