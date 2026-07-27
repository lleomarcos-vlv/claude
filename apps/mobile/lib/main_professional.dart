import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app.dart';
import 'core/config/flavor.dart';

/// Entrypoint for the **Profissional** (gardener) app.
///
/// Run with:
/// ```
/// flutter run --flavor professional -t lib/main_professional.dart
/// ```
void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);

  const config =
      FlavorConfig(flavor: Flavor.professional, appName: 'JardimJá Profissional');
  FlavorConfig.set(config);

  runApp(
    ProviderScope(
      overrides: [
        flavorProvider.overrideWithValue(config),
      ],
      child: const JardimJaApp(),
    ),
  );
}
