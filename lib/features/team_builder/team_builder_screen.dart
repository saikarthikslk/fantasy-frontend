import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:myapp/data/teamselection_api.dart';

import '../../data/players_api.dart';
import '../../data/team_draft_store.dart';
import '../../domain/models.dart';
import 'team_builder_controller.dart';

class TeamBuilderScreen extends StatefulWidget {
  const TeamBuilderScreen({super.key, required this.matchId});

  final String matchId;

  @override
  State<TeamBuilderScreen> createState() => _TeamBuilderScreenState();
}

class _TeamBuilderScreenState extends State<TeamBuilderScreen> {
  TeamBuilderController? controller;
  PlayerRole? roleFilter;

  @override
  void dispose() {
    controller
      ?..removeListener(_onChanged)
      ..dispose();
    super.dispose();
  }

  void _onChanged() => setState(() {});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    // We expect MatchScreen to always pass a valid matchId,
    // so we don't look it up via mock data anymore.

    return Scaffold(
      appBar: AppBar(
        title: const Text('Create Team'),
        actions: [
          IconButton(
            tooltip: 'Reset',
            onPressed: () {
              controller?.reset();
            },
            icon: const Icon(Icons.refresh_rounded),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: FutureBuilder<List<PlayerInfo>>(
        future: PlayersApi().fetchPlayersForMatch(widget.matchId),
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
          if (allPlayers.isEmpty) {
            return const Center(child: Text('No players returned from API.'));
          }

          controller ??= _createController(allPlayers);
          final c = controller!;

          final players = c.allPlayers
              .where((p) => roleFilter == null || p.role == roleFilter)
              .toList();

          return Column(
            children: [
              _TopStatusBar(controller: c),
              const SizedBox(height: 10),
              SizedBox(
                height: 44,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  children: [
                    _RoleChip(
                      selected: roleFilter == null,
                      label: 'All',
                      onTap: () => setState(() => roleFilter = null),
                    ),
                    const SizedBox(width: 10),
                    for (final role in PlayerRole.values) ...[
                      _RoleChip(
                        selected: roleFilter == role,
                        label: roleLabel(role),
                        onTap: () => setState(() => roleFilter = role),
                      ),
                      const SizedBox(width: 10),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 8),
              Expanded(
                child: ListView.builder(
                  itemCount: players.length,
                  itemBuilder: (context, index) {
                    final p = players[index];
                    final selected = c.isSelected(p);

                    return Card(
                      child: ListTile(
                        leading: ClipOval(
                          child: Image.network(
                            p.imageUrl,
                            fit: BoxFit
                                .contain, // cover fills the circle completely
                            width: 80,
                            height: 80,
                            errorBuilder: (context, error, stackTrace) =>
                                Icon(Icons.person),
                          ),
                        ),
                        title: Text(
                          p.name,
                          style: Theme.of(context)
                              .textTheme
                              .titleMedium
                              ?.copyWith(fontWeight: FontWeight.w900),
                        ),
                        subtitle: Text(
                          'Role ${roleLabel(p.role)}',
                        ),
                        trailing: FilledButton(
                          onPressed: () {
                            final msg = c.tryToggle(p);
                            if (msg != null) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(msg),
                                  behavior: SnackBarBehavior.floating,
                                ),
                              );
                            }
                          },
                          style: FilledButton.styleFrom(
                            backgroundColor: selected
                                ? cs.surfaceContainerHighest
                                : cs.primary,
                            foregroundColor:
                                selected ? cs.onSurface : cs.onPrimary,
                          ),
                          child: Text(selected ? 'Remove' : 'Add'),
                        ),
                      ),
                    );
                  },
                ),
              ),
              _BottomBar(
                controller: c,
                onPreview: () {
                  final msg = c.validateForProceed();
                  if (msg != null) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(msg),
                        behavior: SnackBarBehavior.floating,
                      ),
                    );
                    return;
                  }
                  Map<String,dynamic> body = {"matchid":widget.matchId };
                  var players = [];
                  for (var player in this.controller!.selectedPlayers) {
                    players.add({"playerid":player.id , "type":player.role.toString()});
                  }
                  body["properties"] = players;
                  print(body);
                  TeamselectionApi().saveteam(body);

                  context.go('/matches/${widget.matchId}/preview');
                },
              ),
            ],
          );
        },
      ),
    );
  }

  TeamBuilderController _createController(List<PlayerInfo> allPlayers) {
    final store = TeamDraftStore.instance;
    final c = TeamBuilderController(
      matchId: widget.matchId,
      allPlayers: allPlayers,
      initialSelectedPlayerIds: store.getDraft(widget.matchId),
      onSelectionChanged: (ids) => store.saveDraft(widget.matchId, ids),
    );
    c.addListener(_onChanged);
    return c;
  }
}

