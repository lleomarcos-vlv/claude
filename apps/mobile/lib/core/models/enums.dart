import 'package:flutter/material.dart';

/// Domain enums — the Dart mirror of `@jardimja/shared`
/// (`packages/shared/src/enums.ts`). The wire value of every enum matches the
/// SCREAMING_SNAKE string used by the backend so JSON round-trips without a
/// translation layer. pt-BR labels mirror `ServiceTypeLabel` etc. exactly.

/// Shared helper: resolve an enum from its wire value with a fallback.
T _fromWire<T>(
  List<T> values,
  String Function(T) wireOf,
  String? wire,
  T fallback,
) {
  if (wire == null) return fallback;
  for (final v in values) {
    if (wireOf(v) == wire) return v;
  }
  return fallback;
}

// ── ServiceType ────────────────────────────────────────────────────────────
/// Catalogue of bookable services. `OUTRO` is the free-text escape hatch.
enum ServiceType {
  corteGrama('CORTE_GRAMA', 'Cortar grama', Icons.grass),
  poda('PODA', 'Poda', Icons.content_cut),
  paisagismo('PAISAGISMO', 'Paisagismo', Icons.deck),
  limpeza('LIMPEZA', 'Limpeza', Icons.cleaning_services),
  retiradaFolhas('RETIRADA_FOLHAS', 'Retirada de folhas', Icons.air),
  adubacao('ADUBACAO', 'Adubação', Icons.compost),
  plantio('PLANTIO', 'Plantio', Icons.local_florist),
  controlePragas('CONTROLE_PRAGAS', 'Controle de pragas', Icons.pest_control),
  irrigacao('IRRIGACAO', 'Sistema de irrigação', Icons.water_drop),
  jardimCompleto('JARDIM_COMPLETO', 'Jardim completo', Icons.yard),
  outro('OUTRO', 'Outro', Icons.more_horiz);

  const ServiceType(this.wire, this.label, this.icon);

  final String wire;
  final String label;
  final IconData icon;

  static ServiceType fromWire(String? wire) =>
      _fromWire(values, (e) => e.wire, wire, ServiceType.outro);
}

// ── JobStatus ──────────────────────────────────────────────────────────────
/// Uber-style state machine for a service request.
enum JobStatus {
  draft('DRAFT', 'Rascunho'),
  analyzing('ANALYZING', 'Analisando'),
  quoted('QUOTED', 'Orçado'),
  matching('MATCHING', 'No marketplace'),
  offered('OFFERED', 'Com propostas'),
  accepted('ACCEPTED', 'Aceito'),
  scheduled('SCHEDULED', 'Agendado'),
  enroute('ENROUTE', 'A caminho'),
  arrived('ARRIVED', 'Chegou'),
  inProgress('IN_PROGRESS', 'Em andamento'),
  completed('COMPLETED', 'Concluído'),
  approved('APPROVED', 'Aprovado'),
  paid('PAID', 'Pago'),
  reviewed('REVIEWED', 'Avaliado'),
  cancelled('CANCELLED', 'Cancelado'),
  disputed('DISPUTED', 'Em disputa');

  const JobStatus(this.wire, this.label);

  final String wire;
  final String label;

  static JobStatus fromWire(String? wire) =>
      _fromWire(values, (e) => e.wire, wire, JobStatus.draft);
}

// ── OfferStatus ────────────────────────────────────────────────────────────
enum OfferStatus {
  pending('PENDING', 'Pendente'),
  acceptedByGardener('ACCEPTED_BY_GARDENER', 'Aceitou o preço'),
  countered('COUNTERED', 'Contraproposta'),
  declined('DECLINED', 'Recusada'),
  chosen('CHOSEN', 'Escolhida'),
  expired('EXPIRED', 'Expirada'),
  withdrawn('WITHDRAWN', 'Retirada');

  const OfferStatus(this.wire, this.label);

  final String wire;
  final String label;

  static OfferStatus fromWire(String? wire) =>
      _fromWire(values, (e) => e.wire, wire, OfferStatus.pending);
}

// ── PaymentStatus / PaymentMethod ──────────────────────────────────────────
enum PaymentStatus {
  pending('PENDING'),
  authorized('AUTHORIZED'),
  captured('CAPTURED'),
  split('SPLIT'),
  refunded('REFUNDED'),
  failed('FAILED');

  const PaymentStatus(this.wire);
  final String wire;

  static PaymentStatus fromWire(String? wire) =>
      _fromWire(values, (e) => e.wire, wire, PaymentStatus.pending);
}

enum PaymentMethod {
  pix('PIX', 'PIX'),
  creditCard('CREDIT_CARD', 'Cartão de crédito'),
  googlePay('GOOGLE_PAY', 'Google Pay'),
  applePay('APPLE_PAY', 'Apple Pay');

  const PaymentMethod(this.wire, this.label);
  final String wire;
  final String label;

  static PaymentMethod fromWire(String? wire) =>
      _fromWire(values, (e) => e.wire, wire, PaymentMethod.pix);
}

// ── UserRole ───────────────────────────────────────────────────────────────
enum UserRole {
  client('CLIENT'),
  gardener('GARDENER'),
  admin('ADMIN'),
  support('SUPPORT');

