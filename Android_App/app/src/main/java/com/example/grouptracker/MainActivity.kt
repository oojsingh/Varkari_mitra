package com.example.grouptracker

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.location.Location
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.provider.MediaStore
import android.util.Log
import android.view.View
import android.webkit.*
import android.widget.ProgressBar
import android.widget.Toast
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import com.google.android.gms.location.*
import com.google.firebase.FirebaseApp
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import com.google.firebase.firestore.SetOptions
import android.content.SharedPreferences
import android.util.Base64
import org.json.JSONObject
import java.io.File
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID
import kotlin.concurrent.thread

private const val REQUEST_PERMISSIONS_CODE = 1001
private const val TRACKING_DOC = "anchors"
private const val TRACKING_COLLECTION = "group_tracking"
// IMPORTANT: Update this to your production backend URL
// or your Laptop's IP (e.g., http://192.168.1.10:8080) for physical device testing.
private const val BACKEND_BASE_URL = "https://varkari-mitra.onrender.com"
private const val TAG = "VarithonApp"
private const val SOS_CHANNEL_ID = "sos_alerts"
private const val PREFS_NAME = "varithon_prefs"
private const val PREF_AUTH_TOKEN = "auth_token"
private const val PREF_CURRENT_USER = "current_user"

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar

    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var locationCallback: LocationCallback
    private lateinit var db: FirebaseFirestore
    private var firestoreListener: ListenerRegistration? = null

    private val trafficDiversionManager = TrafficDiversionManager()
    private val authorityDispatcher = AuthorityDispatcher()

    private var currentRole: String = "observer"
    private var lastKnownLocation: Location? = null
    private var authToken: String? = null
    private var currentUserJson: String? = null
    private var currentVariLatitude: Double = 18.5020
    private var currentVariLongitude: Double = 73.9260

    private lateinit var googleSignInClient: GoogleSignInClient
    private lateinit var googleSignInLauncher: ActivityResultLauncher<Intent>

    // WebChromeClient file chooser callback
    private var fileUploadCallback: ValueCallback<Array<Uri>>? = null
    private var cameraImageUri: Uri? = null
    private lateinit var filePickerLauncher: ActivityResultLauncher<Intent>

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        try {
            FirebaseApp.initializeApp(this)
            db = FirebaseFirestore.getInstance()
        } catch (e: Exception) {
            Log.e(TAG, "Firebase initialization failed", e)
        }

        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        authToken = prefs.getString(PREF_AUTH_TOKEN, null)
        currentUserJson = prefs.getString(PREF_CURRENT_USER, null)

        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)

        webView = findViewById(R.id.webView)
        progressBar = findViewById(R.id.progressBar)

        setupFilePicker()
        setupGoogleSignIn()
        setupWebView()
        setupLocationTracking()
        requestAppPermissions()
        listenToFirestoreTracking()
        createNotificationChannel()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = "Emergency SOS Alerts"
            val descriptionText = "Critical safety and medical alerts"
            val importance = NotificationManager.IMPORTANCE_HIGH
            val channel = NotificationChannel(SOS_CHANNEL_ID, name, importance).apply {
                description = descriptionText
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 500, 200, 500)
            }
            val notificationManager: NotificationManager =
                getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun triggerVibration() {
        val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vibratorManager = getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
            vibratorManager.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createOneShot(1000, VibrationEffect.DEFAULT_AMPLITUDE))
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(1000)
        }
    }

    private fun showSosNotification() {
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        val pendingIntent: PendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
        )

        val builder = NotificationCompat.Builder(this, SOS_CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setContentTitle("CRITICAL SOS ACTIVATED")
            .setContentText("Emergency services and nearby Mitras are being notified of your location.")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)

        with(NotificationManagerCompat.from(this)) {
            if (ActivityCompat.checkSelfPermission(
                    this@MainActivity,
                    Manifest.permission.POST_NOTIFICATIONS
                ) == PackageManager.PERMISSION_GRANTED
            ) {
                notify(101, builder.build())
            }
        }
    }

    private fun setupFilePicker() {
        filePickerLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
            if (result.resultCode == Activity.RESULT_OK) {
                val data = result.data
                val results: Array<Uri>? = when {
                    data?.data != null -> arrayOf(data.data!!)
                    data?.clipData != null -> {
                        val clip = data.clipData!!
                        Array(clip.itemCount) { i -> clip.getItemAt(i).uri }
                    }
                    cameraImageUri != null -> arrayOf(cameraImageUri!!)
                    else -> null
                }
                fileUploadCallback?.onReceiveValue(results)
            } else {
                fileUploadCallback?.onReceiveValue(null)
            }
            fileUploadCallback = null
            // Reset camera uri after result is handled
            // Note: Don't reset if we might need it, but usually we don't
        }
    }

    private fun setupGoogleSignIn() {
        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestEmail()
            .requestProfile()
            // .requestIdToken("YOUR_SERVER_CLIENT_ID") // Uncomment and add your Client ID if needed by backend
            .build()
        googleSignInClient = GoogleSignIn.getClient(this, gso)

        googleSignInLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
            if (result.resultCode == Activity.RESULT_OK) {
                val task = GoogleSignIn.getSignedInAccountFromIntent(result.data)
                try {
                    val account = task.getResult(ApiException::class.java)
                    handleGoogleSignInSuccess(account)
                } catch (e: ApiException) {
                    Log.e(TAG, "Google sign-in failed", e)
                    Toast.makeText(this, "Google Sign-In failed: ${e.statusCode}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun handleGoogleSignInSuccess(account: GoogleSignInAccount?) {
        if (account == null) return
        
        val email = account.email ?: ""
        val name = account.displayName ?: ""
        val id = account.id ?: ""
        val idToken = account.idToken ?: ""

        thread {
            try {
                val json = JSONObject().apply {
                    put("email", email)
                    put("name", name)
                    put("googleId", id)
                    put("idToken", idToken)
                }
                val response = postJson("/api/auth/google", json)
                val obj = JSONObject(response)
                
                if (obj.optString("status") == "ok") {
                    val token = obj.optString("token")
                    val userObj = obj.optJSONObject("user")
                    val userJson = userObj?.toString() ?: "{}"
                    
                    runOnUiThread {
                        saveAuthSession(token, userJson)
                        webView.evaluateJavascript("window.showToast('Welcome, $name');", null)
                        webView.evaluateJavascript("window.updateProfileUI();", null)
                        webView.evaluateJavascript("window.closeModal('loginModal');", null)
                    }
                } else {
                    runOnUiThread {
                        Toast.makeText(this, "Backend Auth Failed: ${obj.optString("message")}", Toast.LENGTH_LONG).show()
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Backend sync for Google Login failed", e)
                runOnUiThread {
                    Toast.makeText(this, "Failed to connect to backend", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            setGeolocationEnabled(true)
            cacheMode = WebSettings.LOAD_DEFAULT
            useWideViewPort = true
            loadWithOverviewMode = true
            mediaPlaybackRequiresUserGesture = false
        }

        webView.addJavascriptInterface(WebAppInterface(), "Android")

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                if (newProgress >= 100) {
                    progressBar.visibility = View.GONE
                } else {
                    progressBar.visibility = View.VISIBLE
                }
            }

            override fun onGeolocationPermissionsShowPrompt(
                origin: String?,
                callback: GeolocationPermissions.Callback?
            ) {
                callback?.invoke(origin, true, false)
            }

            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                fileUploadCallback?.onReceiveValue(null)
                fileUploadCallback = filePathCallback
                cameraImageUri = null

                // Check if capture is enabled (capture="camera" or capture="environment" etc.)
                val captureEnabled = fileChooserParams?.isCaptureEnabled ?: false

                val cameraIntent = Intent(MediaStore.ACTION_IMAGE_CAPTURE)
                if (cameraIntent.resolveActivity(packageManager) != null) {
                    try {
                        val photoFile = createImageFile()
                        val photoURI = FileProvider.getUriForFile(
                            this@MainActivity,
                            "$packageName.fileprovider",
                            photoFile
                        )
                        cameraImageUri = photoURI
                        cameraIntent.putExtra(MediaStore.EXTRA_OUTPUT, photoURI)
                    } catch (ex: IOException) {
                        Log.e(TAG, "Unable to create Image File", ex)
                    }
                }

                val contentSelectionIntent = fileChooserParams?.createIntent() ?: Intent(Intent.ACTION_GET_CONTENT).apply {
                    type = "image/*"
                    addCategory(Intent.CATEGORY_OPENABLE)
                }

                val chooserIntent = Intent(Intent.ACTION_CHOOSER).apply {
                    putExtra(Intent.EXTRA_INTENT, contentSelectionIntent)
                    putExtra(Intent.EXTRA_TITLE, "Image Chooser")
                    if (cameraImageUri != null) {
                        putExtra(Intent.EXTRA_INITIAL_INTENTS, arrayOf(cameraIntent))
                    }
                }

                try {
                    // If capture is enabled, we might want to launch camera directly
                    // but usually, a chooser with camera as first option is better
                    // for generic "file" inputs. For capture="camera", we can be more direct.
                    if (captureEnabled && cameraImageUri != null) {
                        filePickerLauncher.launch(cameraIntent)
                    } else {
                        filePickerLauncher.launch(chooserIntent)
                    }
                } catch (e: Exception) {
                    fileUploadCallback = null
                    return false
                }
                return true
            }

            private fun createImageFile(): File {
                val timeStamp: String = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
                val storageDir: File? = getExternalFilesDir(Environment.DIRECTORY_PICTURES)
                return File.createTempFile("JPEG_${timeStamp}_", ".jpg", storageDir)
            }
        }

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false

                if (url.startsWith("tel:")) {
                    try {
                        val intent = Intent(Intent.ACTION_DIAL, Uri.parse(url))
                        startActivity(intent)
                        return true
                    } catch (e: Exception) {
                        Toast.makeText(this@MainActivity, "Cannot launch dialer", Toast.LENGTH_SHORT).show()
                    }
                } else if (url.startsWith("mailto:")) {
                    try {
                        val intent = Intent(Intent.ACTION_SENDTO, Uri.parse(url))
                        startActivity(intent)
                        return true
                    } catch (e: Exception) {
                        // Ignore
                    }
                }
                return false
            }
        }

        // Load local asset frontend HTML
        webView.loadUrl("file:///android_asset/frontend.html")
    }

    private fun requestAppPermissions() {
        val permissions = arrayOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION,
            Manifest.permission.CAMERA
        )

        val needed = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (needed.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, needed.toTypedArray(), REQUEST_PERMISSIONS_CODE)
        } else {
            fetchInitialLocation()
        }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == REQUEST_PERMISSIONS_CODE) {
            if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                fetchInitialLocation()
                if (currentRole != "observer") {
                    startLocationUpdates()
                }
            }
        }
    }

    @SuppressLint("MissingPermission")
    private fun fetchInitialLocation() {
        if (hasLocationPermission()) {
            fusedLocationClient.lastLocation.addOnSuccessListener { loc ->
                if (loc != null) {
                    lastKnownLocation = loc
                    updateFrontendCoordinates(loc.latitude, loc.longitude)
                }
            }
        }
    }

    private fun hasLocationPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            this, Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
    }

    private fun setupLocationTracking() {
        locationCallback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                val loc = result.lastLocation ?: return
                lastKnownLocation = loc

                if (currentRole == "leaderA" || currentRole == "leaderB") {
                    val fieldLat = if (currentRole == "leaderA") "leaderA_lat" else "leaderB_lat"
                    val fieldLng = if (currentRole == "leaderA") "leaderA_lng" else "leaderB_lng"

                    val data = mapOf(
                        fieldLat to loc.latitude,
                        fieldLng to loc.longitude,
                        "last_updated" to System.currentTimeMillis()
                    )

                    try {
                        db.collection(TRACKING_COLLECTION)
                            .document(TRACKING_DOC)
                            .set(data, SetOptions.merge())
                    } catch (e: Exception) {
                        Log.e(TAG, "Failed to write location to Firestore", e)
                    }

                    syncWithBackend(loc.latitude, loc.longitude)
                }
            }
        }
    }

    @SuppressLint("MissingPermission")
    private fun startLocationUpdates() {
        if (!hasLocationPermission()) return

        val request = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 5000L)
            .setMinUpdateIntervalMillis(2000L)
            .build()

        fusedLocationClient.requestLocationUpdates(request, locationCallback, Looper.getMainLooper())
    }

    private fun stopLocationUpdates() {
        try {
            fusedLocationClient.removeLocationUpdates(locationCallback)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to stop location updates", e)
        }
    }

    private fun syncWithBackend(lat: Double, lng: Double) {
        thread {
            try {
                val url = URL("$BACKEND_BASE_URL/api/traffic/update-vari-location")
                val conn = url.openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.setRequestProperty("Content-Type", "application/json")
                conn.setRequestProperty("bypass-tunnel-reminder", "true")
                conn.doOutput = true
                conn.connectTimeout = 4000
                conn.readTimeout = 4000

                val json = JSONObject().apply {
                    put("latitude", lat)
                    put("longitude", lng)
                    put("role", currentRole)
                }
                conn.outputStream.use { it.write(json.toString().toByteArray()) }
                val responseCode = conn.responseCode
                Log.d(TAG, "Backend sync response: $responseCode")
                conn.disconnect()
            } catch (e: Exception) {
                Log.e(TAG, "Backend sync failed for url: $BACKEND_BASE_URL", e)
            }
        }
    }

    private fun listenToFirestoreTracking() {
        try {
            firestoreListener = db.collection(TRACKING_COLLECTION)
                .document(TRACKING_DOC)
                .addSnapshotListener { snapshot, error ->
                    if (error != null || snapshot == null || !snapshot.exists()) return@addSnapshotListener

                    val aLat = snapshot.getDouble("leaderA_lat") ?: 18.5020
                    val aLng = snapshot.getDouble("leaderA_lng") ?: 73.9260
                    val bLat = snapshot.getDouble("leaderB_lat") ?: 18.4600
                    val bLng = snapshot.getDouble("leaderB_lng") ?: 73.9600

                    currentVariLatitude = aLat
                    currentVariLongitude = aLng

                    val results = FloatArray(1)
                    Location.distanceBetween(aLat, aLng, bLat, bLng, results)
                    val distanceMeters = results[0]
                    val spanStr = "%.1f km stretch".format(distanceMeters / 1000f)
                    val speedStr = "3.2 km/h"

                    val diversionStatus = trafficDiversionManager.evaluateDiversion(aLat, aLng)
                    val headLoc = diversionStatus.sector?.name ?: "Hadapsar Gadital"
                    val tailLoc = "Phursungi Bridge"

                    runOnUiThread {
                        val js = "window.updatePalkhiPositions($aLat, $aLng, $bLat, $bLng, '$spanStr', '$speedStr', '$headLoc', '$tailLoc');"
                        webView.evaluateJavascript(js, null)
                    }
                }
        } catch (e: Exception) {
            Log.e(TAG, "Firestore listener setup failed", e)
        }
    }

    private fun updateFrontendCoordinates(lat: Double, lng: Double) {
        val latStr = "%.4f° N".format(lat)
        val lngStr = "%.4f° E".format(lng)
        runOnUiThread {
            webView.evaluateJavascript(
                "console.log('Native GPS Located at: $latStr, $lngStr');",
                null
            )
        }
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        stopLocationUpdates()
        firestoreListener?.remove()
    }

    // ──────────────────────────────────────────────────────────────────
    // Auth Helpers
    // ──────────────────────────────────────────────────────────────────
    private fun saveAuthSession(token: String, userJson: String) {
        authToken = token
        currentUserJson = userJson
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().putString(PREF_AUTH_TOKEN, token).putString(PREF_CURRENT_USER, userJson).apply()
    }

    private fun clearAuthSession() {
        authToken = null
        currentUserJson = null
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().remove(PREF_AUTH_TOKEN).remove(PREF_CURRENT_USER).apply()
    }

    private fun backendUrl(path: String): String = "$BACKEND_BASE_URL$path"

    private fun addAuthHeaders(conn: HttpURLConnection) {
        authToken?.let {
            conn.setRequestProperty("Authorization", "Bearer $it")
        }
    }

    private fun postJson(path: String, body: JSONObject): String {
        val url = URL(backendUrl(path))
        val conn = url.openConnection() as HttpURLConnection
        conn.requestMethod = "POST"
        conn.setRequestProperty("Content-Type", "application/json")
        conn.setRequestProperty("bypass-tunnel-reminder", "true")
        addAuthHeaders(conn)
        conn.doOutput = true
        conn.connectTimeout = 4000
        conn.readTimeout = 4000
        conn.outputStream.use { it.write(body.toString().toByteArray()) }
        val responseCode = conn.responseCode
        val stream = if (responseCode in 200..299) conn.inputStream else conn.errorStream
        val response = stream.bufferedReader().use { it.readText() }
        conn.disconnect()
        return response
    }

    private fun getJson(path: String): String {
        val url = URL(backendUrl(path))
        val conn = url.openConnection() as HttpURLConnection
        conn.requestMethod = "GET"
        conn.setRequestProperty("bypass-tunnel-reminder", "true")
        addAuthHeaders(conn)
        conn.connectTimeout = 4000
        conn.readTimeout = 4000
        val responseCode = conn.responseCode
        val stream = if (responseCode in 200..299) conn.inputStream else conn.errorStream
        val response = stream.bufferedReader().use { it.readText() }
        conn.disconnect()
        return response
    }

    // ──────────────────────────────────────────────────────────────────
    // JavaScript Interface: Communicates between web UI and Android
    // ──────────────────────────────────────────────────────────────────
    inner class WebAppInterface {

        @JavascriptInterface
        fun getGpsLocation(): String {
            val loc = lastKnownLocation
            return if (loc != null) {
                "%.4f° N, %.4f° E".format(loc.latitude, loc.longitude)
            } else {
                "18.5020° N, 73.9260° E"
            }
        }

        @JavascriptInterface
        fun openDialer(phone: String) {
            runOnUiThread {
                try {
                    val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phone"))
                    startActivity(intent)
                } catch (e: Exception) {
                    Toast.makeText(this@MainActivity, "Cannot open dialer: $phone", Toast.LENGTH_SHORT).show()
                }
            }
        }

        @JavascriptInterface
        fun openMapRoute(lat: Double, lng: Double) {
            runOnUiThread {
                try {
                    val blocked = trafficDiversionManager.isLocationBlockedByVari(lat, lng, currentVariLatitude, currentVariLongitude)
                    if (blocked != null) {
                        Toast.makeText(this@MainActivity,
                            "⚠️ Route blocked by Vari procession near ${blocked.sector.name}. Alternate: ${blocked.sector.alternateBypassRoute}",
                            Toast.LENGTH_LONG).show()
                    }
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse("geo:$lat,$lng?q=$lat,$lng(Destination)"))
                    startActivity(intent)
                } catch (e: Exception) {
                    Toast.makeText(this@MainActivity, "Cannot open map route", Toast.LENGTH_SHORT).show()
                }
            }
        }

        @JavascriptInterface
        fun shareAlert(text: String) {
            runOnUiThread {
                try {
                    val intent = Intent(Intent.ACTION_SEND).apply {
                        type = "text/plain"
                        putExtra(Intent.EXTRA_TEXT, text)
                    }
                    startActivity(Intent.createChooser(intent, "Share Varkari Alert"))
                } catch (e: Exception) {
                    Log.e(TAG, "shareAlert failed", e)
                }
            }
        }

        @JavascriptInterface
        fun triggerSOS() {
            val lat = lastKnownLocation?.latitude ?: 18.5020
            val lng = lastKnownLocation?.longitude ?: 73.9260

            val sosPayload = hashMapOf(
                "timestamp" to System.currentTimeMillis(),
                "latitude" to lat,
                "longitude" to lng,
                "type" to "CRITICAL_SOS",
                "role" to currentRole,
                "status" to "DISPATCHED"
            )

            // Trigger system alerts
            runOnUiThread {
                triggerVibration()
                showSosNotification()
            }

            try {
                db.collection("emergency_sos")
                    .add(sosPayload)
            } catch (e: Exception) {
                Log.e(TAG, "Failed to write SOS to Firestore", e)
            }

            val diversionStatus = trafficDiversionManager.evaluateDiversion(lat, lng)
            try {
                authorityDispatcher.broadcastToAllAuthorities(
                    db, BACKEND_BASE_URL, lat, lng, 350.0, diversionStatus
                ) { /* dispatched */ }
            } catch (e: Exception) {
                Log.e(TAG, "Authority dispatch failed", e)
            }

            thread {
                try {
                    val url = URL("$BACKEND_BASE_URL/api/emergency/report")
                    val conn = url.openConnection() as HttpURLConnection
                    conn.requestMethod = "POST"
                    conn.setRequestProperty("Content-Type", "application/json")
                    conn.setRequestProperty("bypass-tunnel-reminder", "true")
                    conn.doOutput = true
                    conn.connectTimeout = 4000

                    val json = JSONObject().apply {
                        put("latitude", lat)
                        put("longitude", lng)
                        put("type", "MEDICAL_POLICE_SOS")
                        put("timestamp", System.currentTimeMillis())
                    }
                    conn.outputStream.use { it.write(json.toString().toByteArray()) }
                    val responseCode = conn.responseCode
                    Log.d(TAG, "Emergency report response: $responseCode")
                    conn.disconnect()
                } catch (e: Exception) {
                    Log.e(TAG, "Emergency report POST failed", e)
                }
            }

            runOnUiThread {
                Toast.makeText(
                    this@MainActivity,
                    "🚨 SOS Broadcasted to Police & 108 Emergency!",
                    Toast.LENGTH_LONG
                ).show()
            }
        }

        @JavascriptInterface
        fun submitKYC(name: String, aadhaar: String, role: String) {
            currentRole = role
            val kycData = hashMapOf(
                "name" to name,
                "aadhaar" to aadhaar,
                "role" to role,
                "registeredAt" to System.currentTimeMillis(),
                "deviceId" to UUID.randomUUID().toString()
            )

            try {
                db.collection("mitra_kyc")
                    .add(kycData)
            } catch (e: Exception) {
                Log.e(TAG, "KYC Firestore write failed", e)
            }

            thread {
                try {
                    val json = JSONObject().apply {
                        put("name", name)
                        put("aadhaar", aadhaar)
                        put("role", role)
                    }
                    postJson("/api/kyc/submit", json)
                    runOnUiThread {
                        currentUserJson = JSONObject(currentUserJson ?: "{}").apply {
                            put("kycStatus", "VERIFIED")
                            put("kycData", JSONObject().apply {
                                put("name", name)
                                put("aadhaar", aadhaar)
                                put("role", role)
                            })
                        }.toString()
                        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                        prefs.edit().putString(PREF_CURRENT_USER, currentUserJson).apply()
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "KYC backend POST failed", e)
                }
            }

            runOnUiThread {
                startLocationUpdates()
                Toast.makeText(
                    this@MainActivity,
                    "Mitra KYC Approved: Role $role Active",
                    Toast.LENGTH_SHORT
                ).show()
            }
        }

        @JavascriptInterface
        fun reportLostChild(name: String, attire: String, gps: String) {
            val report = hashMapOf(
                "childName" to name,
                "attire" to attire,
                "gpsCoordinates" to gps,
                "timestamp" to System.currentTimeMillis(),
                "status" to "BROADCAST_ACTIVE"
            )

            try {
                db.collection("lost_children")
                    .add(report)
            } catch (e: Exception) {
                Log.e(TAG, "Lost child report Firestore write failed", e)
            }

            try {
                val payload = JSONObject().apply {
                    put("childName", name)
                    put("description", attire)
                    put("lastSeenLocation", gps)
                    put("reportedBy", "Android App")
                    put("reportedByRole", "varkari")
                }
                postJson("/api/lost-child/report", payload)
            } catch (e: Exception) {
                Log.e(TAG, "Lost child backend report failed", e)
            }

            runOnUiThread {
                Toast.makeText(
                    this@MainActivity,
                    "Child Alert Broadcasted to Police & Mitras",
                    Toast.LENGTH_SHORT
                ).show()
            }
        }

        @JavascriptInterface
        fun registerSeva(name: String, category: String, capacity: String, contact: String) {
            val seva = hashMapOf(
                "facilityName" to name,
                "category" to category,
                "capacity" to capacity,
                "contact" to contact,
                "timestamp" to System.currentTimeMillis()
            )

            try {
                db.collection("seva_registry")
                    .add(seva)
            } catch (e: Exception) {
                Log.e(TAG, "Seva registration Firestore write failed", e)
            }

            runOnUiThread {
                Toast.makeText(
                    this@MainActivity,
                    "Seva registered and shared with pilgrims!",
                    Toast.LENGTH_SHORT
                ).show()
            }
        }

        @JavascriptInterface
        fun reportGrievance(issueType: String, location: String) {
            val ticket = hashMapOf(
                "issueType" to issueType,
                "location" to location,
                "timestamp" to System.currentTimeMillis(),
                "status" to "DISPATCHED_TO_PANCHAYAT"
            )

            try {
                db.collection("sanitation_tickets")
                    .add(ticket)
            } catch (e: Exception) {
                Log.e(TAG, "Grievance ticket Firestore write failed", e)
            }

            val lat = lastKnownLocation?.latitude ?: 18.5020
            val lng = lastKnownLocation?.longitude ?: 73.9260

            try {
                val backendPayload = JSONObject().apply {
                    put("issueType", issueType)
                    put("location", location)
                    put("latitude", lat)
                    put("longitude", lng)
                    put("status", "DISPATCHED_TO_PANCHAYAT")
                    put("reportedBy", "Nirmal Wari Sanitation Hub")
                }
                postJson("/api/sanitation/report", backendPayload)
            } catch (e: Exception) {
                Log.e(TAG, "Sanitation backend report failed", e)
            }

            runOnUiThread {
                try {
                    val emailIntent = Intent(Intent.ACTION_SENDTO).apply {
                        data = Uri.parse("mailto:")
                        putExtra(Intent.EXTRA_EMAIL, arrayOf("panchayat.health@example.gov.in"))
                        putExtra(Intent.EXTRA_SUBJECT, "Nirmal Wari Grievance: $issueType")
                        putExtra(Intent.EXTRA_TEXT, "Hello Officer,\n\nA sanitation issue has been reported.\n\nType: $issueType\nLocation: $location\nGPS: ${getGpsLocation()}\n\nPlease take necessary action.\n\nSent via Varkari Mitra App")
                    }
                    startActivity(Intent.createChooser(emailIntent, "Send Grievance Ticket"))
                } catch (e: Exception) {
                    Toast.makeText(this@MainActivity, "Grievance recorded. Auto-mailer failed.", Toast.LENGTH_SHORT).show()
                }
            }
        }

        @JavascriptInterface
        fun loginUser(email: String, password: String): String {
            return try {
                val json = JSONObject().apply {
                    put("email", email)
                    put("password", password)
                }
                val response = postJson("/api/auth/login", json)
                val obj = JSONObject(response)
                if (obj.optString("status") == "ok") {
                    val token = obj.optString("token")
                    val userObj = obj.optJSONObject("user")
                    val userJson = userObj?.toString() ?: "{}"
                    runOnUiThread {
                        saveAuthSession(token, userJson)
                    }
                    obj.toString()
                } else {
                    obj.toString()
                }
            } catch (e: Exception) {
                JSONObject().apply {
                    put("status", "error")
                    put("message", e.message ?: "Login failed")
                }.toString()
            }
        }

        @JavascriptInterface
        fun loginWithGoogle(): String {
            runOnUiThread {
                googleSignInClient.signOut().addOnCompleteListener {
                    val signInIntent = googleSignInClient.signInIntent
                    googleSignInLauncher.launch(signInIntent)
                }
            }
            return JSONObject().apply {
                put("status", "pending")
            }.toString()
        }

        @JavascriptInterface
        fun logoutUser() {
            runOnUiThread {
                clearAuthSession()
                googleSignInClient.signOut()
            }
        }

        @JavascriptInterface
        fun getMyDevices(): String {
            return try {
                val response = getJson("/api/devices/mine")
                JSONObject(response).toString()
            } catch (e: Exception) {
                JSONObject().apply {
                    put("status", "error")
                    put("message", e.message ?: "Failed to load devices")
                }.toString()
            }
        }

        @JavascriptInterface
        fun registerCurrentDevice(): String {
            return try {
                val imei = android.provider.Settings.Secure.getString(contentResolver, android.provider.Settings.Secure.ANDROID_ID) ?: "unknown_imei"
                val json = JSONObject().apply {
                    put("imei", imei)
                    put("name", "This Device")
                    put("phone", "")
                }
                val response = postJson("/api/devices/register", json)
                JSONObject(response).toString()
            } catch (e: Exception) {
                JSONObject().apply {
                    put("status", "error")
                    put("message", e.message ?: "Failed to register device")
                }.toString()
            }
        }

        @JavascriptInterface
        fun trackOtherMitraDevice(email: String): String {
            return try {
                val json = JSONObject().apply {
                    put("targetEmail", email)
                }
                val response = postJson("/api/devices/track", json)
                JSONObject(response).toString()
            } catch (e: Exception) {
                JSONObject().apply {
                    put("status", "error")
                    put("message", e.message ?: "Failed to track device")
                }.toString()
            }
        }

        @JavascriptInterface
        fun showToast(msg: String) {
            runOnUiThread {
                Toast.makeText(this@MainActivity, msg, Toast.LENGTH_SHORT).show()
            }
        }
    }
}
