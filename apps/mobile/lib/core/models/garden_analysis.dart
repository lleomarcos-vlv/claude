import 'enums.dart';

/// Garden analysis — Dart mirror of `packages/shared/src/garden-analysis.ts`.
/// The structured technical report produced by the multimodal AI pipeline and
/// rendered on the quote-review screen.

class GardenFeatures {
  const GardenFeatures({
    required this.grassAreaM2,
    required this.totalAreaM2,
    required this.grassHeightCm,
    required this.vegetationTypes,
    required this.treeCount,
    required this.shrubCount,
    required this.leafLitterLevel,
    required this.hasTallWeeds,
    required this.hasRocks,
    required this.hasPool,
    required this.hasSidewalks,
    required this.hasWalls,
    required this.terrainSlope,
    required this.accessDifficulty,
    required this.greenWasteM3,
  });

  final double grassAreaM2;
  final double totalAreaM2;
  final double grassHeightCm;
  final List<String> vegetationTypes;
  final int treeCount;
  final int shrubCount;

  /// Leaf litter volume, qualitative 0–5 scale.
  final int leafLitterLevel;
  final bool hasTallWeeds;
  final bool hasRocks;
  final bool hasPool;
  final bool hasSidewalks;
  final bool hasWalls;
  final TerrainSlope terrainSlope;
  final AccessDifficulty accessDifficulty;

  /// Estimated green-waste to haul away, in m³.
  final double greenWasteM3;

  factory GardenFeatures.fromJson(Map<String, dynamic> json) => GardenFeatures(
        grassAreaM2: (json['grassAreaM2'] as num?)?.toDouble() ?? 0,
        totalAreaM2: (json['totalAreaM2'] as num?)?.toDouble() ?? 0,
        grassHeightCm: (json['grassHeightCm'] as num?)?.toDouble() ?? 0,
        vegetationTypes: (json['vegetationTypes'] as List<dynamic>? ?? const [])
            .map((e) => e.toString())
            .toList(),
        treeCount: (json['treeCount'] as num?)?.toInt() ?? 0,
        shrubCount: (json['shrubCount'] as num?)?.toInt() ?? 0,
        leafLitterLevel: (json['leafLitterLevel'] as num?)?.toInt() ?? 0,
        hasTallWeeds: json['hasTallWeeds'] as bool? ?? false,
        hasRocks: json['hasRocks'] as bool? ?? false,
        hasPool: json['hasPool'] as bool? ?? false,
        hasSidewalks: json['hasSidewalks'] as bool? ?? false,
        hasWalls: json['hasWalls'] as bool? ?? false,
        terrainSlope: TerrainSlope.fromWire(json['terrainSlope'] as String?),
        accessDifficulty:
            AccessDifficulty.fromWire(json['accessDifficulty'] as String?),
        greenWasteM3: (json['greenWasteM3'] as num?)?.toDouble() ?? 0,
      );

  Map<String, dynamic> toJson() => {
        'grassAreaM2': grassAreaM2,
        'totalAreaM2': totalAreaM2,
        'grassHeightCm': grassHeightCm,
        'vegetationTypes': vegetationTypes,
        'treeCount': treeCount,
        'shrubCount': shrubCount,
        'leafLitterLevel': leafLitterLevel,
        'hasTallWeeds': hasTallWeeds,
        'hasRocks': hasRocks,
        'hasPool': hasPool,
        'hasSidewalks': hasSidewalks,
        'hasWalls': hasWalls,
        'terrainSlope': terrainSlope.wire,
        'accessDifficulty': accessDifficulty.wire,
        'greenWasteM3': greenWasteM3,
      };
}

class WorkEstimate {
  const WorkEstimate({
    required this.recommendedServices,
    required this.requiredEquipment,
    required this.needsSpecialEquipment,
    required this.estimatedHours,
    required this.estimatedCrewSize,
    required this.difficulty,
    required this.risk,
  });

  final List<ServiceType> recommendedServices;
  final List<Equipment> requiredEquipment;
  final bool needsSpecialEquipment;
  final double estimatedHours;
  final int estimatedCrewSize;
  final DifficultyLevel difficulty;
  final RiskLevel risk;

