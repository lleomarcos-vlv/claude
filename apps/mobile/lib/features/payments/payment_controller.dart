import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/models/enums.dart';
import '../../core/providers/job_repository.dart';

/// Creates and tracks a payment intent for a job. `null` state = no intent yet;
/// otherwise an [AsyncValue] wrapping the [PaymentIntent] (PIX QR / card).
class PaymentController
    extends AutoDisposeNotifier<AsyncValue<PaymentIntent>?> {
  @override
  AsyncValue<PaymentIntent>? build() => null;

  Future<void> createIntent(String jobId, PaymentMethod method) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(jobRepositoryProvider).paymentIntent(jobId, method: method),
    );
  }

  /// Approves the job (releasing escrow) after the client confirms payment.
  Future<bool> approveAndCapture(String jobId) async {
    try {
      await ref.read(jobRepositoryProvider).approve(jobId);
      ref.invalidate(jobProvider(jobId));
      return true;
    } catch (_) {
      return false;
    }
  }
}

final paymentControllerProvider =
    AutoDisposeNotifierProvider<PaymentController, AsyncValue<PaymentIntent>?>(
  PaymentController.new,
);
