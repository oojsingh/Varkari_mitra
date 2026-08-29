package com.varithon.emergency.model;

import jakarta.persistence.*;
import org.locationtech.jts.geom.Point;

@Entity
@Table(name = "hospitals")
public class Hospital {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    private String name;
    
    @Column(columnDefinition = "geometry(Point, 4326)")
    private Point location;
    
    private String contactNumber;

    // Default constructor for JPA
    public Hospital() {}

    public Hospital(String name, Point location, String contactNumber) {
        this.name = name;
        this.location = location;
        this.contactNumber = contactNumber;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public Point getLocation() { return location; }
    public String getContactNumber() { return contactNumber; }
}
