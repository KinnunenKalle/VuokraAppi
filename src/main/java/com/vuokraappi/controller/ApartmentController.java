// ApartmentController.java
package com.vuokraappi.controller;

import com.vuokraappi.model.Apartment;
import com.vuokraappi.model.ApartmentSearchRequest;
import com.vuokraappi.model.MultiStatisticsRequest;
import com.vuokraappi.repository.ApartmentRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpHeaders;

import java.util.Map;
import java.util.Objects;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.UUID;
import java.util.Optional;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vuokraappi.service.BlobStorageService;
import com.vuokraappi.service.ApartmentService;

@RestController
@RequestMapping("/apartments")
public class ApartmentController {

    @Autowired
    private ApartmentRepository apartmentRepository;

    @Autowired
    private BlobStorageService blobStorageService;

    @Autowired
    private ApartmentService apartmentService; 

    @GetMapping("/{id}")
    public ResponseEntity<String> readById(@PathVariable String id) {
        UUID uuid;
    	try {
            uuid = UUID.fromString(id);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Virheellinen ID-muoto");
        }

        return apartmentRepository.findById(uuid)
                .map(apartment -> {
                    try {
                        String json = new ObjectMapper().writeValueAsString(apartment);
                        return ResponseEntity.ok(json);
                    } catch (JsonProcessingException e) {
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body("JSON serialization error");
                    }
                })
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("Asuntoa ei löytynyt"));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Apartment>> readByUser(@PathVariable String userId) {
	List<Apartment> apartments = apartmentRepository.findByUserId(UUID.fromString(userId));
	return ResponseEntity.ok(apartments);
    }

