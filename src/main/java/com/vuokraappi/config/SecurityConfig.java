package com.vuokraappi.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nimbusds.jose.crypto.RSADecrypter;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jwt.EncryptedJWT;
import com.nimbusds.jwt.JWT;
import com.nimbusds.jwt.SignedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.ReactiveAuthenticationManager;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.endpoint.OAuth2AuthorizationCodeGrantRequest;
import org.springframework.security.oauth2.client.endpoint.ReactiveOAuth2AccessTokenResponseClient;
import org.springframework.security.oauth2.client.endpoint.WebClientReactiveAuthorizationCodeTokenResponseClient;
import org.springframework.security.oauth2.client.oidc.authentication.OidcAuthorizationCodeReactiveAuthenticationManager;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.web.server.logout.OidcClientInitiatedServerLogoutSuccessHandler;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ReactiveClientRegistrationRepository;
import org.springframework.security.oauth2.client.userinfo.ReactiveOAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.OidcUserInfo;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusReactiveJwtDecoder;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoderFactory;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.WebFilterExchange;
import org.springframework.security.web.server.authentication.ServerAuthenticationSuccessHandler;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.annotation.PostConstruct;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Value("${signicat.encryption.private-key-jwk:}")
    private String privateKeyJwk;

    @PostConstruct
    public void init() {
        if (privateKeyJwk != null && !privateKeyJwk.isEmpty()) {
            System.out.println("✓ Signicat encryption private key loaded (length: " + privateKeyJwk.length() + " chars)");
            try {
                RSAKey.parse(privateKeyJwk);
                System.out.println("✓ Private key JWK is valid");
            } catch (Exception e) {
                System.err.println("✗ Private key JWK is INVALID: " + e.getMessage());
            }
        } else {
            System.out.println("⚠ Signicat encryption private key NOT configured");
        }
    }

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(
            ServerHttpSecurity http,
            ReactiveClientRegistrationRepository clientRegistrationRepository) {
        
        // Luo custom authentication manager
        ReactiveAuthenticationManager authManager = createOidcAuthManager(clientRegistrationRepository);
        
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
                .authenticationManager(authManager)
                .authenticationSuccessHandler(oidcSuccessHandler())
            )
            .logout(logout -> logout
                .logoutSuccessHandler(
                    oidcLogoutSuccessHandler(clientRegistrationRepository)
                )
            );
        
        return http.build();
    }

    /**
     * Luo OIDC Authentication Manager custom JWT decoderilla ja UserServicella
     */
    private ReactiveAuthenticationManager createOidcAuthManager(
            ReactiveClientRegistrationRepository clientRegistrationRepository) {
        
        // Access token client
        ReactiveOAuth2AccessTokenResponseClient<OAuth2AuthorizationCodeGrantRequest> accessTokenResponseClient =
            new WebClientReactiveAuthorizationCodeTokenResponseClient();
        
        // Luo OIDC auth manager
        OidcAuthorizationCodeReactiveAuthenticationManager authManager =
            new OidcAuthorizationCodeReactiveAuthenticationManager(
                accessTokenResponseClient,
                customOidcUserService()
            );
        
        // Aseta custom JWT decoder factory
        authManager.setJwtDecoderFactory(jwtDecoderFactory());
        
        return authManager;
    }

    /**
     * Custom JWT Decoder Factory JWE-tuella
     */
    @Bean
    public ReactiveJwtDecoderFactory<ClientRegistration> jwtDecoderFactory() {
        return clientRegistration -> {
            System.out.println("→ Creating JWT decoder for: " + clientRegistration.getClientName());
            
            return new ReactiveJwtDecoder() {
                @Override
                public Mono<Jwt> decode(String token) {
                    return Mono.fromCallable(() -> {
                        System.out.println("→ Decoding JWT token...");
                        
                        JWT jwt = com.nimbusds.jwt.JWTParser.parse(token);
                        System.out.println("  JWT type: " + jwt.getClass().getSimpleName());
                        
                        if (jwt instanceof EncryptedJWT) {
                            System.out.println("  → JWE detected, decrypting...");
                            
                            if (privateKeyJwk == null || privateKeyJwk.isEmpty()) {
                                throw new JwtException("Private key JWK not configured");
                            }
                            
                            EncryptedJWT encryptedJWT = (EncryptedJWT) jwt;
                            System.out.println("  Algorithm: " + encryptedJWT.getHeader().getAlgorithm());
                            System.out.println("  Encryption: " + encryptedJWT.getHeader().getEncryptionMethod());
                            
                            RSAKey rsaKey = RSAKey.parse(privateKeyJwk);
                            RSADecrypter decrypter = new RSADecrypter(rsaKey);
                            encryptedJWT.decrypt(decrypter);
                            System.out.println("  ✓ Decrypted successfully");
                            
                            SignedJWT signedJWT = encryptedJWT.getPayload().toSignedJWT();
                            if (signedJWT == null) {
                                throw new JwtException("JWE payload is not a signed JWT");
                            }
                            
                            System.out.println("  → Validating nested JWT signature...");
                            return signedJWT.serialize();
                            
                        } else if (jwt instanceof SignedJWT) {
                            System.out.println("  → JWS detected, validating signature...");
                            return token;
                            
                        } else {
                            throw new JwtException("Unsupported JWT type: " + jwt.getClass());
                        }
                    })
                    .flatMap(signedToken -> {
                        String jwkSetUri = clientRegistration.getProviderDetails().getJwkSetUri();
                        NimbusReactiveJwtDecoder delegate = NimbusReactiveJwtDecoder
                            .withJwkSetUri(jwkSetUri)
                            .build();
                        
                        return delegate.decode(signedToken)
                            .doOnSuccess(jwt -> System.out.println("  ✓ JWT signature validated successfully"))
                            .doOnError(e -> System.err.println("  ✗ Signature validation failed: " + e.getMessage()));
                    })
                    .onErrorMap(e -> {
                        System.err.println("✗ JWT decode error: " + e.getMessage());
                        if (e instanceof JwtException) {
                            return e;
                        }
                        return new JwtException("Failed to decode JWT", e);
                    });
                }
            };
        };
    }

    /**
     * Custom OIDC User Service joka osaa käsitellä JWT UserInfo-vastauksia
     */
    @Bean
    public ReactiveOAuth2UserService<OidcUserRequest, OidcUser> customOidcUserService() {
        return userRequest -> {
            System.out.println("→ Fetching UserInfo...");
            
            return WebClient.create()
                .get()
                .uri(userRequest.getClientRegistration().getProviderDetails().getUserInfoEndpoint().getUri())
                .headers(headers -> headers.setBearerAuth(userRequest.getAccessToken().getTokenValue()))
                .retrieve()
                .bodyToMono(String.class)
                .flatMap(response -> {
                    try {
                        System.out.println("  → UserInfo response received");
                        
                        if (response.trim().startsWith("{")) {
                            // JSON
                            System.out.println("  → UserInfo is JSON");
                            ObjectMapper mapper = new ObjectMapper();
                            Map<String, Object> claims = mapper.readValue(response, Map.class);
                            return Mono.just(createOidcUser(userRequest, claims));
                            
                        } else {
                            // JWT
                            System.out.println("  → UserInfo is JWT, decoding...");
                            JWT jwt = com.nimbusds.jwt.JWTParser.parse(response);
                            
                            if (jwt instanceof EncryptedJWT) {
                                System.out.println("  → UserInfo JWT is encrypted");
                                EncryptedJWT encryptedJWT = (EncryptedJWT) jwt;
                                RSAKey rsaKey = RSAKey.parse(privateKeyJwk);
                                RSADecrypter decrypter = new RSADecrypter(rsaKey);
                                encryptedJWT.decrypt(decrypter);
                                
                                SignedJWT signedJWT = encryptedJWT.getPayload().toSignedJWT();
                                Map<String, Object> claims = signedJWT.getJWTClaimsSet().getClaims();
                                System.out.println("  ✓ UserInfo decrypted");
                                return Mono.just(createOidcUser(userRequest, claims));
                                
                            } else if (jwt instanceof SignedJWT) {
                                SignedJWT signedJWT = (SignedJWT) jwt;
                                Map<String, Object> claims = signedJWT.getJWTClaimsSet().getClaims();
                                System.out.println("  ✓ UserInfo parsed");
                                return Mono.just(createOidcUser(userRequest, claims));
                            } else {
                                throw new OAuth2AuthenticationException("Unsupported UserInfo JWT");
                            }
                        }
                    } catch (Exception e) {
                        System.err.println("✗ UserInfo error: " + e.getMessage());
                        return Mono.error(new OAuth2AuthenticationException("Failed to parse UserInfo"));
                    }
                });
        };
    }

    private OidcUser createOidcUser(OidcUserRequest userRequest, Map<String, Object> claims) {
        System.out.println("  → Creating OidcUser");
        System.out.println("    Name: " + claims.get("name"));
        
        OidcIdToken idToken = userRequest.getIdToken();
        OidcUserInfo userInfo = new OidcUserInfo(claims);
        
        Set<GrantedAuthority> authorities = new HashSet<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
        
        return new DefaultOidcUser(authorities, idToken, userInfo);
    }

    @Bean
    public ServerAuthenticationSuccessHandler oidcSuccessHandler() {
        return new ServerAuthenticationSuccessHandler() {
            @Override
            public Mono<Void> onAuthenticationSuccess(
                    WebFilterExchange webFilterExchange,
                    Authentication authentication) {
                
                ServerWebExchange exchange = webFilterExchange.getExchange();
                
                try {
                    OidcUser oidcUser = (OidcUser) authentication.getPrincipal();
                    
                    String name = oidcUser.getClaimAsString("name");
                    String email = oidcUser.getClaimAsString("email");
                    String ssn = oidcUser.getClaimAsString("signicat.national_id");
                    
                    System.out.println("✓ User authenticated successfully!");
                    System.out.println("  Name: " + name);
                    System.out.println("  Email: " + email);
                    System.out.println("  SSN: " + ssn);
                    
                    String token = oidcUser.getIdToken().getTokenValue();
                    String encodedToken = URLEncoder.encode(token, StandardCharsets.UTF_8);
                    
                    String redirectUrl = String.format(
                        "exp://j-dhp8s-kikidicarlos-8081.exp.direct",
                        encodedToken
                    );
                    
                    exchange.getResponse().setStatusCode(HttpStatus.FOUND);
                    exchange.getResponse().getHeaders().setLocation(URI.create(redirectUrl));
                    
                    return exchange.getResponse().setComplete();
                    
                } catch (Exception e) {
                    System.err.println("✗ Authentication error: " + e.getMessage());
                    
                    String errorUrl = "myapp://auth/callback?error=authentication_failed";
                    exchange.getResponse().setStatusCode(HttpStatus.FOUND);
                    exchange.getResponse().getHeaders().setLocation(URI.create(errorUrl));
                    
                    return exchange.getResponse().setComplete();
                }
            }
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