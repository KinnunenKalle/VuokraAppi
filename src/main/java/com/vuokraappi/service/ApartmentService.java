package com.vuokraappi.service;
import java.util.List;
import java.util.ArrayList;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import com.vuokraappi.model.Apartment;
import com.vuokraappi.model.ApartmentSearchRequest;

@Service
public class ApartmentService {

    @PersistenceContext
    private EntityManager em;

    public List<Apartment> searchApartments(ApartmentSearchRequest request) {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery<Apartment> cq = cb.createQuery(Apartment.class);
        Root<Apartment> root = cq.from(Apartment.class);

        List<Predicate> predicates = new ArrayList<>();

        // Koordinaattihaku
        if (request.getMinLat() != null && request.getMaxLat() != null &&
            request.getMinLon() != null && request.getMaxLon() != null) {
            predicates.add(cb.between(root.get("latitude"), request.getMinLat(), request.getMaxLat()));
            predicates.add(cb.between(root.get("longitude"), request.getMinLon(), request.getMaxLon()));
        } 
        // Tekstiparametrihaku
        else {
            if (request.getCity() != null && !request.getCity().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("city")), "%" + request.getCity().toLowerCase() + "%"));
            }
            if (request.getPostalCode() != null && !request.getPostalCode().isEmpty()) {
                predicates.add(cb.equal(root.get("postalCode"), request.getPostalCode()));
            }
            if (request.getStreetAddress() != null && !request.getStreetAddress().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("streetAddress")), "%" + request.getStreetAddress().toLowerCase() + "%"));
            }
        }

        cq.where(predicates.toArray(new Predicate[0]));
        return em.createQuery(cq).getResultList();
    }
}
