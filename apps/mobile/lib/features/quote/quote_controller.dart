import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers/job_repository.dart';

/// Drives the "publish to marketplace" action from the quote-review screen.
/// State is a simple in-flight flag the button binds to.
class PublishController extends AutoDisposeNotifier<bool> {
  @override
  bool build() => false; // isPublishing

  Future<bool> publish(String jobId) async {
    state = true;
    try {
      await ref.read(jobRepositoryProvider).publish(jobId);
      ref.invalidate(jobProvider(jobId));
      ref.invalidate(myJobsProvider);
      return true;
    } catch (_) {
      return false;
    } finally {
      state = false;
    }
  }
}

final publishControllerProvider =
    AutoDisposeNotifierProvider<PublishController, bool>(PublishController.new);
