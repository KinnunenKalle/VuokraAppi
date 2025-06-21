package com.vuokraappi.controller;

import com.vuokraappi.config.OAuth2TokenManager;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Enumeration;
import java.util.List;

@RestController
@RequestMapping("/graph")
public class GraphProxyController {

    @Autowired
    private OAuth2TokenManager tokenManager;

    @Autowired
    private WebClient webClient;

    @RequestMapping("/**")
    public Mono<ResponseEntity<String>> proxy(HttpMethod method,
                                              HttpServletRequest requestEntity) throws IOException {

        String requestPath = requestEntity.getRequestURI().replaceFirst("/graph", "");
        String query = requestEntity.getQueryString();
        String fullUrl = "https://graph.microsoft.com/v1.0" + requestPath + (query != null ? "?" + query : "");

        byte[] requestBody = StreamUtils.copyToByteArray(requestEntity.getInputStream());
        String body = new String(requestBody, StandardCharsets.UTF_8);

        HttpHeaders headers = new HttpHeaders();
        Enumeration<String> headerNames = requestEntity.getHeaderNames();
        while (headerNames.hasMoreElements()) {
            String headerName = headerNames.nextElement();
            if (!headerName.equalsIgnoreCase("host") &&
                !headerName.equalsIgnoreCase("authorization")) {
		headers.addAll(headerName, java.util.Collections.list(requestEntity.getHeaders(headerName)));
            }
        }

        return tokenManager.getAccessToken().flatMap(token -> {
            headers.setBearerAuth(token);

            WebClient.RequestBodySpec spec = webClient
                    .method(method)
                    .uri(fullUrl)
                    .headers(httpHeaders -> httpHeaders.addAll(headers));

            WebClient.RequestHeadersSpec<?> requestSpec =
                    method == HttpMethod.GET || method == HttpMethod.DELETE
                            ? spec
                            : spec.body(BodyInserters.fromValue(body));

            return requestSpec
                    .retrieve()
                    .toEntity(String.class);
        });
    }
}

