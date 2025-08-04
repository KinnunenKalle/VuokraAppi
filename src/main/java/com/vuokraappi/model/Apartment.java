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
    private Integer size;

    @Column
    private Double longitude;

    @Column
    private Double latitude;


    private Double rent;

    @Column(name = "user_id")
    private UUID userId;

    public Apartment() {}

    public Apartment(UUID id, String streetAddress, String zipcode, String city, String region, Integer size, Double rent, Double longitude, Double latitude) {
        this.id = id;
        this.streetAddress = streetAddress;
        this.zipcode = zipcode;
        this.city = city;
        this.region = region;
        this.size = size;
        this.rent = rent;
        this.longitude = longitude;
        this.latitude = latitude;
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

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
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

    public Integer getSize() {
        return size;
    }

    public void setSize(Integer size) {
        this.size = size;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }
}