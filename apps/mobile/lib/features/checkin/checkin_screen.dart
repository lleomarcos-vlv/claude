import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';

import '../../core/models/enums.dart';
import '../../core/models/job.dart';
import '../../core/router/app_router.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/primary_button.dart';
import '../../core/widgets/status_timeline.dart';
import '../tracking/tracking_controller.dart';
import 'checkin_controller.dart';

/// Active-job screen (gardener): check-in with a photo + GPS + timestamp, start
/// the work, then check-out with a completion photo. The primary action adapts
/// to the job's current status.
class CheckinScreen extends ConsumerStatefulWidget {
  const CheckinScreen({super.key, required this.jobId});

  final String jobId;

  @override
  ConsumerState<CheckinScreen> createState() => _CheckinScreenState();
}

class _CheckinScreenState extends ConsumerState<CheckinScreen> {
  final _picker = ImagePicker();
  String? _photoPath;

  // Demo GPS fix — the real app reads this from the device location service.
  static const _gps = LatLng(-23.5617, -46.6559);

  Future<void> _capture() async {
    final x = await _picker.pickImage(source: ImageSource.camera, imageQuality: 82);
    if (x != null) setState(() => _photoPath = x.path);
  }

  Future<void> _act(JobStatus status) async {
    final ctrl = ref.read(checkinControllerProvider.notifier);
    bool ok;
    switch (status) {
      case JobStatus.arrived:
        ok = await ctrl.start(widget.jobId);
        break;
      case JobStatus.inProgress:
        if (_photoPath == null) {
          _requirePhoto();
          return;
        }
        ok = await ctrl.checkout(widget.jobId, photoPath: _photoPath);
        break;
      default: // accepted / scheduled / enroute → check-in
        if (_photoPath == null) {
          _requirePhoto();
          return;
        }
        ok = await ctrl.checkin(widget.jobId,
            lat: _gps.lat, lng: _gps.lng, photoPath: _photoPath);
    }
    if (!mounted) return;
    if (ok) {
      setState(() => _photoPath = null);
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Registrado com sucesso!')));
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Falha ao registrar. Tente novamente.')));
    }
  }

  void _requirePhoto() {
    ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Tire uma foto para comprovar.')));
  }

  ({String label, IconData icon, bool needsPhoto})? _actionFor(JobStatus s) {
    switch (s) {
      case JobStatus.accepted:
      case JobStatus.scheduled:
      case JobStatus.enroute:
        return (label: 'Check-in — cheguei', icon: Icons.login, needsPhoto: true);
      case JobStatus.arrived:
        return (label: 'Iniciar serviço', icon: Icons.play_arrow, needsPhoto: false);
      case JobStatus.inProgress:
        return (
          label: 'Check-out — concluí',
          icon: Icons.logout,
          needsPhoto: true
        );
      default:
        return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final jobAsync = ref.watch(trackingJobProvider(widget.jobId));
    final working = ref.watch(checkinControllerProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Serviço em andamento'),
        actions: [
          IconButton(
            icon: const Icon(Icons.chat_bubble_outline),
            onPressed: () => context.push(Routes.chat(widget.jobId)),
          ),
        ],
      ),
      body: jobAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) =>
            const Center(child: Text('Não foi possível carregar o serviço.')),
        data: (job) {
          final action = _actionFor(job.status);
          return ListView(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
            children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(job.serviceTypesLabel.isEmpty
                          ? 'Serviço'
                          : job.serviceTypesLabel,
                          style: const TextStyle(
                              fontWeight: FontWeight.w800, fontSize: 16)),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(Icons.place,
                              size: 15, color: AppTheme.subtleInk),
                          const SizedBox(width: 4),
                          Text(job.locationLabel,
                              style: const TextStyle(
                                  color: AppTheme.subtleInk, fontSize: 13)),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(18),
                  child: StatusTimeline(current: job.status),
                ),
              ),
              const SizedBox(height: 16),
              if (action != null && action.needsPhoto)
                _PhotoProof(
                  path: _photoPath,
                  onCapture: _capture,
                  gps: _gps,
                ),
              const SizedBox(height: 16),
              if (action != null)
                PrimaryButton(
                  label: action.label,
                  icon: action.icon,
                  loading: working,
                  onPressed: () => _act(job.status),
                )
              else
                _DoneCard(status: job.status),
            ],
          );
        },
      ),
    );
  }
}

class _PhotoProof extends StatelessWidget {
  const _PhotoProof({
    required this.path,
    required this.onCapture,
    required this.gps,
  });

  final String? path;
  final VoidCallback onCapture;
  final LatLng gps;

  @override
  Widget build(BuildContext context) {
    final now = DateFormat("dd/MM/yyyy 'às' HH:mm").format(DateTime.now());
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Comprovação',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
            const SizedBox(height: 4),
            const Text('Foto do local com data/hora e GPS.',
                style: TextStyle(color: AppTheme.subtleInk, fontSize: 13)),
            const SizedBox(height: 14),
            AspectRatio(
              aspectRatio: 16 / 10,
              child: GestureDetector(
                onTap: onCapture,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(14),
                  child: path == null
                      ? Container(
                          color: AppTheme.brandLight,
                          child: const Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.photo_camera,
                                    size: 34, color: AppTheme.brandDark),
                                SizedBox(height: 8),
                                Text('Tirar foto',
                                    style: TextStyle(
                                        color: AppTheme.brandDark,
                                        fontWeight: FontWeight.w700)),
                              ],
                            ),
                          ),
                        )
                      : Image.file(File(path!), fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => Container(
                                color: AppTheme.brandLight,
                                child: const Icon(Icons.check_circle,
                                    color: AppTheme.brand, size: 40),
                              )),
                ),
              ),
            ),
            const SizedBox(height: 12),
            _MetaRow(icon: Icons.schedule, text: now),
            _MetaRow(
              icon: Icons.my_location,
              text:
                  'GPS: ${gps.lat.toStringAsFixed(5)}, ${gps.lng.toStringAsFixed(5)}',
            ),
          ],
        ),
      ),
    );
  }
}

class _MetaRow extends StatelessWidget {
  const _MetaRow({required this.icon, required this.text});
  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        children: [
          Icon(icon, size: 16, color: AppTheme.brand),
          const SizedBox(width: 8),
          Text(text,
              style: const TextStyle(
                  fontSize: 12.5, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

class _DoneCard extends StatelessWidget {
  const _DoneCard({required this.status});
  final JobStatus status;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: AppTheme.brandLight,
        borderRadius: BorderRadius.circular(AppTheme.radius),
      ),
      child: Column(
        children: [
          const Icon(Icons.verified, color: AppTheme.brand, size: 44),
          const SizedBox(height: 10),
          Text(
            status == JobStatus.completed
                ? 'Serviço concluído! Aguardando aprovação do cliente.'
                : 'Este serviço já foi finalizado.',
            textAlign: TextAlign.center,
            style: const TextStyle(
                fontWeight: FontWeight.w700, color: AppTheme.brandDark),
          ),
        ],
      ),
    );
  }
}
