import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/models/enums.dart';
import '../../core/models/job.dart';
import '../../core/router/app_router.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/primary_button.dart';
import '../../core/widgets/service_type_chip.dart';
import 'capture_controller.dart';

/// Capture step: 4–30 photos, an optional video and voice note, the location
/// and a drawn work-area. On submit the DRAFT job is created + media uploaded,
/// then we route to the "IA analisando…" screen.
class CaptureScreen extends ConsumerStatefulWidget {
  const CaptureScreen({super.key, required this.selectedServices});

  final List<ServiceType> selectedServices;

  @override
  ConsumerState<CaptureScreen> createState() => _CaptureScreenState();
}

class _CaptureScreenState extends ConsumerState<CaptureScreen> {
  final _picker = ImagePicker();
  final _noteCtrl = TextEditingController();

  @override
  void dispose() {
    _noteCtrl.dispose();
    super.dispose();
  }

  Future<void> _takePhoto() async {
    final x = await _picker.pickImage(source: ImageSource.camera, imageQuality: 82);
    if (x != null) ref.read(captureControllerProvider.notifier).addPhotos([x.path]);
  }

  Future<void> _pickFromGallery() async {
    final xs = await _picker.pickMultiImage(imageQuality: 82);
    if (xs.isNotEmpty) {
      ref
          .read(captureControllerProvider.notifier)
          .addPhotos(xs.map((e) => e.path).toList());
    }
  }

  Future<void> _pickVideo() async {
    final x = await _picker.pickVideo(source: ImageSource.camera);
    if (x != null) ref.read(captureControllerProvider.notifier).setVideo(x.path);
  }

  void _drawAreaPlaceholder() {
    // Placeholder for the google_maps_flutter polygon editor: seed a demo
    // square around the (demo) location so the flow and the m² calc are live.
    final base = ref.read(captureControllerProvider).location ??
        const LatLng(-23.5617, -46.6559);
    const d = 0.00012;
    ref.read(captureControllerProvider.notifier).setPolygon([
      LatLng(base.lat - d, base.lng - d),
      LatLng(base.lat - d, base.lng + d),
      LatLng(base.lat + d, base.lng + d),
      LatLng(base.lat + d, base.lng - d),
    ]);
  }

