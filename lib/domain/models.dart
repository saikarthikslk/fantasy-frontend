import 'package:flutter/foundation.dart';

enum PlayerRole { wk, bat, ar, bowl }

@immutable
class TeamInfo {
  const TeamInfo({
    required this.id,
    required this.shortName,
    required this.name,
    required this.primaryColor,
  });

  final String id;
  final String shortName;
  final String name;
  final int primaryColor;

  factory TeamInfo.fromApiJson(Map<String, dynamic> json) {
    return TeamInfo(
      id: json['teamId']?.toString() ?? '',
      shortName: (json['teamSName'] ?? json['teamName'] ?? '') as String,
      name: (json['teamName'] ?? '') as String,
      // Use a neutral blue/red based on teamId parity as a placeholder.
      primaryColor: (json['teamId'] ?? 0) % 2 == 0 ? 0xFF1D4ED8 : 0xFFB91C1C,
    );
  }
}

@immutable
class MatchInfo {
  const MatchInfo({
    required this.id,
    required this.teamA,
    required this.teamB,
    required this.startTime,
    required this.tournament,
    required this.venue,
    this.status,
  });

  final String id;
  final TeamInfo teamA;
  final TeamInfo teamB;
  final DateTime startTime;
  final String tournament;
  final String venue;
  // Optional status string from backend like "Match starts at ..."
  final String? status;

  factory MatchInfo.fromApiJson(Map<String, dynamic> json) {
    final venue = json['venueInfo'] as Map<String, dynamic>?;
    final ground = venue?['ground'] as String? ?? '';
    final city = venue?['city'] as String? ?? '';
    final venueLabel =
        ground.isEmpty ? city : (city.isEmpty ? ground : '$ground, $city');

    final startMillis = json['startDate'] as num?;
    final start = startMillis != null
        ? DateTime.fromMillisecondsSinceEpoch(startMillis.toInt(), isUtc: true)
            .toLocal()
        : DateTime.now();

    return MatchInfo(
      id: json['matchId']?.toString() ?? '',
      teamA: TeamInfo.fromApiJson(json['team1'] as Map<String, dynamic>),
      teamB: TeamInfo.fromApiJson(json['team2'] as Map<String, dynamic>),
      startTime: start,
      tournament: (json['seriesName'] ?? '') as String,
      venue: venueLabel,
      status: json['status'] as String?,
    );
  }
}

@immutable
class PlayerInfo {
  const PlayerInfo({
    required this.id,
    required this.name,
    required this.role,
    required this.teamId,
    required this.credits,
    required this.isStar,
    required this.recentPoints,
    required this.imageUrl,
  });

  final String id;
  final String name;
  final PlayerRole role;
  final String teamId;
  final double credits;
  final bool isStar;
  final int recentPoints;
  final String imageUrl;

  factory PlayerInfo.fromApiJson(Map<String, dynamic> json) {
    final type = (json['type'] as String?)?.toUpperCase() ?? '';
    PlayerRole role;
    if (type.contains('KEEP')) {
      role = PlayerRole.wk;
    } else if (type.contains('BAT')) {
      role = PlayerRole.bat;
    } else if (type.contains('ALL')) {
      role = PlayerRole.ar;
    } else {
      role = PlayerRole.bowl;
    }

    final team = json['team'] as Map<String, dynamic>?;
    final teamId = team?['teamId']?.toString() ?? '';
    int imageid = json['imageId'];
    var imageurl = "http://localhost:8080/redirect/${imageid}/i.jpg";
    // Backend   does not yet provide credits or recent fantasy points,
    // so we start with neutral placeholder values.
    return PlayerInfo(
        id: json['id']?.toString() ?? '',
        name: (json['name'] ?? '') as String,
        role: role,
        teamId: teamId,
        credits: 8.0,
        isStar: false,
        recentPoints: 0,
        imageUrl: imageurl);
  }
}

String roleLabel(PlayerRole role) {
  switch (role) {
    case PlayerRole.wk:
      return 'WK';
    case PlayerRole.bat:
      return 'BAT';
    case PlayerRole.ar:
      return 'AR';
    case PlayerRole.bowl:
      return 'BOWL';
  }
}
