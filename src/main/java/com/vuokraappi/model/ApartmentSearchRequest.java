package com.vuokraappi.model;

public class ApartmentSearchRequest {
    private String city;
    private String postalCode;
    private String streetAddress;

    private Double minLat;
    private Double maxLat;
    private Double minLon;
    private Double maxLon;

    // Getters & setters
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getPostalCode() { return postalCode; }
    public void setPostalCode(String postalCode) { this.postalCode = postalCode; }

    public String getStreetAddress() { return streetAddress; }
    public void setStreetAddress(String streetAddress) { this.streetAddress = streetAddress; }

    public Double getMinLat() { return minLat; }
    public void setMinLat(Double minLat) { this.minLat = minLat; }

    public Double getMaxLat() { return maxLat; }
    public void setMaxLat(Double maxLat) { this.maxLat = maxLat; }

    public Double getMinLon() { return minLon; }
    public void setMinLon(Double minLon) { this.minLon = minLon; }

    public Double getMaxLon() { return maxLon; }
    public void setMaxLon(Double maxLon) { this.maxLon = maxLon; }
}