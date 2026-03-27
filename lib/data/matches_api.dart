import 'dart:convert';

import 'package:http/http.dart' as http;

import '../domain/models.dart';
import 'auth_token_store.dart';

class MatchesApi {
  MatchesApi({http.Client? client}) : _client = client ?? http.Client();

  static const String _baseUrl = 'http://localhost:8080';

  final http.Client _client;

  Future<List<MatchInfo>> fetchMatches() async {
    final uri = Uri.parse('$_baseUrl/matches/fetch');
    final headers = <String, String>{};
    final token = AuthTokenStore.instance.token;
    if (token != null && token.isNotEmpty) {
      headers['key'] = token;
    }

    final response = await _client.get(uri, headers: headers.isEmpty ? null : headers);

    if (response.statusCode != 200) {
      throw Exception('Failed to load matches (${response.statusCode})');
    }

    final body = json.decode(response.body);
    if (body is! List) {
      throw Exception('Unexpected matches payload shape');
    }

    return body
        .whereType<Map<String, dynamic>>()
        .map(MatchInfo.fromApiJson)
        .toList();
  }
}
