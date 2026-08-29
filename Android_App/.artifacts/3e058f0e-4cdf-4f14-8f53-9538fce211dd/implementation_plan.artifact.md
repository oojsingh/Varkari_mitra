# Functional Enhancements for Safety, Seva, and Sanitation

This plan details the steps to make the "Safety & SOS", "Seva Network", and "Nirmal Wari" sections of the app functional by integrating deeper with Android system features (Notifications, Vibration, Intents) and providing a robust simulation for the Firestore backend.

## User Review Required

> [!IMPORTANT]
> The app currently uses a placeholder `google-services.json`. Firestore operations will fail unless a real Firebase project is configured. This plan includes adding local fallback and system-level actions (like Emails/Notifications) to ensure the app remains functional for demo and local use.

## Proposed Changes

### [MainActivity](file:///C:/Users/Ooj/OneDrive/Desktop/Android_App/app/src/main/java/com/example/grouptracker/MainActivity.kt)

#### [MODIFY] [MainActivity.kt](file:///C:/Users/Ooj/OneDrive/Desktop/Android_App/app/src/main/java/com/example/grouptracker/MainActivity.kt)
- **SOS Enhancement**: Implement a `triggerVibration()` method and show a high-priority `Notification` when SOS is activated.
- **Grievance Reporting**: Update `reportGrievance` to launch an `Intent.ACTION_SEND` (Email) pre-filled with the grievance details (issue type, GPS coordinates) to simulate dispatching to the Gram Panchayat.
- **Seva Network**: Add local simulation logic to ensure registered Sevas appear in the UI even if Firestore fails.
- **Lost Child Photo Handling**: Ensure `onShowFileChooser` correctly passes images and potentially integrate them into the `reportLostChild` payload.

### [Frontend Assets](file:///C:/Users/Ooj/OneDrive/Desktop/Android_App/app/src/main/assets/frontend.html)

#### [MODIFY] [frontend.html](file:///C:/Users/Ooj/OneDrive/Desktop/Android_App/app/src/main/assets/frontend.html)
- **Map Integration**: Update `navToLocation` to call `Android.openMapRoute` so users can choose to open external map apps for navigation.
- **UI Feedback**: Improve the "Resolved" states in the sanitation feed to show simulated real-time updates from authorities.

---

## Verification Plan

### Automated Tests
- I will run `:app:assembleDebug` to ensure the build remains stable after adding new Intent and Notification logic.

### Manual Verification
1. **SOS Test**: Click the SOS button and verify the device vibrates and shows a notification.
2. **Seva Test**: Register a new Seva and verify it appears in the list and on the map.
3. **Sanitation Test**: Submit a grievance and verify it prompts to open the Email client with correct details.
4. **KYC Test**: Complete the Mitra KYC and verify the role activates and location tracking starts.