  Future<void> _setLocation() async {
    final cityCtrl = TextEditingController();
    final stateCtrl = TextEditingController(text: 'SP');
    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(
            20, 20, 20, MediaQuery.of(ctx).viewInsets.bottom + 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Onde é o serviço?',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
            const SizedBox(height: 4),
            const Text(
              'No app final, escolha o ponto no mapa (Google Maps).',
              style: TextStyle(color: AppTheme.subtleInk, fontSize: 13),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: cityCtrl,
              decoration: const InputDecoration(
                labelText: 'Cidade',
                prefixIcon: Icon(Icons.location_city),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: stateCtrl,
              maxLength: 2,
              textCapitalization: TextCapitalization.characters,
              decoration: const InputDecoration(
                labelText: 'UF',
                counterText: '',
                prefixIcon: Icon(Icons.map_outlined),
              ),
            ),
            const SizedBox(height: 12),
            PrimaryButton(
              label: 'Confirmar local',
              icon: Icons.check,
              onPressed: () => Navigator.of(ctx).pop(true),
            ),
          ],
        ),
      ),
    );
    if (result == true) {
      ref.read(captureControllerProvider.notifier).setLocation(
            const LatLng(-23.5617, -46.6559),
            city: cityCtrl.text.trim().isEmpty ? null : cityCtrl.text.trim(),
            state: stateCtrl.text.trim().isEmpty ? null : stateCtrl.text.trim(),
          );
    }
  }

  Future<void> _submit() async {
    ref.read(captureControllerProvider.notifier).setNote(_noteCtrl.text);
    final jobId = await ref
        .read(captureControllerProvider.notifier)
        .submit(widget.selectedServices);
    if (jobId != null && mounted) context.push(Routes.analyzing(jobId));
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(captureControllerProvider);
    final ctrl = ref.read(captureControllerProvider.notifier);

    return Scaffold(
      appBar: AppBar(title: const Text('Registre seu jardim')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
          children: [
            if (widget.selectedServices.isNotEmpty) ...[
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: widget.selectedServices
                    .map((t) => ServiceTypeChip(type: t, compact: true))
                    .toList(),
              ),
              const SizedBox(height: 20),
            ],

            // ── Photos ──────────────────────────────────────────────────
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Fotos',
                    style:
                        TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
                Text(
                  '${state.photoPaths.length}/${CaptureState.maxPhotos}',
                  style: TextStyle(
                    color: state.hasEnoughPhotos
                        ? AppTheme.brand
                        : AppTheme.subtleInk,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              'Envie de ${CaptureState.minPhotos} a ${CaptureState.maxPhotos} fotos, de vários ângulos.',
              style: const TextStyle(color: AppTheme.subtleInk, fontSize: 13),
            ),
            const SizedBox(height: 12),
            _PhotoGrid(
              paths: state.photoPaths,
              onRemove: ctrl.removePhoto,
              onAdd: state.canAddMore ? _pickFromGallery : null,
              onCamera: state.canAddMore ? _takePhoto : null,
            ),
            const SizedBox(height: 22),

            // ── Video + voice ──────────────────────────────────────────
            Row(
              children: [
                Expanded(
                  child: _MediaButton(
                    icon: state.videoPath == null
                        ? Icons.videocam_outlined
                        : Icons.check_circle,
                    label: state.videoPath == null ? 'Vídeo' : 'Vídeo pronto',
                    active: state.videoPath != null,
                    onTap: _pickVideo,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _MediaButton(
                    icon: state.voiceNotePath == null
                        ? Icons.mic_none
                        : Icons.check_circle,
                    label: state.voiceNotePath == null
                        ? 'Áudio'
                        : 'Áudio gravado',
                    active: state.voiceNotePath != null,
                    onTap: () => ctrl.setVoiceNote(
                      state.voiceNotePath == null ? 'voice_note.m4a' : null,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 22),

            // ── Location ────────────────────────────────────────────────
            _SectionTile(
              icon: Icons.place_outlined,
              title: state.hasLocation
                  ? 'Local: ${[state.city, state.state].where((e) => e != null && e.isNotEmpty).join(' - ')}'
                  : 'Definir localização',
              subtitle: state.hasLocation
                  ? 'Toque para alterar'
                  : 'Obrigatório para o marketplace',
              done: state.hasLocation,
              onTap: _setLocation,
            ),
            const SizedBox(height: 12),

            // ── Area draw placeholder ──────────────────────────────────
            _AreaCard(
              areaM2: state.drawnAreaM2,
              onDraw: _drawAreaPlaceholder,
              onClear: () => ctrl.setPolygon(const []),
            ),
            const SizedBox(height: 22),

            // ── Urgency ────────────────────────────────────────────────
            const Text('Urgência',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              children: UrgencyLevel.values
                  .map((u) => ChoiceChip(
                        label: Text(u.label),
                        selected: state.urgency == u,
                        onSelected: (_) => ctrl.setUrgency(u),
                      ))
                  .toList(),
            ),
            const SizedBox(height: 22),

            // ── Note ───────────────────────────────────────────────────
            const Text('Observações (opcional)',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
            const SizedBox(height: 10),
            TextField(
              controller: _noteCtrl,
              maxLines: 3,
              decoration: const InputDecoration(
                hintText: 'Ex.: portão pelos fundos, cuidado com o cachorro...',
              ),
            ),

            if (state.error != null) ...[
              const SizedBox(height: 14),
              Text(state.error!,
                  style: const TextStyle(color: AppTheme.danger)),
            ],
            const SizedBox(height: 20),
            PrimaryButton(
              label: 'Analisar com IA',
              icon: Icons.auto_awesome,
              loading: state.submitting,
              onPressed:
                  state.hasEnoughPhotos && state.hasLocation ? _submit : null,
            ),
            const SizedBox(height: 6),
            if (!state.hasEnoughPhotos || !state.hasLocation)
              Center(
                child: Text(
                  !state.hasEnoughPhotos
                      ? 'Adicione ao menos ${CaptureState.minPhotos} fotos'
                      : 'Defina a localização para continuar',
                  style:
                      const TextStyle(color: AppTheme.subtleInk, fontSize: 12.5),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _PhotoGrid extends StatelessWidget {
  const _PhotoGrid({
    required this.paths,
    required this.onRemove,
    required this.onAdd,
    required this.onCamera,
  });

  final List<String> paths;
  final ValueChanged<int> onRemove;
  final VoidCallback? onAdd;
  final VoidCallback? onCamera;

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 3,
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      children: [
        _AddTile(icon: Icons.photo_camera, label: 'Câmera', onTap: onCamera),
        _AddTile(icon: Icons.photo_library, label: 'Galeria', onTap: onAdd),
        for (var i = 0; i < paths.length; i++)
          _Thumb(path: paths[i], onRemove: () => onRemove(i)),
      ],
    );
  }
}

class _AddTile extends StatelessWidget {
  const _AddTile({required this.icon, required this.label, this.onTap});
  final IconData icon;
  final String label;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final enabled = onTap != null;
    return InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: onTap,
      child: DottedBorderBox(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon,
                color: enabled ? AppTheme.brand : AppTheme.subtleInk, size: 26),
            const SizedBox(height: 6),
            Text(label,
                style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: enabled ? AppTheme.brandDark : AppTheme.subtleInk)),
          ],
        ),
      ),
    );
  }
}

class _Thumb extends StatelessWidget {
  const _Thumb({required this.path, required this.onRemove});
  final String path;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(14),
          child: Image.file(File(path), fit: BoxFit.cover,
              errorBuilder: (_, __, ___) {
            return Container(
              color: AppTheme.brandLight,
              child: const Icon(Icons.image, color: AppTheme.brandDark),
            );
          }),
        ),
        Positioned(
          top: 4,
          right: 4,
          child: GestureDetector(
            onTap: onRemove,
            child: Container(
              padding: const EdgeInsets.all(3),
              decoration: const BoxDecoration(
                color: Colors.black54,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.close, color: Colors.white, size: 15),
            ),
          ),
        ),
      ],
    );
  }
}

