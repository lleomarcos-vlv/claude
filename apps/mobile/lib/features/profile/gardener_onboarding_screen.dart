import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/models/enums.dart';
import '../../core/router/app_router.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/money.dart';
import '../../core/widgets/primary_button.dart';

/// Gardener onboarding: CPF/CNPJ, documents, specialties, equipment, service
/// radius and pricing. A multi-step wizard; the final step submits the profile.
///
/// NOTE: the shared REST list doesn't include a gardener-profile endpoint, so
/// submission is simulated here (navigates home) — wire it to your `/gardeners`
/// / `/me` PATCH when available.
class GardenerOnboardingScreen extends ConsumerStatefulWidget {
  const GardenerOnboardingScreen({super.key});

  @override
  ConsumerState<GardenerOnboardingScreen> createState() =>
      _GardenerOnboardingScreenState();
}

class _GardenerOnboardingScreenState
    extends ConsumerState<GardenerOnboardingScreen> {
  int _step = 0;

  final _cpfCnpj = TextEditingController();
  final _city = TextEditingController();
  final _state = TextEditingController(text: 'SP');
  final _minPrice = TextEditingController(text: '80,00');
  final _hourly = TextEditingController(text: '45,00');

  final Set<ServiceType> _specialties = {};
  final Set<Equipment> _equipment = {};
  double _radiusKm = 15;
  bool _docsUploaded = false;

  static const _steps = ['Dados', 'Documentos', 'Serviços', 'Preços'];

  @override
  void dispose() {
    _cpfCnpj.dispose();
    _city.dispose();
    _state.dispose();
    _minPrice.dispose();
    _hourly.dispose();
    super.dispose();
  }

  void _next() {
    if (_step < _steps.length - 1) {
      setState(() => _step++);
    } else {
      _finish();
    }
  }

  void _finish() {
    // Assemble the payload (kept local for the demo).
    // ignore: unused_local_variable
    final payload = {
      'cpfCnpj': _cpfCnpj.text.trim(),
      'city': _city.text.trim(),
      'state': _state.text.trim(),
      'serviceRadiusKm': _radiusKm,
      'specialties': _specialties.map((e) => e.wire).toList(),
      'equipment': _equipment.map((e) => e.wire).toList(),
      'minPriceCents': Money.parseToCents(_minPrice.text),
      'hourlyRateCents': Money.parseToCents(_hourly.text),
    };
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Perfil enviado! Verificaremos seus dados.')),
    );
    context.go(Routes.home);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Cadastro profissional')),
      body: Column(
        children: [
          _StepIndicator(steps: _steps, current: _step),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
              child: _buildStep(),
            ),
          ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
              child: Row(
                children: [
                  if (_step > 0)
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => setState(() => _step--),
                        child: const Text('Voltar'),
                      ),
                    ),
                  if (_step > 0) const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: PrimaryButton(
                      label: _step == _steps.length - 1
                          ? 'Concluir cadastro'
                          : 'Continuar',
                      onPressed: _next,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStep() {
    switch (_step) {
      case 0:
        return _stepData();
      case 1:
        return _stepDocs();
      case 2:
        return _stepServices();
      default:
        return _stepPrices();
    }
  }

  Widget _stepData() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _StepTitle(
          title: 'Seus dados',
          subtitle: 'Precisamos identificar você como MEI/empresa ou autônomo.',
        ),
        TextField(
          controller: _cpfCnpj,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(
            labelText: 'CPF ou CNPJ',
            prefixIcon: Icon(Icons.badge_outlined),
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              flex: 3,
              child: TextField(
                controller: _city,
                decoration: const InputDecoration(
                  labelText: 'Cidade base',
                  prefixIcon: Icon(Icons.location_city),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: TextField(
                controller: _state,
                maxLength: 2,
                textCapitalization: TextCapitalization.characters,
                decoration: const InputDecoration(
                    labelText: 'UF', counterText: ''),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _stepDocs() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _StepTitle(
          title: 'Documentos',
          subtitle: 'Envie um documento com foto e um comprovante de endereço.',
        ),
        _UploadTile(
          label: 'Documento com foto (RG/CNH)',
          done: _docsUploaded,
          onTap: () => setState(() => _docsUploaded = true),
        ),
        const SizedBox(height: 10),
        _UploadTile(
          label: 'Comprovante de endereço',
          done: _docsUploaded,
          onTap: () => setState(() => _docsUploaded = true),
        ),
        const SizedBox(height: 10),
        _UploadTile(
          label: 'Certificados (opcional)',
          done: false,
          onTap: () {},
        ),
      ],
    );
  }

  Widget _stepServices() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _StepTitle(
          title: 'O que você faz',
          subtitle: 'Selecione suas especialidades e equipamentos.',
        ),
        const Text('Especialidades',
            style: TextStyle(fontWeight: FontWeight.w800)),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: ServiceType.values
              .map((t) => FilterChip(
                    label: Text(t.label),
                    avatar: Icon(t.icon, size: 18),
                    selected: _specialties.contains(t),
                    onSelected: (v) => setState(() {
                      v ? _specialties.add(t) : _specialties.remove(t);
                    }),
                  ))
              .toList(),
        ),
        const SizedBox(height: 20),
        const Text('Equipamentos', style: TextStyle(fontWeight: FontWeight.w800)),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: Equipment.values
              .map((e) => FilterChip(
                    label: Text(e.label),
                    avatar: Icon(e.icon, size: 18),
                    selected: _equipment.contains(e),
                    onSelected: (v) => setState(() {
                      v ? _equipment.add(e) : _equipment.remove(e);
                    }),
                  ))
              .toList(),
        ),
      ],
    );
  }

  Widget _stepPrices() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _StepTitle(
          title: 'Preços e alcance',
          subtitle: 'Isso ajuda o marketplace a te sugerir os melhores serviços.',
        ),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Raio de atendimento',
                style: TextStyle(fontWeight: FontWeight.w700)),
            Text('${_radiusKm.toStringAsFixed(0)} km',
                style: const TextStyle(
                    fontWeight: FontWeight.w800, color: AppTheme.brandDark)),
          ],
        ),
        Slider(
          value: _radiusKm,
          min: 1,
          max: 60,
          divisions: 59,
          activeColor: AppTheme.brand,
          label: '${_radiusKm.toStringAsFixed(0)} km',
          onChanged: (v) => setState(() => _radiusKm = v),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: _minPrice,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(
            labelText: 'Preço mínimo por serviço',
            prefixText: 'R\$ ',
          ),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _hourly,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(
            labelText: 'Valor por hora',
            prefixText: 'R\$ ',
          ),
        ),
      ],
    );
  }
}

