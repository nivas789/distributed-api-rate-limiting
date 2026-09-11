package com.rateguard.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "api_keys")
public class ApiKey {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String keyName; // e.g. "Prod-Key-01"

    @Column(nullable = false, unique = true)
    private String keyValue; // e.g. "rg_live_9f81a7b2c3d4e5f6"

    @Column(nullable = false)
    private int rateLimit; // e.g. 5 requests per minute

    @Column(nullable = false)
    private boolean active = true;

    private LocalDateTime createdAt;

    // FetchType.LAZY prevents loading the whole User object when retrieving a key
    // JsonIgnore avoids infinite loops when serializing API Keys to JSON
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Default Constructor (required by JPA/Hibernate)
    public ApiKey() {}

    // Parametrized Constructor
    public ApiKey(String keyName, String keyValue, int rateLimit, User user) {
        this.keyName = keyName;
        this.keyValue = keyValue;
        this.rateLimit = rateLimit;
        this.user = user;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getKeyName() {
        return keyName;
    }

    public void setKeyName(String keyName) {
        this.keyName = keyName;
    }

    public String getKeyValue() {
        return keyValue;
    }

    public void setKeyValue(String keyValue) {
        this.keyValue = keyValue;
    }

    public int getRateLimit() {
        return rateLimit;
    }

    public void setRateLimit(int rateLimit) {
        this.rateLimit = rateLimit;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}
