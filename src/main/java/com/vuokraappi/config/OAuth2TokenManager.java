package com.vuokraappi.config;

import org.springframework.security.oauth2.client.AuthorizedClientServiceOAuth2AuthorizedClientManager;
import org.springframework.security.oauth2.client.OAuth2AuthorizeRequest;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientManager;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientProvider;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientProviderBuilder;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
public class OAuth2TokenManager {

    private final OAuth2AuthorizedClientManager authorizedClientManager;

    public OAuth2TokenManager(ClientRegistrationRepository clientRegistrationRepository,
                              OAuth2AuthorizedClientService authorizedClientService) {

        OAuth2AuthorizedClientProvider authorizedClientProvider =
                OAuth2AuthorizedClientProviderBuilder.builder()
                        .clientCredentials()
                        .build();

        AuthorizedClientServiceOAuth2AuthorizedClientManager manager =
                new AuthorizedClientServiceOAuth2AuthorizedClientManager(
                        clientRegistrationRepository, authorizedClientService);

        manager.setAuthorizedClientProvider(authorizedClientProvider);
        this.authorizedClientManager = manager;
    }

    public Mono<String> getAccessToken() {
        OAuth2AuthorizeRequest authorizeRequest = OAuth2AuthorizeRequest
                .withClientRegistrationId("graph")  // Tämä viittaa application.properties:ssa määriteltyyn clientiin
                .principal("graph-client")          // client_credentials flow: ei oikeaa käyttäjää
                .build();

        // Käytetään reaktiivista authorization manageria
        return Mono.fromCallable(() -> {
            OAuth2AuthorizedClient authorizedClient =
                    authorizedClientManager.authorize(authorizeRequest);

            if (authorizedClient == null) {
                throw new IllegalStateException("Could not authorize client");
            }

            return authorizedClient.getAccessToken().getTokenValue();
        });
    }

}

