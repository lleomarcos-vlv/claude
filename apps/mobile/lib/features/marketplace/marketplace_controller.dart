import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers/job_repository.dart';

/// Handles a gardener sending/countering an offer from the offer-detail screen.
/// Exposes a simple in-flight flag.
class OfferController extends AutoDisposeNotifier<bool> {
  @override
  bool build() => false; // isSubmitting

  Future<bool> submit({
    required String jobId,
    required int priceCents,
    String? message,
  }) async {
    state = true;
    try {
      await ref
          .read(jobRepositoryProvider)
          .sendOffer(jobId, priceCents: priceCents, message: message);
      // Remove the job from the feed once we've acted on it.
      ref.invalidate(feedProvider);
      return true;
    } catch (_) {
      return false;
    } finally {
      state = false;
    }
  }
}

final offerControllerProvider =
    AutoDisposeNotifierProvider<OfferController, bool>(OfferController.new);
