import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/login_screen.dart';
import '../../features/auth/register_screen.dart';
import '../../features/capture/capture_screen.dart';
import '../../features/chat/chat_screen.dart';
import '../../features/checkin/checkin_screen.dart';
import '../../features/home/client_home_screen.dart';
import '../../features/home/splash_screen.dart';
import '../../features/marketplace/feed_screen.dart';
import '../../features/marketplace/offer_detail_screen.dart';
import '../../features/payments/payment_screen.dart';
import '../../features/profile/gardener_onboarding_screen.dart';
import '../../features/profile/profile_screen.dart';
import '../../features/quote/analyzing_screen.dart';
import '../../features/quote/quote_review_screen.dart';
import '../../features/reviews/review_screen.dart';
import '../../features/offers/offers_list_screen.dart';
import '../../features/service_selection/service_grid_screen.dart';
import '../../features/tracking/tracking_screen.dart';
import '../config/flavor.dart';
import '../models/enums.dart';
import '../providers/auth_provider.dart';

/// All named route paths in one place. Detail routes take a `:jobId` segment.
class Routes {
  const Routes._();

  static const splash = '/splash';
  static const login = '/login';
  static const register = '/register';
  static const home = '/';
  static const profile = '/profile';

  // Client
  static const services = '/services';
  static const capture = '/capture';
  static String analyzing(String jobId) => '/analyzing/$jobId';
  static String quote(String jobId) => '/quote/$jobId';
  static String offers(String jobId) => '/offers/$jobId';
  static String tracking(String jobId) => '/tracking/$jobId';
  static String payment(String jobId) => '/payment/$jobId';
  static String review(String jobId) => '/review/$jobId';

  // Shared
  static String chat(String jobId) => '/chat/$jobId';

  // Professional
  static String offerDetail(String jobId) => '/offer/$jobId';
  static String checkin(String jobId) => '/checkin/$jobId';
  static const onboarding = '/onboarding';
}

/// Builds the [GoRouter], wiring auth-based redirects and the role-aware home.
final routerProvider = Provider<GoRouter>((ref) {
  // Bump a Listenable whenever auth changes so go_router re-evaluates redirect.
  final refresh = ValueNotifier(0);
  ref.listen(authControllerProvider, (_, __) => refresh.value++);
  ref.onDispose(refresh.dispose);

  final flavor = ref.read(flavorProvider);

  return GoRouter(
    initialLocation: Routes.splash,
    refreshListenable: refresh,
    redirect: (context, state) {
      final auth = ref.read(authControllerProvider);
      final loc = state.matchedLocation;
      final onSplash = loc == Routes.splash;
      final onAuth = loc == Routes.login || loc == Routes.register;

      switch (auth.status) {
        case AuthStatus.unknown:
          return onSplash ? null : Routes.splash;
        case AuthStatus.unauthenticated:
          return onAuth ? null : Routes.login;
        case AuthStatus.authenticated:
          if (onSplash || onAuth) return Routes.home;
          return null;
      }
    },
    routes: [
      GoRoute(
        path: Routes.splash,
        builder: (_, __) => const SplashScreen(),
      ),
      GoRoute(
        path: Routes.login,
        builder: (_, __) => const LoginScreen(),
      ),
      GoRoute(
        path: Routes.register,
        builder: (_, __) => const RegisterScreen(),
      ),

      // Role-aware landing.
      GoRoute(
        path: Routes.home,
        builder: (_, __) => flavor.isClient
            ? const ClientHomeScreen()
            : const FeedScreen(),
      ),
      GoRoute(
        path: Routes.profile,
        builder: (_, __) => const ProfileScreen(),
      ),

      // ── Client routes ────────────────────────────────────────────────
      GoRoute(
        path: Routes.services,
        builder: (_, __) => const ServiceGridScreen(),
      ),
      GoRoute(
        path: Routes.capture,
        builder: (context, state) {
          final selected = (state.extra as List<ServiceType>?) ?? const [];
          return CaptureScreen(selectedServices: selected);
        },
      ),
      GoRoute(
        path: '/analyzing/:jobId',
        builder: (_, s) => AnalyzingScreen(jobId: s.pathParameters['jobId']!),
      ),
      GoRoute(
        path: '/quote/:jobId',
        builder: (_, s) => QuoteReviewScreen(jobId: s.pathParameters['jobId']!),
      ),
      GoRoute(
        path: '/offers/:jobId',
        builder: (_, s) => OffersListScreen(jobId: s.pathParameters['jobId']!),
      ),
      GoRoute(
        path: '/tracking/:jobId',
        builder: (_, s) => TrackingScreen(jobId: s.pathParameters['jobId']!),
      ),
      GoRoute(
        path: '/payment/:jobId',
        builder: (_, s) => PaymentScreen(jobId: s.pathParameters['jobId']!),
      ),
      GoRoute(
        path: '/review/:jobId',
        builder: (_, s) => ReviewScreen(jobId: s.pathParameters['jobId']!),
      ),

      // ── Shared ───────────────────────────────────────────────────────
      GoRoute(
        path: '/chat/:jobId',
        builder: (_, s) => ChatScreen(jobId: s.pathParameters['jobId']!),
      ),

      // ── Professional routes ──────────────────────────────────────────
      GoRoute(
        path: '/offer/:jobId',
        builder: (_, s) => OfferDetailScreen(jobId: s.pathParameters['jobId']!),
      ),
      GoRoute(
        path: '/checkin/:jobId',
        builder: (_, s) => CheckinScreen(jobId: s.pathParameters['jobId']!),
      ),
      GoRoute(
        path: Routes.onboarding,
        builder: (_, __) => const GardenerOnboardingScreen(),
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      appBar: AppBar(title: const Text('Ops')),
      body: Center(child: Text('Rota não encontrada: ${state.uri}')),
    ),
  );
});
