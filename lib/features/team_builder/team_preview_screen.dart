import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../data/players_api.dart';
import '../../data/team_draft_store.dart';
import '../../domain/models.dart';
import 'team_builder_controller.dart';

class TeamPreviewScreen extends StatelessWidget {
  const TeamPreviewScreen({super.key, required this.matchId});

  final String matchId;

  @override
  Widget build(BuildContext context) {
    final selectedIds = TeamDraftStore.instance.getDraft(matchId);
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Team Preview'),
        actions: [
          TextButton.icon(
            onPressed: () => context.go('/matches/$matchId/build'),
            icon: const Icon(Icons.edit_outlined),
            label: const Text('Edit'),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: FutureBuilder<List<PlayerInfo>>(
        future: PlayersApi().fetchPlayersForMatch(matchId),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Text(
                  'Couldn\'t load players for this match.',
                  style: Theme.of(context)
                      .textTheme
                      .bodyMedium
                      ?.copyWith(color: cs.onSurfaceVariant),
                  textAlign: TextAlign.center,
                ),
              ),
            );
          }

          final allPlayers = snapshot.data ?? const <PlayerInfo>[];
          final controller = TeamBuilderController(
            matchId: matchId,
            allPlayers: allPlayers,
            initialSelectedPlayerIds: selectedIds,
          );
      
          return ListView(
            children: [
              const SizedBox(height: 8),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Text(
                  'Selected team',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w900,
                      ),
                ),
              ),
              const SizedBox(height: 12),
              if (controller.selectedPlayers.isEmpty)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(18),
                      border:
                          Border.all(color: cs.outlineVariant.withOpacity(0.7)),
                      color: cs.surfaceContainerHighest.withOpacity(0.25),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.info_outline_rounded,
                            color: cs.onSurfaceVariant),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            'No players selected yet. Tap Edit to create your XI.',
                            style: Theme.of(context)
                                .textTheme
                                .bodyMedium
                                ?.copyWith(color: cs.onSurfaceVariant),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              const SizedBox(height: 16),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Text(
                  'Roles',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w900,
                      ),
                ),
              ),
              const SizedBox(height: 8),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: [
                      for (final r in PlayerRole.values)
                        _RoleStat(
                          label: roleLabel(r),
                          value: controller.countRole(r).toString(),
                        ),
                      _RoleStat(
                        label: 'Credits',
                        value:
                            '${controller.creditsUsed.toStringAsFixed(1)}/${controller.rules.creditCap.toStringAsFixed(0)}',
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
              if (controller.selectedPlayers.isNotEmpty) ...[
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Text(
                    'Selected XI',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w900,
                        ),
                  ),
                ),
                const SizedBox(height: 8),
                for (final p in controller.selectedPlayers)
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
                            ?.copyWith(fontWeight: FontWeight.w900),
                      ),
                      subtitle: Text('Credits ${p.credits.toStringAsFixed(1)}'),
                      trailing: Text(
                        '${p.recentPoints} pts',
                        style: Theme.of(context)
                            .textTheme
                            .labelLarge
                            ?.copyWith(
                              fontWeight: FontWeight.w900,
                              color: cs.onSurfaceVariant,
                            ),
                      ),
                    ),
                  ),
              ],
              const SizedBox(height: 24),
            ],
          );
        },
      ),
    );
  }
}

class _RoleStat extends StatelessWidget {
  const _RoleStat({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: cs.outlineVariant.withOpacity(0.7)),
        color: cs.surfaceContainerHighest.withOpacity(0.28),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
                  color: cs.onSurfaceVariant,
                  fontWeight: FontWeight.w700,
                ),
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w900,
                ),
          ),
        ],
      ),
    );
  }
}

