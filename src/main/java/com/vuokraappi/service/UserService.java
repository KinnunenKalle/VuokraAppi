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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Date;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private LandlordRepository landlordRepository;

    @Autowired
    private ApartmentRepository apartmentRepository;

    // CREATE
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
        String personalIdentityCode = json.has("personalIdentityCode") ? json.get("personalIdentityCode").asText() : null;
        String introduction = json.has("introduction") ? json.get("introduction").asText() : null;
        String role = json.has("role") ? json.get("role").asText().toUpperCase() : null;
        UUID userId = UUID.fromString(userIdStr);
        AtomicReference<Date> dateOfBirthRef = new AtomicReference<>();

        if (json.has("dateOfBirth") && !json.get("dateOfBirth").isNull()) {
            try {
                String dateStr = json.get("dateOfBirth").asText();
                LocalDate localDate = LocalDate.parse(dateStr); // odottaa "yyyy-MM-dd"
                dateOfBirthRef.set(java.sql.Date.valueOf(localDate));
            } catch (DateTimeParseException e) {
//                log.error("Invalid dateOfBirth format: {}", json.get("dateOfBirth").asText(), e);
            }
        }

        Date dateOfBirth = dateOfBirthRef.get();

        AtomicReference<User.Gender> genderRef = new AtomicReference<>();

        if (json.has("gender") && !json.get("gender").isNull()) {
            try {
                String genderStr = json.get("gender").asText();
                genderRef.set(User.Gender.valueOf(genderStr.toUpperCase()));
            } catch (IllegalArgumentException e) {
                //log.warn("Unknown gender value: {}", json.get("gender").asText());
            }
        }

        return userRepository.findById(userId).map(user -> {
            user.setRole(role);
            if (personalIdentityCode != null) user.setPersonalIdentityCode(personalIdentityCode);
            if (dateOfBirth != null) user.setDateOfBirth(dateOfBirth);
            user.setGender(genderRef.get());
            if (introduction != null) user.setIntroduction(introduction);
            switch (role.toUpperCase()) {
                case "TENANT" -> {
                    Tenant tenant = tenantRepository.findById(userId).orElseGet(() -> {
                        Tenant newTenant = new Tenant();
                        newTenant.setId(userId);
                        newTenant.setUser(user);
                        return newTenant;
                    });
                    tenantRepository.save(tenant);
                    user.setTenant(tenant);
                    user.setLandlord(null); // remove other role
                }
                case "LANDLORD" -> {
                    Landlord landlord = landlordRepository.findById(userId).orElseGet(() -> {
                        Landlord newLandlord = new Landlord();
                        newLandlord.setId(userId);
                        newLandlord.setUser(user);
                        return newLandlord;
                    });
                    landlordRepository.save(landlord);
                    user.setLandlord(landlord);
                    user.setTenant(null); // remove other role
                }
            }

            return userRepository.save(user);
        });
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
