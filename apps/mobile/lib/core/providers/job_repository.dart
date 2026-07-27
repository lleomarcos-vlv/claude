import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/enums.dart';
import '../models/garden_analysis.dart';
import '../models/job.dart';
import '../models/message.dart';
import '../models/offer.dart';
import '../models/quote.dart';
import '../network/api_client.dart';
import '../network/endpoints.dart';

/// The result of `POST /jobs/{id}/analyze` — the AI report + its priced quote.
typedef AnalyzeResult = ({GardenAnalysis analysis, Quote quote});

/// Everything the app does with the `Job` aggregate, in one place. Feature
/// controllers depend on this rather than talking to Dio directly.
class JobRepository {
  JobRepository(this._api);

  final ApiClient _api;

  // ── Client flow ────────────────────────────────────────────────────────
  Future<List<Job>> myJobs() async {
    final list = await _api.getList(Endpoints.jobs);
    return list.map((e) => Job.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<Job> getJob(String id) async {
    final json = await _api.getJson(Endpoints.job(id));
    return Job.fromJson(json);
  }

  /// Creates the DRAFT job. Media is uploaded separately.
  Future<Job> createJob({
    required List<ServiceType> serviceTypes,
    required UrgencyLevel urgency,
    String? note,
    LatLng? location,
    String? city,
    String? state,
    double? drawnAreaM2,
    List<LatLng>? polygon,
  }) async {
    final json = await _api.postJson(Endpoints.jobs, body: {
      'serviceTypes': serviceTypes.map((e) => e.wire).toList(),
      'urgency': urgency.wire,
      if (note != null && note.isNotEmpty) 'note': note,
      if (location != null) ...{'lat': location.lat, 'lng': location.lng},
      if (city != null) 'city': city,
      if (state != null) 'state': state,
      if (drawnAreaM2 != null) 'drawnAreaM2': drawnAreaM2,
      if (polygon != null)
        'drawnPolygon': {
          'points': polygon.map((p) => p.toJson()).toList(),
        },
    });
    return Job.fromJson(json);
  }

  /// Uploads captured photos/video/audio as multipart form-data.
  Future<void> uploadMedia(String jobId, List<MediaUpload> files) async {
    final form = FormData();
    for (final f in files) {
      form.files.add(MapEntry(
        'files',
        await MultipartFile.fromFile(f.path, filename: f.filename),
      ));
      form.fields.add(MapEntry('kind', f.kind.wire));
    }
    await _api.postMultipart(Endpoints.jobMedia(jobId), form);
  }

  /// Runs the multimodal AI pipeline; returns the report and the priced quote.
  Future<AnalyzeResult> analyze(String jobId) async {
    final json = await _api.postJson(Endpoints.analyze(jobId));
    return (
      analysis: GardenAnalysis.fromJson(
          json['analysis'] as Map<String, dynamic>? ?? const {}),
      quote: Quote.fromJson(json['quote'] as Map<String, dynamic>? ?? const {}),
    );
  }

  Future<void> publish(String jobId) => _api.postJson(Endpoints.publish(jobId));

  Future<List<Offer>> offers(String jobId) async {
    final list = await _api.getList(Endpoints.jobOffers(jobId));
    return list.map((e) => Offer.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> chooseOffer(String offerId) =>
      _api.postJson(Endpoints.chooseOffer(offerId));

  Future<void> approve(String jobId) => _api.postJson(Endpoints.approve(jobId));

  Future<void> review(
    String jobId, {
    required int rating,
    String? comment,
    List<String> photoUrls = const [],
  }) =>
      _api.postJson(Endpoints.review(jobId), body: {
        'rating': rating,
        if (comment != null && comment.isNotEmpty) 'comment': comment,
        if (photoUrls.isNotEmpty) 'photos': photoUrls,
      });

  // ── Gardener flow ──────────────────────────────────────────────────────
  Future<List<Job>> feed() async {
    final list = await _api.getList(Endpoints.marketplaceFeed);
    return list.map((e) => Job.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<Offer> sendOffer(
    String jobId, {
    required int priceCents,
    String? message,
  }) async {
    final json = await _api.postJson(Endpoints.jobOffers(jobId), body: {
      'priceCents': priceCents,
      if (message != null && message.isNotEmpty) 'message': message,
    });
    return Offer.fromJson(json);
  }

  Future<void> checkin(
    String jobId, {
    required double lat,
    required double lng,
    String? photoPath,
  }) async {
    final form = FormData.fromMap({
      'lat': lat,
      'lng': lng,
      if (photoPath != null)
        'photo': await MultipartFile.fromFile(photoPath),
    });
    await _api.postMultipart(Endpoints.checkin(jobId), form);
  }

  Future<void> start(String jobId) => _api.postJson(Endpoints.start(jobId));

  Future<void> checkout(String jobId, {String? photoPath}) async {
    final form = FormData.fromMap({
      if (photoPath != null)
        'photo': await MultipartFile.fromFile(photoPath),
    });
    await _api.postMultipart(Endpoints.checkout(jobId), form);
  }

  // ── Chat ───────────────────────────────────────────────────────────────
  Future<List<Message>> messages(String jobId) async {
    final list = await _api.getList(Endpoints.messages(jobId));
    return list
        .map((e) => Message.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Message> sendMessage(
    String jobId, {
    required MessageKind kind,
    String? body,
    String? mediaUrl,
    double? lat,
    double? lng,
  }) async {
    final json = await _api.postJson(Endpoints.messages(jobId), body: {
      'kind': kind.wire,
      if (body != null) 'body': body,
      if (mediaUrl != null) 'mediaUrl': mediaUrl,
      if (lat != null) 'lat': lat,
      if (lng != null) 'lng': lng,
    });
    return Message.fromJson(json);
  }

  // ── Payments ───────────────────────────────────────────────────────────
  Future<PaymentIntent> paymentIntent(
    String jobId, {
    required PaymentMethod method,
  }) async {
    final json = await _api.postJson(Endpoints.paymentIntent(jobId), body: {
      'method': method.wire,
    });
    return PaymentIntent.fromJson(json);
  }
}

/// A local file selected for upload, tagged with its media kind.
class MediaUpload {
  const MediaUpload({required this.path, required this.kind, this.filename});
  final String path;
  final MediaKind kind;
  final String? filename;
}

/// The payment intent returned by the backend (PIX QR / card client secret).
class PaymentIntent {
  const PaymentIntent({
    required this.status,
    required this.amountCents,
    this.pixQrCode,
    this.pixCopyPaste,
    this.clientSecret,
    this.externalId,
  });

  final PaymentStatus status;
  final int amountCents;
  final String? pixQrCode;
  final String? pixCopyPaste;
  final String? clientSecret;
  final String? externalId;

  factory PaymentIntent.fromJson(Map<String, dynamic> json) => PaymentIntent(
        status: PaymentStatus.fromWire(json['status'] as String?),
        amountCents: (json['amountCents'] as num?)?.toInt() ?? 0,
        pixQrCode: json['pixQrCode'] as String?,
        pixCopyPaste: json['pixCopyPaste'] as String?,
        clientSecret: json['clientSecret'] as String?,
        externalId: json['externalId'] as String?,
      );
}

// ── Providers ──────────────────────────────────────────────────────────────
final jobRepositoryProvider = Provider<JobRepository>(
  (ref) => JobRepository(ref.watch(apiClientProvider)),
);

final myJobsProvider = FutureProvider<List<Job>>(
  (ref) => ref.watch(jobRepositoryProvider).myJobs(),
);

final jobProvider = FutureProvider.family<Job, String>(
  (ref, id) => ref.watch(jobRepositoryProvider).getJob(id),
);

final offersProvider = FutureProvider.family<List<Offer>, String>(
  (ref, id) => ref.watch(jobRepositoryProvider).offers(id),
);

final feedProvider = FutureProvider<List<Job>>(
  (ref) => ref.watch(jobRepositoryProvider).feed(),
);

final messagesProvider = FutureProvider.family<List<Message>, String>(
  (ref, id) => ref.watch(jobRepositoryProvider).messages(id),
);
