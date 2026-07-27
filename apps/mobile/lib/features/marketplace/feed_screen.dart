import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/models/job.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/providers/job_repository.dart';
import '../../core/router/app_router.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/money.dart';

/// Professional home: the marketplace feed of nearby jobs, each with the AI
/// report highlights and the suggested price. Tapping opens the offer detail.
class FeedScreen extends ConsumerWidget {
  const FeedScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    final feedAsync = ref.watch(feedProvider);

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          color: AppTheme.brand,
          onRefresh: () => ref.refresh(feedProvider.future),
          child: CustomScrollView(
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Serviços perto de você',
                                style: TextStyle(
                                    fontSize: 22,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: -0.5)),
                            Text('Olá, ${user?.firstName ?? 'jardineiro'}',
                                style: const TextStyle(
                                    color: AppTheme.subtleInk)),
                          ],
                        ),
                      ),
                      IconButton(
                        onPressed: () => context.push(Routes.profile),
                        icon: const Icon(Icons.account_circle,
                            size: 34, color: AppTheme.brand),
                      ),
                    ],
                  ),
                ),
              ),
              feedAsync.when(
                loading: () => const SliverFillRemaining(
                  child: Center(child: CircularProgressIndicator()),
                ),
                error: (e, _) => const SliverFillRemaining(
                  hasScrollBody: false,
                  child: Center(
                      child: Text('Não foi possível carregar o marketplace.')),
                ),
                data: (jobs) {
                  if (jobs.isEmpty) {
                    return const SliverFillRemaining(
                      hasScrollBody: false,
                      child: _EmptyFeed(),
                    );
                  }
                  return SliverPadding(
                    padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
                    sliver: SliverList.separated(
                      itemCount: jobs.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 12),
                      itemBuilder: (_, i) => _FeedCard(
                        job: jobs[i],
                        onTap: () =>
                            context.push(Routes.offerDetail(jobs[i].id)),
                      ),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FeedCard extends StatelessWidget {
  const _FeedCard({required this.job, required this.onTap});
  final Job job;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final analysis = job.analysis;
    final suggested = job.suggestedPriceCents ?? job.quote?.totalCents;

    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(AppTheme.radius),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    height: 44,
                    width: 44,
                    decoration: BoxDecoration(
                      color: AppTheme.brandLight,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(job.primaryService?.icon ?? Icons.yard,
                        color: AppTheme.brandDark),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          job.serviceTypesLabel.isEmpty
                              ? 'Serviço'
                              : job.serviceTypesLabel,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              fontWeight: FontWeight.w800, fontSize: 15),
                        ),
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            const Icon(Icons.place,
                                size: 14, color: AppTheme.subtleInk),
                            const SizedBox(width: 2),
                            Text(job.locationLabel,
                                style: const TextStyle(
                                    color: AppTheme.subtleInk, fontSize: 12.5)),
                            if (job.distanceKm != null) ...[
                              const SizedBox(width: 8),
                              Text('• ${job.distanceKm!.toStringAsFixed(1)} km',
                                  style: const TextStyle(
                                      color: AppTheme.brandDark,
                                      fontSize: 12.5,
                                      fontWeight: FontWeight.w700)),
                            ],
                          ],
                        ),
                      ],
                    ),
                  ),
                  _UrgencyTag(label: job.urgency.label),
                ],
              ),
              if (analysis != null) ...[
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF6F8F6),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      _MiniStat(
                        icon: Icons.grass,
                        value:
                            '${analysis.features.grassAreaM2.toStringAsFixed(0)} m²',
                        label: 'Grama',
                      ),
                      _MiniStat(
                        icon: Icons.park,
                        value: '${analysis.features.treeCount}',
                        label: 'Árvores',
                      ),
                      _MiniStat(
                        icon: Icons.speed,
                        value: analysis.work.difficulty.label,
                        label: 'Dificuldade',
                      ),
                      _MiniStat(
                        icon: Icons.timer_outlined,
                        value:
                            '${analysis.work.estimatedHours.toStringAsFixed(1)}h',
                        label: 'Duração',
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 14),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Preço sugerido',
                          style: TextStyle(
                              color: AppTheme.subtleInk, fontSize: 12)),
                      Text(
                        suggested != null ? Money.format(suggested) : 'A definir',
                        style: const TextStyle(
                            fontWeight: FontWeight.w900,
                            fontSize: 18,
                            color: AppTheme.brandDark),
                      ),
                    ],
                  ),
                  const Row(
                    children: [
                      Text('Ver e responder',
                          style: TextStyle(
                              color: AppTheme.brand,
                              fontWeight: FontWeight.w800)),
                      Icon(Icons.arrow_forward, size: 18, color: AppTheme.brand),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MiniStat extends StatelessWidget {
  const _MiniStat({
    required this.icon,
    required this.value,
    required this.label,
  });

  final IconData icon;
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Icon(icon, size: 18, color: AppTheme.brandDark),
          const SizedBox(height: 4),
          Text(value,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                  fontWeight: FontWeight.w800, fontSize: 12.5)),
          Text(label,
              style: const TextStyle(color: AppTheme.subtleInk, fontSize: 10.5)),
        ],
      ),
    );
  }
}

class _UrgencyTag extends StatelessWidget {
  const _UrgencyTag({required this.label});
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(
        color: AppTheme.warning.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(label,
          style: const TextStyle(
              color: Color(0xFFB45309),
              fontWeight: FontWeight.w800,
              fontSize: 11)),
    );
  }
}

class _EmptyFeed extends StatelessWidget {
  const _EmptyFeed();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(28),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: const [
          Icon(Icons.explore_off, size: 48, color: AppTheme.subtleInk),
          SizedBox(height: 12),
          Text('Nenhum serviço no seu raio agora',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
          SizedBox(height: 6),
          Text(
            'Aumente seu raio de atendimento no perfil ou volte mais tarde.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppTheme.subtleInk),
          ),
        ],
      ),
    );
  }
}
