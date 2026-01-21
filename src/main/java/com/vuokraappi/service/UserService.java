package com.vuokraappi.service;

import com.vuokraappi.model.User;
import com.vuokraappi.model.Tenant;
import com.vuokraappi.model.Landlord;
import com.fasterxml.jackson.databind.JsonNode;
import com.vuokraappi.model.Apartment;
import com.vuokraappi.repository.UserRepository;
import com.vuokraappi.repository.TenantRepository;
import com.vuokraappi.repository.LandlordRepository;
import com.vuokraappi.repository.ApartmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;
import java.util.List;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;

@Service
public class UserService {

    private UserRepository userRepository;
    private TenantRepository tenantRepository;
    private LandlordRepository landlordRepository;
    private ApartmentRepository apartmentRepository;
    private final ObjectMapper objectMapper;

    // Constructor injection
    public UserService(
        UserRepository userRepository,
        TenantRepository tenantRepository,
        LandlordRepository landlordRepository,
        ObjectMapper objectMapper  // Lisää tämä
    ) {
        this.userRepository = userRepository;
        this.tenantRepository = tenantRepository;
        this.landlordRepository = landlordRepository;
        this.objectMapper = objectMapper;  // Lisää tämä
    }

    @Transactional
    public User provisionUser(UUID id, String role) {
        if (userRepository.existsById(id)) {
            return userRepository.findById(id).orElse(null);
        }

        User user = new User();
        user.setId(id);
        user.setRole(role);

        switch (role.toUpperCase()) {
            case "TENANT" -> {
                Tenant tenant = new Tenant();
                tenant.setUser(user);
                user.setTenant(tenant);
                userRepository.save(user);
           }
            case "LANDLORD" -> {
                Landlord landlord = new Landlord();
                landlord.setUser(user);
                user.setLandlord(landlord);
                userRepository.save(user);            
            }
        }

        return user;
    }

    // READ
    public Optional<User> getUser(UUID id) {
        return userRepository.findById(id);
    }

    // UPDATE
    public Optional<User> updateUser(JsonNode json) {
        String userIdStr = json.has("id") ? json.get("id").asText() : null;
        UUID userId = UUID.fromString(userIdStr);
        String role = json.has("role") ? json.get("role").asText().toUpperCase() : null;

        return userRepository.findById(userId).map(user -> {
            try {
            // Päivitä kaikki kentät automaattisesti
                objectMapper.readerForUpdating(user).readValue(json);
            
                // Käsittele rooli erikseen
                if (role != null) {
                    user.setRole(role);
                    handleRoleUpdate(user, role);
                }
            
                return userRepository.save(user);
            } catch (IOException e) {
                throw new RuntimeException("Failed to update user", e);
            }
        });
    }

    private void handleRoleUpdate(User user, String role) {
        switch (role.toUpperCase()) {
            case "TENANT" -> {
                Tenant tenant = tenantRepository.findById(user.getId()).orElseGet(() -> {
                    Tenant newTenant = new Tenant();
                    newTenant.setId(user.getId());
                    newTenant.setUser(user);
                    return newTenant;
                });
                tenantRepository.save(tenant);
                user.setTenant(tenant);
                user.setLandlord(null);
            }
            case "LANDLORD" -> {
                Landlord landlord = landlordRepository.findById(user.getId()).orElseGet(() -> {
                    Landlord newLandlord = new Landlord();
                    newLandlord.setId(user.getId());
                    newLandlord.setUser(user);
                    return newLandlord;
                });
                landlordRepository.save(landlord);
                user.setLandlord(landlord);
                user.setTenant(null);
            }
        }
    }

    // DELETE
    public boolean deleteUser(UUID id) {
        if (!userRepository.existsById(id)) return false;

        // Poista roolispesifiset tiedot
        tenantRepository.findById(id).ifPresent(tenantRepository::delete);
        landlordRepository.findById(id).ifPresent(landlordRepository::delete);
        List<Apartment> apartments = apartmentRepository.findByUserId(id);
        apartmentRepository.deleteAll(apartments);

        userRepository.deleteById(id);
        return true;
    }
}