  factory WorkEstimate.fromJson(Map<String, dynamic> json) => WorkEstimate(
        recommendedServices:
            (json['recommendedServices'] as List<dynamic>? ?? const [])
                .map((e) => ServiceType.fromWire(e as String?))
                .toList(),
        requiredEquipment:
            (json['requiredEquipment'] as List<dynamic>? ?? const [])
                .map((e) => Equipment.fromWire(e as String?))
                .toList(),
        needsSpecialEquipment: json['needsSpecialEquipment'] as bool? ?? false,
        estimatedHours: (json['estimatedHours'] as num?)?.toDouble() ?? 0,
        estimatedCrewSize: (json['estimatedCrewSize'] as num?)?.toInt() ?? 1,
        difficulty: DifficultyLevel.fromWire(json['difficulty'] as String?),
        risk: RiskLevel.fromWire(json['risk'] as String?),
      );

  Map<String, dynamic> toJson() => {
        'recommendedServices':
            recommendedServices.map((e) => e.wire).toList(),
        'requiredEquipment': requiredEquipment.map((e) => e.wire).toList(),
        'needsSpecialEquipment': needsSpecialEquipment,
        'estimatedHours': estimatedHours,
        'estimatedCrewSize': estimatedCrewSize,
        'difficulty': difficulty.wire,
        'risk': risk.wire,
      };
}

/// Which providers contributed to the consensus and whether each succeeded.
class ProviderRun {
  const ProviderRun({
    required this.id,
    required this.ok,
    this.latencyMs,
    this.error,
  });

  final String id;
  final bool ok;
  final double? latencyMs;
  final String? error;

  factory ProviderRun.fromJson(Map<String, dynamic> json) => ProviderRun(
        id: json['id'] as String? ?? '',
        ok: json['ok'] as bool? ?? false,
        latencyMs: (json['latencyMs'] as num?)?.toDouble(),
        error: json['error'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'ok': ok,
        if (latencyMs != null) 'latencyMs': latencyMs,
        if (error != null) 'error': error,
      };
}

class GardenAnalysis {
  const GardenAnalysis({
    required this.features,
    required this.work,
    required this.summary,
    required this.confidence,
    required this.fieldAgreement,
    required this.providers,
    required this.warnings,
  });

  final GardenFeatures features;
  final WorkEstimate work;

  /// Short natural-language summary in pt-BR for the client-facing report.
  final String summary;

  /// Overall confidence in [0,1].
  final double confidence;

  /// Per-field agreement metrics across providers (0 = total disagreement).
  final Map<String, double> fieldAgreement;
  final List<ProviderRun> providers;
  final List<String> warnings;

  int get confidencePercent => (confidence * 100).round();

  factory GardenAnalysis.fromJson(Map<String, dynamic> json) {
    // Backend may nest under featuresJson/workJson (Prisma record) or return
    // the flat Zod shape { features, work, ... }. Handle both.
    final featuresJson =
        (json['features'] ?? json['featuresJson']) as Map<String, dynamic>? ??
            const {};
    final workJson =
        (json['work'] ?? json['workJson']) as Map<String, dynamic>? ?? const {};
    return GardenAnalysis(
      features: GardenFeatures.fromJson(featuresJson),
      work: WorkEstimate.fromJson(workJson),
      summary: json['summary'] as String? ?? '',
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0,
      fieldAgreement: ((json['fieldAgreement'] as Map<String, dynamic>?) ??
              const {})
          .map((k, v) => MapEntry(k, (v as num).toDouble())),
      providers: (json['providers'] as List<dynamic>? ?? const [])
          .map((e) => ProviderRun.fromJson(e as Map<String, dynamic>))
          .toList(),
      warnings: (json['warnings'] as List<dynamic>? ?? const [])
          .map((e) => e.toString())
          .toList(),
    );
  }

  Map<String, dynamic> toJson() => {
        'features': features.toJson(),
        'work': work.toJson(),
        'summary': summary,
        'confidence': confidence,
        'fieldAgreement': fieldAgreement,
        'providers': providers.map((e) => e.toJson()).toList(),
        'warnings': warnings,
      };
}
