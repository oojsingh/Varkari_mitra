package com.example.grouptracker

data class PilgrimageSector(
    val id: String,
    val name: String,
    val latitude: Double,
    val longitude: Double,
    val radiusKm: Double,
    val blockedRoad: String,
    val alternateBypassRoute: String,
    val policeCheckpoints: List<String>,
    val estimatedDelayMinutes: Int,
    val vehicleRestrictions: String,
    val advisoryNote: String
)

data class ActiveDiversionStatus(
    val isDiversionActive: Boolean,
    val sector: PilgrimageSector?,
    val distanceToVariKm: Double,
    val title: String,
    val blockedRoad: String,
    val alternateRoute: String,
    val checkpoints: String,
    val delayMinutes: Int,
    val advisory: String
) {
    fun toMap(): Map<String, Any> {
        return mapOf(
            "isDiversionActive" to isDiversionActive,
            "sectorName" to (sector?.name ?: "None"),
            "distanceToVariKm" to distanceToVariKm,
            "blockedRoad" to blockedRoad,
            "alternateRoute" to alternateRoute,
            "checkpoints" to checkpoints,
            "delayMinutes" to delayMinutes,
            "advisory" to advisory,
            "timestamp" to System.currentTimeMillis()
        )
    }
}

data class CommuterRouteOption(
    val routeId: String,
    val name: String,
    val startLocation: String,
    val destination: String,
    val passesThroughSectorId: String,
    val normalTravelMinutes: Int
)

data class BlockedLocationResult(
    val isBlocked: Boolean,
    val sector: PilgrimageSector,
    val distanceToSectorKm: Double
)

data class RouteCheckResult(
    val isBlocked: Boolean,
    val routeName: String,
    val statusBadge: String,
    val warningMessage: String,
    val recommendedDetour: String,
    val additionalDelayMinutes: Int,
    val activeCheckpoints: String
)
