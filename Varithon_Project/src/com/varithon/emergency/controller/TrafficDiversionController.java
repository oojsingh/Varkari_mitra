package com.varithon.emergency.controller;

import com.varithon.emergency.model.Location;
import com.varithon.emergency.model.TrafficDiversion;
import com.varithon.emergency.service.TrafficDiversionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/traffic")
public class TrafficDiversionController {

    private final TrafficDiversionService trafficDiversionService;

    @Autowired
    public TrafficDiversionController(TrafficDiversionService trafficDiversionService) {
        this.trafficDiversionService = trafficDiversionService;
    }

    @GetMapping("/active-diversions")
    public ResponseEntity<List<TrafficDiversion>> getActiveDiversions() {
        return ResponseEntity.ok(trafficDiversionService.getActiveDiversions());
    }

    @GetMapping("/sectors")
    public ResponseEntity<List<TrafficDiversion>> getAllSectors() {
        return ResponseEntity.ok(trafficDiversionService.getAllSectors());
    }

    @PostMapping("/update-vari-location")
    public ResponseEntity<Map<String, Object>> updateVariLocation(@RequestBody Location location) {
        trafficDiversionService.updateVariLocation(location);
        List<TrafficDiversion> active = trafficDiversionService.getActiveDiversions();

        Map<String, Object> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("currentVariLocation", location);
        response.put("activeDiversionsCount", active.size());
        response.put("activeDiversions", active);

        return ResponseEntity.ok(response);
    }
}