  const UserRole(this.wire);
  final String wire;

  static UserRole fromWire(String? wire) =>
      _fromWire(values, (e) => e.wire, wire, UserRole.client);
}

// ── Equipment ──────────────────────────────────────────────────────────────
enum Equipment {
  rocadeira('ROCADEIRA', 'Roçadeira', Icons.agriculture),
  cortadorGrama('CORTADOR_GRAMA', 'Cortador de grama', Icons.grass),
  motosserra('MOTOSSERRA', 'Motosserra', Icons.carpenter),
  soprador('SOPRADOR', 'Soprador', Icons.air),
  triturador('TRITURADOR', 'Triturador', Icons.blender),
  escada('ESCADA', 'Escada', Icons.stairs),
  caminhao('CAMINHAO', 'Caminhão', Icons.local_shipping),
  pulverizador('PULVERIZADOR', 'Pulverizador', Icons.sanitizer),
  podadorAltura('PODADOR_ALTURA', 'Podador de altura', Icons.height);

  const Equipment(this.wire, this.label, this.icon);

  final String wire;
  final String label;
  final IconData icon;

  static Equipment fromWire(String? wire) =>
      _fromWire(values, (e) => e.wire, wire, Equipment.rocadeira);
}

// ── DifficultyLevel ────────────────────────────────────────────────────────
enum DifficultyLevel {
  low('LOW', 'Baixa', Color(0xFF16A34A)),
  medium('MEDIUM', 'Média', Color(0xFFF59E0B)),
  high('HIGH', 'Alta', Color(0xFFEA580C)),
  extreme('EXTREME', 'Extrema', Color(0xFFDC2626));

  const DifficultyLevel(this.wire, this.label, this.color);

  final String wire;
  final String label;
  final Color color;

  static DifficultyLevel fromWire(String? wire) =>
      _fromWire(values, (e) => e.wire, wire, DifficultyLevel.medium);
}

// ── UrgencyLevel ───────────────────────────────────────────────────────────
enum UrgencyLevel {
  flexible('FLEXIBLE', 'Flexível'),
  normal('NORMAL', 'Normal'),
  urgent('URGENT', 'Urgente'),
  emergency('EMERGENCY', 'Emergência');

  const UrgencyLevel(this.wire, this.label);

  final String wire;
  final String label;

  static UrgencyLevel fromWire(String? wire) =>
      _fromWire(values, (e) => e.wire, wire, UrgencyLevel.normal);
}

// ── RiskLevel ──────────────────────────────────────────────────────────────
enum RiskLevel {
  low('LOW', 'Baixo'),
  medium('MEDIUM', 'Médio'),
  high('HIGH', 'Alto');

  const RiskLevel(this.wire, this.label);
  final String wire;
  final String label;

  static RiskLevel fromWire(String? wire) =>
      _fromWire(values, (e) => e.wire, wire, RiskLevel.low);
}

// ── TerrainSlope ───────────────────────────────────────────────────────────
enum TerrainSlope {
  flat('FLAT', 'Plano'),
  gentle('GENTLE', 'Leve'),
  moderate('MODERATE', 'Moderado'),
  steep('STEEP', 'Íngreme');

  const TerrainSlope(this.wire, this.label);
  final String wire;
  final String label;

  static TerrainSlope fromWire(String? wire) =>
      _fromWire(values, (e) => e.wire, wire, TerrainSlope.flat);
}

// ── AccessDifficulty ───────────────────────────────────────────────────────
enum AccessDifficulty {
  easy('EASY', 'Fácil'),
  moderate('MODERATE', 'Moderado'),
  hard('HARD', 'Difícil');

  const AccessDifficulty(this.wire, this.label);
  final String wire;
  final String label;

  static AccessDifficulty fromWire(String? wire) =>
      _fromWire(values, (e) => e.wire, wire, AccessDifficulty.easy);
}

// ── MediaKind ──────────────────────────────────────────────────────────────
enum MediaKind {
  photo('PHOTO'),
  video('VIDEO'),
  audio('AUDIO'),
  document('DOCUMENT');

  const MediaKind(this.wire);
  final String wire;

  static MediaKind fromWire(String? wire) =>
      _fromWire(values, (e) => e.wire, wire, MediaKind.photo);
}

// ── MessageKind ────────────────────────────────────────────────────────────
enum MessageKind {
  text('TEXT'),
  photo('PHOTO'),
  video('VIDEO'),
  audio('AUDIO'),
  location('LOCATION'),
  document('DOCUMENT'),
  system('SYSTEM');

  const MessageKind(this.wire);
  final String wire;

  static MessageKind fromWire(String? wire) =>
      _fromWire(values, (e) => e.wire, wire, MessageKind.text);
}

// ── GardenerStatus ─────────────────────────────────────────────────────────
enum GardenerStatus {
  pendingVerification('PENDING_VERIFICATION', 'Em verificação'),
  active('ACTIVE', 'Ativo'),
  suspended('SUSPENDED', 'Suspenso'),
  rejected('REJECTED', 'Recusado');

  const GardenerStatus(this.wire, this.label);
  final String wire;
  final String label;

  static GardenerStatus fromWire(String? wire) =>
      _fromWire(values, (e) => e.wire, wire, GardenerStatus.pendingVerification);
}
