import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/models/offer.dart';
import '../../core/providers/job_repository.dart';
import '../../core/router/app_router.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/money.dart';
import '../../core/widgets/primary_button.dart';

/// Client-facing list of gardener offers. Choosing one calls
/// `POST /offers/{id}/choose` and moves the job into live tracking.
class OffersListScreen extends ConsumerWidget {
  const OffersListScreen({super.key, required this.jobId});

  final String jobId;

  Future<void> _choose(BuildContext context, WidgetRef ref, Offer offer) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Confirmar jardineiro?'),
        content: Text(
          'Você vai contratar ${offer.gardener?.name ?? 'este jardineiro'} '
          'por ${Money.format(offer.priceCents)}.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Confirmar'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    try {
      await ref.read(jobRepositoryProvider).chooseOffer(offer.id);
      ref.invalidate(jobProvider(jobId));
      if (context.mounted) context.pushReplacement(Routes.tracking(jobId));
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Não foi possível escolher a proposta.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final offersAsync = ref.watch(offersProvider(jobId));

    return Scaffold(
      appBar: AppBar(title: const Text('Propostas recebidas')),
      body: offersAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => const Center(
          child: Text('Não foi possível carregar as propostas.'),
        ),
        data: (offers) {
          if (offers.isEmpty) return const _WaitingForOffers();
          return RefreshIndicator(
            color: AppTheme.brand,
            onRefresh: () => ref.refresh(offersProvider(jobId).future),
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
              itemCount: offers.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (_, i) => _OfferCard(
                offer: offers[i],
                onChoose: () => _choose(context, ref, offers[i]),
                onChat: () => context.push(Routes.chat(jobId)),
              ),
            ),
          );
        },
      ),
    );
  }
}

class _OfferCard extends StatelessWidget {
  const _OfferCard({
    required this.offer,
    required this.onChoose,
    required this.onChat,
  });

  final Offer offer;
  final VoidCallback onChoose;
  final VoidCallback onChat;

  @override
  Widget build(BuildContext context) {
    final g = offer.gardener;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 26,
                  backgroundColor: AppTheme.brandLight,
                  child: Text(
                    (g?.name ?? 'J').substring(0, 1).toUpperCase(),
                    style: const TextStyle(
                        color: AppTheme.brandDark,
                        fontWeight: FontWeight.w800,
                        fontSize: 20),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(g?.name ?? 'Jardineiro',
                          style: const TextStyle(
                              fontWeight: FontWeight.w800, fontSize: 16)),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          const Icon(Icons.star,
                              color: Color(0xFFF59E0B), size: 16),
                          const SizedBox(width: 3),
                          Text(
                            '${(g?.ratingAvg ?? 0).toStringAsFixed(1)} '
                            '(${g?.ratingCount ?? 0})',
                            style: const TextStyle(
                                fontWeight: FontWeight.w600, fontSize: 13),
                          ),
                          const SizedBox(width: 10),
                          Text('${g?.jobsCompleted ?? 0} serviços',
                              style: const TextStyle(
                                  color: AppTheme.subtleInk, fontSize: 12.5)),
                        ],
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    if (offer.isCounterOffer)
                      const Text('Contraproposta',
                          style: TextStyle(
                              color: AppTheme.warning,
                              fontSize: 11,
                              fontWeight: FontWeight.w700)),
                    Text(
                      Money.format(offer.priceCents),
                      style: const TextStyle(
                          fontWeight: FontWeight.w900,
                          fontSize: 18,
                          color: AppTheme.brandDark),
                    ),
                  ],
                ),
              ],
            ),
            if (offer.message != null && offer.message!.isNotEmpty) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                width: double.infinity,
                decoration: BoxDecoration(
                  color: const Color(0xFFF3F4F6),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text('"${offer.message!}"',
                    style: const TextStyle(
                        fontStyle: FontStyle.italic, fontSize: 13.5)),
              ),
            ],
            if (g?.distanceKm != null) ...[
              const SizedBox(height: 10),
              Row(
                children: [
                  const Icon(Icons.near_me,
                      size: 15, color: AppTheme.subtleInk),
                  const SizedBox(width: 4),
                  Text('${g!.distanceKm!.toStringAsFixed(1)} km de distância',
                      style: const TextStyle(
                          color: AppTheme.subtleInk, fontSize: 12.5)),
                ],
              ),
            ],
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: onChat,
                    icon: const Icon(Icons.chat_bubble_outline, size: 18),
                    label: const Text('Conversar'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: PrimaryButton(
                    label: 'Escolher',
                    onPressed: onChoose,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _WaitingForOffers extends StatelessWidget {
  const _WaitingForOffers();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              height: 90,
              width: 90,
              decoration: const BoxDecoration(
                color: AppTheme.brandLight,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.hourglass_top,
                  color: AppTheme.brand, size: 42),
            ),
            const SizedBox(height: 20),
            const Text('Aguardando propostas',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
            const SizedBox(height: 8),
            const Text(
              'Seu pedido está no marketplace. Jardineiros próximos já foram '
              'notificados — puxe para atualizar.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppTheme.subtleInk),
            ),
          ],
        ),
      ),
    );
  }
}
