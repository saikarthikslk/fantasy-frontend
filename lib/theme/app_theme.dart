import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

ThemeData buildAppTheme({required Brightness brightness}) {
  final base = ThemeData(
    useMaterial3: true,
    brightness: brightness,
    colorScheme: ColorScheme.fromSeed(
      seedColor: const Color(0xFF8C1D40), // deep fantasy maroon
      brightness: brightness,
    ),
  );

  final textTheme = GoogleFonts.spaceGroteskTextTheme(base.textTheme);

  return base.copyWith(
    textTheme: textTheme,
    appBarTheme: base.appBarTheme.copyWith(
      centerTitle: false,
      scrolledUnderElevation: 0,
      titleTextStyle: textTheme.titleLarge?.copyWith(
        fontWeight: FontWeight.w700,
        letterSpacing: -0.2,
        color: base.colorScheme.onSurface,
      ),
    ),
    cardTheme: base.cardTheme.copyWith(
      elevation: 0,
      clipBehavior: Clip.antiAlias,
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      color: base.colorScheme.surfaceContainerHighest.withOpacity(
        brightness == Brightness.dark ? 0.35 : 0.55,
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        textStyle: textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w700),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
    ),
    inputDecorationTheme: base.inputDecorationTheme.copyWith(
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(color: base.colorScheme.outlineVariant),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(color: base.colorScheme.outlineVariant),
      ),
      filled: true,
      fillColor: base.colorScheme.surfaceContainerHighest.withOpacity(
        brightness == Brightness.dark ? 0.25 : 0.5,
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
    ),
    chipTheme: base.chipTheme.copyWith(
      labelStyle: textTheme.labelMedium?.copyWith(fontWeight: FontWeight.w600),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
      side: BorderSide(color: base.colorScheme.outlineVariant),
    ),
  );
}