    @PostMapping
    public ResponseEntity<Map<String, UUID>> addApartment(@RequestBody Apartment apartment) {
        Apartment savedApartment = apartmentRepository.save(apartment);

        Map<String, UUID> response = Map.of("id", savedApartment.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> updateApartment(@PathVariable String id, @RequestBody Apartment apartmentUpdates) {
        UUID uuid;
        try {
            uuid = UUID.fromString(id);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid UUID format");
        }

        Optional<Apartment> optionalApartment = apartmentRepository.findById(uuid);
        if (optionalApartment.isEmpty()) {
            return ResponseEntity.notFound().build();
        } 

        Apartment existingApartment = optionalApartment.get();

        // Päivitetään vain kentät, jotka ovat ei-tyhjiä (tai ei-nulleja)
        if (apartmentUpdates.getRent() != null) {
            existingApartment.setRent(apartmentUpdates.getRent());
        }
        if (apartmentUpdates.getStreetAddress() != null) {
            existingApartment.setStreetAddress(apartmentUpdates.getStreetAddress());
        }

        Apartment updatedApartment = apartmentRepository.save(existingApartment);
        return ResponseEntity.ok(updatedApartment);
    }

    @GetMapping("/uploadPic")
    public ResponseEntity<Map<String, String>> generateSas(@RequestParam String userId) {
        try {
            String sasUrl = blobStorageService.generateSasUrlForUser(userId);
            return ResponseEntity.ok(Map.of("sasUrl", sasUrl));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "SAS-linkin luonti epäonnistui: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteApartment(@PathVariable String id) {
        UUID apartmentId;
        try {
            apartmentId = UUID.fromString(id);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();  // Palautetaan 400 virhe, jos ID-muoto on huono
        }

        Optional<Apartment> optionalApartment = apartmentRepository.findById(apartmentId);
        if (optionalApartment.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Apartment apartment = optionalApartment.get();
        UUID userId = apartment.getUserId();
        // Poista kuvat blob storage -kontista
        blobStorageService.deleteApartmentBlobs(userId, apartment.getId());

        apartmentRepository.deleteById(apartmentId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/statistics")
    public ResponseEntity<?> getStatistics(@RequestBody MultiStatisticsRequest request) {
        Map<String, String> typeToCode = Map.of(
                "yksiö", "01",
                "kaksio", "02",
                "kolmio", "03"
        );

        // validointi / oletukset
        if (request == null) return ResponseEntity.badRequest().body(Map.of("error", "Request body puuttuu"));
        List<String> reqTypes = request.getTypes() == null || request.getTypes().isEmpty()
                ? List.of("yksiö", "kaksio", "kolmio")
                : request.getTypes();
        List<String> reqPostalCodes = request.getPostalCodes();
        if (reqPostalCodes == null || reqPostalCodes.isEmpty())
            return ResponseEntity.badRequest().body(Map.of("error", "postalCodes puuttuu tai on tyhjä"));

        String url = "https://pxdata.stat.fi:443/PxWeb/api/v1/fi/StatFin/asvu/statfin_asvu_pxt_13eb.px";

        try {
            RestTemplate restTemplate = new RestTemplate();
            ObjectMapper mapper = new ObjectMapper();

            // 1) metadata
            String metaJson = restTemplate.getForObject(url, String.class);
            JsonNode metaRoot = mapper.readTree(metaJson);
            JsonNode variables = metaRoot.path("variables");

            // 2) viimeisin kvarttaali
            List<String> validQuarters = new ArrayList<>();
            for (JsonNode v : variables) {
                if ("Vuosineljännes".equals(v.path("code").asText())) {
                    for (JsonNode x : v.path("values")) validQuarters.add(x.asText());
                    break;
                }
            }
            if (validQuarters.isEmpty())
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Vuosineljännes-arvoja ei löytynyt"));
            String latestQuarter = validQuarters.get(validQuarters.size() - 1);

            // 3) sallitut postinumerot (metadatasta)
            List<String> validPostals = new ArrayList<>();
            for (JsonNode v : variables) {
                if ("Postinumero".equals(v.path("code").asText())) {
                    for (JsonNode x : v.path("values")) validPostals.add(x.asText());
                    break;
                }
            }
            List<String> filteredPostals = reqPostalCodes.stream()
                    .filter(validPostals::contains)
                    .distinct()
                    .toList();
            if (filteredPostals.isEmpty())
                return ResponseEntity.badRequest().body(Map.of("error", "Yhtään annetuista postinumeroista ei löytynyt datasetistä"));

            // 4) käännä pyydetyt tyypit koodeiksi (metadatan Huoneluku on esim. "01","02","03")
            List<String> normalizedTypes = reqTypes.stream()
                    .map(t -> t == null ? null : t.toLowerCase().trim())
                    .filter(Objects::nonNull)
                    .distinct()
                    .toList();

            List<String> requestedRoomCodes = new ArrayList<>();
            List<String> requestedTypeNames = new ArrayList<>();
            List<String> invalidTypes = new ArrayList<>();
            for (String t : normalizedTypes) {
                String code = typeToCode.get(t);
                if (code != null) {
                    requestedRoomCodes.add(code);
                    requestedTypeNames.add(t);
                } else {
                    invalidTypes.add(t);
                }
            }
            if (requestedRoomCodes.isEmpty())
                return ResponseEntity.badRequest().body(Map.of("error", "Yhtään annetuista asuntotyypeistä ei löytynyt datasetistä", "invalidTypes", invalidTypes));

            // 5) tee yksi pyyntö PXWeb:iin kaikilla huoneluvuilla ja postinumeroilla
            Map<String, Object> query = Map.of(
                    "query", List.of(
                            Map.of("code", "Vuosineljännes", "selection", Map.of("filter", "item", "values", List.of(latestQuarter))),
                            Map.of("code", "Postinumero", "selection", Map.of("filter", "item", "values", filteredPostals)),
                            Map.of("code", "Huoneluku", "selection", Map.of("filter", "item", "values", requestedRoomCodes)),
                            Map.of("code", "Tiedot", "selection", Map.of("filter", "item", "values", List.of("keskivuokra")))
                    ),
                    "response", Map.of("format", "json-stat2")
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(query, headers);

            ResponseEntity<String> resp = restTemplate.postForEntity(url, entity, String.class);
            JsonNode root = mapper.readTree(resp.getBody());

            // 6) rakenna järjestetyt avain-taulukot käyttäen category/index -numeroita
            JsonNode postalIndexNode = root.at("/dimension/Postinumero/category/index"); // esim { "00100": 0, "00200": 1, ... }
            JsonNode roomIndexNode = root.at("/dimension/Huoneluku/category/index");     // esim { "01": 0, "02": 1, ... }

            // koot ja dim-id
            JsonNode dimIds = root.path("id");
            JsonNode sizesNode = root.path("size");
            int dims = dimIds.size();
            int[] sizes = new int[dims];
            for (int i = 0; i < dims; i++) sizes[i] = sizesNode.get(i).asInt();

            // etsi dim-positiot
            int postDimPos = -1, roomDimPos = -1;
            for (int i = 0; i < dims; i++) {
                String id = dimIds.get(i).asText();
                if ("Postinumero".equals(id)) postDimPos = i;
                if ("Huoneluku".equals(id)) roomDimPos = i;
            }
            if (postDimPos == -1 || roomDimPos == -1)
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "Dimensionit Postinumero tai Huoneluku puuttuvat vastauksesta"));

            // rakenna järjestetyt avain-taulukot (index -> key)
            int postalSize = sizes[postDimPos];
            String[] postalKeysOrdered = new String[postalSize];
            postalIndexNode.fieldNames().forEachRemaining(key -> {
                int idx = postalIndexNode.path(key).asInt();
                if (idx >= 0 && idx < postalKeysOrdered.length) postalKeysOrdered[idx] = key;
            });

            int roomSize = sizes[roomDimPos];
            String[] roomKeysOrdered = new String[roomSize];
            roomIndexNode.fieldNames().forEachRemaining(key -> {
                int idx = roomIndexNode.path(key).asInt();
                if (idx >= 0 && idx < roomKeysOrdered.length) roomKeysOrdered[idx] = key;
            });

            // 7) valmistele tulosrakenne
            Map<String, Map<String, Double>> results = new LinkedHashMap<>();
            for (String tn : requestedTypeNames) results.put(tn, new LinkedHashMap<>());

            // käännä roomCode -> tyyppinimi (pyydettyihin)
            Map<String, String> roomCodeToTypeName = new HashMap<>();
            for (int i = 0; i < requestedRoomCodes.size(); i++) {
                roomCodeToTypeName.put(requestedRoomCodes.get(i), requestedTypeNames.get(i));
            }

            // 8) lue value-array ja indeksoi oikein
            JsonNode valueArray = root.path("value");
            // laske strides
            long[] strides = new long[dims];
            for (int i = 0; i < dims; i++) {
                long prod = 1;
                for (int j = i + 1; j < dims; j++) prod *= sizes[j];
                strides[i] = prod;
            }

            for (int flat = 0; flat < valueArray.size(); flat++) {
                int[] coords = new int[dims];
                for (int i = 0; i < dims; i++) {
                    if (strides[i] == 0) coords[i] = 0;
                    else coords[i] = (int) ((flat / strides[i]) % sizes[i]);
                }

                int postalCoord = coords[postDimPos];
                int roomCoord = coords[roomDimPos];

                // suodatetaan vain pyydetyt postinumerot
                String postalKey = postalCoord >= 0 && postalCoord < postalKeysOrdered.length ? postalKeysOrdered[postalCoord] : null;
                String roomKey = roomCoord >= 0 && roomCoord < roomKeysOrdered.length ? roomKeysOrdered[roomCoord] : null;
                if (postalKey == null || roomKey == null) continue;
                if (!filteredPostals.contains(postalKey)) continue;

                String typeName = roomCodeToTypeName.get(roomKey);
                if (typeName == null) continue; // emme pyytäneet tätä huonelukua

                JsonNode valNode = valueArray.get(flat);
                Double rent = (valNode == null || valNode.isNull()) ? null : valNode.asDouble();
            
                results.get(typeName).put(postalKey, rent);
            }

            Map<String, Object> responseBody = Map.of("quarter", latestQuarter, "vuokrat", results);
            // lisätään infoa hylätyistä tyypeistä jos sellaisia oli
            if (!invalidTypes.isEmpty()) {
                Map<String, Object> ext = new LinkedHashMap<>(responseBody);
                ext.put("ignoredTypes", invalidTypes);
                return ResponseEntity.ok(ext);
            }
            return ResponseEntity.ok(responseBody);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Tietojen haku epäonnistui: " + e.getMessage()));
        }
    }

    @PostMapping("/search")
    public ResponseEntity<List<Apartment>> searchApartments(@RequestBody ApartmentSearchRequest request) {
        List<Apartment> results = apartmentService.searchApartments(request);
        return ResponseEntity.ok(results);
    }
} 
