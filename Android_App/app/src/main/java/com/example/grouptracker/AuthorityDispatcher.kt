package com.example.grouptracker

import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID
import kotlin.concurrent.thread

class AuthorityDispatcher {

    private val timeFormat = SimpleDateFormat("HH:mm:ss", Locale.getDefault())

    fun generatePayloads(
        latitude: Double,
        longitude: Double,
        crowdRadiusMeters: Double,
        diversionStatus: ActiveDiversionStatus
    ): List<AuthorityDispatchPayload> {
        val broadcastId = "BC-" + UUID.randomUUID().toString().substring(0, 8).uppercase()
        val now = System.currentTimeMillis()
        val sectorName = diversionStatus.sector?.name ?: "Transit Corridor"
        val isBlocked = diversionStatus.isDiversionActive

        return AuthorityType.values().map { authority ->
            val priority = if (isBlocked) {
                if (authority == AuthorityType.TRAFFIC_POLICE || authority == AuthorityType.MEDICAL_DISPATCH) "CRITICAL" else "HIGH"
            } else "ROUTINE"

            val actionMessage = when (authority) {
                AuthorityType.TRAFFIC_POLICE -> {
                    if (isBlocked) "🚨 URGENT: Activate Barricades on ${diversionStatus.blockedRoad}. Reroute via ${diversionStatus.alternateRoute}. Checkpoints: ${diversionStatus.checkpoints}."
                    else "🟢 Procession smooth at (${"%.4f".format(latitude)}, ${"%.4f".format(longitude)}). Normal patrols."
                }
                AuthorityType.MEDICAL_DISPATCH ->
                    "🚑 Medical Alert: Crowd center (${"%.4f".format(latitude)}, ${"%.4f".format(longitude)}), radius ~${crowdRadiusMeters.toInt()}m. 108 ambulances on standby."
                AuthorityType.DISTRICT_ADMINISTRATION ->
                    "🏛️ Admin Feed: Sector: $sectorName. Crowd perimeter: ${crowdRadiusMeters.toInt()}m. Water & sanitation active."
                AuthorityType.FIRE_RESCUE ->
                    "🚒 Rescue Notice: Procession at $sectorName. Emergency evacuation routes cleared."
            }

            AuthorityDispatchPayload(
                broadcastId = broadcastId, timestamp = now,
                latitude = latitude, longitude = longitude,
                crowdRadiusMeters = crowdRadiusMeters,
                activeSectorName = sectorName,
                isDiversionActive = isBlocked,
                blockedRoad = diversionStatus.blockedRoad,
                alternateRoute = diversionStatus.alternateRoute,
                targetAuthority = authority,
                priorityLevel = priority,
                departmentAction = actionMessage
            )
        }
    }

    /**
     * Broadcasts to BOTH Firebase Firestore AND the Spring Boot backend on the laptop
     */
    fun broadcastToAllAuthorities(
        db: FirebaseFirestore,
        backendBaseUrl: String,
        latitude: Double,
        longitude: Double,
        crowdRadiusMeters: Double,
        diversionStatus: ActiveDiversionStatus,
        onResult: (List<AuthorityDispatchStatus>) -> Unit
    ) {
        val payloads = generatePayloads(latitude, longitude, crowdRadiusMeters, diversionStatus)
        val statuses = mutableListOf<AuthorityDispatchStatus>()
        val timeStr = timeFormat.format(Date())
        var pendingCount = payloads.size

        for (payload in payloads) {
            val authority = payload.targetAuthority

            // 1. Send to Firebase Firestore
            val docRef = db.collection("authority_broadcasts").document("latest_${authority.code}")
            docRef.set(payload.toMap(), SetOptions.merge())
                .addOnCompleteListener { firestoreTask ->
                    val firebaseOk = firestoreTask.isSuccessful

                    // 2. Send to Spring Boot backend (in background thread)
                    thread {
                        var backendOk = false
                        try {
                            val json = JSONObject().apply {
                                put("broadcastId", payload.broadcastId)
                                put("timestamp", payload.timestamp)
                                put("authority", authority.code)
                                put("department", authority.department)
                                put("latitude", payload.latitude)
                                put("longitude", payload.longitude)
                                put("crowdRadiusMeters", payload.crowdRadiusMeters)
                                put("sector", payload.activeSectorName)
                                put("isDiversionActive", payload.isDiversionActive)
                                put("blockedRoad", payload.blockedRoad)
                                put("alternateRoute", payload.alternateRoute)
                                put("priority", payload.priorityLevel)
                                put("instructions", payload.departmentAction)
                            }
                            val url = URL("$backendBaseUrl/api/emergency/broadcast-position")
                            val conn = url.openConnection() as HttpURLConnection
                            conn.connectTimeout = 3000
                            conn.readTimeout = 3000
                            conn.requestMethod = "POST"
                            conn.doOutput = true
                            conn.setRequestProperty("Content-Type", "application/json")
                            conn.setRequestProperty("bypass-tunnel-reminder", "true")
                            conn.outputStream.use { it.write(json.toString().toByteArray(Charsets.UTF_8)) }
                            backendOk = conn.responseCode in 200..299
                            conn.disconnect()
                        } catch (_: Exception) { }

                        val delivered = firebaseOk || backendOk
                        val channels = mutableListOf<String>()
                        if (firebaseOk) channels.add("Firebase")
                        if (backendOk) channels.add("Backend")
                        val channelStr = if (channels.isNotEmpty()) channels.joinToString(" + ") else "Queued"

                        synchronized(statuses) {
                            statuses.add(
                                AuthorityDispatchStatus(
                                    authority = authority,
                                    isDelivered = delivered,
                                    timestampText = timeStr,
                                    detailMessage = "${authority.icon} ${authority.displayName}: $channelStr ($timeStr)\nPriority: ${payload.priorityLevel} • ${payload.departmentAction}"
                                )
                            )
                            pendingCount--
                            if (pendingCount == 0) onResult(statuses.toList())
                        }
                    }
                }
        }
    }
}
