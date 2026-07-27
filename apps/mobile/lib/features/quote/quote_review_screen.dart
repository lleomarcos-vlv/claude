import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/models/garden_analysis.dart';
import '../../core/models/job.dart';
import '../../core/providers/job_repository.dart';
import '../../core/router/app_router.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/confidence_bar.dart';
import '../../core/widgets/price_breakdown_card.dart';
import '../../core/widgets/primary_button.dart';
import '../../core/widgets/service_type_chip.dart';
import 'quote_controller.dart';

/// Quote review: renders the AI garden report + the priced quote breakdown and
/// lets the client publish the job to the marketplace.
class QuoteReviewScreen extends ConsumerWidget {
  const QuoteReviewScreen({super.key, required this.jobId});

  final String jobId;

  Future<void> _publish(BuildContext context, WidgetRef ref) async {
    final ok = await ref.read(publishControllerProvider.notifier).publish(jobId);
    if (!context.mounted) return;
    if (ok) {
      context.pushReplacement(Routes.offers(jobId));
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Não foi possível publicar. Tente de novo.')),
      );
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final jobAsync = ref.watch(jobProvider(jobId));
    final publishing = ref.watch(publishControllerProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Seu orçamento')),
      body: jobAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => _ErrorState(onRetry: () => ref.invalidate(jobProvider(jobId))),
        data: (job) {
          final analysis = job.analysis;
          final quote = job.quote;
          if (analysis == null || quote == null) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text(
                  'A análise ainda não está pronta para este pedido.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppTheme.subtleInk),
                ),
              ),
            );
          }
          return ListView(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
            children: [
              _AiSummaryCard(analysis: analysis),
              const SizedBox(height: 16),
              _ReportGrid(features: analysis.features, work: analysis.work),
              const SizedBox(height: 16),
              _EquipmentCard(work: analysis.work),
              if (analysis.warnings.isNotEmpty) ...[
                const SizedBox(height: 16),
                _WarningsCard(warnings: analysis.warnings),
              ],
              const SizedBox(height: 16),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(18),
                  child: ConfidenceBar(confidence: quote.confidence),
                ),
              ),
              const SizedBox(height: 16),
              PriceBreakdownCard(quote: quote),
              const SizedBox(height: 24),
              PrimaryButton(
                label: 'Publicar no marketplace',
                icon: Icons.storefront,
                loading: publishing,
                onPressed: () => _publish(context, ref),
              ),
              const SizedBox(height: 8),
              const Center(
                child: Text(
                  'Jardineiros próximos vão enviar propostas para você escolher.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppTheme.subtleInk, fontSize: 12.5),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _AiSummaryCard extends StatelessWidget {
  const _AiSummaryCard({required this.analysis});
  final GardenAnalysis analysis;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  height: 40,
                  width: 40,
                  decoration: BoxDecoration(
                    color: AppTheme.brandLight,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.auto_awesome,
                      color: AppTheme.brand, size: 22),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Text('Relatório da IA',
                      style: TextStyle(
                          fontWeight: FontWeight.w800, fontSize: 16)),
                ),
                _ConfidenceChip(percent: analysis.confidencePercent),
              ],
            ),
            const SizedBox(height: 14),
            Text(
              analysis.summary.isEmpty
                  ? 'Análise concluída com base nas fotos enviadas.'
                  : analysis.summary,
              style: const TextStyle(height: 1.4, color: AppTheme.ink),
            ),
            if (analysis.work.recommendedServices.isNotEmpty) ...[
              const SizedBox(height: 14),
              const Text('Serviços recomendados',
                  style: TextStyle(
                      color: AppTheme.subtleInk,
                      fontSize: 12.5,
                      fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: analysis.work.recommendedServices
                    .map((t) => ServiceTypeChip(type: t, compact: true))
                    .toList(),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _ConfidenceChip extends StatelessWidget {
  const _ConfidenceChip({required this.percent});
  final int percent;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: AppTheme.brandLight,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text('$percent% conf.',
          style: const TextStyle(
              color: AppTheme.brandDark,
              fontWeight: FontWeight.w800,
              fontSize: 12)),
    );
  }
}

class _ReportGrid extends StatelessWidget {
  const _ReportGrid({required this.features, required this.work});
  final GardenFeatures features;
  final WorkEstimate work;

  @override
  Widget build(BuildContext context) {
    final metrics = <_Metric>[
      _Metric(Icons.grass, 'Área de grama',
          '${features.grassAreaM2.toStringAsFixed(0)} m²'),
      _Metric(Icons.crop_free, 'Área total',
          '${features.totalAreaM2.toStringAsFixed(0)} m²'),
      _Metric(Icons.height, 'Altura da grama',
          '${features.grassHeightCm.toStringAsFixed(0)} cm'),
      _Metric(Icons.park, 'Árvores', '${features.treeCount}'),
      _Metric(Icons.nature, 'Arbustos', '${features.shrubCount}'),
      _Metric(Icons.terrain, 'Terreno', features.terrainSlope.label),
      _Metric(Icons.timer_outlined, 'Duração estim.',
          '${work.estimatedHours.toStringAsFixed(1)} h'),
      _Metric(Icons.group, 'Equipe', '${work.estimatedCrewSize} pessoa(s)'),
    ];

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Medições',
                    style: TextStyle(
                        fontWeight: FontWeight.w800, fontSize: 16)),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: work.difficulty.color.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    'Dificuldade: ${work.difficulty.label}',
                    style: TextStyle(
                        color: work.difficulty.color,
                        fontWeight: FontWeight.w800,
                        fontSize: 12),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 2.6,
              children: metrics.map((m) => _MetricTile(metric: m)).toList(),
            ),
          ],
        ),
      ),
    );
  }
}

