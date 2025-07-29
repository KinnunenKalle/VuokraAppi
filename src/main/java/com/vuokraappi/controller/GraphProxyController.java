package com.vuokraappi.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.List;
import com.vuokraappi.config.OAuth2TokenManager;
import com.vuokraappi.model.User;
import com.vuokraappi.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.http.server.reactive.ServerHttpRequest;
import reactor.core.publisher.Mono;

import java.util.UUID;

@RestController
@RequestMapping("/graph")
public class GraphProxyController {

    @Autowired
    private OAuth2TokenManager tokenManager;

    @Autowired
    private WebClient webClient;

    @Autowired
    private UserService userService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @RequestMapping("/**")
    public Mono<ResponseEntity<String>> proxy(
            ServerHttpRequest request,
            @RequestBody(required = false) String body
    ) {

        String requestPath = request.getURI().getPath().replaceFirst("/graph", "");
        String query = request.getURI().getQuery();
        String fullUrl = "https://graph.microsoft.com/v1.0" + requestPath + (query != null ? "?" + query : "");

        HttpHeaders headers = new HttpHeaders();
        request.getHeaders().forEach((headerName, values) -> {
            if (!headerName.equalsIgnoreCase("host") && !headerName.equalsIgnoreCase("authorization")) {
                headers.addAll(headerName, values);
            }
        });

        HttpMethod method = request.getMethod();

        return tokenManager.getAccessToken().flatMap(initialToken  -> {
            headers.setBearerAuth(initialToken);

            String filteredBody = body;
            if (method == HttpMethod.POST) {
                try {
                    JsonNode json = objectMapper.readTree(body);
                    String userIdStr = json.has("id") ? json.get("id").asText() : null;
                    String role = json.has("role") ? json.get("role").asText().toUpperCase() : null;

                    if (userIdStr == null || userIdStr.isBlank()) {
                        return Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Käyttäjän tallennus epäonnistui, id:tä ei löydy"));
                    }
                    UUID userId = UUID.fromString(userIdStr);
                    userService.provisionUser(userId, role);

                    // Roolin asetus Entraan
                    return tokenManager.getAccessToken().flatMap(newToken -> {
                        String appRoleId;
                        switch (role) {
                            case "TENANT" -> appRoleId = "1cf794e6-77a1-44c5-bc9e-e6b690713740";
                            case "LANDLORD" -> appRoleId = "53fc7f95-4883-4883-af70-375270557682";
                            default -> {
                                return Mono.just(ResponseEntity.badRequest()
                                    .body("Tuntematon rooli: " + role));
                            }
                        }

                        String resourceId = "527e1349-11e8-45e2-b038-f461d1626275";
                        String roleAssignmentUrl = "https://graph.microsoft.com/v1.0/users/" + userId + "/appRoleAssignments";

                        ObjectNode roleRequest = objectMapper.createObjectNode();
                        roleRequest.put("principalId", userId.toString());
                        roleRequest.put("resourceId", resourceId);
                        roleRequest.put("appRoleId", appRoleId);

                        return webClient.post()
                            .uri(roleAssignmentUrl)
                            .headers(h -> h.setBearerAuth(newToken))
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(roleRequest)
                            .retrieve()
                            .toBodilessEntity()
                            .map(resp -> ResponseEntity.status(HttpStatus.NO_CONTENT).body("Rooli asetettu"))
                            .onErrorResume(error -> {
                                error.printStackTrace();
                                return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                        .body("Virhe Entra-roolin asettamisessa: " + error.getMessage()));
                            });

                    });
                } catch (Exception e) {
                    e.printStackTrace();
                    System.err.println("Käyttäjän tallennus epäonnistui: " + e.getMessage());
                    return Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Käyttäjän tallennus epäonnistui"));
                }

            // Estetään Graph API -kutsu POSTilla, mutta palautetaan silti ok vastaus
            //return Mono.just(ResponseEntity.status(HttpStatus.NO_CONTENT).body("Käyttäjä tallennettu"));
            }
    
            WebClient.RequestBodySpec spec = webClient
                    .method(method)
                    .uri(fullUrl)
                    .headers(httpHeaders -> httpHeaders.addAll(headers));

            // Poistetaan sovelluskohtaiset parametrit PATCH pyynnöistä, ne eivät kelpaa graph apiin
            if (method == HttpMethod.PATCH){
                try{
                    JsonNode root = objectMapper.readTree(body);
                    ((ObjectNode) root).remove(List.of("role"));
                    filteredBody = objectMapper.writeValueAsString(root);
                } catch (Exception e) {
                    return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body("{\"error\":\"Virhe sovellusparametrien poistossa\"}"));
                }
            }

            WebClient.RequestHeadersSpec<?> requestSpec =
                    method == HttpMethod.GET || method == HttpMethod.DELETE
                            ? spec
                            : spec.body(BodyInserters.fromValue(filteredBody  != null ? filteredBody : ""));

            return requestSpec
                    .retrieve()
                    .toEntity(String.class)
                    .flatMap(response -> {
                        try {
                            if (method == HttpMethod.GET) {
                                String[] parts = requestPath.split("/");
                                if (parts.length >= 3) {
                                    UUID userId = UUID.fromString(parts[2]);
                                    User user = userService.getUser(userId).orElse(null);
                                    if (user == null) {
                                        return Mono.just(ResponseEntity.notFound().build());
                                    }
                                    String userJson = objectMapper.writeValueAsString(user);

                                    ObjectMapper mapper = new ObjectMapper();
                                    JsonNode graphJson = mapper.readTree(response.getBody());
                                    JsonNode localJson = mapper.readTree(userJson);

                                    ObjectNode combined = mapper.createObjectNode();
                                    graphJson.fields().forEachRemaining(entry -> combined.set(entry.getKey(), entry.getValue()));

                                    // Lisää localJsonin kentät, jos eivät ole jo olemassa
                                    localJson.fields().forEachRemaining(entry -> {
                                        if (!combined.has(entry.getKey())) {
                                            combined.set(entry.getKey(), entry.getValue());
                                        }
                                    });
                                    HttpHeaders responseHeaders = new HttpHeaders();
                                    responseHeaders.setContentType(MediaType.APPLICATION_JSON);
                                    return Mono.just(ResponseEntity.ok().headers(responseHeaders).body(combined.toString()));
                                }
                            } else if (method == HttpMethod.PATCH) {
                                    JsonNode json = objectMapper.readTree(body != null ? body : "{}");
                                    String userIdStr = json.has("id") ? json.get("id").asText() : null;
                                    String role = json.has("role") ? json.get("role").asText().toUpperCase() : null;
                                    if (userIdStr != null && !userIdStr.isBlank()) {
                                        UUID userId = UUID.fromString(userIdStr);
                                        userService.updateUser(userId, role);
                                    }
                            } else if (method == HttpMethod.DELETE) {
                                String[] parts = requestPath.split("/");
                                if (parts.length >= 3) {
                                    UUID userId = UUID.fromString(parts[2]);
                                    userService.deleteUser(userId);
                                }
                            }
                            return Mono.just(response);
                        } catch (Exception e) {
                            e.printStackTrace();
                            return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                    .body("{\"error\":\"JSON processing failed\"}"));
                        }
                    });
        });
    }
}