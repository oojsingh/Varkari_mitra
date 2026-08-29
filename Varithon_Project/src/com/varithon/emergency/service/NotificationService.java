package com.varithon.emergency.service;

import com.varithon.emergency.model.Ambulance;
import com.varithon.emergency.model.EmergencyRequest;
import com.varithon.emergency.model.Hospital;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    // Simulates FCM (Firebase Cloud Messaging) Push Notification
    public void notifyHospitalFCM(Hospital hospital, EmergencyRequest request) {
        System.out.println("==================================================");
        System.out.println("[FCM Push Notification -> Hospital: " + hospital.getName() + "]");
        System.out.println("EMERGENCY ALERT: " + request.getDetails());
        System.out.println("Location: " + request.getEmergencyLocation());
        System.out.println("Patient: " + request.getRequester().getName() + " (" + request.getRequester().getPhoneNumber() + ")");
        System.out.println("==================================================\n");
    }

    // Simulates MQTT Publish to Ambulance Dashboard/Device
    public void notifyAmbulanceMQTT(Ambulance ambulance, EmergencyRequest request) {
        System.out.println("--------------------------------------------------");
        System.out.println("[MQTT Message -> Ambulance: " + ambulance.getVehicleNumber() + " (Driver: " + ambulance.getDriverName() + ")]");
        System.out.println("DISPATCH ALERT: " + request.getDetails());
        System.out.println("Target Location: " + request.getEmergencyLocation());
        System.out.println("--------------------------------------------------\n");
    }
}
