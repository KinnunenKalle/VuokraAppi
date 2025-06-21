// ApartmentRepository.java
package com.vuokraappi.repository;

import com.vuokraappi.model.Apartment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface ApartmentRepository extends JpaRepository<Apartment, UUID> {
	List<Apartment> findByUserId(UUID userId);
}
