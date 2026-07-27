import 'package:flutter/material.dart';

import '../models/enums.dart';
import '../theme/app_theme.dart';

/// A single step in the live-tracking timeline.
class TimelineStep {
  const TimelineStep({
    required this.status,
    required this.title,
    required this.subtitle,
    required this.icon,
  });

  final JobStatus status;
  final String title;
  final String subtitle;
  final IconData icon;
}

/// Vertical status timeline: a caminho → chegou → iniciou → concluiu.
/// Steps up to and including [current] render as completed (brand green); the
/// current step is highlighted; later steps are muted.
class StatusTimeline extends StatelessWidget {
  const StatusTimeline({
    super.key,
    required this.current,
    this.steps = defaultSteps,
  });

  final JobStatus current;
  final List<TimelineStep> steps;

  /// The canonical live-service journey shown on the tracking screen.
  static const List<TimelineStep> defaultSteps = [
    TimelineStep(
      status: JobStatus.enroute,
      title: 'A caminho',
      subtitle: 'O jardineiro está indo até você',
      icon: Icons.directions_car_filled,
    ),
    TimelineStep(
      status: JobStatus.arrived,
      title: 'Chegou',
      subtitle: 'Check-in no local com foto e GPS',
      icon: Icons.place,
    ),
    TimelineStep(
      status: JobStatus.inProgress,
      title: 'Iniciou',
      subtitle: 'Serviço em andamento',
      icon: Icons.grass,
    ),
    TimelineStep(
      status: JobStatus.completed,
      title: 'Concluiu',
      subtitle: 'Check-out com foto do resultado',
      icon: Icons.check_circle,
    ),
  ];

  int get _currentIndex {
    // Map any status onto the closest step by ordinal in the lifecycle.
    final order = JobStatus.values.map((e) => e).toList();
    final currentOrd = order.indexOf(current);
    var idx = -1;
    for (var i = 0; i < steps.length; i++) {
      if (order.indexOf(steps[i].status) <= currentOrd) idx = i;
    }
    return idx;
  }

  @override
  Widget build(BuildContext context) {
    final currentIdx = _currentIndex;
    return Column(
      children: [
        for (var i = 0; i < steps.length; i++)
          _StepRow(
            step: steps[i],
            done: i <= currentIdx,
            active: i == currentIdx,
            isLast: i == steps.length - 1,
          ),
      ],
    );
  }
}

class _StepRow extends StatelessWidget {
  const _StepRow({
    required this.step,
    required this.done,
    required this.active,
    required this.isLast,
  });

  final TimelineStep step;
  final bool done;
  final bool active;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    final color = done ? AppTheme.brand : const Color(0xFFD1D5DB);
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Column(
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                height: 38,
                width: 38,
                decoration: BoxDecoration(
                  color: done ? AppTheme.brand : Colors.white,
                  shape: BoxShape.circle,
                  border: Border.all(color: color, width: 2),
                  boxShadow: active
                      ? [
                          BoxShadow(
                            color: AppTheme.brand.withValues(alpha: 0.25),
                            blurRadius: 10,
                            spreadRadius: 2,
                          ),
                        ]
                      : null,
                ),
                child: Icon(
                  step.icon,
                  size: 18,
                  color: done ? Colors.white : const Color(0xFF9CA3AF),
                ),
              ),
              if (!isLast)
                Expanded(
                  child: Container(
                    width: 2.5,
                    color: done ? AppTheme.brand : const Color(0xFFE5E7EB),
                  ),
                ),
            ],
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: isLast ? 0 : 22, top: 4),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    step.title,
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 15,
                      color: done ? AppTheme.ink : AppTheme.subtleInk,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    step.subtitle,
                    style: const TextStyle(
                      color: AppTheme.subtleInk,
                      fontSize: 13,
                      height: 1.3,
                    ),
                  ),
                  if (active)
                    Padding(
                      padding: const EdgeInsets.only(top: 6),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppTheme.brandLight,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Text(
                          'Agora',
                          style: TextStyle(
                            color: AppTheme.brandDark,
                            fontWeight: FontWeight.w700,
                            fontSize: 11.5,
                          ),
                        ),
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
}
