package com.example.deployintel.auth.security;

import com.example.deployintel.user.entity.UserRole;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    private final SecretKey signingKey;
    private final long expiration;

    public JwtService(
            @Value("${security.jwt.secret}") String secret,
            @Value("${security.jwt.expiration}") long expiration
    ) {
        this.signingKey = Keys.hmacShaKeyFor(
                secret.getBytes(StandardCharsets.UTF_8)
        );

        this.expiration = expiration;
    }

    public String generateToken(
            UUID userId,
            String email,
            UserRole role
    ) {
        Date now = new Date();
        Date expirationDate = new Date(now.getTime() + expiration);

        return Jwts.builder()
                .subject(userId.toString())
                .claim("email", email)
                .claim("role", role.name())
                .issuedAt(now)
                .expiration(expirationDate)
                .signWith(signingKey)
                .compact();
    }

    /**
     * Generates a long-lived CI/CD or API token for GitHub Actions automation.
     *
     * @param userId             the token owner's UUID
     * @param email              the token owner's email
     * @param role               the token owner's user role
     * @param projectId          the associated project UUID
     * @param customExpirationMs custom token lifetime in milliseconds
     * @return signed JWT token string
     */
    public String generateCicdToken(
            UUID userId,
            String email,
            UserRole role,
            UUID projectId,
            long customExpirationMs
    ) {
        Date now = new Date();
        Date expirationDate = new Date(now.getTime() + customExpirationMs);

        return Jwts.builder()
                .subject(userId.toString())
                .claim("email", email)
                .claim("role", role.name())
                .claim("projectId", projectId.toString())
                .claim("type", "CICD")
                .issuedAt(now)
                .expiration(expirationDate)
                .signWith(signingKey)
                .compact();
    }

    public Claims extractClaims(String token) {

        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public UUID extractUserId(String token) {

        return UUID.fromString(
                extractClaims(token).getSubject()
        );
    }

    public String extractEmail(String token) {

        return extractClaims(token)
                .get("email", String.class);
    }
    public UserRole extractRole(String token) {
        return UserRole.valueOf(
                extractClaims(token).get("role", String.class)
        );
    }

    public boolean isTokenValid(String token) {

        try {
            extractClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}