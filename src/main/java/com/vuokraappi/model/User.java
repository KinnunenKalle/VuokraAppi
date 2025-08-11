package com.vuokraappi.model;

import jakarta.persistence.*;
import java.util.UUID;
import java.util.Date;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "[user]")
public class User {
    @Id
    private UUID id; // Sama kuin Azure AD:n userId

    private String role; // "TENANT" tai "LANDLORD"

    private String personalIdentityCode;

    private Date dateOfBirth;

    public enum Gender {MALE, FEMALE, OTHER};

    private Gender gender;

    @Column(length = 2000)
    private String introduction;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    @JsonIgnore
    private Tenant tenant;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    @JsonIgnore
    private Landlord landlord;

    // Getterit ja setterit
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public Tenant getTenant() { return tenant; }
    public void setTenant(Tenant tenant) { this.tenant = tenant; }

    public Landlord getLandlord() { return landlord; }
    public void setLandlord(Landlord landlord) { this.landlord = landlord; }

    public String getPersonalIdentityCode() { return personalIdentityCode; }
    public void getPersonalIdentityCode(String personalIdentityCode) { this.personalIdentityCode = personalIdentityCode; }

    public Date getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(Date dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public Gender getGender() { return gender; }
    public void setGender(Gender gender) {this.gender = gender;}

    public String getIntroduction() { return introduction; }
    public void setIntroduction(String introduction) { this.introduction = introduction; }
}