import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/models/garden_analysis.dart';
import '../../core/models/job.dart';
import '../../core/providers/job_repository.dart';
import '../../core/router/app_router.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/money.dart';
import '../../core/widgets/confidence_bar.dart';
import '../../core/widgets/primary_button.dart';
import '../../core/widgets/service_type_chip.dart';
import 'marketplace_controller.dart';

/// Job offer detail (gardener side): full AI report + the suggested price, with
/// accept / counter-offer / decline / chat actions.
class OfferDetailScreen extends ConsumerWidget {
  const OfferDetailScreen({super.key, required this.jobId});

  final String jobId;

  Future<void> _accept(BuildContext context, WidgetRef ref, int priceCents) async {
    final ok = await ref.read(offerControllerProvider.notifier).submit(
          jobId: jobId,
          priceCents: priceCents,
          message: 'Aceito pelo preço sugerido. Posso realizar o serviço!',
        );
    if (!context.mounted) return;
    if (ok) {
      // Prototype flow: acceptance takes the gardener to the active-job screen
      // (check-in / start / check-out). In production this opens only after the
      // client chooses this offer (via push notification deep-link).
      context.pushReplacement(Routes.checkin(jobId));
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Não foi possível enviar a proposta.')),
      );
    }
  }

  Future<void> _counter(BuildContext context, WidgetRef ref, int suggested) async {
    final result = await showModalBottomSheet<({int price, String? msg})>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => _CounterSheet(suggested: suggested),
    );
    if (result == null) return;
    final ok = await ref.read(offerControllerProvider.notifier).submit(
          jobId: jobId,
          priceCents: result.price,
          message: result.msg,
        );
    if (context.mounted) _afterSubmit(context, ok);
  }

  void _afterSubmit(BuildContext context, bool ok) {
    if (!context.mounted) return;
    if (ok) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Proposta enviada! Você será avisado se for escolhido.')),
      );
      context.pop();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Não foi possível enviar a proposta.')),
      );
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final jobAsync = ref.watch(jobProvider(jobId));
    final submitting = ref.watch(offerControllerProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Detalhes do serviço'),
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
        data: (job) {
          final analysis = job.analysis;
          final suggested = job.suggestedPriceCents ??
              job.quote?.totalCents ??
              job.quote?.subtotalCents ??
              0;
          return Column(
            children: [
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
                  children: [
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: job.serviceTypes
                          .map((t) => ServiceTypeChip(type: t, compact: true))
                          .toList(),
                    ),
                    const SizedBox(height: 14),
                    _InfoRow(
                      icon: Icons.place,
                      text: job.locationLabel +
                          (job.distanceKm != null
                              ? '  ·  ${job.distanceKm!.toStringAsFixed(1)} km'
                              : ''),
                    ),
                    _InfoRow(icon: Icons.bolt, text: 'Urgência: ${job.urgency.label}'),
                    if (job.note != null && job.note!.isNotEmpty)
                      _InfoRow(icon: Icons.sticky_note_2_outlined, text: job.note!),
                    const SizedBox(height: 16),
                    if (analysis != null) ...[
                      _AiReport(analysis: analysis),
                      const SizedBox(height: 16),
                      if (job.quote != null)
                        Card(
                          child: Padding(
                            padding: const EdgeInsets.all(18),
                            child:
                                ConfidenceBar(confidence: job.quote!.confidence),
                          ),
                        ),
                    ],
                    const SizedBox(height: 16),
                    _SuggestedPriceCard(
                      suggested: suggested,
                      net: job.quote?.gardenerNetCents,
                    ),
                  ],
                ),
              ),
              _ActionBar(
                submitting: submitting,
                onAccept: () => _accept(context, ref, suggested),
                onCounter: () => _counter(context, ref, suggested),
                onDecline: () {
                  ref.invalidate(feedProvider);
                  context.pop();
                },
              ),
            ],
          );
        },
      ),
    );
  }
}

class _AiReport extends StatelessWidget {
  const _AiReport({required this.analysis});
  final GardenAnalysis analysis;

