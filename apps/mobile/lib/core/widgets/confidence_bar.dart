import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// Visualises the AI estimate confidence in [0,1] as a labelled meter.
/// Green ≥ 0.75, amber ≥ 0.5, red below — so the client instantly reads how
/// much to trust the number.
class ConfidenceBar extends StatelessWidget {
  const ConfidenceBar({
    super.key,
    required this.confidence,
    this.label = 'Confiança da estimativa',
  });

  /// Value in [0,1].
  final double confidence;
  final String label;

  Color get _color {
    if (confidence >= 0.75) return AppTheme.brand;
    if (confidence >= 0.5) return AppTheme.warning;
    return AppTheme.danger;
  }

  String get _qualitative {
    if (confidence >= 0.75) return 'Alta';
    if (confidence >= 0.5) return 'Média';
    return 'Baixa';
  }

  @override
  Widget build(BuildContext context) {
    final pct = (confidence.clamp(0, 1) * 100).round();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                color: AppTheme.subtleInk,
                fontSize: 13,
              ),
            ),
            Text(
              '$pct% · $_qualitative',
              style: TextStyle(fontWeight: FontWeight.w800, color: _color),
            ),
          ],
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: LinearProgressIndicator(
            value: confidence.clamp(0, 1).toDouble(),
            minHeight: 10,
            backgroundColor: const Color(0xFFEDEFED),
            valueColor: AlwaysStoppedAnimation(_color),
          ),
        ),
      ],
    );
  }
}
