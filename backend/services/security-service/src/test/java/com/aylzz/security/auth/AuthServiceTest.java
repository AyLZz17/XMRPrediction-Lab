package com.aylzz.security.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aylzz.security.auth.AuthService.AuthResult;
import com.aylzz.security.user.AppUser;
import com.aylzz.security.user.AppUserRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {
    @Mock
    AppUserRepository users;

    @Mock
    JwtService jwtService;

    private PasswordEncoder passwordEncoder;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder(4);
        authService = new AuthService(users, passwordEncoder, jwtService);
    }

    @Test
    void registrationNormalizesEmailAndOnlyPersistsAHash() {
        when(users.existsByEmail("researcher@example.com")).thenReturn(false);
        when(users.saveAndFlush(any(AppUser.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(jwtService.createToken(any(), any())).thenReturn("signed-token");
        when(jwtService.getTtlSeconds()).thenReturn(900L);

        AuthResult result = authService.register(
                " Researcher@Example.COM ", "Strong-password-123");

        ArgumentCaptor<AppUser> savedUser = ArgumentCaptor.forClass(AppUser.class);
        verify(users).saveAndFlush(savedUser.capture());
        assertEquals("researcher@example.com", savedUser.getValue().getEmail());
        assertNotEquals("Strong-password-123", savedUser.getValue().getPasswordHash());
        assertTrue(passwordEncoder.matches(
                "Strong-password-123", savedUser.getValue().getPasswordHash()));
        assertEquals("signed-token", result.token());
        assertEquals("researcher@example.com", result.user().email());
    }

    @Test
    void loginNormalizesEmailAndRejectsBadCredentials() {
        AppUser storedUser = new AppUser(
                "researcher@example.com", passwordEncoder.encode("Strong-password-123"));
        when(users.findByEmail("researcher@example.com")).thenReturn(Optional.of(storedUser));
        when(jwtService.createToken(any(), any())).thenReturn("signed-token");
        when(jwtService.getTtlSeconds()).thenReturn(900L);

        assertEquals("researcher@example.com",
                authService.login("RESEARCHER@example.com", "Strong-password-123")
                        .user().email());
        assertThrows(BadCredentialsException.class,
                () -> authService.login("researcher@example.com", "wrong-password"));
        assertThrows(BadCredentialsException.class,
                () -> authService.login("researcher@example.com", "é".repeat(37)));
    }

    @Test
    void registrationRejectsAnExistingEmailAndOverlongUtf8Password() {
        when(users.existsByEmail("researcher@example.com")).thenReturn(true);
        assertThrows(UserAlreadyExistsException.class,
                () -> authService.register(
                        "researcher@example.com", "Strong-password-123"));

        when(users.existsByEmail("large-password@example.com")).thenReturn(false);
        assertThrows(InvalidPasswordException.class,
                () -> authService.register(
                        "large-password@example.com", "é".repeat(37)));
    }
}
