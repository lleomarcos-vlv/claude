import 'package:flutter/material.dart';

import '../models/quote.dart';
import '../theme/app_theme.dart';
import '../utils/money.dart';

/// Renders a [Quote] as an itemised receipt: line items (with optional
/// explanation), platform fee, the suggested marketplace price band and the
/// grand total. Reused on the quote-review and payment screens.
class PriceBreakdownCard extends StatelessWidget {
  const PriceBreakdownCard({
    super.key,
    required this.quote,
    this.showBand = true,
    this.showGardenerNet = false,
  });

  final Quote quote;

  /// Whether to show the suggested price band (client-facing).
  final bool showBand;

  /// Whether to show what the gardener nets (professional-facing).
  final bool showGardenerNet;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Detalhamento do orçamento',
              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
            ),
            const SizedBox(height: 14),
            for (final item in quote.lineItems) _LineRow(item: item),
            const Divider(height: 26),
            _totalRow('Subtotal', quote.subtotalCents, muted: true),
            const SizedBox(height: 8),
            _totalRow('Taxa da plataforma', quote.platformFeeCents, muted: true),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: AppTheme.brandLight,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Total',
                    style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                  ),
                  Text(
                    Money.format(quote.totalCents),
                    style: const TextStyle(
                      fontWeight: FontWeight.w900,
                      fontSize: 20,
                      color: AppTheme.brandDark,
                    ),
                  ),
                ],
              ),
            ),
            if (showGardenerNet) ...[
              const SizedBox(height: 10),
              _totalRow('Você recebe (líquido)', quote.gardenerNetCents,
                  emphasize: true),
            ],
            if (showBand) ...[
              const SizedBox(height: 14),
              Row(
                children: [
                  const Icon(Icons.trending_up,
                      size: 16, color: AppTheme.subtleInk),
                  const SizedBox(width: 6),
                  Text(
                    'Faixa de mercado: ${Money.format(quote.bandLowCents)} – ${Money.format(quote.bandHighCents)}',
                    style: const TextStyle(
                      color: AppTheme.subtleInk,
                      fontSize: 12.5,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _totalRow(String label, int cents,
      {bool muted = false, bool emphasize = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            color: muted ? AppTheme.subtleInk : AppTheme.ink,
            fontWeight: emphasize ? FontWeight.w800 : FontWeight.w600,
          ),
        ),
        Text(
          Money.format(cents),
          style: TextStyle(
            color: emphasize ? AppTheme.brandDark : AppTheme.ink,
            fontWeight: emphasize ? FontWeight.w800 : FontWeight.w700,
          ),
        ),
      ],
    );
  }
}

class _LineRow extends StatelessWidget {
  const _LineRow({required this.item});

  final QuoteLineItem item;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  item.label,
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
              ),
              const SizedBox(width: 12),
              Text(
                Money.format(item.amountCents),
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
            ],
          ),
          if (item.explanation != null && item.explanation!.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 2),
              child: Text(
                item.explanation!,
                style: const TextStyle(
                  color: AppTheme.subtleInk,
                  fontSize: 12.5,
                  height: 1.3,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
