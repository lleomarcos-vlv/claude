import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart' as gmaps;

import '../../core/models/enums.dart';
import '../../core/models/job.dart';
import '../../core/router/app_router.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/primary_button.dart';
import '../../core/widgets/status_timeline.dart';
import 'tracking_controller.dart';

/// Live tracking: a map with the gardener + destination markers and the
/// a caminho → chegou → iniciou → concluiu timeline, auto-refreshed via
/// [trackingJobProvider]. When the service is completed the client can approve
/// and pay.
class TrackingScreen extends ConsumerWidget {
  const TrackingScreen({super.key, required this.jobId});

  final String jobId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final jobAsync = ref.watch(trackingJobProvider(jobId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Acompanhar serviço'),
        actions: [
          IconButton(
            icon: const Icon(Icons.chat_bubble_outline),
            onPressed: () => context.push(Routes.chat(jobId)),
          ),
        ],
      ),
      body: jobAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) =>
            const Center(child: Text('Não foi possível carregar o serviço.')),
        data: (job) => _TrackingBody(job: job),
      ),
    );
  }
}

class _TrackingBody extends StatelessWidget {
  const _TrackingBody({required this.job});
  final Job job;

  @override
  Widget build(BuildContext context) {
    final dest = job.location ?? const LatLng(-23.5617, -46.6559);
    // Fake the gardener a little north-east of the destination for the demo.
    final gardener = LatLng(dest.lat + 0.004, dest.lng + 0.004);
    final isCompleted = job.status == JobStatus.completed ||
        job.status == JobStatus.approved;

    return Column(
      children: [
        SizedBox(
          height: 240,
          child: _MapView(destination: dest, gardener: gardener, status: job.status),
        ),
        Expanded(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 24),
            children: [
              _StatusHeader(status: job.status),
              const SizedBox(height: 18),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(18),
                  child: StatusTimeline(current: job.status),
                ),
              ),
              const SizedBox(height: 16),
              const _GardenerStrip(),
              const SizedBox(height: 20),
              if (isCompleted)
                PrimaryButton(
                  label: 'Aprovar e pagar',
                  icon: Icons.verified,
                  onPressed: () => context.push(Routes.payment(job.id)),
                )
              else
                SecondaryButton(
                  label: 'Abrir chat',
                  icon: Icons.chat_bubble_outline,
                  onPressed: () => context.push(Routes.chat(job.id)),
                ),
            ],
          ),
        ),
      ],
    );
  }
}

class _MapView extends StatelessWidget {
  const _MapView({
    required this.destination,
    required this.gardener,
    required this.status,
  });

  final LatLng destination;
  final LatLng gardener;
  final JobStatus status;

  @override
  Widget build(BuildContext context) {
    final showGardener = status == JobStatus.enroute ||
        status == JobStatus.arrived ||
        status == JobStatus.inProgress;

    final markers = <gmaps.Marker>{
      gmaps.Marker(
        markerId: const gmaps.MarkerId('destino'),
        position: gmaps.LatLng(destination.lat, destination.lng),
        infoWindow: const gmaps.InfoWindow(title: 'Local do serviço'),
      ),
      if (showGardener)
        gmaps.Marker(
          markerId: const gmaps.MarkerId('jardineiro'),
          position: gmaps.LatLng(gardener.lat, gardener.lng),
          icon: gmaps.BitmapDescriptor.defaultMarkerWithHue(
              gmaps.BitmapDescriptor.hueGreen),
          infoWindow: const gmaps.InfoWindow(title: 'Jardineiro'),
        ),
    };

    return gmaps.GoogleMap(
      initialCameraPosition: gmaps.CameraPosition(
        target: gmaps.LatLng(destination.lat, destination.lng),
        zoom: 14.5,
      ),
      markers: markers,
      myLocationButtonEnabled: false,
      zoomControlsEnabled: false,
      compassEnabled: false,
      liteModeEnabled: true,
    );
  }
}

class _StatusHeader extends StatelessWidget {
  const _StatusHeader({required this.status});
  final JobStatus status;

  String get _headline {
    switch (status) {
      case JobStatus.enroute:
        return 'O jardineiro está a caminho';
      case JobStatus.arrived:
        return 'O jardineiro chegou';
      case JobStatus.inProgress:
        return 'Serviço em andamento';
      case JobStatus.completed:
      case JobStatus.approved:
        return 'Serviço concluído';
      default:
        return 'Preparando seu serviço';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          height: 44,
          width: 44,
          decoration: const BoxDecoration(
            color: AppTheme.brandLight,
            shape: BoxShape.circle,
          ),
          child: const Icon(Icons.eco, color: AppTheme.brand),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(_headline,
              style: const TextStyle(
                  fontSize: 18, fontWeight: FontWeight.w900, height: 1.2)),
        ),
      ],
    );
  }
}

class _GardenerStrip extends StatelessWidget {
  const _GardenerStrip();

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            const CircleAvatar(
              radius: 24,
              backgroundColor: AppTheme.brandLight,
              child: Icon(Icons.person, color: AppTheme.brandDark),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Text('Seu jardineiro',
                      style: TextStyle(fontWeight: FontWeight.w800)),
                  SizedBox(height: 2),
                  Text('Confirmado para este serviço',
                      style:
                          TextStyle(color: AppTheme.subtleInk, fontSize: 12.5)),
                ],
              ),
            ),
            IconButton(
              onPressed: () {},
              icon: const Icon(Icons.call, color: AppTheme.brand),
            ),
          ],
        ),
      ),
    );
  }
}
