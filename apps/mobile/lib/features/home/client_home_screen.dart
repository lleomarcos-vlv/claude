import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/models/enums.dart';
import '../../core/models/job.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/providers/job_repository.dart';
import '../../core/router/app_router.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/service_type_chip.dart';

/// Client landing screen: greeting, the big "request a service" CTA, and the
/// list of the user's ongoing jobs. Tapping a job deep-links to whatever screen
/// its status calls for (quote, offers, tracking, payment, review).
class ClientHomeScreen extends ConsumerWidget {
  const ClientHomeScreen({super.key});

  /// Maps a job's lifecycle status to the right destination route.
  static String routeForJob(Job job) {
    switch (job.status) {
      case JobStatus.draft:
      case JobStatus.analyzing:
        return Routes.analyzing(job.id);
      case JobStatus.quoted:
        return Routes.quote(job.id);
      case JobStatus.matching:
      case JobStatus.offered:
        return Routes.offers(job.id);
      case JobStatus.accepted:
      case JobStatus.scheduled:
      case JobStatus.enroute:
      case JobStatus.arrived:
      case JobStatus.inProgress:
        return Routes.tracking(job.id);
      case JobStatus.completed:
      case JobStatus.approved:
        return Routes.payment(job.id);
      case JobStatus.paid:
        return Routes.review(job.id);
      default:
        return Routes.tracking(job.id);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    final jobsAsync = ref.watch(myJobsProvider);

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          color: AppTheme.brand,
          onRefresh: () => ref.refresh(myJobsProvider.future),
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
            children: [
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Olá,',
                            style: TextStyle(
                                color: AppTheme.subtleInk, fontSize: 15)),
                        Text(
                          user?.firstName ?? 'tudo bem?',
                          style: const TextStyle(
                            fontSize: 26,
                            fontWeight: FontWeight.w900,
                            letterSpacing: -0.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                  GestureDetector(
                    onTap: () => context.push(Routes.profile),
                    child: CircleAvatar(
                      radius: 24,
                      backgroundColor: AppTheme.brandLight,
                      child: Text(
                        (user?.firstName ?? 'J')
                            .substring(0, 1)
                            .toUpperCase(),
                        style: const TextStyle(
                          color: AppTheme.brandDark,
                          fontWeight: FontWeight.w800,
                          fontSize: 18,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              _RequestCta(onTap: () => context.push(Routes.services)),
              const SizedBox(height: 24),
              const Text(
                'Serviços populares',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  ServiceType.corteGrama,
                  ServiceType.poda,
                  ServiceType.limpeza,
                  ServiceType.jardimCompleto,
                ]
                    .map((t) => ServiceTypeChip(
                          type: t,
                          onTap: () =>
                              context.push(Routes.capture, extra: <ServiceType>[t]),
                        ))
                    .toList(),
              ),
              const SizedBox(height: 28),
              const Text(
                'Seus pedidos',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 12),
              jobsAsync.when(
                loading: () => const Padding(
                  padding: EdgeInsets.symmetric(vertical: 32),
                  child: Center(child: CircularProgressIndicator()),
                ),
                error: (e, _) => _EmptyJobs(
                  message: 'Não foi possível carregar seus pedidos.',
                ),
                data: (jobs) {
                  if (jobs.isEmpty) {
                    return const _EmptyJobs(
                      message:
                          'Você ainda não tem pedidos. Que tal começar agora?',
                    );
                  }
                  return Column(
                    children: jobs
                        .map((j) => Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: _JobCard(
                                job: j,
                                onTap: () => context.push(routeForJob(j)),
                              ),
                            ))
                        .toList(),
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

class _RequestCta extends StatelessWidget {
  const _RequestCta({required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(22),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            gradient: const LinearGradient(
              colors: [AppTheme.brand, AppTheme.brandDark],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    Text(
                      'Orçamento por IA em segundos',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        height: 1.2,
                      ),
                    ),
                    SizedBox(height: 6),
                    Text(
                      'Tire fotos do seu jardim e receba um preço justo na hora.',
                      style: TextStyle(color: Colors.white, fontSize: 13),
                    ),
                    SizedBox(height: 14),
                    _CtaPill(),
                  ],
                ),
              ),
              const Icon(Icons.photo_camera, color: Colors.white, size: 48),
            ],
          ),
        ),
      ),
    );
  }
}

class _CtaPill extends StatelessWidget {
  const _CtaPill();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(30),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: const [
          Text('Solicitar serviço',
              style: TextStyle(
                  color: AppTheme.brandDark, fontWeight: FontWeight.w800)),
          SizedBox(width: 6),
          Icon(Icons.arrow_forward, size: 18, color: AppTheme.brandDark),
        ],
      ),
    );
  }
}

class _JobCard extends StatelessWidget {
  const _JobCard({required this.job, required this.onTap});
  final Job job;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(AppTheme.radius),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                height: 46,
                width: 46,
                decoration: BoxDecoration(
                  color: AppTheme.brandLight,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(job.primaryService?.icon ?? Icons.yard,
                    color: AppTheme.brandDark),
              ),
              const SizedBox(width: 14),
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
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 4),
                    Text(job.locationLabel,
                        style: const TextStyle(
                            color: AppTheme.subtleInk, fontSize: 12.5)),
                  ],
                ),
              ),
              JobStatusBadge(status: job.status),
            ],
          ),
        ),
      ),
    );
  }
}

/// Reusable status pill.
class JobStatusBadge extends StatelessWidget {
  const JobStatusBadge({super.key, required this.status});
  final JobStatus status;

  Color get _color {
    switch (status) {
      case JobStatus.paid:
      case JobStatus.approved:
      case JobStatus.completed:
      case JobStatus.reviewed:
        return AppTheme.brand;
      case JobStatus.cancelled:
      case JobStatus.disputed:
        return AppTheme.danger;
      case JobStatus.analyzing:
      case JobStatus.matching:
        return AppTheme.warning;
      default:
        return AppTheme.brandDark;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: _color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        status.label,
        style: TextStyle(
            color: _color, fontWeight: FontWeight.w800, fontSize: 11.5),
      ),
    );
  }
}

class _EmptyJobs extends StatelessWidget {
  const _EmptyJobs({required this.message});
  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 36, horizontal: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppTheme.radius),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Column(
        children: [
          const Icon(Icons.spa_outlined, size: 40, color: AppTheme.subtleInk),
          const SizedBox(height: 12),
          Text(
            message,
            textAlign: TextAlign.center,
            style: const TextStyle(color: AppTheme.subtleInk),
          ),
        ],
      ),
    );
  }
}
