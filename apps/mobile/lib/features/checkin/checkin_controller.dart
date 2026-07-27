import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers/job_repository.dart';
import '../tracking/tracking_controller.dart';

/// Drives the gardener's on-site actions: check-in (photo + GPS), start and
/// check-out (photo). Holds a single in-flight flag for the action buttons.
class CheckinController extends AutoDisposeNotifier<bool> {
  @override
  bool build() => false; // isWorking

  Future<bool> checkin(
    String jobId, {
    required double lat,
    required double lng,
    String? photoPath,
  }) =>
      _run(jobId,
          () => ref.read(jobRepositoryProvider).checkin(jobId,
              lat: lat, lng: lng, photoPath: photoPath));

  Future<bool> start(String jobId) =>
      _run(jobId, () => ref.read(jobRepositoryProvider).start(jobId));

  Future<bool> checkout(String jobId, {String? photoPath}) => _run(
      jobId,
      () => ref.read(jobRepositoryProvider).checkout(jobId, photoPath: photoPath));

  Future<bool> _run(String jobId, Future<void> Function() action) async {
    state = true;
    try {
      await action();
      ref.invalidate(jobProvider(jobId));
      ref.invalidate(trackingJobProvider(jobId));
      return true;
    } catch (_) {
      return false;
    } finally {
      state = false;
    }
  }
}

final checkinControllerProvider =
    AutoDisposeNotifierProvider<CheckinController, bool>(CheckinController.new);
