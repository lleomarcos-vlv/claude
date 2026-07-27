import 'package:flutter/material.dart';

import '../models/enums.dart';
import '../theme/app_theme.dart';

/// A selectable/pill chip representing a [ServiceType], with its brand icon and
/// pt-BR label. Used in the service grid, capture summary and marketplace feed.
class ServiceTypeChip extends StatelessWidget {
  const ServiceTypeChip({
    super.key,
    required this.type,
    this.selected = false,
    this.onTap,
    this.compact = false,
  });

  final ServiceType type;
  final bool selected;
  final VoidCallback? onTap;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final bg = selected ? AppTheme.brandLight : Colors.white;
    final fg = selected ? AppTheme.brandDark : AppTheme.ink;
    final border = selected ? AppTheme.brand : const Color(0xFFE5E7EB);

    return Material(
      color: bg,
      borderRadius: BorderRadius.circular(30),
      child: InkWell(
        borderRadius: BorderRadius.circular(30),
        onTap: onTap,
        child: Container(
          padding: EdgeInsets.symmetric(
            horizontal: compact ? 12 : 14,
            vertical: compact ? 8 : 10,
          ),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(30),
            border: Border.all(color: border, width: selected ? 1.5 : 1),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(type.icon, size: compact ? 16 : 18, color: fg),
              const SizedBox(width: 6),
              Text(
                type.label,
                style: TextStyle(
                  color: fg,
                  fontWeight: FontWeight.w600,
                  fontSize: compact ? 12.5 : 14,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Large tappable tile used in the service-selection grid.
class ServiceTypeTile extends StatelessWidget {
  const ServiceTypeTile({super.key, required this.type, this.onTap});

  final ServiceType type;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                height: 46,
                width: 46,
                decoration: BoxDecoration(
                  color: AppTheme.brandLight,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(type.icon, color: AppTheme.brandDark),
              ),
              const SizedBox(height: 14),
              Text(
                type.label,
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 15,
                  height: 1.2,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
