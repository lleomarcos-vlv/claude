import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/config/flavor.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';

/// The root widget shared by both flavors. The concrete flavor is provided by
/// the entrypoint via a `ProviderScope` override of [flavorProvider].
class JardimJaApp extends ConsumerWidget {
  const JardimJaApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    final flavor = ref.watch(flavorProvider);

    return MaterialApp.router(
      title: flavor.isClient ? 'JardimJá' : 'JardimJá Profissional',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: ThemeMode.light,
      routerConfig: router,
    );
  }
}
