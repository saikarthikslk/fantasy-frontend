import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../data/auth_token_store.dart';
import '../../data/matches_api.dart';
import '../../domain/models.dart';
import '../shared/ui/section_header.dart';

class MatchesScreen extends StatelessWidget {
  const MatchesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Matches'),
        actions: [
          IconButton(
            tooltip: 'Search',
            onPressed: () {},
            icon: const Icon(Icons.search_rounded),
          ),
          IconButton(
            tooltip: 'Wallet',
            onPressed: () {},
            icon: const Icon(Icons.account_balance_wallet_outlined),
          ),
          IconButton(
            tooltip: 'Logout',
            onPressed: () {
              AuthTokenStore.instance.setToken(null);
              context.go('/login');
            },
            icon: const Icon(Icons.logout),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: FutureBuilder<List<MatchInfo>>(
        future: MatchesApi().fetchMatches(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.wifi_off_rounded, size: 40),
                    const SizedBox(height: 12),
                    Text(
                      'Couldn\'t load matches',
                      style: Theme.of(context)
                          .textTheme
                          .titleMedium
                          ?.copyWith(fontWeight: FontWeight.w900),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Check your connection and that the backend is reachable.',
                      textAlign: TextAlign.center,
                      style: Theme.of(context)
                          .textTheme
                          .bodyMedium
                          ?.copyWith(color: cs.onSurfaceVariant),
                    ),
                  ],
                ),
              ),
            );
          }

          final matches = snapshot.data ?? const <MatchInfo>[];
          if (matches.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Text(
                  'No upcoming matches found.',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ),
            );
          }

          return ListView(
            children: [
              const SizedBox(height: 8),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 16),
                child: SectionHeader(
                  title: 'Upcoming',
                  subtitle: 'Build your XI before the deadline.',
                ),
              ),
              const SizedBox(height: 8),
              for (final m in matches) _MatchCard(match: m),
              const SizedBox(height: 24),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(18),
                    gradient: LinearGradient(
                      colors: [
                        cs.primary.withOpacity(0.16),
                        cs.tertiary.withOpacity(0.10),
                      ],
                    ),
                    border: Border.all(color: cs.outlineVariant.withOpacity(0.6)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.insights_rounded),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Tip: Mix safe picks with 1–2 differentials for higher rank.',
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
            ],
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {},
        icon: const Icon(Icons.local_fire_department_outlined),
        label: const Text('Contests'),
      ),
    );
  }
}

class _MatchCard extends StatelessWidget {
  const _MatchCard({required this.match});

  final MatchInfo match;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final now = DateTime.now();
    final diff = match.startTime.difference(now);
    final h = diff.inHours;
    final m = diff.inMinutes % 60;
    final timeLeft =
        diff.isNegative ? (match.status ?? 'Live') : '${h}h ${m}m';

    return Card(
      child: InkWell(
        onTap: () => context.go('/matches/${match.id}', extra: match),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      match.tournament,
                      style: Theme.of(context).textTheme.labelLarge?.copyWith(
                            fontWeight: FontWeight.w700,
                            color: cs.onSurfaceVariant,
                          ),
                    ),
                  ),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(999),
                      color: cs.primary.withOpacity(0.10),
                      border: Border.all(
                        color: cs.primary.withOpacity(0.35),
                      ),
                    ),
                    child: Text(
                      timeLeft,
                      style: Theme.of(context).textTheme.labelMedium?.copyWith(
                            fontWeight: FontWeight.w800,
                            color: cs.primary,
                          ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  _TeamPill(team: match.teamA),
                  const SizedBox(width: 10),
                  Text(
                    'vs',
                    style: Theme.of(context).textTheme.labelLarge?.copyWith(
                          color: cs.onSurfaceVariant,
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                  const SizedBox(width: 10),
                  _TeamPill(team: match.teamB),
                ],
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Icon(Icons.place_outlined, size: 16, color: cs.onSurfaceVariant),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      match.venue,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: cs.onSurfaceVariant,
                          ),
                    ),
                  ),
                  Icon(Icons.chevron_right_rounded,
                      color: cs.onSurfaceVariant),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TeamPill extends StatelessWidget {
  const _TeamPill({required this.team});

  final TeamInfo team;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          color: cs.surface.withOpacity(0.5),
          border: Border.all(color: cs.outlineVariant.withOpacity(0.7)),
        ),
        child: Row(
          children: [
            Container(
              width: 12,
              height: 12,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Color(team.primaryColor),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                team.shortName,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.3,
                    ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

