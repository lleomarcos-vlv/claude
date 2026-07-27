import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/models/job.dart';
import '../../core/providers/job_repository.dart';

/// Polls the job every few seconds so the tracking screen reflects the
/// gardener's progress (ENROUTE → ARRIVED → IN_PROGRESS → COMPLETED) and any
/// new location pings. In production this would be a websocket/SSE stream; the
/// polling stream keeps the same reactive shape without extra infra.
final trackingJobProvider =
    StreamProvider.autoDispose.family<Job, String>((ref, id) async* {
  final repo = ref.watch(jobRepositoryProvider);
  while (true) {
    try {
      yield await repo.getJob(id);
    } catch (_) {
      // Swallow transient errors; the next tick retries.
    }
    await Future<void>.delayed(const Duration(seconds: 6));
  }
});
