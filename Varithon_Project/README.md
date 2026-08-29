# Varithon Emergency Dispatch Backend

## Project Status (Saved Progress)
This project contains the foundational Spring Boot backend for the Varithon Hackathon. It is designed to handle emergency medical requests from Walkers (Varkaris) and Varkari Mitras, and dispatch nearby Ambulances and Hospitals.

**What is completed:**
1. **Domain Models**: Defined JPA Entities for `Hospital` and `Ambulance` utilizing PostGIS native `Point` geometry types for fast location querying.
2. **Geospatial Repositories**: Created Spring Data JPA repositories with `ST_DWithin` spatial queries.
3. **Core Services**: Initialized `EmergencyService` and `NotificationService` structures.
4. **Environment Infrastructure**: Provided a `docker-compose.yml` to spin up PostgreSQL + PostGIS and EMQX (MQTT broker) flawlessly.
5. **REST API**: Started an `EmergencyController` to accept POST requests from the Kotlin Mobile App.

**What to do next (Tomorrow):**
1. **Start the Environment**: Run `docker-compose up -d` in the root folder.
2. **Open the Project**: Open this folder in IntelliJ IDEA or Eclipse (ensure Java 17+ and Maven are configured in your IDE).
3. **Connect Firebase**: Place your `firebase-service-account.json` in the `src/main/resources` folder to enable FCM push notifications.
4. **Flesh out MQTT**: Complete the MQTT publisher logic in `NotificationService.java` using Eclipse Paho.
5. **Connect Kotlin App**: Build the Retrofit calls in the Kotlin Mobile app to send location data to `http://<your-ip>:8080/api/emergency/report`.

*Happy Hacking!*
