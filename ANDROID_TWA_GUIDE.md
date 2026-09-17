# Android TWA & Google Play Console Guide (Android 15 / 16)

This guide explains how to configure the Android Trusted Web Activity (TWA) wrapper (e.g. built with [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap)) to comply with Google Play Console requirements for **Android 15 (SDK 35) Edge-to-Edge** and **Android 16 Large Screen Support**.

---

## 1. Edge-to-Edge & Target SDK 35 (Android 15)

Starting with Android 15 (SDK 35), apps targeting SDK 35 are displayed in edge-to-edge mode by default.

### A. Updating `twa-manifest.json` & Bubblewrap
1. Upgrade Bubblewrap CLI to the latest version:
   ```bash
   npm install -g @bubblewrap/cli@latest
   ```
2. In your `twa-manifest.json` file, set or update:
   ```json
   {
     "targetSdkVersion": 35,
     "generatorApp": "bubblewrap"
   }
   ```
3. Re-build the Android project:
   ```bash
   bubblewrap build
   ```

### B. Custom Java / Kotlin Activity (if applicable)
If you use a custom `MainActivity` or custom `LauncherActivity` in your Android project:
* **Kotlin**: Call `enableEdgeToEdge()` inside `onCreate()` before `setContentView()`.
  ```kotlin
  import androidx.activity.enableEdgeToEdge

  override fun onCreate(savedInstanceState: Bundle?) {
      enableEdgeToEdge()
      super.onCreate(savedInstanceState)
  }
  ```
* **Java**: Call `EdgeToEdge.enable(this)` inside `onCreate()` before `setContentView()`.
  ```java
  import androidx.activity.EdgeToEdge;

  @Override
  protected void onCreate(Bundle savedInstanceState) {
      EdgeToEdge.enable(this);
      super.onCreate(savedInstanceState);
  }
  ```

### C. Web App Safe Area Support
The web app includes:
* `<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover"/>`
* CSS safe area insets via `env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`, `env(safe-area-inset-left)`, and `env(safe-area-inset-right)`.

---

## 2. Large Screens & Resizability (Android 16)

Starting with Android 16, Android ignores orientation and aspect ratio restrictions on large screen devices (tablets, foldables, desktop mode).

### Recommended Android App Configuration:
1. In `twa-manifest.json`:
   ```json
   {
     "orientation": "portrait",
     "resizableActivity": true
   }
   ```
2. In `AndroidManifest.xml`, ensure your Activity supports multi-window / resizing:
   ```xml
   <activity
       android:name="com.google.android.apps.chrome.trusted.LauncherActivity"
       android:resizeableActivity="true"
       android:configChanges="orientation|screenSize|screenLayout|smallestScreenSize">
   ```

The web app's CSS layout is fully responsive and centered (`max-width: 600px; margin: auto`), guaranteeing proper rendering and readability when rotated or resized on large screens and foldables.
