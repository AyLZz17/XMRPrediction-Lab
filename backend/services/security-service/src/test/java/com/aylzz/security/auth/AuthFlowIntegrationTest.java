package com.aylzz.security.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.aylzz.security.user.AppUserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers(disabledWithoutDocker = true)
class AuthFlowIntegrationTest {
    @Container
    static final PostgreSQLContainer<?> POSTGRES =
            new PostgreSQLContainer<>("postgres:17-alpine");

    @DynamicPropertySource
    static void databaseProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("security.jwt.secret",
                () -> "integration-test-secret-0123456789-abcdef");
    }

    @Autowired
    MockMvc mvc;

    @Autowired
    AppUserRepository users;

    @Test
    void registrationPersistsHashedPasswordAndCreatesHttpOnlyCookie() throws Exception {
        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"Researcher@aylzz.lab","password":"Secure-password-123"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(cookie().exists("aylzz_session"))
                .andExpect(jsonPath("$.user.email").value("researcher@aylzz.lab"));

        var storedUser = users.findByEmail("researcher@aylzz.lab").orElseThrow();
        org.junit.jupiter.api.Assertions.assertNotEquals(
                "Secure-password-123", storedUser.getPasswordHash());
        org.junit.jupiter.api.Assertions.assertTrue(
                storedUser.getPasswordHash().startsWith("$2a$"));
    }

    @Test
    void loginAndCurrentUserRequireValidCredentialsAndCookie() throws Exception {
        mvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"email":"user@example.com","password":"Strong-password-456"}
                        """)).andExpect(status().isCreated());

        var login = mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"USER@example.com","password":"Strong-password-456"}
                                """))
                .andExpect(status().isOk())
                .andReturn();
        String cookie = login.getResponse().getCookie("aylzz_session").getValue();

        mvc.perform(get("/api/auth/me").cookie(login.getResponse().getCookie("aylzz_session")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.email").value("user@example.com"));

        mvc.perform(get("/api/auth/me").cookie(new jakarta.servlet.http.Cookie(
                        "aylzz_session", cookie + "invalid")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void registrationRejectsDuplicateEmailAndWeakPassword() throws Exception {
        String request = """
                {"email":"duplicate@example.com","password":"Strong-password-789"}
                """;
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(request)).andExpect(status().isCreated());
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(request)).andExpect(status().isConflict());
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"email":"weak@example.com","password":"tiny"}
                        """)).andExpect(status().isBadRequest());
    }
}
