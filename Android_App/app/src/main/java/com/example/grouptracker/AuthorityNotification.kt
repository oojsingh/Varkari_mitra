package com.example.grouptracker

enum class AuthorityType(
    val code: String,
    val displayName: String,
    val department: String,
    val icon: String
) {
    TRAFFIC_POLICE(
        "traffic_police",
        "Traffic Police & Highway Patrol",
        "Traffic Management Division",
        "👮"
    ),
    MEDICAL_DISPATCH(
        "medical_dispatch",
        "District Health & 108 Ambulances",
        "Emergency Medical Services",
        "🏥"
    ),
    DISTRICT_ADMINISTRATION(
        "district_admin",
        "District Collector & Temple Trust",
        "Disaster Management Cell",
        "🏛️"
    ),
    FIRE_RESCUE(
        "fire_rescue",
        "Fire & Disaster Rescue Services",
        "Emergency Safety Operations",
        "🚒"
    )
}

data class AuthorityDispatchPayload(
    val broadcastId: String,
    val timestamp: Long,
    val latitude: Double,
    val longitude: Double,
    val crowdRadiusMeters: Double,
    val activeSectorName: String,
    val isDiversionActive: Boolean,
    val blockedRoad: String,
    val alternateRoute: String,
    val targetAuthority: AuthorityType,
    val priorityLevel: String,
    val departmentAction: String
) {
    fun toMap(): Map<String, Any> {
        return mapOf(
            "broadcastId" to broadcastId,
            "timestamp" to timestamp,
            "location" to mapOf(
                "latitude" to latitude,
                "longitude" to longitude
            ),
            "crowdRadiusMeters" to crowdRadiusMeters,
            "activeSectorName" to activeSectorName,
            "isDiversionActive" to isDiversionActive,
            "blockedRoad" to blockedRoad,
            "alternateRoute" to alternateRoute,
            "targetAuthority" to targetAuthority.displayName,
            "department" to targetAuthority.department,
            "priorityLevel" to priorityLevel,
            "departmentAction" to departmentAction
        )
    }
}

data class AuthorityDispatchStatus(
    val authority: AuthorityType,
    val isDelivered: Boolean,
    val timestampText: String,
    val detailMessage: String
)
