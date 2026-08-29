package com.example.grouptracker

import android.location.Location
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions

class TrafficDiversionManager {

    val sectors = listOf(
        PilgrimageSector(
            id = "pune_hadapsar",
            name = "Pune - Hadapsar Sector",
            latitude = 18.5089,
            longitude = 73.9260,
            radiusKm = 6.0,
            blockedRoad = "Solapur Road & Gadital Hadapsar Junction",
            alternateBypassRoute = "Divert via Magarpatta -> Kharadi Bypass OR Katraj-Dehu Road Bypass",
            policeCheckpoints = listOf("Gadital Chowk Barricade", "Magarpatta Naka Post"),
            estimatedDelayMinutes = 35,
            vehicleRestrictions = "Heavy trucks & intercity buses prohibited. Light vehicles diverted to bypass.",
            advisoryNote = "Vari procession entering Hadapsar. Expect heavy pedestrian movement."
        ),
        PilgrimageSector(
            id = "dive_ghat_saswad",
            name = "Dive Ghat - Saswad Sector",
            latitude = 18.3450,
            longitude = 74.0120,
            radiusKm = 7.5,
            blockedRoad = "Hadapsar - Dive Ghat - Saswad Highway (SH-61)",
            alternateBypassRoute = "Divert via Kondhwa -> Bopdev Ghat -> Saswad OR Pune-Solapur Hwy -> Kedgaon -> Chaufula Bypass",
            policeCheckpoints = listOf("Wadki Naka Police Post", "Dive Ghat Base Checkpoint", "Saswad Phata"),
            estimatedDelayMinutes = 45,
            vehicleRestrictions = "Dive Ghat strictly closed for all vehicular traffic. Only Emergency Ambulances allowed.",
            advisoryNote = "Warkaris traversing Dive Ghat slope. Extreme congestion on standard route."
        ),
        PilgrimageSector(
            id = "saswad_jejuri",
            name = "Saswad - Jejuri Sector",
            latitude = 18.2800,
            longitude = 74.1500,
            radiusKm = 7.0,
            blockedRoad = "Saswad - Jejuri Highway (Old Palkhi Marg)",
            alternateBypassRoute = "Divert via Morgaon -> Supe -> Baramati OR Shirwal -> Lonand Route",
            policeCheckpoints = listOf("Jejuri Naka Barricade", "Nazare Reservoir Checkpoint"),
            estimatedDelayMinutes = 30,
            vehicleRestrictions = "Commercial goods vehicles diverted via Shirwal-Lonand. Local cars guided via Morgaon bypass.",
            advisoryNote = "Procession halting near Jejuri temple corridor."
        ),
        PilgrimageSector(
            id = "lonand_taradgaon",
            name = "Lonand - Taradgaon Sector",
            latitude = 18.0400,
            longitude = 74.1900,
            radiusKm = 8.0,
            blockedRoad = "Lonand - Shirwal Road & Lonand Market Stretch",
            alternateBypassRoute = "Divert via Nira -> Khandala -> NH-48 (Pune-Bangalore Hwy) Bypass",
            policeCheckpoints = listOf("Lonand Railway Crossing Post", "Nira Bridge Barricade"),
            estimatedDelayMinutes = 25,
            vehicleRestrictions = "No heavy transport vehicles allowed between Lonand and Taradgaon.",
            advisoryNote = "Palkhi crossing Nira river basin."
        ),
        PilgrimageSector(
            id = "phaltan_natepute",
            name = "Phaltan - Natepute Sector",
            latitude = 17.9800,
            longitude = 74.4300,
            radiusKm = 8.5,
            blockedRoad = "Phaltan - Natepute - Dahiwadi Highway",
            alternateBypassRoute = "Divert via Baramati - Indapur - Akluj State Highway (SH-10)",
            policeCheckpoints = listOf("Phaltan Ring Road Checkpoint", "Dahiwadi Phata Post"),
            estimatedDelayMinutes = 40,
            vehicleRestrictions = "State transport buses rerouted via Indapur corridor.",
            advisoryNote = "Large dindi gathering near Phaltan. High density pedestrian area."
        ),
        PilgrimageSector(
            id = "malshiras_velapur",
            name = "Malshiras - Velapur Sector",
            latitude = 17.7400,
            longitude = 75.0200,
            radiusKm = 9.0,
            blockedRoad = "Malshiras - Velapur - Pandharpur Approach Road",
            alternateBypassRoute = "Divert via Mohol - Kurduvadi - Tembhurni Highway",
            policeCheckpoints = listOf("Velapur Phata Barricade", "Akluj Crossroad Post"),
            estimatedDelayMinutes = 35,
            vehicleRestrictions = "Non-emergency four wheelers stopped at Velapur perimeter.",
            advisoryNote = "Final approach march underway."
        ),
        PilgrimageSector(
            id = "wakhari_pandharpur",
            name = "Wakhari - Pandharpur Holy City Sector",
            latitude = 17.6775,
            longitude = 75.3278,
            radiusKm = 10.0,
            blockedRoad = "All Central Arterial Roads entering Pandharpur Town & Core Temple Ring",
            alternateBypassRoute = "Park at Outer Mega-Parking (Wakhari / Isbavi) & Use E-Shuttle or Green Corridor",
            policeCheckpoints = listOf("Wakhari Naka Mega-Barricade", "Isbavi Ring Post", "Bhimanagar Police Checkpoint"),
            estimatedDelayMinutes = 60,
            vehicleRestrictions = "Complete vehicular lockdown inside Pandharpur municipal limits. Green Corridor only.",
            advisoryNote = "Grand Ringan & Pandharpur entry. 1+ million pilgrims in holy perimeter."
        )
    )

