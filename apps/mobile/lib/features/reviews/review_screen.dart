import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/providers/job_repository.dart';
import '../../core/router/app_router.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/primary_button.dart';

/// Rating screen: 1–5 stars, a comment and optional photos of the result.
class ReviewScreen extends ConsumerStatefulWidget {
  const ReviewScreen({super.key, required this.jobId});

  final String jobId;

  @override
  ConsumerState<ReviewScreen> createState() => _ReviewScreenState();
}

class _ReviewScreenState extends ConsumerState<ReviewScreen> {
  final _picker = ImagePicker();
  final _comment = TextEditingController();
  int _rating = 5;
  final List<String> _photos = [];
  bool _submitting = false;

  static const _labels = {
    1: 'Ruim',
    2: 'Regular',
    3: 'Bom',
    4: 'Muito bom',
    5: 'Excelente!',
  };

  @override
  void dispose() {
    _comment.dispose();
    super.dispose();
  }

  Future<void> _addPhoto() async {
    final x = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (x != null) setState(() => _photos.add(x.path));
  }

  Future<void> _submit() async {
    setState(() => _submitting = true);
    try {
      await ref.read(jobRepositoryProvider).review(
            widget.jobId,
            rating: _rating,
            comment: _comment.text.trim(),
            photoUrls: _photos,
          );
      ref.invalidate(myJobsProvider);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Obrigado pela avaliação!')),
      );
      context.go(Routes.home);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Não foi possível enviar. Tente novamente.')),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Avaliar serviço')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
        children: [
          const Center(
            child: CircleAvatar(
              radius: 34,
              backgroundColor: AppTheme.brandLight,
              child: Icon(Icons.person, size: 38, color: AppTheme.brandDark),
            ),
          ),
          const SizedBox(height: 12),
          const Center(
            child: Text('Como foi o serviço?',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
          ),
          const SizedBox(height: 4),
          Center(
            child: Text(_labels[_rating] ?? '',
                style: const TextStyle(
                    color: AppTheme.brandDark, fontWeight: FontWeight.w700)),
          ),
          const SizedBox(height: 18),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(5, (i) {
              final value = i + 1;
              return IconButton(
                iconSize: 44,
                onPressed: () => setState(() => _rating = value),
                icon: Icon(
                  value <= _rating ? Icons.star_rounded : Icons.star_outline_rounded,
                  color: value <= _rating
                      ? const Color(0xFFF59E0B)
                      : const Color(0xFFD1D5DB),
                ),
              );
            }),
          ),
          const SizedBox(height: 12),
          const Text('Deixe um comentário',
              style: TextStyle(fontWeight: FontWeight.w800)),
          const SizedBox(height: 8),
          TextField(
            controller: _comment,
            maxLines: 4,
            decoration: const InputDecoration(
              hintText: 'Conte como foi o atendimento, pontualidade e resultado...',
            ),
          ),
          const SizedBox(height: 18),
          const Text('Fotos do resultado (opcional)',
              style: TextStyle(fontWeight: FontWeight.w800)),
          const SizedBox(height: 10),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              GestureDetector(
                onTap: _addPhoto,
                child: Container(
                  height: 76,
                  width: 76,
                  decoration: BoxDecoration(
                    color: AppTheme.brandLight,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                        color: AppTheme.brand.withValues(alpha: 0.4)),
                  ),
                  child: const Icon(Icons.add_a_photo,
                      color: AppTheme.brandDark),
                ),
              ),
              ..._photos.map((p) => ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.file(File(p),
                        height: 76,
                        width: 76,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                              height: 76,
                              width: 76,
                              color: AppTheme.brandLight,
                              child: const Icon(Icons.image),
                            )),
                  )),
            ],
          ),
          const SizedBox(height: 26),
          PrimaryButton(
            label: 'Enviar avaliação',
            icon: Icons.send,
            loading: _submitting,
            onPressed: _submit,
          ),
          const SizedBox(height: 8),
          Center(
            child: TextButton(
              onPressed: () => context.go(Routes.home),
              child: const Text('Agora não'),
            ),
          ),
        ],
      ),
    );
  }
}
