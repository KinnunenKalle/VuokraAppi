// Apartment.java
package com.vuokraappi.model;

import jakarta.persistence.*;
//import jakarta.persistence.Id;
//import jakarta.persistence.GeneratedValue;
//import jakarta.persistence.GenerationType;
import java.util.UUID;

@Entity
public class Apartment {

    @Id
    @GeneratedValue
    private UUID id;
    private String address;
    private Double rent;
    @Column(name = "user_id")
    private UUID userId;

    public Apartment() {}

    public Apartment(UUID id, String address, double rent) {
        this.id = id;
        this.address = address;
        this.rent = rent;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public Double getRent() {
        return rent;
    }

    public void setRent(Double rent) {
        this.rent = rent;
    }

    public UUID getuserId() {
        return userId;
    }

    public void setuserId(UUID userId) {
        this.userId = userId;
    }
}

