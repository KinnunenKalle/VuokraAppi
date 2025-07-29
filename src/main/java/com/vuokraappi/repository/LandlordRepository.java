package com.vuokraappi.repository;

import com.vuokraappi.model.Landlord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface LandlordRepository extends JpaRepository<Landlord, UUID> {
    // Voit lisätä tarvittaessa custom-hakuja, esim.
    // Optional<Landlord> findByCompanyName(String name);
}
