import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/models/enums.dart';
import '../../core/providers/job_repository.dart';
import '../../core/router/app_router.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/money.dart';
import '../../core/widgets/primary_button.dart';
import 'payment_controller.dart';

/// Payment: choose PIX (QR + copy-paste) or credit card. On confirmation the
/// job is approved (escrow released) and we route to the rating screen.
class PaymentScreen extends ConsumerStatefulWidget {
  const PaymentScreen({super.key, required this.jobId});

  final String jobId;

  @override
  ConsumerState<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends ConsumerState<PaymentScreen> {
  PaymentMethod _method = PaymentMethod.pix;

  Future<void> _selectPix() async {
    setState(() => _method = PaymentMethod.pix);
    await ref
        .read(paymentControllerProvider.notifier)
        .createIntent(widget.jobId, PaymentMethod.pix);
  }

  Future<void> _confirm() async {
    final ok = await ref
        .read(paymentControllerProvider.notifier)
        .approveAndCapture(widget.jobId);
    if (!mounted) return;
    if (ok) {
      context.pushReplacement(Routes.review(widget.jobId));
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pagamento não confirmado. Tente novamente.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final jobAsync = ref.watch(jobProvider(widget.jobId));
    final intent = ref.watch(paymentControllerProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Pagamento')),
      body: jobAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) =>
            const Center(child: Text('Não foi possível carregar o pagamento.')),
        data: (job) {
          final total = job.quote?.totalCents ?? 0;
          return ListView(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
            children: [
              _TotalCard(total: total),
              const SizedBox(height: 20),
              const Text('Forma de pagamento',
                  style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
              const SizedBox(height: 12),
              _MethodTile(
                selected: _method == PaymentMethod.pix,
                icon: Icons.pix,
                title: 'PIX',
                subtitle: 'Aprovação na hora',
                onTap: _selectPix,
              ),
              const SizedBox(height: 10),
              _MethodTile(
                selected: _method == PaymentMethod.creditCard,
                icon: Icons.credit_card,
                title: 'Cartão de crédito',
                subtitle: 'Visa, Master, Elo, Amex',
                onTap: () => setState(() => _method = PaymentMethod.creditCard),
              ),
              const SizedBox(height: 20),
              if (_method == PaymentMethod.pix)
                _PixPanel(intent: intent, onGenerate: _selectPix)
              else
                const _CardForm(),
              const SizedBox(height: 24),
              PrimaryButton(
                label: _method == PaymentMethod.pix
                    ? 'Já paguei — confirmar'
                    : 'Pagar ${Money.format(total)}',
                icon: Icons.lock,
                onPressed: _confirm,
              ),
              const SizedBox(height: 10),
              const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.shield_outlined,
                      size: 15, color: AppTheme.subtleInk),
                  SizedBox(width: 6),
                  Text('Pagamento protegido — só liberamos após você aprovar.',
                      style:
                          TextStyle(color: AppTheme.subtleInk, fontSize: 11.5)),
                ],
              ),
            ],
          );
        },
      ),
    );
  }
}

class _TotalCard extends StatelessWidget {
  const _TotalCard({required this.total});
  final int total;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppTheme.brand, AppTheme.brandDark],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(AppTheme.radius),
      ),
      child: Column(
        children: [
          const Text('Total a pagar',
              style: TextStyle(color: Colors.white70)),
          const SizedBox(height: 6),
          Text(Money.format(total),
              style: const TextStyle(
                  color: Colors.white,
                  fontSize: 34,
                  fontWeight: FontWeight.w900)),
        ],
      ),
    );
  }
}

class _MethodTile extends StatelessWidget {
  const _MethodTile({
    required this.selected,
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final bool selected;
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? AppTheme.brandLight : Colors.white,
      borderRadius: BorderRadius.circular(AppTheme.radius),
      child: InkWell(
        borderRadius: BorderRadius.circular(AppTheme.radius),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppTheme.radius),
            border: Border.all(
              color: selected ? AppTheme.brand : const Color(0xFFE5E7EB),
              width: selected ? 1.6 : 1,
            ),
          ),
          child: Row(
            children: [
              Icon(icon, color: AppTheme.brandDark),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title,
                        style: const TextStyle(
                            fontWeight: FontWeight.w800, fontSize: 15)),
                    Text(subtitle,
                        style: const TextStyle(
                            color: AppTheme.subtleInk, fontSize: 12.5)),
                  ],
                ),
              ),
              Icon(
                selected
                    ? Icons.radio_button_checked
                    : Icons.radio_button_off,
                color: selected ? AppTheme.brand : AppTheme.subtleInk,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PixPanel extends StatelessWidget {
  const _PixPanel({required this.intent, required this.onGenerate});
  final AsyncValue<PaymentIntent>? intent;
  final VoidCallback onGenerate;

  @override
  Widget build(BuildContext context) {
    if (intent == null) {
      return Center(
        child: OutlinedButton.icon(
          onPressed: onGenerate,
          icon: const Icon(Icons.qr_code_2),
          label: const Text('Gerar QR Code PIX'),
        ),
      );
    }
    return intent!.when(
      loading: () => const Padding(
        padding: EdgeInsets.all(24),
        child: Center(child: CircularProgressIndicator()),
      ),
      error: (e, _) => Center(
        child: Column(
          children: [
            const Text('Falha ao gerar o PIX.'),
            const SizedBox(height: 8),
            OutlinedButton(onPressed: onGenerate, child: const Text('Tentar de novo')),
          ],
        ),
      ),
      data: (pi) => Card(
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            children: [
              Container(
                height: 190,
                width: 190,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE5E7EB)),
                ),
                child: const Icon(Icons.qr_code_2, size: 150),
              ),
              const SizedBox(height: 14),
              const Text('Escaneie com o app do seu banco',
                  style: TextStyle(fontWeight: FontWeight.w700)),
              const SizedBox(height: 12),
              _CopyPaste(
                code: pi.pixCopyPaste ??
                    '00020126BR.GOV.BCB.PIX...jardimja-${pi.externalId ?? 'demo'}',
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CopyPaste extends StatelessWidget {
  const _CopyPaste({required this.code});
  final String code;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () {
        Clipboard.setData(ClipboardData(text: code));
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Código PIX copiado!')),
        );
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: const Color(0xFFF3F4F6),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(code,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontFamily: 'monospace', fontSize: 12)),
            ),
            const SizedBox(width: 8),
            const Icon(Icons.copy, size: 18, color: AppTheme.brand),
          ],
        ),
      ),
    );
  }
}

class _CardForm extends StatelessWidget {
  const _CardForm();

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          children: [
            const TextField(
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                labelText: 'Número do cartão',
                hintText: '0000 0000 0000 0000',
                prefixIcon: Icon(Icons.credit_card),
              ),
            ),
            const SizedBox(height: 12),
            const TextField(
              decoration: InputDecoration(
                labelText: 'Nome impresso no cartão',
                prefixIcon: Icon(Icons.person_outline),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: const [
                Expanded(
                  child: TextField(
                    keyboardType: TextInputType.datetime,
                    decoration: InputDecoration(
                      labelText: 'Validade',
                      hintText: 'MM/AA',
                    ),
                  ),
                ),
                SizedBox(width: 12),
                Expanded(
                  child: TextField(
                    keyboardType: TextInputType.number,
                    obscureText: true,
                    decoration: InputDecoration(
                      labelText: 'CVV',
                      hintText: '123',
                    ),
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
