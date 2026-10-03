# Aroma De Luz — Mobile App (Android APK & iOS)

Luxury mobile application for **Aroma De Luz** scented candles and bespoke perfumes, featuring shared account authentication and instant bidirectional cart synchronization with the storefront website.

---

## Directory Structure

```text
aroma-app/
├── android/                 # Native Android Gradle project (Android Studio ready)
│   ├── app/                 # Android app module with AndroidManifest, build.gradle, sources
│   ├── gradlew              # Unix Gradle wrapper
│   └── gradlew.bat          # Windows Gradle wrapper
├── ios/                     # Native iOS Xcode project
│   ├── AromaDeLuz/          # iOS configuration and Info.plist
│   └── Podfile              # CocoaPods dependencies specification
├── src/                     # React Native cross-platform application source
│   ├── components/          # Header, ProductCard, CartModal, AuthModal, ProductDetailModal
│   ├── context/             # AuthContext (Supabase) & CartContext (Cloud Sync)
│   ├── screens/             # CatalogScreen (Category filters, luxury feed)
│   ├── services/            # api.ts (Cart & Product endpoints), supabase.ts (Auth)
│   ├── theme.ts             # Brand tokens (Deep Purple, Gold, Ivory, Cream)
│   └── types.ts             # TypeScript interfaces
├── app.json                 # Expo native manifest (Android package & iOS bundle ID)
├── eas.json                 # EAS build profile configured for direct APK generation
├── build-android-apk.bat    # 1-Click Android APK build script
├── build-ios.bat            # 1-Click iOS build script
└── start-mobile.bat         # 1-Click development runner (Expo Go)
```

---

## 1. How to Build the Android APK (`.apk`)

### Method A: Direct Cloud Build (No Android Studio or Java Required)
This is the recommended method. Expo's cloud build servers compile the code and provide a downloadable `.apk` file:

1. Double-click `build-android-apk.bat` (or open terminal in `aroma-app` and run):
   ```bash
   npx eas build -p android --profile preview
   ```
2. Log in with your free [Expo account](https://expo.dev) when prompted.
3. EAS will build the standalone Android `.apk` and print a direct download URL and QR code.
4. Download the `.apk` on your phone and tap **Install**.

### Method B: Local Build with Android Studio / Gradle
If you have Android Studio and the Android SDK installed:
```bash
cd android
./gradlew assembleRelease
```
The generated APK will be at:
`android/app/build/outputs/apk/release/app-release.apk`

---

## 2. How to Build the iOS Mobile App

### Method A: Direct Cloud Build via EAS
```bash
npx eas build -p ios --profile preview
```
or run `build-ios.bat`.

### Method B: Local Build on macOS with Xcode
Open the iOS project in Xcode:
```bash
cd ios
pod install
open AromaDeLuz.xcworkspace
```

---

## 3. Instant Testing on Physical Mobile Phone (Expo Go)

To test the mobile app directly on your device with hot reload and live cloud cart sync:

1. Double click `start-mobile.bat` (or run `npx expo start --tunnel`).
2. Scan the terminal QR code:
   - **Android**: Open **Expo Go** $\rightarrow$ tap **"Scan QR Code"**.
   - **iPhone**: Open default **Camera app** $\rightarrow$ tap **"Open in Expo Go"**.

---

## 4. Key Features & Synchronisation

- **Shared Authentication**: Users log in to the same Supabase account as on `https://aroma-deluz.vercel.app`.
- **Instant Cart Synchronization**:
  - Adding an item on the website immediately updates the mobile app shopping bag.
  - Adding or changing quantities in the mobile app immediately updates the website shopping bag.
- **Brand Palette**:
  - Deep Purple: `#3B2367`, `#241441`, `#1A0F30`
  - Gold: `#C9A45C`, `#E3C77F`
  - Cream & Ivory: `#F7F2EA`, `#FDFBF7`
