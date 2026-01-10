package com.vuokraappi.config;

import com.vuokraappi.service.JwtTokenService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.oidc.web.server.logout.OidcClientInitiatedServerLogoutSuccessHandler;
import org.springframework.security.oauth2.client.registration.ReactiveClientRegistrationRepository;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.WebFilterExchange;
import org.springframework.security.web.server.authentication.ServerAuthenticationSuccessHandler;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    private final JwtTokenService jwtTokenService;

    public SecurityConfig(JwtTokenService jwtTokenService) {
        this.jwtTokenService = jwtTokenService;
    }

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(
            ServerHttpSecurity http,
            ReactiveClientRegistrationRepository clientRegistrationRepository) {
        
        http
            .csrf(csrf -> csrf.disable())
            .authorizeExchange(exchanges -> exchanges
                .pathMatchers("/graph/**").permitAll()
                .pathMatchers("/users/strongAuthentication").permitAll()
                .pathMatchers("/login/**").permitAll()
                .pathMatchers("/oauth2/**").permitAll()
                .anyExchange().permitAll()
            )
            .oauth2Login(oauth2 -> oauth2
                .authenticationSuccessHandler(oidcSuccessHandler())
            )
            .logout(logout -> logout
                .logoutSuccessHandler(
                    oidcLogoutSuccessHandler(clientRegistrationRepository)
                )
            );
        
        return http.build();
    }

    @Bean
    public ServerAuthenticationSuccessHandler oidcSuccessHandler() {
        return new ServerAuthenticationSuccessHandler() {
            @Override
            public Mono<Void> onAuthenticationSuccess(
                    WebFilterExchange webFilterExchange,  // <-- Vaihda tämä
                    Authentication authentication) {
            
                ServerWebExchange exchange = webFilterExchange.getExchange();  // <-- Lisää tämä
            
                try {
                    OidcUser oidcUser = (OidcUser) authentication.getPrincipal();
                
                    // Hae käyttäjätiedot Signicatista (null-safe)
                    String sub = oidcUser.getSubject();
                    String name = oidcUser.getClaimAsString("name");
                    String email = oidcUser.getClaimAsString("email");
                    String ssn = oidcUser.getClaimAsString("signicat.national_id");
                
                    System.out.println("User authenticated: " + name + " (SSN: " + ssn + ")");
                
                    // Luo JWT token mobiilisovellukselle
                    String jwtToken = jwtTokenService.createToken(oidcUser);
                
                    // URL-enkoodaa tokenit
                    String encodedJwtToken = URLEncoder.encode(jwtToken, StandardCharsets.UTF_8);
                    String encodedIdToken = URLEncoder.encode(
                        oidcUser.getIdToken().getTokenValue(), 
                        StandardCharsets.UTF_8
                    );
                
                    // Ohjaa takaisin mobiilisovellukseen
                    String redirectUrl = String.format(
                        "myapp://auth/callback?token=%s&id_token=%s",
                        encodedJwtToken,
                        encodedIdToken
                    );
                
                    exchange.getResponse().setStatusCode(HttpStatus.FOUND);
                    exchange.getResponse().getHeaders().setLocation(URI.create(redirectUrl));
                
                    return exchange.getResponse().setComplete();
                
                } catch (Exception e) {
                    System.err.println("Authentication success handler error: " + e.getMessage());
                    e.printStackTrace();
                
                    // Ohjaa virheeseen
                    String errorUrl = "myapp://auth/callback?error=authentication_failed";
                    exchange.getResponse().setStatusCode(HttpStatus.FOUND);
                    exchange.getResponse().getHeaders().setLocation(URI.create(errorUrl));
                
                    return exchange.getResponse().setComplete();
                }
            };
        };
    }

    private OidcClientInitiatedServerLogoutSuccessHandler oidcLogoutSuccessHandler(
            ReactiveClientRegistrationRepository clientRegistrationRepository) {
        
        OidcClientInitiatedServerLogoutSuccessHandler successHandler = 
            new OidcClientInitiatedServerLogoutSuccessHandler(clientRegistrationRepository);
        
        successHandler.setPostLogoutRedirectUri("myapp://auth/logout");
        
        return successHandler;
    }
}