    val commuterRoutes = listOf(
        CommuterRouteOption(
            routeId = "pune_saswad",
            name = "Pune -> Saswad",
            startLocation = "Pune Swargate / Hadapsar",
            destination = "Saswad City",
            passesThroughSectorId = "dive_ghat_saswad",
            normalTravelMinutes = 45
        ),
        CommuterRouteOption(
            routeId = "hadapsar_jejuri",
            name = "Hadapsar -> Jejuri",
            startLocation = "Hadapsar Gadital",
            destination = "Jejuri Temple",
            passesThroughSectorId = "dive_ghat_saswad",
            normalTravelMinutes = 70
        ),
        CommuterRouteOption(
            routeId = "pune_pandharpur",
            name = "Pune -> Pandharpur (Direct)",
            startLocation = "Pune City",
            destination = "Pandharpur Holy Town",
            passesThroughSectorId = "wakhari_pandharpur",
            normalTravelMinutes = 240
        ),
        CommuterRouteOption(
            routeId = "satara_pandharpur",
            name = "Satara -> Pandharpur",
            startLocation = "Satara MIDC",
            destination = "Pandharpur",
            passesThroughSectorId = "malshiras_velapur",
            normalTravelMinutes = 150
        ),
        CommuterRouteOption(
            routeId = "baramati_lonand",
            name = "Baramati -> Lonand",
            startLocation = "Baramati Bus Stand",
            destination = "Lonand Market",
            passesThroughSectorId = "lonand_taradgaon",
            normalTravelMinutes = 55
        )
    )

