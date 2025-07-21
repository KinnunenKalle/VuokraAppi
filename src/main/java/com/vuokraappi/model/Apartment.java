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

    @Column(name = "street_address")
    private String streetAddress;

    @Column
    private String zipcode;

    @Column
    private String city;

    @Column
    private String region;

    @Column
    private int size;


    private Double rent;

    @Column(name = "user_id")
    private UUID userId;

    public Apartment() {}

    public Apartment(UUID id, String streetAddress, String zipcode, String city, String region, int size, double rent) {
        this.id = id;
        this.streetAddress = streetAddress;
        this.zipcode = zipcode;
        this.city = city;
        this.region = region;
        this.size = size;
        this.rent = rent;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getStreetAddress() {
        return streetAddress;
    }

    public void setStreetAddress(String streetAddress) {
        this.streetAddress = streetAddress;
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

     public String getZipcode() {
        return zipcode;
    }

    public void setZipcode(String zipcode) {
        this.zipcode = zipcode;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }

    public int getSize() {
        return size;
    }

    public void setSize(int size) {
        this.size = size;
    }
}

