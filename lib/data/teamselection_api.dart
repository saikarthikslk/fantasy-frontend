import 'dart:convert';

import 'package:http/http.dart' as http;

import '../domain/models.dart';
import 'auth_token_store.dart';

class TeamselectionApi {
  TeamselectionApi({http.Client? client}) : _client = client ?? http.Client();

  static const String _baseUrl = 'http://localhost:8080';

  final http.Client _client;

  Future<dynamic> saveteam(dynamic body) async{
 final uri = Uri.parse('$_baseUrl/teams/create');
    final headers = <String, String>{};
    final token = AuthTokenStore.instance.token;
    if (token != null && token.isNotEmpty) {
      headers['key'] = token;
    }
    headers["Content-Type"] = "application/json";
    final response = await _client.post(uri, headers: headers.isEmpty ? null : headers,body: jsonEncode(body));

    if (response.statusCode != 200) {
      throw Exception('Failed to load players (${response.statusCode})');
    }
  }
}
