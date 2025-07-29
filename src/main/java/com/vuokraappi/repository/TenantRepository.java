package com.vuokraappi.repository;

import com.vuokraappi.model.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface TenantRepository extends JpaRepository<Tenant, UUID> {
    // Voit lisätä tarvittaessa custom-hakuja, esim.
    // Optional<Tenant> findByPreferencesContaining(String keyword);
}
