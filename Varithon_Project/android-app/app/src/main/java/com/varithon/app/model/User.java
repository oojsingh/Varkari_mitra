package com.varithon.app.model;

public class User {
    private String id;
    private String email;
    private String name;
    private String role;
    private String kycStatus;
    private boolean locationSharing;

    public User() {}

    public User(String id, String email, String name, String role, String kycStatus, boolean locationSharing) {
        this.id = id;
        this.email = email;
        this.name = name;
        this.role = role;
        this.kycStatus = kycStatus;
        this.locationSharing = locationSharing;
    }

    public String getId() { return id; }
    public String getEmail() { return email; }
    public String getName() { return name; }
    public String getRole() { return role; }
    public String getKycStatus() { return kycStatus; }
    public boolean isLocationSharing() { return locationSharing; }

    public void setId(String id) { this.id = id; }
    public void setEmail(String email) { this.email = email; }
    public void setName(String name) { this.name = name; }
    public void setRole(String role) { this.role = role; }
    public void setKycStatus(String kycStatus) { this.kycStatus = kycStatus; }
    public void setLocationSharing(boolean locationSharing) { this.locationSharing = locationSharing; }
}
