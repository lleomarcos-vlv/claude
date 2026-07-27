import 'enums.dart';
import 'garden_analysis.dart';
import 'quote.dart';

/// A geographic coordinate (mirror of `LatLng` from `packages/shared/src/geo.ts`).
class LatLng {
  const LatLng(this.lat, this.lng);

  final double lat;
  final double lng;

  factory LatLng.fromJson(Map<String, dynamic> json) => LatLng(
        (json['lat'] as num?)?.toDouble() ?? 0,
        (json['lng'] as num?)?.toDouble() ?? 0,
      );

  Map<String, dynamic> toJson() => {'lat': lat, 'lng': lng};
}

/// A media asset attached to a job.
class JobMedia {
  const JobMedia({
    required this.id,
    required this.kind,
    required this.url,
    this.mimeType,
    this.durationS,
  });

  final String id;
  final MediaKind kind;
  final String url;
  final String? mimeType;
  final double? durationS;

  factory JobMedia.fromJson(Map<String, dynamic> json) => JobMedia(
        id: json['id'] as String? ?? '',
        kind: MediaKind.fromWire(json['kind'] as String?),
        url: json['url'] as String? ?? '',
        mimeType: json['mimeType'] as String?,
        durationS: (json['durationS'] as num?)?.toDouble(),
      );
}

/// The central job entity — Dart mirror of the `Job` model (app subset).
class Job {
  const Job({
    required this.id,
    required this.clientId,
    required this.serviceTypes,
    required this.status,
    required this.urgency,
    this.note,
    this.location,
    this.city,
    this.state,
    this.drawnAreaM2,
    this.media = const [],
    this.analysis,
    this.quote,
    this.chosenGardenerId,
    this.scheduledAt,
    this.createdAt,
    // Marketplace-feed enrichments (present on GET /marketplace/feed rows).
    this.distanceKm,
    this.suggestedPriceCents,
    this.clientName,
  });

  final String id;
  final String clientId;
  final List<ServiceType> serviceTypes;
  final JobStatus status;
  final UrgencyLevel urgency;
  final String? note;
  final LatLng? location;
  final String? city;
  final String? state;

  /// Area the client drew on the map (m²) — a strong prior for the AI.
  final double? drawnAreaM2;

  final List<JobMedia> media;
  final GardenAnalysis? analysis;
  final Quote? quote;
  final String? chosenGardenerId;
  final DateTime? scheduledAt;
  final DateTime? createdAt;

  final double? distanceKm;
  final int? suggestedPriceCents;
  final String? clientName;

  ServiceType? get primaryService =>
      serviceTypes.isEmpty ? null : serviceTypes.first;

  String get serviceTypesLabel =>
      serviceTypes.map((e) => e.label).join(' · ');

  String get locationLabel {
    if (city == null && state == null) return 'Local não informado';
    return [city, state].where((e) => e != null && e.isNotEmpty).join(' - ');
  }

  factory Job.fromJson(Map<String, dynamic> json) {
    LatLng? loc;
    if (json['location'] is Map) {
      loc = LatLng.fromJson(json['location'] as Map<String, dynamic>);
    } else if (json['lat'] != null && json['lng'] != null) {
      loc = LatLng(
        (json['lat'] as num).toDouble(),
        (json['lng'] as num).toDouble(),
      );
    }

    // The quote may arrive as `quote` or as the latest of a `quotes` array.
    Map<String, dynamic>? quoteJson;
    if (json['quote'] is Map) {
      quoteJson = json['quote'] as Map<String, dynamic>;
    } else if (json['quotes'] is List && (json['quotes'] as List).isNotEmpty) {
      quoteJson = (json['quotes'] as List).last as Map<String, dynamic>;
    }

    return Job(
      id: json['id'] as String? ?? '',
      clientId: json['clientId'] as String? ?? '',
      serviceTypes: (json['serviceTypes'] as List<dynamic>? ?? const [])
          .map((e) => ServiceType.fromWire(e as String?))
          .toList(),
      status: JobStatus.fromWire(json['status'] as String?),
      urgency: UrgencyLevel.fromWire(json['urgency'] as String?),
      note: json['note'] as String?,
      location: loc,
      city: json['city'] as String?,
      state: json['state'] as String?,
      drawnAreaM2: (json['drawnAreaM2'] as num?)?.toDouble(),
      media: (json['media'] as List<dynamic>? ?? const [])
          .map((e) => JobMedia.fromJson(e as Map<String, dynamic>))
          .toList(),
      analysis: json['analysis'] == null
          ? null
          : GardenAnalysis.fromJson(json['analysis'] as Map<String, dynamic>),
      quote: quoteJson == null ? null : Quote.fromJson(quoteJson),
      chosenGardenerId: json['chosenGardenerId'] as String?,
      scheduledAt: _parseDate(json['scheduledAt']),
      createdAt: _parseDate(json['createdAt']),
      distanceKm: (json['distanceKm'] as num?)?.toDouble(),
      suggestedPriceCents: (json['suggestedPriceCents'] as num?)?.toInt(),
      clientName: json['clientName'] as String? ??
          (json['client'] is Map
              ? (json['client'] as Map)['name'] as String?
              : null),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'clientId': clientId,
        'serviceTypes': serviceTypes.map((e) => e.wire).toList(),
        'status': status.wire,
        'urgency': urgency.wire,
        if (note != null) 'note': note,
        if (location != null) 'location': location!.toJson(),
        if (city != null) 'city': city,
        if (state != null) 'state': state,
        if (drawnAreaM2 != null) 'drawnAreaM2': drawnAreaM2,
      };

  static DateTime? _parseDate(dynamic value) {
    if (value is String) return DateTime.tryParse(value);
    return null;
  }
}

/// Live-tracking ping — mirror of `TrackingPing` from `geo.ts`.
class TrackingPing {
  const TrackingPing({
    required this.location,
    this.headingDeg,
    this.speedKmh,
    this.etaSeconds,
    this.at,
  });

  final LatLng location;
  final double? headingDeg;
  final double? speedKmh;
  final int? etaSeconds;
  final DateTime? at;

  factory TrackingPing.fromJson(Map<String, dynamic> json) => TrackingPing(
        location: LatLng.fromJson(
            (json['location'] ?? json) as Map<String, dynamic>),
        headingDeg: (json['headingDeg'] as num?)?.toDouble(),
        speedKmh: (json['speedKmh'] as num?)?.toDouble(),
        etaSeconds: (json['etaSeconds'] as num?)?.toInt(),
        at: json['at'] is String ? DateTime.tryParse(json['at'] as String) : null,
      );
}
