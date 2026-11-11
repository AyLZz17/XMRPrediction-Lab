package com.aylzz.security.auth;

import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
    private final String issuer;
    private final long ttlSeconds;
    private final Algorithm algorithm;
    private final JWTVerifier verifier;

    public JwtService(
            @Value("${security.jwt.issuer}") String issuer,
            @Value("${security.jwt.secret}") String secret,
            @Value("${security.jwt.ttl-seconds}") long ttlSeconds) {
        if (secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalArgumentException("JWT_SECRET must be at least 32 bytes");
        }
        if (ttlSeconds < 60 || ttlSeconds > 86_400) {
            throw new IllegalArgumentException("JWT_TTL_SECONDS must be between 60 and 86400");
        }
        this.issuer = issuer;
        this.ttlSeconds = ttlSeconds;
        this.algorithm = Algorithm.HMAC256(secret);
        this.verifier = JWT.require(algorithm).withIssuer(issuer).build();
    }

    public String createToken(UUID userId, String email) {
        Instant issuedAt = Instant.now();
        return JWT.create()
                .withIssuer(issuer)
                .withSubject(userId.toString())
                .withClaim("email", email)
                .withIssuedAt(Date.from(issuedAt))
                .withExpiresAt(Date.from(issuedAt.plusSeconds(ttlSeconds)))
                .sign(algorithm);
    }

    public DecodedJWT verify(String token) {
        return verifier.verify(token);
    }

    public long getTtlSeconds() {
        return ttlSeconds;
    }
}
