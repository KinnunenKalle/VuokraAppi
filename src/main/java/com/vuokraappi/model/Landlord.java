package com.vuokraappi.model;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
public class Landlord {
    @Id
    private UUID id;

    @OneToOne
    @MapsId
    @JoinColumn(name = "id")
    private User user;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
}