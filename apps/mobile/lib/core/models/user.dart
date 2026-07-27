import 'enums.dart';

/// Authenticated user — Dart mirror of the `User` model (subset the app needs).
class User {
  const User({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    this.phone,
    this.avatarUrl,
    this.locale = 'pt-BR',
    this.emailVerified = false,
    this.gardenerProfile,
  });

  final String id;
  final String email;
  final String name;
  final UserRole role;
  final String? phone;
  final String? avatarUrl;
  final String locale;
  final bool emailVerified;
  final GardenerProfile? gardenerProfile;

  bool get isGardener => role == UserRole.gardener;
  bool get isClient => role == UserRole.client;

  /// First name, for greetings ("Olá, Marcos").
  String get firstName => name.trim().split(' ').first;

  factory User.fromJson(Map<String, dynamic> json) => User(
        id: json['id'] as String? ?? '',
        email: json['email'] as String? ?? '',
        name: json['name'] as String? ?? '',
        role: UserRole.fromWire(json['role'] as String?),
        phone: json['phone'] as String?,
        avatarUrl: json['avatarUrl'] as String?,
        locale: json['locale'] as String? ?? 'pt-BR',
        emailVerified: json['emailVerified'] as bool? ?? false,
        gardenerProfile: json['gardenerProfile'] == null
            ? null
            : GardenerProfile.fromJson(
                json['gardenerProfile'] as Map<String, dynamic>),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'name': name,
        'role': role.wire,
        if (phone != null) 'phone': phone,
        if (avatarUrl != null) 'avatarUrl': avatarUrl,
        'locale': locale,
        'emailVerified': emailVerified,
        if (gardenerProfile != null) 'gardenerProfile': gardenerProfile!.toJson(),
      };
}

/// Gardener onboarding profile — Dart mirror of `GardenerProfile` (subset).
class GardenerProfile {
  const GardenerProfile({
    required this.id,
    required this.cpfCnpj,
    required this.city,
    required this.state,
    this.bio,
    this.status = GardenerStatus.pendingVerification,
    this.serviceRadiusKm = 15,
    this.specialties = const [],
    this.equipment = const [],
    this.crewSize = 1,
    this.minPriceCents = 8000,
    this.hourlyRateCents = 4500,
    this.pricePerM2Cents,
    this.ratingAvg = 0,
    this.ratingCount = 0,
    this.jobsCompleted = 0,
  });

  final String id;
  final String cpfCnpj;
  final String city;
  final String state;
  final String? bio;
  final GardenerStatus status;
  final double serviceRadiusKm;
  final List<ServiceType> specialties;
  final List<Equipment> equipment;
  final int crewSize;
  final int minPriceCents;
  final int hourlyRateCents;
  final int? pricePerM2Cents;
  final double ratingAvg;
  final int ratingCount;
  final int jobsCompleted;

  factory GardenerProfile.fromJson(Map<String, dynamic> json) =>
      GardenerProfile(
        id: json['id'] as String? ?? '',
        cpfCnpj: json['cpfCnpj'] as String? ?? '',
        city: json['city'] as String? ?? '',
        state: json['state'] as String? ?? '',
        bio: json['bio'] as String?,
        status: GardenerStatus.fromWire(json['status'] as String?),
        serviceRadiusKm: (json['serviceRadiusKm'] as num?)?.toDouble() ?? 15,
        specialties: (json['specialties'] as List<dynamic>? ?? const [])
            .map((e) => ServiceType.fromWire(e as String?))
            .toList(),
        equipment: (json['equipment'] as List<dynamic>? ?? const [])
            .map((e) => Equipment.fromWire(e as String?))
            .toList(),
        crewSize: (json['crewSize'] as num?)?.toInt() ?? 1,
        minPriceCents: (json['minPriceCents'] as num?)?.toInt() ?? 8000,
        hourlyRateCents: (json['hourlyRateCents'] as num?)?.toInt() ?? 4500,
        pricePerM2Cents: (json['pricePerM2Cents'] as num?)?.toInt(),
        ratingAvg: (json['ratingAvg'] as num?)?.toDouble() ?? 0,
        ratingCount: (json['ratingCount'] as num?)?.toInt() ?? 0,
        jobsCompleted: (json['jobsCompleted'] as num?)?.toInt() ?? 0,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'cpfCnpj': cpfCnpj,
        'city': city,
        'state': state,
        if (bio != null) 'bio': bio,
        'status': status.wire,
        'serviceRadiusKm': serviceRadiusKm,
        'specialties': specialties.map((e) => e.wire).toList(),
        'equipment': equipment.map((e) => e.wire).toList(),
        'crewSize': crewSize,
        'minPriceCents': minPriceCents,
        'hourlyRateCents': hourlyRateCents,
        if (pricePerM2Cents != null) 'pricePerM2Cents': pricePerM2Cents,
        'ratingAvg': ratingAvg,
        'ratingCount': ratingCount,
        'jobsCompleted': jobsCompleted,
      };
}
