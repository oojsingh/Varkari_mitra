package com.varithon.emergency.repository;

import com.varithon.emergency.model.Ambulance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.locationtech.jts.geom.Point;

import java.util.List;

public interface AmbulanceRepository extends JpaRepository<Ambulance, String> {

    // PostGIS spatial query to find AVAILABLE ambulances within radius (meters)
    @Query(value = "SELECT * FROM ambulances a WHERE a.is_available = true AND ST_DWithin(a.current_location, :point, :radiusMeters)", nativeQuery = true)
    List<Ambulance> findAvailableAmbulancesWithinRadius(@Param("point") Point point, @Param("radiusMeters") double radiusMeters);
}
