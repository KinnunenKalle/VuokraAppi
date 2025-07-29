package com.vuokraappi.config;

import org.springframework.security.oauth2.client.*;
import org.springframework.security.oauth2.client.registration.ReactiveClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.reactive.function.client.ServerOAuth2AuthorizedClientExchangeFilterFunction;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
public class OAuth2TokenManager {

    private final ReactiveOAuth2AuthorizedClientManager authorizedClientManager;

    public OAuth2TokenManager(ReactiveClientRegistrationRepository clientRegistrationRepository,
                              ReactiveOAuth2AuthorizedClientService authorizedClientService) {

        ReactiveOAuth2AuthorizedClientProvider authorizedClientProvider =
                ReactiveOAuth2AuthorizedClientProviderBuilder.builder()
                        .clientCredentials()
                        .build();

        AuthorizedClientServiceReactiveOAuth2AuthorizedClientManager manager =
                new AuthorizedClientServiceReactiveOAuth2AuthorizedClientManager(
                        clientRegistrationRepository, authorizedClientService);

        manager.setAuthorizedClientProvider(authorizedClientProvider);
        this.authorizedClientManager = manager;
    }

    public Mono<String> getAccessToken() {
        OAuth2AuthorizeRequest authorizeRequest = OAuth2AuthorizeRequest
                .withClientRegistrationId("graph")
                .principal("graph-client")
                .build();

        return authorizedClientManager.authorize(authorizeRequest)
                .map(client -> client.getAccessToken().getTokenValue());
    }
}