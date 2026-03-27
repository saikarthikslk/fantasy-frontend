class AuthTokenStore {
  AuthTokenStore._();

  static final AuthTokenStore instance = AuthTokenStore._();

  String? _token;

  String? get token => _token;

  void setToken(String? value) {
    _token = value;
  }
}

