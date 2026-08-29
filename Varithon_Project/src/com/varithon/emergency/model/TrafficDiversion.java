package com.varithon.emergency.model;

import java.util.List;

public class TrafficDiversion {
    private String id;
    private String sectorName;
    private double latitude;
    private double longitude;
    private double radiusKm;
    private String blockedRoadName;
    private String diversionRouteName;
    private List<String> policeCheckpoints;
    private int estimatedDelayMinutes;
    private String vehicleRestrictions;
    private String advisoryNote;
    private boolean isActive;

    public TrafficDiversion() {}

    public TrafficDiversion(String id, String sectorName, double latitude, double longitude, double radiusKm,
                            String blockedRoadName, String diversionRouteName, List<String> policeCheckpoints,
                            int estimatedDelayMinutes, String vehicleRestrictions, String advisoryNote, boolean isActive) {
        this.id = id;
        this.sectorName = sectorName;
        this.latitude = latitude;
        this.longitude = longitude;
        this.radiusKm = radiusKm;
        this.blockedRoadName = blockedRoadName;
        this.diversionRouteName = diversionRouteName;
        this.policeCheckpoints = policeCheckpoints;
        this.estimatedDelayMinutes = estimatedDelayMinutes;
        this.vehicleRestrictions = vehicleRestrictions;
        this.advisoryNote = advisoryNote;
        this.isActive = isActive;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getSectorName() { return sectorName; }
    public void setSectorName(String sectorName) { this.sectorName = sectorName; }

    public double getLatitude() { return latitude; }
    public void setLatitude(double latitude) { this.latitude = latitude; }

    public double getLongitude() { return longitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }

    public double getRadiusKm() { return radiusKm; }
    public void setRadiusKm(double radiusKm) { this.radiusKm = radiusKm; }

    public String getBlockedRoadName() { return blockedRoadName; }
    public void setBlockedRoadName(String blockedRoadName) { this.blockedRoadName = blockedRoadName; }

    public String getDiversionRouteName() { return diversionRouteName; }
    public void setDiversionRouteName(String diversionRouteName) { this.diversionRouteName = diversionRouteName; }

    public List<String> getPoliceCheckpoints() { return policeCheckpoints; }
    public void setPoliceCheckpoints(List<String> policeCheckpoints) { this.policeCheckpoints = policeCheckpoints; }

    public int getEstimatedDelayMinutes() { return estimatedDelayMinutes; }
    public void setEstimatedDelayMinutes(int estimatedDelayMinutes) { this.estimatedDelayMinutes = estimatedDelayMinutes; }

    public String getVehicleRestrictions() { return vehicleRestrictions; }
    public void setVehicleRestrictions(String vehicleRestrictions) { this.vehicleRestrictions = vehicleRestrictions; }

    public String getAdvisoryNote() { return advisoryNote; }
    public void setAdvisoryNote(String advisoryNote) { this.advisoryNote = advisoryNote; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
}
