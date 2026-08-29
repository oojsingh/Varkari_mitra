package com.varithon.emergency.controller;

import com.varithon.emergency.model.AuthorityPositionBroadcast;
import com.varithon.emergency.model.EmergencyRequest;
import com.varithon.emergency.service.EmergencyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/emergency")
public class EmergencyController {

    private final EmergencyService emergencyService;

    @Autowired
    public EmergencyController(EmergencyService emergencyService) {
        this.emergencyService = emergencyService;
    }

    @PostMapping("/report")
    public ResponseEntity<String> reportEmergency(@RequestBody EmergencyRequest request) {
        emergencyService.handleEmergency(request);
        return ResponseEntity.ok("Emergency request received. Nearest responders have been notified.");
    }

    @PostMapping("/broadcast-position")
    public ResponseEntity<Map<String, Object>> broadcastAuthorityPosition(@RequestBody AuthorityPositionBroadcast payload) {
        System.out.println(">>> [AUTHORITY BROADCAST] Position received for: " + payload.getAuthority());
        System.out.println(">>> Coordinates: (" + payload.getLatitude() + ", " + payload.getLongitude() + ") | Sector: " + payload.getSector());
        System.out.println(">>> Priority: " + payload.getPriority() + " | Action: " + payload.getInstructions());

        Map<String, Object> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("broadcastId", payload.getBroadcastId());
        response.put("authority", payload.getAuthority());
        response.put("message", "Telemetry & diversion directives successfully dispatched to " + payload.getDepartment());
        response.put("timestamp", System.currentTimeMillis());

        return ResponseEntity.ok(response);
    }
}
