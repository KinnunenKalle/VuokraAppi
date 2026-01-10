package com.vuokraappi.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;  // <-- Vaihda tämä
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
public class JwtTokenService {

    private final SecretKey key;  // <-- Vaihda Key -> SecretKey
    private final long expirationMs;

    public JwtTokenService(
            @Value("${jwt.secret:your-secret-key-change-this-in-production-minimum-256-bits}") String secret,
            @Value("${jwt.expiration:3600000}") long expirationMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
        this.expirationMs = expirationMs;
    }

    public String createToken(OidcUser oidcUser) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationMs);

        Map<String, Object> claims = new HashMap<>();
        claims.put("sub", oidcUser.getSubject());
        claims.put("name", oidcUser.getAttribute("name"));
        claims.put("email", oidcUser.getAttribute("email"));
        claims.put("ssn", oidcUser.getAttribute("signicat.national_id"));

    return Jwts.builder()
            .claims(claims)
            .issuedAt(now) 
            .expiration(expiryDate)
            .signWith(key)
            .compact();
    }

    public Claims validateAndParseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)  // Nyt toimii koska key on SecretKey
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isTokenValid(String token) {
        try {
            Claims claims = validateAndParseClaims(token);
            return !claims.getExpiration().before(new Date());
        } catch (Exception e) {
            return false;
        }
    }
}