import 'enums.dart';

/// A chat message — Dart mirror of the `Message` model.
class Message {
  const Message({
    required this.id,
    required this.jobId,
    required this.senderId,
    required this.kind,
    this.body,
    this.mediaUrl,
    this.lat,
    this.lng,
    this.readAt,
    required this.createdAt,
    this.senderName,
  });

  final String id;
  final String jobId;
  final String senderId;
  final MessageKind kind;
  final String? body;
  final String? mediaUrl;
  final double? lat;
  final double? lng;
  final DateTime? readAt;
  final DateTime createdAt;
  final String? senderName;

  bool get isSystem => kind == MessageKind.system;

  /// Whether this message was sent by [meId] (drives bubble alignment).
  bool isMine(String meId) => senderId == meId;

  factory Message.fromJson(Map<String, dynamic> json) => Message(
        id: json['id'] as String? ?? '',
        jobId: json['jobId'] as String? ?? '',
        senderId: json['senderId'] as String? ?? '',
        kind: MessageKind.fromWire(json['kind'] as String?),
        body: json['body'] as String?,
        mediaUrl: json['mediaUrl'] as String?,
        lat: (json['lat'] as num?)?.toDouble(),
        lng: (json['lng'] as num?)?.toDouble(),
        readAt: json['readAt'] is String
            ? DateTime.tryParse(json['readAt'] as String)
            : null,
        createdAt: json['createdAt'] is String
            ? DateTime.tryParse(json['createdAt'] as String) ?? DateTime.now()
            : DateTime.now(),
        senderName: json['senderName'] as String? ??
            (json['sender'] is Map
                ? (json['sender'] as Map)['name'] as String?
                : null),
      );

  Map<String, dynamic> toJson() => {
        'kind': kind.wire,
        if (body != null) 'body': body,
        if (mediaUrl != null) 'mediaUrl': mediaUrl,
        if (lat != null) 'lat': lat,
        if (lng != null) 'lng': lng,
      };
}
