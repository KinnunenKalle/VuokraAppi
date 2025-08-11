package com.vuokraappi.service;

import com.vuokraappi.model.TenantSearchRequest;
import com.vuokraappi.model.User;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class TenantSearchService {

    @PersistenceContext
    private EntityManager entityManager;

    public List<User> searchTenants(TenantSearchRequest request) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<User> cq = cb.createQuery(User.class);
        Root<User> root = cq.from(User.class);

        List<Predicate> predicates = new ArrayList<>();

        // Ikäraja
        if (request.getMinAge() != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get("age"), request.getMinAge()));
        }
        if (request.getMaxAge() != null) {
            predicates.add(cb.lessThanOrEqualTo(root.get("age"), request.getMaxAge()));
        }

        // Sukupuoli
        if (request.getGender() != null && !request.getGender().isBlank()) {
            try {
                User.Gender genderEnum = User.Gender.valueOf(request.getGender().toUpperCase());
                predicates.add(cb.equal(root.get("gender"), genderEnum));
            } catch (IllegalArgumentException e) {
            // Jos hakuehdon arvo ei vastaa mitään enum-arvoa, ei lisätä ehtoa
            }
        }

        // Lemmikit
        if (request.getHasPets() != null) {
            predicates.add(cb.equal(root.get("hasPets"), request.getHasPets()));
        }

        cq.where(predicates.toArray(new Predicate[0]));

        return entityManager.createQuery(cq).getResultList();
    }
}
