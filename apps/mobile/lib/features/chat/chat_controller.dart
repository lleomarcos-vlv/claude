import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/models/enums.dart';
import '../../core/models/message.dart';
import '../../core/providers/job_repository.dart';

/// Loads a job's message thread and appends locally-sent messages so the UI
/// updates instantly (optimistic), keyed by jobId.
class ChatController
    extends AutoDisposeFamilyAsyncNotifier<List<Message>, String> {
  @override
  Future<List<Message>> build(String jobId) {
    return ref.read(jobRepositoryProvider).messages(jobId);
  }

  Future<void> reload() async {
    state = await AsyncValue.guard(
      () => ref.read(jobRepositoryProvider).messages(arg),
    );
  }

  Future<void> send({
    required MessageKind kind,
    String? body,
    String? mediaUrl,
    double? lat,
    double? lng,
  }) async {
    try {
      final msg = await ref.read(jobRepositoryProvider).sendMessage(
            arg,
            kind: kind,
            body: body,
            mediaUrl: mediaUrl,
            lat: lat,
            lng: lng,
          );
      state = AsyncData([...(state.valueOrNull ?? const []), msg]);
    } catch (_) {
      // Keep the thread as-is; a retry affordance could be added here.
    }
  }
}

final chatControllerProvider = AsyncNotifierProvider.autoDispose
    .family<ChatController, List<Message>, String>(ChatController.new);
