import 'enums.dart';

/// A gardener's summary as shown on an offer card (name, rating, badges).
class GardenerSummary {
  const GardenerSummary({
    required this.id,
    required this.name,
    this.avatarUrl,
    this.ratingAvg = 0,
    this.ratingCount = 0,
    this.jobsCompleted = 0,
    this.city,
    this.state,
    this.distanceKm,
  });

  final String id;
  final String name;
  final String? avatarUrl;
  final double ratingAvg;
  final int ratingCount;
  final int jobsCompleted;
  final String? city;
  final String? state;
  final double? distanceKm;

  factory GardenerSummary.fromJson(Map<String, dynamic> json) =>
      GardenerSummary(
        id: json['id'] as String? ?? '',
        name: json['name'] as String? ?? 'Jardineiro',
        avatarUrl: json['avatarUrl'] as String?,
        ratingAvg: (json['ratingAvg'] as num?)?.toDouble() ?? 0,
        ratingCount: (json['ratingCount'] as num?)?.toInt() ?? 0,
        jobsCompleted: (json['jobsCompleted'] as num?)?.toInt() ?? 0,
        city: json['city'] as String?,
        state: json['state'] as String?,
        distanceKm: (json['distanceKm'] as num?)?.toDouble(),
      );
}

/// A gardener's offer against a marketplace job — Dart mirror of `Offer`.
class Offer {
  const Offer({
    required this.id,
    required this.jobId,
    required this.gardenerId,
    required this.status,
    required this.priceCents,
    this.message,
    this.expiresAt,
    this.createdAt,
    this.gardener,
  });

  final String id;
  final String jobId;
  final String gardenerId;
  final OfferStatus status;
  final int priceCents;
  final String? message;
  final DateTime? expiresAt;
  final DateTime? createdAt;
  final GardenerSummary? gardener;

  bool get isCounterOffer => status == OfferStatus.countered;

  factory Offer.fromJson(Map<String, dynamic> json) => Offer(
        id: json['id'] as String? ?? '',
        jobId: json['jobId'] as String? ?? '',
        gardenerId: json['gardenerId'] as String? ?? '',
        status: OfferStatus.fromWire(json['status'] as String?),
        priceCents: (json['priceCents'] as num?)?.toInt() ?? 0,
        message: json['message'] as String?,
        expiresAt: json['expiresAt'] is String
            ? DateTime.tryParse(json['expiresAt'] as String)
            : null,
        createdAt: json['createdAt'] is String
            ? DateTime.tryParse(json['createdAt'] as String)
            : null,
        gardener: json['gardener'] is Map
            ? GardenerSummary.fromJson(
                json['gardener'] as Map<String, dynamic>)
            : null,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'jobId': jobId,
        'gardenerId': gardenerId,
        'status': status.wire,
        'priceCents': priceCents,
        if (message != null) 'message': message,
      };
}
