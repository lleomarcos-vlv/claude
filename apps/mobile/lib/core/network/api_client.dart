import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/env.dart';
import 'endpoints.dart';
import 'token_storage.dart';

/// Dio interceptor that:
///  1. attaches the bearer access token to every request, and
///  2. transparently refreshes it once on a 401 and replays the request.
///
/// Refresh uses a *separate* bare Dio instance so it can never recurse through
/// this interceptor. If refresh fails the session is cleared and the error
/// bubbles up so the router can redirect to login.
class AuthInterceptor extends Interceptor {
  AuthInterceptor(this._tokens)
      : _refreshDio = Dio(BaseOptions(baseUrl: Env.apiV1));

  final TokenStorage _tokens;
  final Dio _refreshDio;

  /// Public sink so `AuthController` can react to a hard logout.
  void Function()? onSessionExpired;

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    // Login/register/refresh must not carry a (possibly stale) token.
    final isAuthCall = options.path.startsWith('/auth/');
    if (!isAuthCall) {
      final token = await _tokens.readAccess();
      if (token != null && token.isNotEmpty) {
        options.headers['Authorization'] = 'Bearer $token';
      }
    }
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final response = err.response;
    final alreadyRetried = err.requestOptions.extra['__retried__'] == true;

    if (response?.statusCode == 401 && !alreadyRetried) {
      final refreshed = await _tryRefresh();
      if (refreshed) {
        try {
          final newToken = await _tokens.readAccess();
          final opts = err.requestOptions
            ..extra['__retried__'] = true
            ..headers['Authorization'] = 'Bearer $newToken';
          final clone = await _refreshDio.fetch<dynamic>(opts);
          return handler.resolve(clone);
        } catch (_) {
          // fall through to session-expired below
        }
      }
      await _tokens.clear();
      onSessionExpired?.call();
    }
    handler.next(err);
  }

  Future<bool> _tryRefresh() async {
    final refresh = await _tokens.readRefresh();
    if (refresh == null || refresh.isEmpty) return false;
    try {
      final res = await _refreshDio.post<Map<String, dynamic>>(
        Endpoints.refresh,
        data: {'refreshToken': refresh},
      );
      final data = res.data ?? const {};
      final access = data['accessToken'] as String?;
      final newRefresh = data['refreshToken'] as String? ?? refresh;
      if (access == null) return false;
      await _tokens.save(access: access, refresh: newRefresh);
      return true;
    } catch (_) {
      return false;
    }
  }
}

/// Thin wrapper over Dio exposing the verbs the controllers use and unwrapping
/// the `{ data: ... }` envelope when the backend sends one.
class ApiClient {
  ApiClient(this.dio);

  final Dio dio;

  Future<Map<String, dynamic>> getJson(
    String path, {
    Map<String, dynamic>? query,
  }) async {
    final res = await dio.get<dynamic>(path, queryParameters: query);
    return _asMap(res.data);
  }

  Future<List<dynamic>> getList(
    String path, {
    Map<String, dynamic>? query,
  }) async {
    final res = await dio.get<dynamic>(path, queryParameters: query);
    final data = res.data;
    if (data is List) return data;
    if (data is Map && data['data'] is List) return data['data'] as List;
    if (data is Map && data['items'] is List) return data['items'] as List;
    return const [];
  }

  Future<Map<String, dynamic>> postJson(
    String path, {
    Object? body,
    Map<String, dynamic>? query,
  }) async {
    final res =
        await dio.post<dynamic>(path, data: body, queryParameters: query);
    return _asMap(res.data);
  }

  Future<Map<String, dynamic>> postMultipart(
    String path,
    FormData form,
  ) async {
    final res = await dio.post<dynamic>(path, data: form);
    return _asMap(res.data);
  }

  Map<String, dynamic> _asMap(dynamic data) {
    if (data is Map<String, dynamic>) {
      if (data['data'] is Map<String, dynamic>) {
        return data['data'] as Map<String, dynamic>;
      }
      return data;
    }
    return <String, dynamic>{};
  }
}

/// The shared [AuthInterceptor] instance (so the auth controller can hook
/// `onSessionExpired`).
final authInterceptorProvider = Provider<AuthInterceptor>((ref) {
  return AuthInterceptor(ref.watch(tokenStorageProvider));
});

final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(
    BaseOptions(
      baseUrl: Env.apiV1,
      connectTimeout: const Duration(seconds: 20),
      receiveTimeout: const Duration(seconds: 30),
      headers: {'Content-Type': 'application/json'},
    ),
  );
  dio.interceptors.add(ref.watch(authInterceptorProvider));
  if (Env.enableNetworkLogs) {
    dio.interceptors.add(
      LogInterceptor(requestBody: true, responseBody: false),
    );
  }
  return dio;
});

final apiClientProvider = Provider<ApiClient>(
  (ref) => ApiClient(ref.watch(dioProvider)),
);
