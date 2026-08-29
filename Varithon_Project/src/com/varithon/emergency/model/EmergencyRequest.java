package com.varithon.emergency.model;

import java.util.Date;

public class EmergencyRequest {
    private String requestId;
    private User requester;
    private Location emergencyLocation;
    private Date timestamp;
    private String details;

    public EmergencyRequest(String requestId, User requester, Location emergencyLocation, String details) {
        this.requestId = requestId;
        this.requester = requester;
        this.emergencyLocation = emergencyLocation;
        this.timestamp = new Date();
        this.details = details;
    }

    public String getRequestId() { return requestId; }
    public User getRequester() { return requester; }
    public Location getEmergencyLocation() { return emergencyLocation; }
    public Date getTimestamp() { return timestamp; }
    public String getDetails() { return details; }
}
