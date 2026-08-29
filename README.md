# Varithon - Project Repository Structure

This repository is organized into standalone, modular folders for each component of the ecosystem:

```
varithon/
├── 📱 Android_App/               👉 100% Standalone Android Application (Kotlin + Firebase)
│   ├── app/                      👉 App module (Activities, Layouts, Models, Managers)
│   ├── gradle/                   👉 Gradle wrapper files
│   ├── build.gradle.kts          👉 Root Gradle build configuration
│   ├── settings.gradle.kts       👉 Module settings
│   └── local.properties          👉 Android SDK path
│
└── 🌐 Varithon_Project/          👉 Central Server & Web Command Dashboard
    ├── frontend/                 👉 React + Vite Traffic Diversion & Authority Control Room
    ├── src/                      👉 Spring Boot Java Backend, PostGIS Spatial Services & Telemetry Tracking
    ├── pom.xml                   👉 Maven Configuration
    └── docker-compose.yml        👉 PostgreSQL + PostGIS & MQTT EMQX infrastructure
```

---

## 📱 1. Android Application (`Android_App/`)

A self-contained Android project with **zero external server dependencies**, powered directly by **Firebase Firestore**.

- **Open in Android Studio**: Open the `Android_App/` folder directly.
- **Key Features**:
  - **Live GPS Tracking**: Real-time dual-anchor leader tracking (`leaderA` / `leaderB`) and crowd centroid estimation.
  - **Dynamic Traffic Diversions**: Automatically evaluates proximity to pilgrimage sectors (Pune Hadapsar, Dive Ghat / Saswad, Jejuri, Lonand, Pandharpur) and displays road closures and detour bypasses.
  - **Citizen Route Checker**: Check commuter trips (e.g. Pune -> Saswad) for Vari route conflicts.
  - **Pilgrimage Sector Simulator**: Move the Vari along the pilgrimage route to test live traffic diversion switching.
  - **Multi-Authority Dispatch**: Broadcasts live position and action directives to Traffic Police, Medical 108, District Admin, and Fire/Rescue.

---

## 🌐 2. Central Web Command Center & Spring Boot (`Varithon_Project/`)

- **Web Dashboard**: Run `cd Varithon_Project/frontend && npm run dev` to launch the dispatch dashboard at [http://localhost:5173/](http://localhost:5173/).
- **Spring Boot Backend**: Provides REST APIs for emergency dispatch, traffic diversion, and telemetry tracking.

---
