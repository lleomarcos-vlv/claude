# JardimJá — Apps Mobile (Flutter)

Um único código-fonte, **dois aplicativos** via _flavors_:

| Flavor | App | Público |
| --- | --- | --- |
| `client` | **JardimJá** | clientes que contratam serviços |
| `professional` | **JardimJá Pro** | jardineiros/empresas que atendem |

Stack: **Flutter 3.29 / Dart 3.7**, Riverpod (estado), go_router (navegação),
Dio (HTTP), flutter_secure_storage (tokens), google_maps_flutter (mapas),
image_picker (câmera/galeria), intl (formatação pt-BR). Material 3, marca verde
`#16A34A` (ver [`docs/design`](../../docs/design/README.md)).

## Rodando

```bash
flutter pub get

# App do Cliente
flutter run --flavor client -t lib/main_client.dart \
  --dart-define=API_BASE_URL=http://10.0.2.2:3333 \
  --dart-define=GOOGLE_MAPS_API_KEY=...

# App do Profissional
flutter run --flavor professional -t lib/main_professional.dart \
  --dart-define=API_BASE_URL=http://10.0.2.2:3333
```

> `10.0.2.2` é o host da máquina no emulador Android. Em iOS use
> `http://localhost:3333`. O backend está em [`apps/api`](../api).

Análise estática e testes:

```bash
flutter analyze
flutter test
```

## Variáveis de ambiente

Nenhum segredo é commitado — tudo entra por `--dart-define` (lidas em
`lib/core/config/env.dart`).

| Chave | Descrição | Default |
| --- | --- | --- |
| `API_BASE_URL` | URL do backend, sem `/api/v1` | `https://api.jardimja.com.br` |
| `GOOGLE_MAPS_API_KEY` | chave do Google Maps (camada Dart) | `""` |
| `ENABLE_NETWORK_LOGS` | logs verbosos do Dio | `true` |

Para não repetir os defines, use um `env.json` (git-ignored):

```json
{ "API_BASE_URL": "https://api.jardimja.com.br", "GOOGLE_MAPS_API_KEY": "AIza..." }
```

```bash
flutter run --flavor client -t lib/main_client.dart --dart-define-from-file=env.json
```

As chaves do Google Maps também precisam ser configuradas nativamente
(`AndroidManifest.xml` / `AppDelegate.swift`).

## Arquitetura (feature-first)

```
lib/
├── main_client.dart          # entrypoint flavor Cliente
├── main_professional.dart    # entrypoint flavor Profissional
├── app.dart                  # widget raiz (tema + router + ProviderScope)
├── core/
│   ├── config/               # Flavor, Env (--dart-define)
│   ├── models/               # user, job, garden_analysis, quote, offer, message, enums
│   │                         #   (espelham os contratos de @jardimja/shared)
│   ├── network/              # api_client (Dio + interceptor de auth/refresh),
│   │                         #   endpoints, token_storage
│   ├── providers/            # auth_provider, job_repository (Riverpod)
│   ├── router/               # app_router (go_router, rotas por papel)
│   ├── theme/                # app_theme (Material 3, tokens da marca)
│   ├── utils/                # money (cents → R$ pt-BR)
│   └── widgets/              # confidence_bar, price_breakdown_card,
│                             #   service_type_chip, status_timeline, primary_button
└── features/
    ├── auth/                 # login, cadastro
    ├── home/                 # splash, home do cliente
    ├── service_selection/    # grade de serviços
    ├── capture/              # captura de 4–30 fotos, vídeo, área no mapa
    ├── quote/                # "IA analisando…" + revisão do orçamento
    ├── offers/               # lista de propostas dos jardineiros
    ├── marketplace/          # feed + detalhe da oferta (Profissional)
    ├── tracking/             # mapa + timeline (a caminho→chegou→iniciou→concluiu)
    ├── chat/                 # chat estilo WhatsApp
    ├── checkin/              # check-in/out com foto + GPS (Profissional)
    ├── payments/             # PIX (QR) + cartão
    ├── reviews/              # avaliação 1–5 estrelas
    └── profile/              # perfil + onboarding do jardineiro
```

## Fluxos

- **Cliente:** login → escolher serviço → capturar fotos → IA gera orçamento →
  publicar → escolher proposta → acompanhar em tempo real → chat → pagar → avaliar.
- **Profissional:** onboarding (CPF/CNPJ, especialidades, equipamentos, raio,
  preços) → feed do marketplace → aceitar/negociar oferta → navegar → check-in →
  executar → check-out → receber (split automático).

## Configuração nativa (pendências para build de loja)

- Android: criar os _product flavors_ `client`/`professional` em
  `android/app/build.gradle`, ícones/splash por flavor, chave do Google Maps no
  `AndroidManifest.xml`, permissões de câmera/localização.
- iOS: _schemes_ por flavor, `Info.plist` (câmera, localização, Maps), APNs/FCM.
- As pastas `android/` e `ios/` são geradas por `flutter create .` (não versionadas
  aqui para manter o foco no código Dart de produto).
