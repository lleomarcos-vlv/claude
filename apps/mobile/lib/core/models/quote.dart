/// Quote contract — Dart mirror of `packages/shared/src/quote.ts`.
/// Every monetary field is integer **cents (BRL)**.

class QuoteLineItem {
  const QuoteLineItem({
    required this.key,
    required this.label,
    required this.amountCents,
    this.explanation,
  });

  /// Stable key for analytics, e.g. "labor", "equipment", "travel".
  final String key;
  final String label;
  final int amountCents;

  /// Optional human explanation of how this line was derived (auditability).
  final String? explanation;

  factory QuoteLineItem.fromJson(Map<String, dynamic> json) => QuoteLineItem(
        key: json['key'] as String? ?? '',
        label: json['label'] as String? ?? '',
        amountCents: (json['amountCents'] as num?)?.toInt() ?? 0,
        explanation: json['explanation'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'key': key,
        'label': label,
        'amountCents': amountCents,
        if (explanation != null) 'explanation': explanation,
      };
}

class Quote {
  const Quote({
    required this.currency,
    required this.lineItems,
    required this.subtotalCents,
    required this.platformFeeCents,
    required this.totalCents,
    required this.gardenerNetCents,
    required this.confidence,
    required this.bandLowCents,
    required this.bandHighCents,
    required this.breakdownVersion,
  });

  final String currency;
  final List<QuoteLineItem> lineItems;
  final int subtotalCents;
  final int platformFeeCents;

  /// Grand total charged to the client, in cents.
  final int totalCents;

  /// Amount the gardener nets after the platform split, in cents.
  final int gardenerNetCents;

  /// Confidence band for the estimate, in [0,1]. Shown as a percentage.
  final double confidence;

  /// Suggested price band advertised to gardeners.
  final int bandLowCents;
  final int bandHighCents;

  final String breakdownVersion;

  /// Confidence as an integer percent (e.g. 0.82 → 82).
  int get confidencePercent => (confidence * 100).round();

  factory Quote.fromJson(Map<String, dynamic> json) => Quote(
        currency: json['currency'] as String? ?? 'BRL',
        lineItems: (json['lineItems'] as List<dynamic>? ?? const [])
            .map((e) => QuoteLineItem.fromJson(e as Map<String, dynamic>))
            .toList(),
        subtotalCents: (json['subtotalCents'] as num?)?.toInt() ?? 0,
        platformFeeCents: (json['platformFeeCents'] as num?)?.toInt() ?? 0,
        totalCents: (json['totalCents'] as num?)?.toInt() ?? 0,
        gardenerNetCents: (json['gardenerNetCents'] as num?)?.toInt() ?? 0,
        confidence: (json['confidence'] as num?)?.toDouble() ?? 0,
        bandLowCents: (json['bandLowCents'] as num?)?.toInt() ?? 0,
        bandHighCents: (json['bandHighCents'] as num?)?.toInt() ?? 0,
        breakdownVersion: json['breakdownVersion'] as String? ?? 'v0',
      );

  Map<String, dynamic> toJson() => {
        'currency': currency,
        'lineItems': lineItems.map((e) => e.toJson()).toList(),
        'subtotalCents': subtotalCents,
        'platformFeeCents': platformFeeCents,
        'totalCents': totalCents,
        'gardenerNetCents': gardenerNetCents,
        'confidence': confidence,
        'bandLowCents': bandLowCents,
        'bandHighCents': bandHighCents,
        'breakdownVersion': breakdownVersion,
      };
}
