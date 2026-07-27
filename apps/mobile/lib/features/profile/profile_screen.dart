import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/config/flavor.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/router/app_router.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/money.dart';

/// Profile + settings. For the professional flavor it also surfaces an earnings
/// summary and the onboarding/edit entry point.
class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  Future<void> _logout(BuildContext context, WidgetRef ref) async {
    await ref.read(authControllerProvider.notifier).logout();
    if (context.mounted) context.go(Routes.login);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    final flavor = ref.watch(flavorProvider);
    final gp = user?.gardenerProfile;

    return Scaffold(
      appBar: AppBar(title: const Text('Perfil')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 34,
                backgroundColor: AppTheme.brandLight,
                child: Text(
                  (user?.firstName ?? 'J').substring(0, 1).toUpperCase(),
                  style: const TextStyle(
                      fontSize: 28,
                      color: AppTheme.brandDark,
                      fontWeight: FontWeight.w900),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(user?.name ?? 'Usuário',
                        style: const TextStyle(
                            fontSize: 20, fontWeight: FontWeight.w900)),
                    const SizedBox(height: 2),
                    Text(user?.email ?? '',
                        style: const TextStyle(color: AppTheme.subtleInk)),
                    if (gp != null) ...[
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          const Icon(Icons.star,
                              size: 16, color: Color(0xFFF59E0B)),
                          const SizedBox(width: 4),
                          Text(
                            '${gp.ratingAvg.toStringAsFixed(1)} · ${gp.jobsCompleted} serviços',
                            style: const TextStyle(
                                fontWeight: FontWeight.w700, fontSize: 13),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          if (flavor.isProfessional) ...[
            _EarningsCard(
              // Demo figures; a real app reads these from an earnings endpoint.
              monthCents: (gp?.jobsCompleted ?? 0) * 12000,
              jobs: gp?.jobsCompleted ?? 0,
            ),
            const SizedBox(height: 20),
            _MenuTile(
              icon: Icons.badge_outlined,
              title: 'Meu cadastro profissional',
              subtitle: gp?.status.label ?? 'Complete seu perfil',
              onTap: () => context.push(Routes.onboarding),
            ),
            _MenuTile(
              icon: Icons.tune,
              title: 'Especialidades e raio',
              subtitle: gp == null
                  ? 'Defina onde e o que você atende'
                  : '${gp.specialties.length} serviços · ${gp.serviceRadiusKm.toStringAsFixed(0)} km',
              onTap: () => context.push(Routes.onboarding),
            ),
          ] else ...[
            _MenuTile(
              icon: Icons.location_on_outlined,
              title: 'Meus endereços',
              subtitle: 'Gerencie os locais de atendimento',
              onTap: () {},
            ),
            _MenuTile(
              icon: Icons.credit_card,
              title: 'Formas de pagamento',
              subtitle: 'PIX e cartões salvos',
              onTap: () {},
            ),
          ],

          _MenuTile(
            icon: Icons.notifications_none,
            title: 'Notificações',
            subtitle: 'Push, e-mail e WhatsApp',
            onTap: () {},
          ),
          _MenuTile(
            icon: Icons.privacy_tip_outlined,
            title: 'Privacidade e LGPD',
            subtitle: 'Consentimentos e seus dados',
            onTap: () {},
          ),
          _MenuTile(
            icon: Icons.help_outline,
            title: 'Ajuda e suporte',
            subtitle: 'Central de atendimento',
            onTap: () {},
          ),
          const SizedBox(height: 20),
          OutlinedButton.icon(
            onPressed: () => _logout(context, ref),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppTheme.danger,
              side: const BorderSide(color: AppTheme.danger),
            ),
            icon: const Icon(Icons.logout),
            label: const Text('Sair da conta'),
          ),
          const SizedBox(height: 16),
          const Center(
            child: Text('JardimJá · v1.0.0',
                style: TextStyle(color: AppTheme.subtleInk, fontSize: 12)),
          ),
        ],
      ),
    );
  }
}

class _EarningsCard extends StatelessWidget {
  const _EarningsCard({required this.monthCents, required this.jobs});
  final int monthCents;
  final int jobs;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppTheme.brand, AppTheme.brandDark],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(AppTheme.radius),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Ganhos no mês',
              style: TextStyle(color: Colors.white70)),
          const SizedBox(height: 4),
          Text(Money.format(monthCents),
              style: const TextStyle(
                  color: Colors.white,
                  fontSize: 30,
                  fontWeight: FontWeight.w900)),
          const SizedBox(height: 12),
          Row(
            children: [
              _EarnStat(label: 'Serviços', value: '$jobs'),
              const SizedBox(width: 24),
              _EarnStat(
                  label: 'Ticket médio',
                  value: jobs == 0
                      ? '—'
                      : Money.format((monthCents / jobs).round())),
            ],
          ),
        ],
      ),
    );
  }
}

class _EarnStat extends StatelessWidget {
  const _EarnStat({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(value,
            style: const TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w800)),
        Text(label,
            style: const TextStyle(color: Colors.white70, fontSize: 12)),
      ],
    );
  }
}

class _MenuTile extends StatelessWidget {
  const _MenuTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Card(
        child: ListTile(
          onTap: onTap,
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppTheme.radius)),
          leading: CircleAvatar(
            backgroundColor: AppTheme.brandLight,
            child: Icon(icon, color: AppTheme.brandDark),
          ),
          title: Text(title,
              style: const TextStyle(fontWeight: FontWeight.w700)),
          subtitle: Text(subtitle),
          trailing: const Icon(Icons.chevron_right),
        ),
      ),
    );
  }
}
