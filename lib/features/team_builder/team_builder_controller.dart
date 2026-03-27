import 'dart:collection';

import 'package:flutter/foundation.dart';

import '../../domain/models.dart';

class TeamRules {
  const TeamRules({
    this.totalPlayers = 11,
    this.maxFromSingleTeam = 7,
    this.creditCap = 100.0,
    this.minWK = 1,
    this.maxWK = 4,
    this.minBAT = 3,
    this.maxBAT = 6,
    this.minAR = 1,
    this.maxAR = 4,
    this.minBOWL = 3,
    this.maxBOWL = 6,
  });

  final int totalPlayers;
  final int maxFromSingleTeam;
  final double creditCap;

  final int minWK;
  final int maxWK;
  final int minBAT;
  final int maxBAT;
  final int minAR;
  final int maxAR;
  final int minBOWL;
  final int maxBOWL;
}

class TeamBuilderController extends ChangeNotifier {
  TeamBuilderController({
    required this.matchId,
    required this.allPlayers,
    TeamRules? rules,
    Set<String>? initialSelectedPlayerIds,
    void Function(Set<String> ids)? onSelectionChanged,
  })  : rules = rules ?? const TeamRules(),
        _onSelectionChanged = onSelectionChanged {
    if (initialSelectedPlayerIds != null) {
      _selectedPlayerIds.addAll(initialSelectedPlayerIds);
    }
  }

  final String matchId;
  final TeamRules rules;
  final List<PlayerInfo> allPlayers;
  final void Function(Set<String> ids)? _onSelectionChanged;

  final LinkedHashSet<String> _selectedPlayerIds = LinkedHashSet<String>();

  Set<String> get selectedPlayerIds => Set.unmodifiable(_selectedPlayerIds);

  UnmodifiableListView<PlayerInfo> get selectedPlayers =>
      UnmodifiableListView(allPlayers.where((p) => _selectedPlayerIds.contains(p.id)));

  int get selectedCount => _selectedPlayerIds.length;

  double get creditsUsed => selectedPlayers.fold(0.0, (sum, p) => sum + p.credits);

  double get creditsLeft => (rules.creditCap - creditsUsed).clamp(0.0, rules.creditCap);

  bool isSelected(PlayerInfo p) => _selectedPlayerIds.contains(p.id);

  int countRole(PlayerRole role) =>
      selectedPlayers.where((p) => p.role == role).length;

  Map<String, int> get teamCounts {
    final m = <String, int>{};
    for (final p in selectedPlayers) {
      m[p.teamId] = (m[p.teamId] ?? 0) + 1;
    }
    return m;
  }

  bool get isComplete => selectedCount == rules.totalPlayers && _meetsMinimums();

  String? tryToggle(PlayerInfo p) {
    if (isSelected(p)) {
      _selectedPlayerIds.remove(p.id);
      _onSelectionChanged?.call(selectedPlayerIds);
      notifyListeners();
      return null;
    }

    if (selectedCount >= rules.totalPlayers) {
      return 'You can select only ${rules.totalPlayers} players.';
    }

    if (creditsUsed + p.credits > rules.creditCap) {
      return 'Not enough credits left.';
    }

    final nextTeamCounts = Map<String, int>.from(teamCounts);
    nextTeamCounts[p.teamId] = (nextTeamCounts[p.teamId] ?? 0) + 1;
    if (nextTeamCounts[p.teamId]! > rules.maxFromSingleTeam) {
      return 'Max ${rules.maxFromSingleTeam} players from one team.';
    }

    final nextRoleCount = countRole(p.role) + 1;
    final maxForRole = _maxForRole(p.role);
    if (nextRoleCount > maxForRole) {
      return 'Max $maxForRole ${roleLabel(p.role)} allowed.';
    }

    _selectedPlayerIds.add(p.id);
    _onSelectionChanged?.call(selectedPlayerIds);
    notifyListeners();
    return null;
  }

  String? validateForProceed() {
    if (selectedCount != rules.totalPlayers) {
      return 'Select ${rules.totalPlayers} players to continue.';
    }
    if (!_meetsMinimums()) {
      return 'Meet role minimums: WK ${rules.minWK}, BAT ${rules.minBAT}, AR ${rules.minAR}, BOWL ${rules.minBOWL}.';
    }
    return null;
  }

  void reset() {
    if (_selectedPlayerIds.isEmpty) return;
    _selectedPlayerIds.clear();
    _onSelectionChanged?.call(selectedPlayerIds);
    notifyListeners();
  }

  bool _meetsMinimums() {
    return countRole(PlayerRole.wk) >= rules.minWK &&
        countRole(PlayerRole.bat) >= rules.minBAT &&
        countRole(PlayerRole.ar) >= rules.minAR &&
        countRole(PlayerRole.bowl) >= rules.minBOWL;
  }

  int _maxForRole(PlayerRole role) {
    switch (role) {
      case PlayerRole.wk:
        return rules.maxWK;
      case PlayerRole.bat:
        return rules.maxBAT;
      case PlayerRole.ar:
        return rules.maxAR;
      case PlayerRole.bowl:
        return rules.maxBOWL;
    }
  }
}

