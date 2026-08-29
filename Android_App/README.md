# Varithon - Standalone Android Application (Connected to Online Backend)

This Android application runs as a standalone project and connects to **both Firebase Firestore** (cloud database) **and your Online Backend Server** via public HTTPS tunnel.

---

## 🌐 Online Backend URL

The app is currently configured to reach the backend over the public internet at:
```
https://varithon-live.loca.lt
```

> **To change this**, edit the constant `BACKEND_BASE_URL` at the top of  
> `app/src/main/java/com/example/grouptracker/MainActivity.kt`

| Scenario | URL to Use |
|:---|:---|
| 🌍 **Online / Anywhere on Internet** | `https://varithon-live.loca.lt` |
| 📱 **Physical Phone on Same WiFi** | `http://10.81.142.46:8080` |
| 💻 **Android Emulator on Laptop** | `http://10.0.2.2:8080` |

---

## 🛠️ How to Expose Your Laptop's Backend Online

Whenever you start the Spring Boot backend on port 8080, you can expose it publicly using either:

### Option A: LocalTunnel (Instant, no signup needed)
```powershell
npx -y localtunnel --port 8080
```

### Option B: Ngrok (Installed on your laptop)
```powershell
ngrok config add-authtoken <your-free-authtoken>
ngrok http 8080
```

---

## 📡 What Gets Sent to the Online Backend

| Data | Backend Endpoint | Description |
|:---|:---|:---|
| **Vari Location Updates** | `POST /api/traffic/update-vari-location` | Every time the Vari position changes (leader GPS or simulation) |
| **Emergency SOS Reports** | `POST /api/emergency/report` | When a user taps "Report Emergency" |
| **Authority Broadcasts** | `POST /api/emergency/broadcast-position` | Tailored directives for Traffic Police, Medical 108, District Admin, Fire Rescue |

All data is **also saved to Firebase Firestore** as a real-time fallback, so the app continues working seamlessly even if the tunnel is paused.

---

## 🚀 How to Run in Android Studio

1. Open **Android Studio** → **File > Open** → Select this `Android_App` folder.
2. Place `google-services.json` inside the `app/` folder.
3. Run the Android app on any Android device anywhere in the world — it will connect directly over the internet!
