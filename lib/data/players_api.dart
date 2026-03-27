import 'dart:convert';

import 'package:http/http.dart' as http;

import '../domain/models.dart';
import 'auth_token_store.dart';

class PlayersApi {
  PlayersApi({http.Client? client}) : _client = client ?? http.Client();

  static const String _baseUrl = 'http://localhost:8080';

  final http.Client _client;

  Future<List<PlayerInfo>> fetchPlayersForMatch(String matchId) async {
    final uri = Uri.parse('$_baseUrl/matches/fetch/$matchId');
     print("starting fetch");
    final headers = <String, String>{};
    final token = AuthTokenStore.instance.token;
    if (token != null && token.isNotEmpty) {
      headers['key'] = token;
    }
    final response = await _client.get(uri, headers: headers.isEmpty ? null : headers);

    if (response.statusCode != 200) {
      throw Exception('Failed to load players (${response.statusCode})');
    }
    

    final body = json.decode(response.body);
  print(body);
    final playerresp =( body as Map<String,dynamic> ) ["players"] as List;
  
    return playerresp
        .whereType<Map<String, dynamic>>()
        .map(PlayerInfo.fromApiJson)
        .toList();
  }
}