class _Metric {
  const _Metric(this.icon, this.label, this.value);
  final IconData icon;
  final String label;
  final String value;
}

class _MetricTile extends StatelessWidget {
  const _MetricTile({required this.metric});
  final _Metric metric;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(metric.icon, color: AppTheme.brandDark, size: 22),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(metric.label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                      color: AppTheme.subtleInk, fontSize: 11.5)),
              Text(metric.value,
                  style: const TextStyle(
                      fontWeight: FontWeight.w800, fontSize: 14)),
            ],
          ),
        ),
      ],
    );
  }
}

class _EquipmentCard extends StatelessWidget {
  const _EquipmentCard({required this.work});
  final WorkEstimate work;

  @override
  Widget build(BuildContext context) {
    if (work.requiredEquipment.isEmpty) return const SizedBox.shrink();
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Equipamentos necessários',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: work.requiredEquipment
                  .map((e) => Chip(
                        avatar: Icon(e.icon, size: 18, color: AppTheme.brandDark),
                        label: Text(e.label),
                      ))
                  .toList(),
            ),
          ],
        ),
      ),
    );
  }
}

class _WarningsCard extends StatelessWidget {
  const _WarningsCard({required this.warnings});
  final List<String> warnings;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.warning.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(AppTheme.radius),
        border: Border.all(color: AppTheme.warning.withValues(alpha: 0.4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              Icon(Icons.info_outline, color: Color(0xFFB45309), size: 20),
              SizedBox(width: 8),
              Text('Observações da IA',
                  style: TextStyle(
                      fontWeight: FontWeight.w800, color: Color(0xFFB45309))),
            ],
          ),
          const SizedBox(height: 8),
          ...warnings.map((w) => Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Text('• $w',
                    style: const TextStyle(
                        color: Color(0xFF92400E), fontSize: 13)),
              )),
        ],
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.onRetry});
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.cloud_off, size: 44, color: AppTheme.subtleInk),
            const SizedBox(height: 12),
            const Text('Não foi possível carregar o orçamento.'),
            const SizedBox(height: 16),
            SizedBox(
              width: 180,
              child: PrimaryButton(
                label: 'Tentar novamente',
                onPressed: onRetry,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
