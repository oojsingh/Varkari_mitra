package com.varithon.emergency.model;

import jakarta.persistence.*;
import org.locationtech.jts.geom.Point;

@Entity
@Table(name = "ambulances")
public class Ambulance {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    private String driverName;
    private String vehicleNumber;
    
    @Column(columnDefinition = "geometry(Point, 4326)")
    private Point currentLocation;
    
    private boolean isAvailable;

    // Default constructor for JPA
    public Ambulance() {}

    public Ambulance(String driverName, String vehicleNumber, Point currentLocation, boolean isAvailable) {
        this.driverName = driverName;
        this.vehicleNumber = vehicleNumber;
        this.currentLocation = currentLocation;
        this.isAvailable = isAvailable;
    }

    public String getId() { return id; }
    public String getDriverName() { return driverName; }
    public String getVehicleNumber() { return vehicleNumber; }
    public Point getCurrentLocation() { return currentLocation; }
    public boolean isAvailable() { return isAvailable; }
    
    public void setCurrentLocation(Point location) { this.currentLocation = location; }
    public void setAvailable(boolean available) { this.isAvailable = available; }
}