    fun evaluateDiversion(variLatitude: Double, variLongitude: Double): ActiveDiversionStatus {
        var closestSector: PilgrimageSector? = null
        var minDistanceKm = Double.MAX_VALUE

        for (sector in sectors) {
            val dist = calculateDistanceKm(variLatitude, variLongitude, sector.latitude, sector.longitude)
            if (dist < minDistanceKm) {
                minDistanceKm = dist
                closestSector = sector
            }
        }

        if (closestSector != null && minDistanceKm <= closestSector.radiusKm) {
            return ActiveDiversionStatus(
                isDiversionActive = true,
                sector = closestSector,
                distanceToVariKm = minDistanceKm,
                title = "TRAFFIC DIVERSION ACTIVE: ${closestSector.name}",
                blockedRoad = closestSector.blockedRoad,
                alternateRoute = closestSector.alternateBypassRoute,
                checkpoints = closestSector.policeCheckpoints.joinToString(", "),
                delayMinutes = closestSector.estimatedDelayMinutes,
                advisory = "${closestSector.advisoryNote} ${closestSector.vehicleRestrictions}"
            )
        } else if (closestSector != null) {
            return ActiveDiversionStatus(
                isDiversionActive = false,
                sector = closestSector,
                distanceToVariKm = minDistanceKm,
                title = "Next Upcoming Diversion: ${closestSector.name} (${"%.1f".format(minDistanceKm)} km away)",
                blockedRoad = "Normal flow active (Watch for ${closestSector.blockedRoad})",
                alternateRoute = "Standby bypass: ${closestSector.alternateBypassRoute}",
                checkpoints = "Standby: ${closestSector.policeCheckpoints.joinToString(", ")}",
                delayMinutes = 0,
                advisory = "Vari is currently ${"%.1f".format(minDistanceKm)} km away from this sector. Roads are currently clear."
            )
        }

        return ActiveDiversionStatus(
            isDiversionActive = false,
            sector = null,
            distanceToVariKm = 0.0,
            title = "No Active Highway Diversion",
            blockedRoad = "All standard pilgrimage arterial roads are open",
            alternateRoute = "Follow standard GPS highway navigation",
            checkpoints = "All police checkpoints operating standard monitoring",
            delayMinutes = 0,
            advisory = "Pilgrimage procession is not causing highway blockages at this coordinate."
        )
    }

    fun checkCommuterRoute(route: CommuterRouteOption, variLat: Double, variLng: Double): RouteCheckResult {
        val currentStatus = evaluateDiversion(variLat, variLng)
        val activeSector = currentStatus.sector

        if (currentStatus.isDiversionActive && activeSector != null && activeSector.id == route.passesThroughSectorId) {
            return RouteCheckResult(
                isBlocked = true,
                routeName = route.name,
                statusBadge = "ROAD BLOCKED BY VARI",
                warningMessage = "Standard route via ${activeSector.blockedRoad} is BLOCKED due to live Vari procession (${"%.1f".format(currentStatus.distanceToVariKm)} km from checkpoint).",
                recommendedDetour = activeSector.alternateBypassRoute,
                additionalDelayMinutes = activeSector.estimatedDelayMinutes,
                activeCheckpoints = activeSector.policeCheckpoints.joinToString(", ")
            )
        }

        val targetSector = sectors.find { it.id == route.passesThroughSectorId }
        val distToTarget = if (targetSector != null) {
            calculateDistanceKm(variLat, variLng, targetSector.latitude, targetSector.longitude)
        } else {
            100.0
        }

        return RouteCheckResult(
            isBlocked = false,
            routeName = route.name,
            statusBadge = "ROUTE CLEAR & OPEN",
            warningMessage = "Standard highway path is OPEN. Vari is currently ${"%.1f".format(distToTarget)} km away from this corridor.",
            recommendedDetour = "Proceed on standard route (${route.normalTravelMinutes} mins expected travel time). Standby bypass: ${targetSector?.alternateBypassRoute ?: "Standard GPS"}",
            additionalDelayMinutes = 0,
            activeCheckpoints = "Routine police traffic observation only"
        )
    }

    fun syncDiversionToFirestore(
        db: FirebaseFirestore,
        status: ActiveDiversionStatus,
        onComplete: (Boolean, String?) -> Unit
    ) {
        val docRef = db.collection("group_tracking").document("traffic_diversions")
        docRef.set(status.toMap(), SetOptions.merge())
            .addOnSuccessListener {
                onComplete(true, null)
            }
            .addOnFailureListener { e ->
                onComplete(false, e.message)
            }
    }

    fun calculateDistanceKm(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
        val results = FloatArray(1)
        Location.distanceBetween(lat1, lon1, lat2, lon2, results)
        return (results[0] / 1000.0).toDouble()
    }
}
