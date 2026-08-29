package com.varithon.emergency.repository;

import com.varithon.emergency.model.Hospital;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.locationtech.jts.geom.Point;

import java.util.List;

public interface HospitalRepository extends JpaRepository<Hospital, String> {

    // ST_DWithin performs a native PostGIS spatial query to find hospitals within radius (meters)
    @Query(value = "SELECT * FROM hospitals h WHERE ST_DWithin(h.location, :point, :radiusMeters)", nativeQuery = true)
    List<Hospital> findHospitalsWithinRadius(@Param("point") Point point, @Param("radiusMeters") double radiusMeters);
}