  @override
  Widget build(BuildContext context) {
    final f = analysis.features;
    final w = analysis.work;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: const [
                Icon(Icons.auto_awesome, color: AppTheme.brand, size: 20),
                SizedBox(width: 8),
                Text('Relatório da IA',
                    style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
              ],
            ),
            const SizedBox(height: 12),
            if (analysis.summary.isNotEmpty)
              Text(analysis.summary,
                  style: const TextStyle(height: 1.4, color: AppTheme.ink)),
            const SizedBox(height: 12),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                _Pill('Grama', '${f.grassAreaM2.toStringAsFixed(0)} m²'),
                _Pill('Altura', '${f.grassHeightCm.toStringAsFixed(0)} cm'),
                _Pill('Árvores', '${f.treeCount}'),
                _Pill('Arbustos', '${f.shrubCount}'),
                _Pill('Dificuldade', w.difficulty.label),
                _Pill('Equipe', '${w.estimatedCrewSize}'),
                _Pill('Duração', '${w.estimatedHours.toStringAsFixed(1)} h'),
                _Pill('Descarte', '${f.greenWasteM3.toStringAsFixed(1)} m³'),
              ],
            ),
            if (w.requiredEquipment.isNotEmpty) ...[
              const SizedBox(height: 14),
              const Text('Equipamentos',
                  style: TextStyle(
                      color: AppTheme.subtleInk,
                      fontWeight: FontWeight.w700,
                      fontSize: 12.5)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: w.requiredEquipment
                    .map((e) => Chip(
                          avatar: Icon(e.icon,
                              size: 16, color: AppTheme.brandDark),
                          label: Text(e.label),
                        ))
                    .toList(),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _Pill extends StatelessWidget {
  const _Pill(this.label, this.value);
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFFF6F8F6),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              style: const TextStyle(color: AppTheme.subtleInk, fontSize: 11)),
          Text(value,
              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
        ],
      ),
    );
  }
}

class _SuggestedPriceCard extends StatelessWidget {
  const _SuggestedPriceCard({required this.suggested, this.net});
  final int suggested;
  final int? net;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppTheme.brand, AppTheme.brandDark],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(AppTheme.radius),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Preço sugerido pela IA',
                    style: TextStyle(color: Colors.white70, fontSize: 13)),
                const SizedBox(height: 2),
                Text(Money.format(suggested),
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 26,
                        fontWeight: FontWeight.w900)),
                if (net != null)
                  Text('Você recebe: ${Money.format(net!)}',
                      style: const TextStyle(
                          color: Colors.white, fontSize: 12.5)),
              ],
            ),
          ),
          const Icon(Icons.request_quote, color: Colors.white, size: 40),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.icon, required this.text});
  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppTheme.subtleInk),
          const SizedBox(width: 8),
          Expanded(child: Text(text, style: const TextStyle(fontSize: 13.5))),
        ],
      ),
    );
  }
}

class _ActionBar extends StatelessWidget {
  const _ActionBar({
    required this.submitting,
    required this.onAccept,
    required this.onCounter,
    required this.onDecline,
  });

  final bool submitting;
  final VoidCallback onAccept;
  final VoidCallback onCounter;
  final VoidCallback onDecline;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: Colors.grey.shade200)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: submitting ? null : onCounter,
                    child: const Text('Contraproposta'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: PrimaryButton(
                    label: 'Aceitar',
                    loading: submitting,
                    onPressed: onAccept,
                  ),
                ),
              ],
            ),
            TextButton(
              onPressed: submitting ? null : onDecline,
              child: const Text('Recusar serviço',
                  style: TextStyle(color: AppTheme.subtleInk)),
            ),
          ],
        ),
      ),
    );
  }
}

class _CounterSheet extends StatefulWidget {
  const _CounterSheet({required this.suggested});
  final int suggested;

  @override
  State<_CounterSheet> createState() => _CounterSheetState();
}

class _CounterSheetState extends State<_CounterSheet> {
  late final TextEditingController _price = TextEditingController(
    text: Money.formatBare(widget.suggested),
  );
  final _msg = TextEditingController();

  @override
  void dispose() {
    _price.dispose();
    _msg.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(
          20, 20, 20, MediaQuery.of(context).viewInsets.bottom + 20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('Sua contraproposta',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
          const SizedBox(height: 4),
          const Text('Defina seu preço e explique o porquê ao cliente.',
              style: TextStyle(color: AppTheme.subtleInk, fontSize: 13)),
          const SizedBox(height: 16),
          TextField(
            controller: _price,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(
              labelText: 'Preço (R\$)',
              prefixText: 'R\$ ',
              prefixIcon: Icon(Icons.attach_money),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _msg,
            maxLines: 2,
            decoration: const InputDecoration(
              labelText: 'Mensagem (opcional)',
              hintText: 'Ex.: inclui descarte e vou hoje à tarde.',
            ),
          ),
          const SizedBox(height: 16),
          PrimaryButton(
            label: 'Enviar contraproposta',
            icon: Icons.send,
            onPressed: () {
              final cents = Money.parseToCents(_price.text);
              Navigator.pop<({int price, String? msg})>(
                context,
                (
                  price: cents,
                  msg: _msg.text.trim().isEmpty ? null : _msg.text.trim()
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
