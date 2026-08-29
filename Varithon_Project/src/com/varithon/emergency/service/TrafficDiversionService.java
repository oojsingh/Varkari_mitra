package com.varithon.emergency.service;

import com.varithon.emergency.model.Location;
import com.varithon.emergency.model.TrafficDiversion;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TrafficDiversionService {

    private final LocationService locationService;
    private final List<TrafficDiversion> sectors;
    private Location currentVariLocation;

    @Autowired
    public TrafficDiversionService(LocationService locationService) {
        this.locationService = locationService;
        this.currentVariLocation = new Location(18.345, 74.012); // Default near Saswad

        this.sectors = new ArrayList<>(Arrays.asList(
            new TrafficDiversion(
                "sec_pune",
                "Pune - Hadapsar Sector",
                18.5089, 73.9260, 6.0,
                "Solapur Road & Gadital Hadapsar Junction",
                "Divert via Magarpatta -> Kharadi Bypass OR Katraj-Dehu Road Bypass",
                Arrays.asList("Gadital Chowk Barricade", "Magarpatta Naka Post"),
                35,
                "Heavy trucks & intercity buses prohibited.",
                "Vari procession entering Hadapsar.",
                false
            ),
            new TrafficDiversion(
                "sec_saswad",
                "Dive Ghat - Saswad Sector",
                18.3450, 74.0120, 7.5,
                "Hadapsar - Dive Ghat - Saswad Highway (SH-61)",
                "Divert via Kondhwa -> Bopdev Ghat -> Saswad OR Pune-Solapur Hwy -> Kedgaon -> Chaufula Bypass",
                Arrays.asList("Wadki Naka Police Post", "Dive Ghat Base Checkpoint", "Saswad Phata"),
                45,
                "Dive Ghat strictly closed for all regular traffic. Green Corridor for Ambulances.",
                "Procession negotiating steep Dive Ghat slope.",
                true
            ),
            new TrafficDiversion(
                "sec_jejuri",
                "Saswad - Jejuri Sector",
                18.2800, 74.1500, 7.0,
                "Saswad - Jejuri Highway (Old Palkhi Marg)",
                "Divert via Morgaon -> Supe -> Baramati OR Shirwal -> Lonand Route",
                Arrays.asList("Jejuri Naka Barricade", "Nazare Reservoir Checkpoint"),
                30,
                "Commercial goods vehicles diverted via Shirwal-Lonand.",
                "Procession halting near Jejuri temple corridor.",
                false
            ),
            new TrafficDiversion(
                "sec_lonand",
                "Lonand - Taradgaon Sector",
                18.0400, 74.1900, 8.0,
                "Lonand - Shirwal Road & Lonand Market Stretch",
                "Divert via Nira -> Khandala -> NH-48 (Pune-Bangalore Hwy) Bypass",
                Arrays.asList("Lonand Railway Crossing Post", "Nira Bridge Barricade"),
                25,
                "No heavy transport vehicles allowed between Lonand and Taradgaon.",
                "Palkhi crossing Nira river basin.",
                false
            ),
            new TrafficDiversion(
                "sec_pandharpur",
                "Wakhari - Pandharpur Holy City Sector",
                17.6775, 75.3278, 10.0,
                "All Central Arterial Roads entering Pandharpur Town",
                "Park at Outer Mega-Parking (Wakhari / Isbavi) & Use E-Shuttle or Green Corridor",
                Arrays.asList("Wakhari Naka Mega-Barricade", "Isbavi Ring Post", "Bhimanagar Police Checkpoint"),
                60,
                "Complete vehicular lockdown inside Pandharpur municipal limits.",
                "Grand Ringan & Holy Temple perimeter.",
                false
            )
        ));

        recalculateActiveDiversions();
    }

    public synchronized void updateVariLocation(Location newLocation) {
        this.currentVariLocation = newLocation;
        recalculateActiveDiversions();
    }

    public synchronized Location getCurrentVariLocation() {
        return this.currentVariLocation;
    }

    public synchronized List<TrafficDiversion> getAllSectors() {
        return this.sectors;
    }

    public synchronized List<TrafficDiversion> getActiveDiversions() {
        return sectors.stream().filter(TrafficDiversion::isActive).collect(Collectors.toList());
    }

    private void recalculateActiveDiversions() {
        for (TrafficDiversion sector : sectors) {
            Location sectorLoc = new Location(sector.getLatitude(), sector.getLongitude());
            boolean withinRadius = locationService.isWithinRadius(currentVariLocation, sectorLoc, sector.getRadiusKm());
            sector.setActive(withinRadius);
        }
    }
}
