import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app.dart';
import 'core/config/flavor.dart';

/// Entrypoint for the **Cliente** (customer) app.
///
/// Run with:
/// ```
/// flutter run --flavor client -t lib/main_client.dart
/// ```
void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);

  const config = FlavorConfig(flavor: Flavor.client, appName: 'JardimJá');
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
