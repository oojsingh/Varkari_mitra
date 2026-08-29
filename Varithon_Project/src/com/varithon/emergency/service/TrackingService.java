package com.varithon.emergency.service;

import com.varithon.emergency.model.LeaderPosition;
import com.varithon.emergency.repository.LeaderPositionRepository;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;

@Service
public class TrackingService {

    private final LeaderPositionRepository leaderPositionRepository;

    @Autowired
    public TrackingService(LeaderPositionRepository leaderPositionRepository) {
        this.leaderPositionRepository = leaderPositionRepository;
    }

    public LeaderPosition create(LeaderPosition position) {
        return leaderPositionRepository.save(position);
    }

    public List<LeaderPosition> findAll() {
        return leaderPositionRepository.findAll();
    }
}
