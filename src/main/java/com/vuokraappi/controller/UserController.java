package com.vuokraappi.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.net.URI;

@RestController
@RequestMapping("/users")
public class UserController {

    /**
     * Aloittaa vahvan tunnistautumisen (Signicat OIDC)
     * Tämä on ensimmäinen kutsu mobiilisovelluksesta
     */
    @GetMapping("/strongAuthentication")
    public Mono<ResponseEntity<Void>> initiateStrongAuthentication() {
        // Ohjaa Spring Securityn OIDC-flowiin
        return Mono.just(
            ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create("/oauth2/authorization/signicat"))
                .build()
        );
    }

    /**
     * Hakee kirjautuneen käyttäjän tiedot
     */
    @GetMapping("/me")
    public Mono<ResponseEntity<UserInfoResponse>> getCurrentUser(
            @AuthenticationPrincipal OidcUser oidcUser) {
        
        if (oidcUser == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }
        
        UserInfoResponse userInfo = new UserInfoResponse(
            oidcUser.getSubject(),
            oidcUser.getAttribute("name"),
            oidcUser.getAttribute("email"),
            oidcUser.getAttribute("signicat.national_id")
        );
        
        return Mono.just(ResponseEntity.ok(userInfo));
    }

    /**
     * Token refresh endpoint
     */
    @PostMapping("/refresh")
    public Mono<ResponseEntity<TokenResponse>> refreshToken(
            @RequestBody RefreshTokenRequest request) {
        // TODO: Toteuta refresh token -logiikka
        // Tässä voit käyttää OAuth2AuthorizedClientService:ä
        return Mono.just(
            ResponseEntity.ok(new TokenResponse("new-access-token", "new-refresh-token"))
        );
    }
}

record UserInfoResponse(String id, String name, String email, String ssn) {}
record TokenResponse(String accessToken, String refreshToken) {}
record RefreshTokenRequest(String refreshToken) {}
