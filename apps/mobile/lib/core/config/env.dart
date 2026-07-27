/// Compile-time environment configuration.
///
/// Values are injected at build time via `--dart-define` (or a
/// `--dart-define-from-file=env.json`) so no secret is ever committed:
///
/// ```
/// flutter run --flavor client -t lib/main_client.dart \
///   --dart-define=API_BASE_URL=https://api.jardimja.com.br \
///   --dart-define=GOOGLE_MAPS_API_KEY=AIza...
/// ```
class Env {
  const Env._();

  /// Base URL of the JardimJá backend (without the `/api/v1` suffix).
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://api.jardimja.com.br',
  );

  /// Google Maps key used by `google_maps_flutter` (also wired natively in
  /// AndroidManifest / AppDelegate — this copy is for the Dart layer only).
  static const String googleMapsApiKey = String.fromEnvironment(
    'GOOGLE_MAPS_API_KEY',
    defaultValue: '',
  );

  /// Toggle verbose Dio logging.
  static const bool enableNetworkLogs = bool.fromEnvironment(
    'ENABLE_NETWORK_LOGS',
    defaultValue: true,
  );

  /// Versioned REST prefix. All [Endpoints] paths are relative to this.
  static String get apiV1 => '$apiBaseUrl/api/v1';
}
