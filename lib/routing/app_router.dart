import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../data/auth_token_store.dart';
import '../domain/models.dart';
import '../features/auth/login_screen.dart';
import '../features/matches/matches_screen.dart';
import '../features/matches/match_screen.dart';
import '../features/team_builder/team_builder_screen.dart';
import '../features/team_builder/team_preview_screen.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();

GoRouter createAppRouter() {
  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/login',
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/matches',
        builder: (context, state) {
          final token = state.uri.queryParameters['token'];
          if (token != null && token.isNotEmpty) {
            AuthTokenStore.instance.setToken(token);
          }
          return const MatchesScreen();
        },
        routes: [
          GoRoute(
            path: ':matchId',
            builder: (context, state) {
              final matchId = state.pathParameters['matchId']!;
              final match = state.extra is MatchInfo ? state.extra as MatchInfo : null;
              return MatchScreen(matchId: matchId, initialMatch: match);
            },
            routes: [
              GoRoute(
                path: 'build',
                builder: (context, state) {
                  final matchId = state.pathParameters['matchId']!;
                  return TeamBuilderScreen(matchId: matchId);
                },
              ),
              GoRoute(
                path: 'preview',
                builder: (context, state) {
                  final matchId = state.pathParameters['matchId']!;
                  return TeamPreviewScreen(matchId: matchId);
                },
              ),
            ],
          ),
        ],
      ),
    ],
  );
}