class _TopStatusBar extends StatelessWidget {
  const _TopStatusBar({required this.controller});

  final TeamBuilderController controller;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final teamCounts = controller.teamCounts;
    final values = teamCounts.values.toList()..sort();
    final maxFromSingle =
        values.isEmpty ? 0 : values.reduce((a, b) => a > b ? a : b);

    Widget stat(String label, String value) {
      return Expanded(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: cs.outlineVariant.withOpacity(0.65)),
            color: cs.surfaceContainerHighest.withOpacity(0.30),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                    color: cs.onSurfaceVariant, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 6),
              Text(
                value,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w900,
                      letterSpacing: -0.2,
                    ),
              ),
            ],
          ),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: [
          Row(
            children: [
              stat('Selected',
                  '${controller.selectedCount}/${controller.rules.totalPlayers}'),
              const SizedBox(width: 10),
              stat('Credits left', controller.creditsLeft.toStringAsFixed(1)),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              stat('From one side', '$maxFromSingle'),
            ],
          ),
          const SizedBox(height: 8),
          Align(
            alignment: Alignment.centerLeft,
            child: Text(
              'Minimums: WK ${controller.rules.minWK}, BAT ${controller.rules.minBAT}, AR ${controller.rules.minAR}, BOWL ${controller.rules.minBOWL}',
              style: Theme.of(context)
                  .textTheme
                  .bodySmall
                  ?.copyWith(color: cs.onSurfaceVariant),
            ),
          ),
        ],
      ),
    );
  }
}

class _RoleChip extends StatelessWidget {
  const _RoleChip(
      {required this.selected, required this.label, required this.onTap});

  final bool selected;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return InkWell(
      borderRadius: BorderRadius.circular(999),
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(999),
          color: selected
              ? cs.primary
              : cs.surfaceContainerHighest.withOpacity(0.35),
          border: Border.all(
            color: selected ? cs.primary : cs.outlineVariant.withOpacity(0.7),
          ),
        ),
        child: Text(
          label,
          style: Theme.of(context).textTheme.labelLarge?.copyWith(
                fontWeight: FontWeight.w900,
                color: selected ? cs.onPrimary : cs.onSurface,
              ),
        ),
      ),
    );
  }
}

class _BottomBar extends StatelessWidget {
  const _BottomBar({required this.controller, required this.onPreview});

  final TeamBuilderController controller;
  final VoidCallback onPreview;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final roleCounts = {
      PlayerRole.wk: controller.countRole(PlayerRole.wk),
      PlayerRole.bat: controller.countRole(PlayerRole.bat),
      PlayerRole.ar: controller.countRole(PlayerRole.ar),
      PlayerRole.bowl: controller.countRole(PlayerRole.bowl),
    };

    Widget pill(PlayerRole role) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: cs.outlineVariant.withOpacity(0.7)),
          color: cs.surfaceContainerHighest.withOpacity(0.35),
        ),
        child: Text(
          '${roleLabel(role)} ${roleCounts[role]}',
          style: Theme.of(context).textTheme.labelMedium?.copyWith(
                fontWeight: FontWeight.w900,
              ),
        ),
      );
    }

    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
        decoration: BoxDecoration(
          color: cs.surface,
          border: Border(
              top: BorderSide(color: cs.outlineVariant.withOpacity(0.7))),
        ),
        child: Row(
          children: [
            Expanded(
              child: Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final r in PlayerRole.values) pill(r),
                ],
              ),
            ),
            const SizedBox(width: 12),
            FilledButton.icon(
              onPressed: onPreview,
              icon: const Icon(Icons.check_circle_outline_rounded),
              label: const Text('Create'),
            ),
          ],
        ),
      ),
    );
  }
}
