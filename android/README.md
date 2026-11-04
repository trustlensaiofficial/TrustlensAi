# TrustLens AI — Android app

Native Android client scaffold using Kotlin, Jetpack Compose and Material 3.

## Open
Open the `android/` directory in Android Studio (Koala or newer), allow Gradle sync, then run the `app` configuration on an Android 8.0+ device or emulator.

## Included in this first implementation
- Cinematic navy/cyan/violet design system with dark and light themes
- Home dashboard, investigation composer, case history, insights and settings screens
- Animated floating action menu, contextual assistant, glass-style cards and responsive layouts
- Message/link input and user-controlled share-sheet entry point
- Accessible labels, touch targets and reduced-motion-aware animation foundations

## Honest integration status
This first UI foundation does not claim to perform a real scam verdict. Analysis currently presents a clear integration state until the app is wired to a verified backend contract. The web app remains unchanged. No notification, SMS, contacts, accessibility, call-log or background-monitoring permissions are requested.

## Next integration work
1. Confirm the actual web API route and request/response schema.
2. Add an authenticated Retrofit client using the Supabase session JWT.
3. Add CameraX + ML Kit QR scanning with camera permission requested only when the user opens QR scan.
4. Add Room case cache and DataStore preferences.
5. Add instrumentation/accessibility tests and verify on physical Android devices.

## Build
Requires JDK 17 and Android SDK Platform 36. Run `./gradlew :app:assembleDebug` after adding the Gradle wrapper from Android Studio, or build/run from Android Studio.