class _StepIndicator extends StatelessWidget {
  const _StepIndicator({required this.steps, required this.current});
  final List<String> steps;
  final int current;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 8),
      child: Row(
        children: List.generate(steps.length, (i) {
          final active = i <= current;
          return Expanded(
            child: Padding(
              padding: EdgeInsets.only(right: i == steps.length - 1 ? 0 : 6),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    height: 5,
                    decoration: BoxDecoration(
                      color: active ? AppTheme.brand : const Color(0xFFE5E7EB),
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(steps[i],
                      style: TextStyle(
                          fontSize: 11.5,
                          fontWeight: FontWeight.w700,
                          color: active
                              ? AppTheme.brandDark
                              : AppTheme.subtleInk)),
                ],
              ),
            ),
          );
        }),
      ),
    );
  }
}

class _StepTitle extends StatelessWidget {
  const _StepTitle({required this.title, required this.subtitle});
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style:
                  const TextStyle(fontSize: 22, fontWeight: FontWeight.w900)),
          const SizedBox(height: 4),
          Text(subtitle,
              style: const TextStyle(color: AppTheme.subtleInk, fontSize: 14)),
        ],
      ),
    );
  }
}

class _UploadTile extends StatelessWidget {
  const _UploadTile({
    required this.label,
    required this.done,
    required this.onTap,
  });

  final String label;
  final bool done;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: done ? AppTheme.brandLight : Colors.white,
      borderRadius: BorderRadius.circular(AppTheme.radius),
      child: InkWell(
        borderRadius: BorderRadius.circular(AppTheme.radius),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppTheme.radius),
            border: Border.all(
                color: done ? AppTheme.brand : const Color(0xFFE5E7EB)),
          ),
          child: Row(
            children: [
              Icon(done ? Icons.check_circle : Icons.upload_file,
                  color: done ? AppTheme.brand : AppTheme.subtleInk),
              const SizedBox(width: 12),
              Expanded(
                child: Text(label,
                    style: const TextStyle(fontWeight: FontWeight.w600)),
              ),
              Text(done ? 'Enviado' : 'Enviar',
                  style: const TextStyle(
                      color: AppTheme.brandDark, fontWeight: FontWeight.w700)),
            ],
          ),
        ),
      ),
    );
  }
}
