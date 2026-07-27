import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';

import '../../core/models/enums.dart';
import '../../core/models/message.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/theme/app_theme.dart';
import 'chat_controller.dart';

/// WhatsApp-style chat: aligned bubbles, timestamps, and an attach menu for
/// photo / audio / location.
class ChatScreen extends ConsumerStatefulWidget {
  const ChatScreen({super.key, required this.jobId});

  final String jobId;

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final _input = TextEditingController();
  final _scroll = ScrollController();
  final _picker = ImagePicker();

  @override
  void dispose() {
    _input.dispose();
    _scroll.dispose();
    super.dispose();
  }

  ChatController get _ctrl =>
      ref.read(chatControllerProvider(widget.jobId).notifier);

  Future<void> _sendText() async {
    final text = _input.text.trim();
    if (text.isEmpty) return;
    _input.clear();
    await _ctrl.send(kind: MessageKind.text, body: text);
    _scrollToBottom();
  }

  Future<void> _attachPhoto() async {
    final x = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (x == null) return;
    await _ctrl.send(kind: MessageKind.photo, mediaUrl: x.path, body: 'Foto');
    _scrollToBottom();
  }

  Future<void> _attachLocation() async {
    // Placeholder coordinate; the real app reads the device GPS.
    await _ctrl.send(
      kind: MessageKind.location,
      lat: -23.5617,
      lng: -46.6559,
      body: 'Localização compartilhada',
    );
    _scrollToBottom();
  }

  Future<void> _attachAudio() async {
    await _ctrl.send(kind: MessageKind.audio, mediaUrl: 'audio.m4a', body: 'Áudio');
    _scrollToBottom();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.animateTo(
          _scroll.position.maxScrollExtent,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _openAttachSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (ctx) => SafeArea(
        child: Wrap(
          children: [
            _AttachTile(
              icon: Icons.photo,
              color: const Color(0xFF7C3AED),
              label: 'Foto',
              onTap: () {
                Navigator.pop(ctx);
                _attachPhoto();
              },
            ),
            _AttachTile(
              icon: Icons.mic,
              color: const Color(0xFFDB2777),
              label: 'Áudio',
              onTap: () {
                Navigator.pop(ctx);
                _attachAudio();
              },
            ),
            _AttachTile(
              icon: Icons.location_on,
              color: AppTheme.brand,
              label: 'Localização',
              onTap: () {
                Navigator.pop(ctx);
                _attachLocation();
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final me = ref.watch(currentUserProvider);
    final messagesAsync = ref.watch(chatControllerProvider(widget.jobId));

    return Scaffold(
      backgroundColor: const Color(0xFFECE9E2),
      appBar: AppBar(
        title: const Text('Conversa'),
        backgroundColor: Colors.white,
      ),
      body: Column(
        children: [
          Expanded(
            child: messagesAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) =>
                  const Center(child: Text('Não foi possível carregar a conversa.')),
              data: (messages) {
                if (messages.isEmpty) {
                  return const _EmptyChat();
                }
                return ListView.builder(
                  controller: _scroll,
                  padding: const EdgeInsets.fromLTRB(12, 14, 12, 14),
                  itemCount: messages.length,
                  itemBuilder: (_, i) {
                    final m = messages[i];
                    if (m.isSystem) return _SystemBubble(message: m);
                    return _ChatBubble(
                      message: m,
                      mine: me != null && m.isMine(me.id),
                    );
                  },
                );
              },
            ),
          ),
          _Composer(
            controller: _input,
            onSend: _sendText,
            onAttach: _openAttachSheet,
          ),
        ],
      ),
    );
  }
}

class _ChatBubble extends StatelessWidget {
  const _ChatBubble({required this.message, required this.mine});
  final Message message;
  final bool mine;

  @override
  Widget build(BuildContext context) {
    final time = DateFormat('HH:mm').format(message.createdAt);
    return Align(
      alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        constraints: BoxConstraints(
            maxWidth: MediaQuery.of(context).size.width * 0.76),
        margin: const EdgeInsets.symmetric(vertical: 3),
        padding: const EdgeInsets.fromLTRB(12, 9, 12, 7),
        decoration: BoxDecoration(
          color: mine ? const Color(0xFFDCF8C6) : Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(14),
            topRight: const Radius.circular(14),
            bottomLeft: Radius.circular(mine ? 14 : 3),
            bottomRight: Radius.circular(mine ? 3 : 14),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _bubbleContent(),
            const SizedBox(height: 2),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(time,
                    style: const TextStyle(
                        fontSize: 10.5, color: AppTheme.subtleInk)),
                if (mine) ...[
                  const SizedBox(width: 3),
                  Icon(
                    message.readAt != null ? Icons.done_all : Icons.done,
                    size: 14,
                    color: message.readAt != null
                        ? AppTheme.brand
                        : AppTheme.subtleInk,
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _bubbleContent() {
    switch (message.kind) {
      case MessageKind.photo:
        return Row(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Icon(Icons.image, size: 18, color: AppTheme.brandDark),
            SizedBox(width: 6),
            Text('Foto'),
          ],
        );
      case MessageKind.audio:
        return Row(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Icon(Icons.play_circle_fill, size: 22, color: AppTheme.brand),
            SizedBox(width: 8),
            Text('Mensagem de voz  0:12'),
          ],
        );
      case MessageKind.location:
        return Row(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Icon(Icons.location_on, size: 18, color: AppTheme.brand),
            SizedBox(width: 6),
            Text('Localização'),
          ],
        );
      default:
        return Text(message.body ?? '',
            style: const TextStyle(fontSize: 15, height: 1.25));
    }
  }
}

class _SystemBubble extends StatelessWidget {
  const _SystemBubble({required this.message});
  final Message message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.black.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(message.body ?? '',
            style: const TextStyle(fontSize: 12, color: AppTheme.subtleInk)),
      ),
    );
  }
}

class _Composer extends StatelessWidget {
  const _Composer({
    required this.controller,
    required this.onSend,
    required this.onAttach,
  });

  final TextEditingController controller;
  final VoidCallback onSend;
  final VoidCallback onAttach;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.fromLTRB(8, 8, 8, 8),
        color: const Color(0xFFECE9E2),
        child: Row(
          children: [
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(26),
                ),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.add, color: AppTheme.subtleInk),
                      onPressed: onAttach,
                    ),
                    Expanded(
                      child: TextField(
                        controller: controller,
                        minLines: 1,
                        maxLines: 4,
                        textCapitalization: TextCapitalization.sentences,
                        decoration: const InputDecoration(
                          hintText: 'Mensagem',
                          border: InputBorder.none,
                          filled: false,
                          contentPadding: EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 6),
            CircleAvatar(
              radius: 24,
              backgroundColor: AppTheme.brand,
              child: IconButton(
                icon: const Icon(Icons.send, color: Colors.white, size: 20),
                onPressed: onSend,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _AttachTile extends StatelessWidget {
  const _AttachTile({
    required this.icon,
    required this.color,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final Color color;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      leading: CircleAvatar(backgroundColor: color, child: Icon(icon, color: Colors.white)),
      title: Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
    );
  }
}

class _EmptyChat extends StatelessWidget {
  const _EmptyChat();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        margin: const EdgeInsets.all(24),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.8),
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Text(
          'Diga olá! Combine detalhes, horário e acesso ao local por aqui.',
          textAlign: TextAlign.center,
          style: TextStyle(color: AppTheme.subtleInk),
        ),
      ),
    );
  }
}
