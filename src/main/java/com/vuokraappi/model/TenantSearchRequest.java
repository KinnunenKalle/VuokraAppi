package com.vuokraappi.model;

public class TenantSearchRequest {
    private Integer minAge;
    private Integer maxAge;
    private String gender; // esim. "male", "female", "other"
    private Boolean hasPets;

    public Integer getMinAge() { return minAge; }
    public void setMinAge(Integer minAge) { this.minAge = minAge; }

    public Integer getMaxAge() { return maxAge; }
    public void setMaxAge(Integer maxAge) { this.maxAge = maxAge; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public Boolean getHasPets() { return hasPets; }
    public void setHasPets(Boolean hasPets) { this.hasPets = hasPets; }
}
