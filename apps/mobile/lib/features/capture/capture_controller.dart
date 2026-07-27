import 'dart:math' as math;

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/models/enums.dart';
import '../../core/models/job.dart';
import '../../core/providers/job_repository.dart';

/// Everything the client assembles before the AI analysis: photos, an optional
/// video/voice note, the drawn work-area polygon and the location.
class CaptureState {
  const CaptureState({
    this.photoPaths = const [],
    this.videoPath,
    this.voiceNotePath,
    this.location,
    this.city,
    this.state,
    this.note = '',
    this.urgency = UrgencyLevel.normal,
    this.polygon = const [],
    this.submitting = false,
    this.error,
  });

  final List<String> photoPaths;
  final String? videoPath;
  final String? voiceNotePath;
  final LatLng? location;
  final String? city;
  final String? state;
  final String note;
  final UrgencyLevel urgency;
  final List<LatLng> polygon;
  final bool submitting;
  final String? error;

  static const int minPhotos = 4;
  static const int maxPhotos = 30;

  bool get hasEnoughPhotos => photoPaths.length >= minPhotos;
  bool get canAddMore => photoPaths.length < maxPhotos;
  bool get hasLocation => location != null;

  /// Rough area (m²) of the drawn polygon via an equirectangular projection —
  /// a client-side prior; the backend recomputes precisely with PostGIS.
  double? get drawnAreaM2 {
    if (polygon.length < 3) return null;
    const earth = 6378137.0; // metres
    final lat0 = polygon.first.lat * math.pi / 180;
    double sum = 0;
    for (var i = 0; i < polygon.length; i++) {
      final a = polygon[i];
      final b = polygon[(i + 1) % polygon.length];
      final ax = earth * (a.lng * math.pi / 180) * math.cos(lat0);
      final ay = earth * (a.lat * math.pi / 180);
      final bx = earth * (b.lng * math.pi / 180) * math.cos(lat0);
      final by = earth * (b.lat * math.pi / 180);
      sum += (ax * by) - (bx * ay);
    }
    return (sum.abs() / 2).roundToDouble();
  }

  CaptureState copyWith({
    List<String>? photoPaths,
    Object? videoPath = _sentinel,
    Object? voiceNotePath = _sentinel,
    Object? location = _sentinel,
    Object? city = _sentinel,
    Object? state = _sentinel,
    String? note,
    UrgencyLevel? urgency,
    List<LatLng>? polygon,
    bool? submitting,
    Object? error = _sentinel,
  }) {
    return CaptureState(
      photoPaths: photoPaths ?? this.photoPaths,
      videoPath: identical(videoPath, _sentinel)
          ? this.videoPath
          : videoPath as String?,
      voiceNotePath: identical(voiceNotePath, _sentinel)
          ? this.voiceNotePath
          : voiceNotePath as String?,
      location:
          identical(location, _sentinel) ? this.location : location as LatLng?,
      city: identical(city, _sentinel) ? this.city : city as String?,
      state: identical(state, _sentinel) ? this.state : state as String?,
      note: note ?? this.note,
      urgency: urgency ?? this.urgency,
      polygon: polygon ?? this.polygon,
      submitting: submitting ?? this.submitting,
      error: identical(error, _sentinel) ? this.error : error as String?,
    );
  }

  static const _sentinel = Object();
}

class CaptureController extends AutoDisposeNotifier<CaptureState> {
  @override
  CaptureState build() => const CaptureState();

  void addPhotos(List<String> paths) {
    final next = [...state.photoPaths, ...paths].take(CaptureState.maxPhotos).toList();
    state = state.copyWith(photoPaths: next, error: null);
  }

  void removePhoto(int index) {
    final next = [...state.photoPaths]..removeAt(index);
    state = state.copyWith(photoPaths: next);
  }

  void setVideo(String? path) => state = state.copyWith(videoPath: path);

  void setVoiceNote(String? path) =>
      state = state.copyWith(voiceNotePath: path);

  void setNote(String note) => state = state.copyWith(note: note);

  void setUrgency(UrgencyLevel u) => state = state.copyWith(urgency: u);

  void setLocation(LatLng loc, {String? city, String? state}) {
    this.state = this.state.copyWith(location: loc, city: city, state: state);
  }

  void setPolygon(List<LatLng> points) =>
      state = state.copyWith(polygon: points);

  /// Creates the DRAFT job and uploads all captured media. Returns the new
  /// job id, or null on failure (with [CaptureState.error] set).
  Future<String?> submit(List<ServiceType> serviceTypes) async {
    if (!state.hasEnoughPhotos) {
      state = state.copyWith(
          error: 'Envie ao menos ${CaptureState.minPhotos} fotos.');
      return null;
    }
    state = state.copyWith(submitting: true, error: null);
    try {
      final repo = ref.read(jobRepositoryProvider);
      final job = await repo.createJob(
        serviceTypes: serviceTypes,
        urgency: state.urgency,
        note: state.note,
        location: state.location,
        city: state.city,
        state: state.state,
        drawnAreaM2: state.drawnAreaM2,
        polygon: state.polygon.isEmpty ? null : state.polygon,
      );

      final uploads = <MediaUpload>[
        for (final p in state.photoPaths)
          MediaUpload(path: p, kind: MediaKind.photo),
        if (state.videoPath != null)
          MediaUpload(path: state.videoPath!, kind: MediaKind.video),
        if (state.voiceNotePath != null)
          MediaUpload(path: state.voiceNotePath!, kind: MediaKind.audio),
      ];
      await repo.uploadMedia(job.id, uploads);

      state = state.copyWith(submitting: false);
      return job.id;
    } catch (_) {
      state = state.copyWith(
        submitting: false,
        error: 'Falha ao enviar. Verifique sua conexão e tente novamente.',
      );
      return null;
    }
  }
}

final captureControllerProvider =
    AutoDisposeNotifierProvider<CaptureController, CaptureState>(
  CaptureController.new,
);
