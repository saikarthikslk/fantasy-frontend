import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';

import 'web_redirect_stub.dart' if (dart.library.html) 'web_redirect_web.dart'
    as web_redirect;

/// Your Web Client ID from Google Cloud Console (OAuth 2.0 → Web application).
/// For redirect after login: add Authorized redirect URI exactly as your app origin,
/// e.g. http://localhost:8080 for local dev (Flutter web default port).
const String _kGoogleWebClientId =
    '1017825382510-6lcqmvqh9a6plgad7acgohhel3045lhe.apps.googleusercontent.com';

class LoginController extends ChangeNotifier {
  LoginController() {
    _googleSignIn = GoogleSignIn(
      // Web only: required. Mobile uses default from google-services.json / Info.plist.
      clientId: kIsWeb ? _kGoogleWebClientId : null,
      serverClientId: null, // Optional: add if your backend verifies ID tokens
    );
  }

  late final GoogleSignIn _googleSignIn;

  bool _isLoading = false;
  String? _errorMessage;

  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  /// Sign in with Google. On web, Google redirects back to your app origin
  /// (e.g. http://localhost:8080) after login — ensure that exact URL is added
  /// in Google Cloud Console → APIs & Services → Credentials → your OAuth client
  /// under "Authorized redirect URIs".
  Future<bool> signInWithGoogle() async {
    if (_isLoading) return false;

    _errorMessage = null;
    _isLoading = true;
    notifyListeners();

    try {
      if (kIsWeb) {
        web_redirect.redirectToUrl(
          'http://localhost:8080/oauth2/authorization/google',
        );
        return true; // Page will redirect
      } else {
        final account = await _googleSignIn.signIn();
        _isLoading = false;
        notifyListeners();
        if (account == null) return false; // user cancelled
        return true;
      }
    } catch (e) {
      _isLoading = false;
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }
}
