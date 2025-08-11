package com.vuokraappi.controller;

import com.vuokraappi.model.TenantSearchRequest;
import com.vuokraappi.model.User;
import com.vuokraappi.service.TenantSearchService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users/tenants")
public class TenantsController {

    private final TenantSearchService tenantSearchService;

    public TenantsController(TenantSearchService tenantSearchService) {
        this.tenantSearchService = tenantSearchService;
    }

    @PostMapping("/search")
    public ResponseEntity<List<User>> searchTenants(@RequestBody TenantSearchRequest request) {
        List<User> tenants = tenantSearchService.searchTenants(request);
        return ResponseEntity.ok(tenants);
    }
}
