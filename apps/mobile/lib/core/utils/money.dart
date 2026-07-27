import 'package:intl/intl.dart';

/// Money helpers — the Dart mirror of the `money` helper in
/// `packages/shared/src/quote.ts`. All monetary amounts crossing the wire are
/// **integer cents (BRL)**; never do arithmetic on the formatted string.
class Money {
  const Money._();

  static final NumberFormat _brl = NumberFormat.currency(
    locale: 'pt_BR',
    symbol: 'R\$',
  );

  static final NumberFormat _brlNoSymbol = NumberFormat.currency(
    locale: 'pt_BR',
    symbol: '',
  );

  /// `123456` → `R$ 1.234,56`.
  static String format(int cents) => _brl.format(cents / 100);

  /// `123456` → `1.234,56` (for inline layouts that render `R$` separately).
  static String formatBare(int cents) => _brlNoSymbol.format(cents / 100).trim();

  /// Parse a user-typed value like `1.234,56` or `1234,56` back to cents.
  static int parseToCents(String input) {
    final normalized =
        input.replaceAll('.', '').replaceAll(',', '.').replaceAll(RegExp(r'[^0-9.]'), '');
    final value = double.tryParse(normalized) ?? 0;
    return (value * 100).round();
  }

  static int reaisToCents(num reais) => (reais * 100).round();
  static double centsToReais(int cents) => cents / 100;
}
