import 'package:flutter/material.dart';

import '../routing/app_router.dart';
import '../theme/app_theme.dart';

class Dream11LikeApp extends StatelessWidget {
  const Dream11LikeApp({super.key});

  @override
  Widget build(BuildContext context) {
    final router = createAppRouter();

    return MaterialApp.router(
      title: 'Fantasy XI',
      theme: buildAppTheme(brightness: Brightness.light),
      darkTheme: buildAppTheme(brightness: Brightness.dark),
      themeMode: ThemeMode.system,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
    );
  }
}
