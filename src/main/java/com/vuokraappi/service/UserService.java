package com.vuokraappi.service;

import com.vuokraappi.model.User;
import com.vuokraappi.model.Tenant;
import com.vuokraappi.model.Landlord;
import com.vuokraappi.repository.UserRepository;
import com.vuokraappi.repository.TenantRepository;
import com.vuokraappi.repository.LandlordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private LandlordRepository landlordRepository;

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
    public Optional<User> updateUser(UUID id, String role) {
        return userRepository.findById(id).map(user -> {
            user.setRole(role);

            switch (role.toUpperCase()) {
                case "TENANT" -> {
                    Tenant tenant = tenantRepository.findById(id).orElseGet(() -> {
                        Tenant newTenant = new Tenant();
                        newTenant.setId(id);
                        newTenant.setUser(user);
                        return newTenant;
                    });
                    tenantRepository.save(tenant);
                    user.setTenant(tenant);
                    user.setLandlord(null); // remove other role
                }
                case "LANDLORD" -> {
                    Landlord landlord = landlordRepository.findById(id).orElseGet(() -> {
                        Landlord newLandlord = new Landlord();
                        newLandlord.setId(id);
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

        userRepository.deleteById(id);
        return true;
    }
}
