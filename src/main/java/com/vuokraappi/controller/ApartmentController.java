// ApartmentController.java
package com.vuokraappi.controller;

import com.vuokraappi.model.Apartment;
import com.vuokraappi.repository.ApartmentRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RestController;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.UUID;
import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/apartments")
public class ApartmentController {

    @Autowired
    private ApartmentRepository apartmentRepository;

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
    public ResponseEntity<String> addApartment(@RequestBody Apartment apartment) {
        apartmentRepository.save(apartment);
        return ResponseEntity.status(HttpStatus.CREATED).body("Asunto tallennettu onnistuneesti");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteApartment(@PathVariable String id) {
        UUID uuid;
        try {
            uuid = UUID.fromString(id);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();  // Palautetaan 400 virhe, jos ID-muoto on huono
        }

        if (!apartmentRepository.existsById(uuid)) {
            return ResponseEntity.notFound().build();
        }
        apartmentRepository.deleteById(uuid);
        return ResponseEntity.noContent().build();
    }

}
