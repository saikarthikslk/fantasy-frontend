import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../data/players_api.dart';
import '../../domain/models.dart';
import '../shared/ui/section_header.dart';

class MatchScreen extends StatelessWidget {
  const MatchScreen({
    super.key,
    required this.matchId,
    this.initialMatch,
  });

  final String matchId;
  final MatchInfo? initialMatch;

  @override
  Widget build(BuildContext context) {
    final match = initialMatch;
    if (match == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Match')),
        body: const Center(child: Text('Match not found')),
      );
    }

    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: Text('${match.teamA.shortName} vs ${match.teamB.shortName}'),
        actions: [
          IconButton(
            tooltip: 'Share',
            onPressed: () {},
            icon: const Icon(Icons.ios_share_rounded),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: ListView(
        children: [
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: SectionHeader(
              title: match.tournament,
              subtitle: '${match.venue} • ${_prettyStart(match.startTime)}',
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Quick build',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w900,
                        ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'Create your team in under a minute using recent-form hints. You can edit later.',
                    style: Theme.of(context)
                        .textTheme
                        .bodyMedium
                        ?.copyWith(color: cs.onSurfaceVariant),
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: FilledButton.icon(
                          onPressed: () => context.go('/matches/$matchId/build'),
                          icon: const Icon(Icons.groups_rounded),
                          label: const Text('Create Team'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      OutlinedButton.icon(
                        onPressed: () => context.go('/matches/$matchId/preview'),
                        icon: const Icon(Icons.visibility_outlined),
                        label: const Text('Preview'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              'Players (from API)',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w900,
                  ),
            ),
          ),
          const SizedBox(height: 8),
          FutureBuilder<List<PlayerInfo>>(
            future: PlayersApi().fetchPlayersForMatch(matchId),
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Padding(
                  padding: EdgeInsets.all(16),
                  child: Center(child: CircularProgressIndicator()),
                );
              }
              if (snapshot.hasError) {
                return Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(
                    'Couldn\'t load players for this match.',
                    style: Theme.of(context)
                        .textTheme
                        .bodyMedium
                        ?.copyWith(color: cs.onSurfaceVariant),
                  ),
                );
              }
              final players = snapshot.data ?? const <PlayerInfo>[];
              if (players.isEmpty) {
                return const Padding(
                  padding: EdgeInsets.all(16),
                  child: Text('No players returned from API.'),
                );
              }

              return Column(
                children: [
                  for (final p in players)
                    Card(
                      child: ListTile(
                        leading: CircleAvatar(
                          child: Text(
                            roleLabel(p.role),
                            style: Theme.of(context)
                                .textTheme
                                .labelSmall
                                ?.copyWith(
                                  fontWeight: FontWeight.w900,
                                  color: cs.onSurface,
                                ),
                          ),
                        ),
                        title: Text(
                          p.name,
                          style: Theme.of(context)
                              .textTheme
                              .titleMedium
                              ?.copyWith(fontWeight: FontWeight.w800),
                        ),
                        subtitle: Text('Role ${roleLabel(p.role)}'),
                      ),
                    ),
                  const SizedBox(height: 24),
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}

String _prettyStart(DateTime dt) {
  final hh = dt.hour.toString().padLeft(2, '0');
  final mm = dt.minute.toString().padLeft(2, '0');
  return '${dt.day}/${dt.month} $hh:$mm';
}

