import 'dart:collection';

class TeamDraftStore {
  TeamDraftStore._();

  static final TeamDraftStore instance = TeamDraftStore._();

  final Map<String, LinkedHashSet<String>> _drafts = {};

  LinkedHashSet<String> getDraft(String matchId) {
    return LinkedHashSet<String>.from(_drafts[matchId] ?? const <String>{});
  }

  void saveDraft(String matchId, Set<String> playerIds) {
    _drafts[matchId] = LinkedHashSet<String>.from(playerIds);
  }

  void clear(String matchId) {
    _drafts.remove(matchId);
  }
}
