import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/enums.dart';

/// The two apps that share this codebase.
///
/// * [Flavor.client] — the customer app ("Cliente").
/// * [Flavor.professional] — the gardener app ("Profissional").
///
/// The flavor is selected by the entrypoint (`main_client.dart` /
/// `main_professional.dart`) and drives routing, theming accents and which
/// role we authenticate as.
enum Flavor { client, professional }

class FlavorConfig {
  const FlavorConfig({required this.flavor, required this.appName});

  final Flavor flavor;
  final String appName;

  bool get isClient => flavor == Flavor.client;
  bool get isProfessional => flavor == Flavor.professional;

  /// The [UserRole] this build authenticates and registers as.
  UserRole get role => isClient ? UserRole.client : UserRole.gardener;

  static FlavorConfig _instance = const FlavorConfig(
    flavor: Flavor.client,
    appName: 'JardimJá',
  );

  /// Globally accessible flavor (for code paths outside the Riverpod tree).
  static FlavorConfig get instance => _instance;

  /// Called once from `main_*.dart` before `runApp`.
  static void set(FlavorConfig config) => _instance = config;
}

/// Riverpod handle for the active flavor. Overridden in `ProviderScope` by the
/// entrypoint so widgets/routers can read it reactively.
final flavorProvider = Provider<FlavorConfig>(
  (ref) => FlavorConfig.instance,
);
