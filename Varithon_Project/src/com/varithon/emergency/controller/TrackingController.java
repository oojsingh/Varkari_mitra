package com.varithon.emergency.controller;

import com.varithon.emergency.model.LeaderPosition;
import com.varithon.emergency.service.TrackingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tracking")
public class TrackingController {

    private final TrackingService trackingService;

    @Autowired
    public TrackingController(TrackingService trackingService) {
        this.trackingService = trackingService;
    }

    @PostMapping
    public ResponseEntity<LeaderPosition> create(@RequestBody LeaderPosition position) {
        return ResponseEntity.ok(trackingService.create(position));
    }

    @GetMapping
    public ResponseEntity<List<LeaderPosition>> findAll() {
        return ResponseEntity.ok(trackingService.findAll());
    }
}
