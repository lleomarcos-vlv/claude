import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/flavor.dart';
import '../models/user.dart';
import '../network/api_client.dart';
import '../network/endpoints.dart';
import '../network/token_storage.dart';

/// Where we are in the auth lifecycle. `unknown` is the splash/bootstrap
/// state while we check secure storage for an existing session.
enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthState {
  const AuthState({
    this.status = AuthStatus.unknown,
    this.user,
    this.submitting = false,
    this.error,
  });

  final AuthStatus status;
  final User? user;

  /// True while a login/register request is in flight (drives button spinner).
  final bool submitting;
  final String? error;

  bool get isAuthenticated => status == AuthStatus.authenticated && user != null;

  AuthState copyWith({
    AuthStatus? status,
    User? user,
    bool? submitting,
    Object? error = _sentinel,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: user ?? this.user,
      submitting: submitting ?? this.submitting,
      error: identical(error, _sentinel) ? this.error : error as String?,
    );
  }

  static const _sentinel = Object();
}

class AuthController extends Notifier<AuthState> {
  ApiClient get _api => ref.read(apiClientProvider);
  TokenStorage get _tokens => ref.read(tokenStorageProvider);

  @override
  AuthState build() {
    // Hook the interceptor so a failed refresh drops us back to login.
    ref.read(authInterceptorProvider).onSessionExpired = () {
      state = const AuthState(status: AuthStatus.unauthenticated);
    };
    // Kick off session restore without blocking the synchronous build.
    Future.microtask(_bootstrap);
    return const AuthState(status: AuthStatus.unknown);
  }

  Future<void> _bootstrap() async {
    if (!await _tokens.hasSession) {
      state = const AuthState(status: AuthStatus.unauthenticated);
      return;
    }
    try {
      final me = await _api.getJson(Endpoints.me);
      state = AuthState(status: AuthStatus.authenticated, user: User.fromJson(me));
    } catch (_) {
      await _tokens.clear();
      state = const AuthState(status: AuthStatus.unauthenticated);
    }
  }

  Future<bool> login({required String email, required String password}) async {
    state = state.copyWith(submitting: true, error: null);
    try {
      final res = await _api.postJson(
        Endpoints.login,
        body: {'email': email.trim(), 'password': password},
      );
      await _persistSession(res);
      return true;
    } on DioException catch (e) {
      state = state.copyWith(submitting: false, error: _messageFor(e));
      return false;
    } catch (_) {
      state = state.copyWith(
          submitting: false, error: 'Não foi possível entrar. Tente novamente.');
      return false;
    }
  }

  Future<bool> register({
    required String name,
    required String email,
    required String password,
    String? phone,
  }) async {
    state = state.copyWith(submitting: true, error: null);
    try {
      final res = await _api.postJson(
        Endpoints.register,
        body: {
          'name': name.trim(),
          'email': email.trim(),
          'password': password,
          if (phone != null && phone.isNotEmpty) 'phone': phone,
          // The flavor decides which role we sign up as.
          'role': ref.read(flavorProvider).role.wire,
        },
      );
      await _persistSession(res);
      return true;
    } on DioException catch (e) {
      state = state.copyWith(submitting: false, error: _messageFor(e));
      return false;
    } catch (_) {
      state = state.copyWith(
          submitting: false, error: 'Falha no cadastro. Tente novamente.');
      return false;
    }
  }

  Future<void> refreshMe() async {
    try {
      final me = await _api.getJson(Endpoints.me);
      state = AuthState(status: AuthStatus.authenticated, user: User.fromJson(me));
    } catch (_) {/* keep current state */}
  }

  Future<void> logout() async {
    await _tokens.clear();
    state = const AuthState(status: AuthStatus.unauthenticated);
  }

  Future<void> _persistSession(Map<String, dynamic> res) async {
    // Accept either a flat `{accessToken, refreshToken, user}` payload or a
    // nested `{tokens: {...}, user}` one.
    final tokens = res['tokens'] is Map ? res['tokens'] as Map : res;
    final access = tokens['accessToken'] as String?;
    final refresh = tokens['refreshToken'] as String?;
    if (access != null && refresh != null) {
      await _tokens.save(access: access, refresh: refresh);
    }
    final userJson = res['user'] as Map<String, dynamic>?;
    final user = userJson != null ? User.fromJson(userJson) : null;
    state = AuthState(
      status: AuthStatus.authenticated,
      user: user,
      submitting: false,
    );
    if (user == null) await refreshMe();
  }

  String _messageFor(DioException e) {
    final data = e.response?.data;
    if (data is Map && data['message'] != null) {
      final m = data['message'];
      if (m is List && m.isNotEmpty) return m.first.toString();
      return m.toString();
    }
    if (e.response?.statusCode == 401) return 'E-mail ou senha inválidos.';
    return 'Erro de conexão. Verifique sua internet.';
  }
}

final authControllerProvider =
    NotifierProvider<AuthController, AuthState>(AuthController.new);

/// Convenience selectors.
final currentUserProvider = Provider<User?>(
  (ref) => ref.watch(authControllerProvider).user,
);
