package com.varithon.emergency;

import com.varithon.emergency.model.*;
import com.varithon.emergency.service.EmergencyService;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

public class Main {
    public static void main(String[] args) {
        // Pandharpur Route roughly near Pune/Saswad coords for simulation
        Location emergencyLoc = new Location(18.345, 74.012); 

        // Mock DB Data
        Hospital h1 = new Hospital("H1", "Sanjeevani Hospital", new Location(18.340, 74.010), "9999999991");
        Hospital h2 = new Hospital("H2", "City Care Clinic", new Location(18.400, 74.100), "9999999992"); // Too far

        Ambulance a1 = new Ambulance("A1", "Ramesh", "MH-12-AB-1234", new Location(18.350, 74.015), true);
        Ambulance a2 = new Ambulance("A2", "Suresh", "MH-14-XY-9876", new Location(18.330, 74.005), true);

        List<Hospital> allHospitals = Arrays.asList(h1, h2);
        List<Ambulance> allAmbulances = Arrays.asList(a1, a2);

        // Initialize Service
        EmergencyService service = new EmergencyService(allHospitals, allAmbulances);

        // A Varkari Mitra spots an emergency
        VarkariMitra mitra = new VarkariMitra("VM001", "Ganesh", "8888888888", "VOL-101");

        EmergencyRequest request = new EmergencyRequest(
                UUID.randomUUID().toString(),
                mitra,
                emergencyLoc,
                "Elderly Varkari fainted due to dehydration."
        );

        // Trigger the process
        service.handleEmergency(request);
    }
}
