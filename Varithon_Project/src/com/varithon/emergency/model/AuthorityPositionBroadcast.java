package com.varithon.emergency.model;

public class AuthorityPositionBroadcast {
    private String broadcastId;
    private long timestamp;
    private String authority;
    private String department;
    private double latitude;
    private double longitude;
    private double crowdRadiusMeters;
    private String sector;
    private boolean isDiversionActive;
    private String blockedRoad;
    private String alternateRoute;
    private String priority;
    private String instructions;

    public AuthorityPositionBroadcast() {}

    public String getBroadcastId() { return broadcastId; }
    public void setBroadcastId(String broadcastId) { this.broadcastId = broadcastId; }

    public long getTimestamp() { return timestamp; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }

    public String getAuthority() { return authority; }
    public void setAuthority(String authority) { this.authority = authority; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public double getLatitude() { return latitude; }
    public void setLatitude(double latitude) { this.latitude = latitude; }

    public double getLongitude() { return longitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }

    public double getCrowdRadiusMeters() { return crowdRadiusMeters; }
    public void setCrowdRadiusMeters(double crowdRadiusMeters) { this.crowdRadiusMeters = crowdRadiusMeters; }

    public String getSector() { return sector; }
    public void setSector(String sector) { this.sector = sector; }

    public boolean isDiversionActive() { return isDiversionActive; }
    public void setDiversionActive(boolean diversionActive) { isDiversionActive = diversionActive; }

    public String getBlockedRoad() { return blockedRoad; }
    public void setBlockedRoad(String blockedRoad) { this.blockedRoad = blockedRoad; }

    public String getAlternateRoute() { return alternateRoute; }
    public void setAlternateRoute(String alternateRoute) { this.alternateRoute = alternateRoute; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }
}
