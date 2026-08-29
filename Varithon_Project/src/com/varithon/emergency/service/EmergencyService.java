package com.varithon.emergency.service;

import com.varithon.emergency.model.Ambulance;
import com.varithon.emergency.model.EmergencyRequest;
import com.varithon.emergency.model.Hospital;

import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

import com.varithon.emergency.model.Location;
import com.varithon.emergency.model.Ambulance;

@Service
public class EmergencyService {
    
    private final LocationService locationService;
    private final NotificationService notificationService;
    private List<Hospital> registeredHospitals;
    private List<Ambulance> registeredAmbulances;

    @Autowired
    public EmergencyService(LocationService locationService, NotificationService notificationService) {
        this.locationService = locationService;
        this.notificationService = notificationService;
        
        // Initialize with Dummy Data for the demo
        this.registeredHospitals = java.util.Arrays.asList(
            new Hospital("H1", "Sanjeevani Hospital", new Location(18.340, 74.010), "9999999991"),
            new Hospital("H2", "City Care Clinic", new Location(18.400, 74.100), "9999999992")
        );
        this.registeredAmbulances = java.util.Arrays.asList(
            new Ambulance("A1", "Ramesh", "MH-12-AB-1234", new Location(18.350, 74.015), true),
            new Ambulance("A2", "Suresh", "MH-14-XY-9876", new Location(18.330, 74.005), true)
        );
    }

    public void handleEmergency(EmergencyRequest request) {
        System.out.println(">>> New Emergency Request Received! ID: " + request.getRequestId());
        System.out.println(">>> Requested by: " + request.getRequester().getName() + " at " + request.getEmergencyLocation());

        double searchRadiusKm = 10.0; // 10 km radius for nearest help

        // Find nearest hospitals
        List<Hospital> nearbyHospitals = registeredHospitals.stream()
                .filter(h -> locationService.isWithinRadius(request.getEmergencyLocation(), h.getLocation(), searchRadiusKm))
                .collect(Collectors.toList());

        // Find nearest available ambulances
        List<Ambulance> nearbyAmbulances = registeredAmbulances.stream()
                .filter(Ambulance::isAvailable)
                .filter(a -> locationService.isWithinRadius(request.getEmergencyLocation(), a.getCurrentLocation(), searchRadiusKm))
                .collect(Collectors.toList());

        System.out.println(">>> Found " + nearbyHospitals.size() + " nearby hospitals and " + nearbyAmbulances.size() + " nearby available ambulances.\n");

        // Notify them
        for (Hospital hospital : nearbyHospitals) {
            notificationService.notifyHospitalFCM(hospital, request);
        }

        for (Ambulance ambulance : nearbyAmbulances) {
            notificationService.notifyAmbulanceMQTT(ambulance, request);
            ambulance.setAvailable(false); // Mark as dispatched
        }
    }
}
