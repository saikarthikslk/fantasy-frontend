# myapp

A new Flutter project.

## Google Sign-In (web redirect)

The app uses Google Sign-In. After you sign in with Google on **web**, the browser redirects back to your app’s origin (e.g. `http://localhost:8080` when running locally).

1. **Set your Web Client ID**  
   In `lib/features/auth/login_controller.dart`, set `_kGoogleWebClientId` to your OAuth 2.0 **Web application** client ID from [Google Cloud Console](https://console.cloud.google.com/apis/credentials).

2. **Authorized redirect URI**  
   In Google Cloud Console → APIs & Services → Credentials → your OAuth 2.0 Client ID (Web), add under **Authorized redirect URIs** the exact URL where the app is served:
   - Local: `http://localhost:8080` (or the port Flutter web uses, e.g. `http://localhost:XXXX`)
   - Production: `https://your-domain.com`

   The redirect brings the user back to your app after login so the sign-in can complete.

## Getting Started

This project is a starting point for a Flutter application.

A few resources to get you started if this is your first Flutter project:

- [Lab: Write your first Flutter app](https://docs.flutter.dev/get-started/codelab)
- [Cookbook: Useful Flutter samples](https://docs.flutter.dev/cookbook)

For help getting started with Flutter development, view the
[online documentation](https://docs.flutter.dev/), which offers tutorials,
samples, guidance on mobile development, and a full API reference.
