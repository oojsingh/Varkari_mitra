package com.varithon.emergency.repository;

import com.varithon.emergency.model.LeaderPosition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LeaderPositionRepository extends JpaRepository<LeaderPosition, String> {
}
