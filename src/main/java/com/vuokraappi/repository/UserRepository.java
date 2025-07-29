package com.vuokraappi.repository;

import com.vuokraappi.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    // Esimerkiksi lisähaku roolin mukaan:
    // List<User> findByRole(String role);
}