class DottedBorderBox extends StatelessWidget {
  const DottedBorderBox({super.key, required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.brandLight.withValues(alpha: 0.35),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.brand.withValues(alpha: 0.4)),
      ),
      child: child,
    );
  }
}

class _MediaButton extends StatelessWidget {
  const _MediaButton({
    required this.icon,
    required this.label,
    required this.active,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: active ? AppTheme.brandLight : Colors.white,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
                color: active ? AppTheme.brand : const Color(0xFFE5E7EB)),
          ),
          child: Column(
            children: [
              Icon(icon,
                  color: active ? AppTheme.brand : AppTheme.subtleInk),
              const SizedBox(height: 6),
              Text(label,
                  style: const TextStyle(
                      fontWeight: FontWeight.w700, fontSize: 13)),
            ],
          ),
        ),
      ),
    );
  }
}

class _SectionTile extends StatelessWidget {
  const _SectionTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.done,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final bool done;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        onTap: onTap,
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppTheme.radius)),
        leading: CircleAvatar(
          backgroundColor: done ? AppTheme.brand : AppTheme.brandLight,
          child: Icon(icon, color: done ? Colors.white : AppTheme.brandDark),
        ),
        title: Text(title,
            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.chevron_right),
      ),
    );
  }
}

class _AreaCard extends StatelessWidget {
  const _AreaCard({
    required this.areaM2,
    required this.onDraw,
    required this.onClear,
  });

  final double? areaM2;
  final VoidCallback onDraw;
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.crop_free, color: AppTheme.brandDark),
                const SizedBox(width: 10),
                const Expanded(
                  child: Text('Área do serviço',
                      style: TextStyle(fontWeight: FontWeight.w800)),
                ),
                if (areaM2 != null)
                  Text('${areaM2!.toStringAsFixed(0)} m²',
                      style: const TextStyle(
                          fontWeight: FontWeight.w900,
                          color: AppTheme.brandDark)),
              ],
            ),
            const SizedBox(height: 12),
            Container(
              height: 120,
              width: double.infinity,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                gradient: const LinearGradient(
                  colors: [Color(0xFFE8F3EC), Color(0xFFD6EBDD)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      areaM2 == null ? Icons.gesture : Icons.check_circle,
                      color: AppTheme.brandDark,
                      size: 30,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      areaM2 == null
                          ? 'Desenhe a área no mapa'
                          : 'Área definida',
                      style: const TextStyle(
                          color: AppTheme.brandDark,
                          fontWeight: FontWeight.w700),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: onDraw,
                    icon: const Icon(Icons.edit_location_alt, size: 18),
                    label: Text(areaM2 == null ? 'Desenhar' : 'Redesenhar'),
                  ),
                ),
                if (areaM2 != null) ...[
                  const SizedBox(width: 10),
                  IconButton(
                    onPressed: onClear,
                    icon: const Icon(Icons.delete_outline),
                    color: AppTheme.danger,
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}
