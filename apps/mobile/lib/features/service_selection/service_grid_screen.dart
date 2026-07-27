import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/models/enums.dart';
import '../../core/router/app_router.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/primary_button.dart';

/// Grid of every [ServiceType]. The client can select one or more and continue
/// to the capture step. Selection is passed to [CaptureScreen] via `extra`.
class ServiceGridScreen extends StatefulWidget {
  const ServiceGridScreen({super.key});

  @override
  State<ServiceGridScreen> createState() => _ServiceGridScreenState();
}

class _ServiceGridScreenState extends State<ServiceGridScreen> {
  final Set<ServiceType> _selected = {};

  void _toggle(ServiceType t) {
    setState(() {
      if (!_selected.add(t)) _selected.remove(t);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('O que você precisa?')),
      body: SafeArea(
        child: Column(
          children: [
            const Padding(
              padding: EdgeInsets.fromLTRB(20, 4, 20, 12),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'Escolha um ou mais serviços. A IA confirma tudo pelas fotos.',
                  style: TextStyle(color: AppTheme.subtleInk, fontSize: 14),
                ),
              ),
            ),
            Expanded(
              child: GridView.builder(
                padding: const EdgeInsets.fromLTRB(20, 4, 20, 20),
                gridDelegate:
                    const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: 1.15,
                ),
                itemCount: ServiceType.values.length,
                itemBuilder: (context, i) {
                  final type = ServiceType.values[i];
                  final selected = _selected.contains(type);
                  return _SelectableServiceTile(
                    type: type,
                    selected: selected,
                    onTap: () => _toggle(type),
                  );
                },
              ),
            ),
            SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
                child: PrimaryButton(
                  label: _selected.isEmpty
                      ? 'Selecione um serviço'
                      : 'Continuar (${_selected.length})',
                  icon: Icons.arrow_forward,
                  onPressed: _selected.isEmpty
                      ? null
                      : () => context.push(
                            Routes.capture,
                            extra: _selected.toList(),
                          ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SelectableServiceTile extends StatelessWidget {
  const _SelectableServiceTile({
    required this.type,
    required this.selected,
    required this.onTap,
  });

  final ServiceType type;
  final bool selected;
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
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    height: 44,
                    width: 44,
                    decoration: BoxDecoration(
                      color: selected ? AppTheme.brand : AppTheme.brandLight,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      type.icon,
                      color: selected ? Colors.white : AppTheme.brandDark,
                    ),
                  ),
                  if (selected)
                    const Icon(Icons.check_circle,
                        color: AppTheme.brand, size: 22),
                ],
              ),
              const Spacer(),
              Text(
                type.label,
                style: const TextStyle(
                    fontWeight: FontWeight.w800, fontSize: 15, height: 1.15),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
