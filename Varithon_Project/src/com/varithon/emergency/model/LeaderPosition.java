package com.varithon.emergency.model;

import jakarta.persistence.*;

@Entity
@Table(name = "leader_positions")
public class LeaderPosition {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String role;

    @Column(nullable = false)
    private double latitude;

    @Column(nullable = false)
    private double longitude;

    @Column(nullable = false)
    private long timestamp;

    public LeaderPosition() {}

    public LeaderPosition(String role, double latitude, double longitude, long timestamp) {
        this.role = role;
        this.latitude = latitude;
        this.longitude = longitude;
        this.timestamp = timestamp;
    }

    public String getId() { return id; }
    public String getRole() { return role; }
    public double getLatitude() { return latitude; }
    public double getLongitude() { return longitude; }
    public long getTimestamp() { return timestamp; }

    public void setId(String id) { this.id = id; }
    public void setRole(String role) { this.role = role; }
    public void setLatitude(double latitude) { this.latitude = latitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
}
