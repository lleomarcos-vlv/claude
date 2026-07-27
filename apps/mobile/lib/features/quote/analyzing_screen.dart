import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/providers/job_repository.dart';
import '../../core/router/app_router.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/primary_button.dart';

/// "IA analisando…" — fires `POST /jobs/{id}/analyze` (multimodal consensus +
/// pricing engine) and cycles through friendly status lines while it runs, then
/// replaces itself with the quote-review screen.
class AnalyzingScreen extends ConsumerStatefulWidget {
  const AnalyzingScreen({super.key, required this.jobId});

  final String jobId;

  @override
  ConsumerState<AnalyzingScreen> createState() => _AnalyzingScreenState();
}

class _AnalyzingScreenState extends ConsumerState<AnalyzingScreen> {
  static const _steps = [
    ('Enviando imagens para a IA', Icons.cloud_upload_outlined),
    ('Medindo a área e a altura da grama', Icons.straighten),
    ('Contando árvores e arbustos', Icons.park_outlined),
    ('Avaliando dificuldade e equipamentos', Icons.handyman_outlined),
    ('Calculando o orçamento justo', Icons.calculate_outlined),
  ];

  int _stepIndex = 0;
  Timer? _timer;
  String? _error;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(milliseconds: 1200), (t) {
      if (!mounted) return;
      setState(() => _stepIndex = (_stepIndex + 1) % _steps.length);
    });
    _runAnalysis();
  }

  Future<void> _runAnalysis() async {
    setState(() => _error = null);
    try {
      await ref.read(jobRepositoryProvider).analyze(widget.jobId);
      // Freshen the cached job so the quote screen reads the new analysis+quote.
      ref.invalidate(jobProvider(widget.jobId));
      if (!mounted) return;
      context.pushReplacement(Routes.quote(widget.jobId));
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = 'Não foi possível concluir a análise.');
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Spacer(),
              _PulsingBrain(),
              const SizedBox(height: 28),
              const Text(
                'IA analisando…',
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900),
              ),
              const SizedBox(height: 8),
              const Text(
                'Isso leva só alguns segundos.',
                style: TextStyle(color: AppTheme.subtleInk),
              ),
              const SizedBox(height: 32),
              if (_error == null)
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 300),
                  child: _StepRow(
                    key: ValueKey(_stepIndex),
                    label: _steps[_stepIndex].$1,
                    icon: _steps[_stepIndex].$2,
                  ),
                )
              else ...[
                const Icon(Icons.error_outline,
                    color: AppTheme.danger, size: 40),
                const SizedBox(height: 12),
                Text(_error!,
                    style: const TextStyle(color: AppTheme.danger)),
                const SizedBox(height: 20),
                PrimaryButton(
                  label: 'Tentar novamente',
                  icon: Icons.refresh,
                  onPressed: _runAnalysis,
                ),
              ],
              const Spacer(),
            ],
          ),
        ),
      ),
    );
  }
}

class _PulsingBrain extends StatefulWidget {
  @override
  State<_PulsingBrain> createState() => _PulsingBrainState();
}

class _PulsingBrainState extends State<_PulsingBrain>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1400),
  )..repeat(reverse: true);

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ScaleTransition(
      scale: Tween(begin: 0.94, end: 1.06).animate(
        CurvedAnimation(parent: _c, curve: Curves.easeInOut),
      ),
      child: Container(
        height: 110,
        width: 110,
        decoration: BoxDecoration(
          color: AppTheme.brandLight,
          shape: BoxShape.circle,
        ),
        child: const Icon(Icons.auto_awesome, size: 54, color: AppTheme.brand),
      ),
    );
  }
}

class _StepRow extends StatelessWidget {
  const _StepRow({super.key, required this.label, required this.icon});
  final String label;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(30),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: AppTheme.brand, size: 20),
          const SizedBox(width: 10),
          Flexible(
            child: Text(label,
                style: const TextStyle(fontWeight: FontWeight.w700)),
          ),
          const SizedBox(width: 10),
          const SizedBox(
            height: 16,
            width: 16,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
        ],
      ),
    );
  }
}
