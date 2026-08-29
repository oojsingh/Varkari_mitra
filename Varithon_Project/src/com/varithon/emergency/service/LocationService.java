package com.varithon.emergency.service;

import com.varithon.emergency.model.Location;
import org.springframework.stereotype.Service;

@Service
public class LocationService {

    private static final int EARTH_RADIUS_KM = 6371;

    // Simulates PostGIS ST_DWithin or similar distance calculation
    public double calculateDistance(Location loc1, Location loc2) {
        double lat1 = loc1.getLatitude();
        double lon1 = loc1.getLongitude();
        double lat2 = loc2.getLatitude();
        double lon2 = loc2.getLongitude();

        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        lat1 = Math.toRadians(lat1);
        lat2 = Math.toRadians(lat2);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return EARTH_RADIUS_KM * c; // Returns distance in kilometers
    }

    public boolean isWithinRadius(Location center, Location target, double radiusKm) {
        return calculateDistance(center, target) <= radiusKm;
    }
}
