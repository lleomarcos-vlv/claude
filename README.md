# Padaria Villa Reis

Aplicativo web completo da Padaria Villa Reis: área pública para os clientes e
painel administrativo próprio, onde a equipe da padaria cadastra produtos,
preços, fotos e vídeos sem depender de programador e **sem passar as imagens
pelo WhatsApp**.

Stack: **Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 ·
Prisma · SQLite/PostgreSQL · sharp**. Sem dependência de serviço pago para
funcionar.

---

## Como ficou

| Área do cliente | Painel administrativo |
| --- | --- |
| ![Home no computador](docs/screenshots/home-computador.jpg) | ![Painel](docs/screenshots/painel-dashboard.jpg) |
| ![Página do produto](docs/screenshots/produto.jpg) | ![Cadastro de produto](docs/screenshots/painel-novo-produto.jpg) |
| ![Carrinho no celular](docs/screenshots/carrinho-celular.jpg) | ![Galeria](docs/screenshots/painel-galeria.jpg) |

As fotos dos produtos são imagens de demonstração geradas pelo próprio sistema:
o administrador substitui cada uma pelas fotos reais da padaria.

---

## Índice

1. [Instalação em 5 minutos](#instalação-em-5-minutos)
2. [Acesso ao painel](#acesso-ao-painel)
3. [O que está pronto](#o-que-está-pronto)
4. [Como as fotos e os vídeos funcionam](#como-as-fotos-e-os-vídeos-funcionam)
5. [Onde guardar os arquivos (storage)](#onde-guardar-os-arquivos-storage)
6. [Banco de dados](#banco-de-dados)
7. [Deploy em produção](#deploy-em-produção)
8. [Variáveis de ambiente](#variáveis-de-ambiente)
9. [Estrutura do projeto](#estrutura-do-projeto)
10. [Testes](#testes)
11. [Segurança](#segurança)
12. [Rotina do dia a dia](#rotina-do-dia-a-dia)

---

## Instalação em 5 minutos

Pré-requisito: **Node.js 20.9 ou superior**.

```bash
# 1. Instalar as dependências
npm install

# 2. Criar o arquivo de configuração
cp .env.example .env

# 3. Gerar uma chave de sessão e colar em AUTH_SECRET dentro do .env
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# 4. Criar o banco, gerar o cliente e popular com dados de demonstração
npm run setup

# 5. Rodar
npm run dev
```

Abra <http://localhost:3000>. O painel fica em <http://localhost:3000/admin>.

O comando `npm run setup` cria 12 categorias, 36 produtos, banner, galeria,
promoções e pedidos de exemplo, todos com imagens geradas automaticamente. É a
base para a padaria começar substituindo o conteúdo, não uma tela vazia.

---

## Acesso ao painel

| Campo | Valor padrão |
| --- | --- |
| Endereço | `/admin` |
| E-mail | `admin@villareis.com.br` |
| Senha | `VillaReis@2026` |

Os dois últimos vêm de `ADMIN_EMAIL` e `ADMIN_PASSWORD` no `.env`.
**Troque a senha antes de publicar o site.** Para criar um novo administrador
com outra senha, ajuste o `.env` e rode `npm run seed` novamente.

---

## O que está pronto

**Área do cliente**

- Home com banner (foto ou vídeo), categorias, Mais pedidos, Ofertas,
  Novidades, Feito na Villa Reis, cafeteria, Instagram e localização
- Catálogo completo com busca e filtro por categoria
- Página de produto com galeria, vídeo, ingredientes, informações adicionais e
  produtos relacionados
- Carrinho, checkout e envio do pedido pelo WhatsApp com a mensagem já montada
- Área de encomendas com formulário completo e upload de foto de referência
- Página da cafeteria, página de contato com mapa e formulário
- Instalável como aplicativo no celular (PWA)

**Painel administrativo**

- Login protegido, sessão assinada de 8 horas, bloqueio por tentativas
- Dashboard com produtos, pedidos, encomendas, mídias, visualizações e mensagens
- Produtos: criar, editar, excluir, ativar/desativar, destacar, promover
- Upload direto de fotos e vídeos com arrastar e soltar, seleção múltipla,
  barra de progresso e pré-visualização
- Galeria do produto com reordenação e escolha da foto principal
- Categorias, banners com período de exibição, promoções com data de validade
- Galeria da padaria, vitrine do Instagram e biblioteca de mídia
- Pedidos e encomendas com mudança de status e resposta direta no WhatsApp
- Configurações: nome, contatos, endereço, horários, redes, textos e SEO

---

## Como as fotos e os vídeos funcionam

Esta é a parte que resolve o problema da qualidade perdida no WhatsApp.

1. O administrador arrasta a foto (ou escolhe do celular) no painel.
2. O servidor **valida o arquivo pela assinatura binária**, não pela extensão:
   um script renomeado para `.jpg` é recusado.
3. O **arquivo original é gravado intacto no storage**. Nunca é recomprimido,
   redimensionado ou alterado. Ele continua disponível para impressão, redes
   sociais e para gerar novas versões no futuro.
4. A partir dele são geradas três versões otimizadas em WebP (ou AVIF):

   | Versão | Largura | Uso |
   | --- | --- | --- |
   | `desktop` | 1600 px | computador e página do produto |
   | `mobile` | 800 px | celular |
   | `thumb` | 480 px | miniaturas e painel |

5. O site entrega a versão certa para cada tela via `srcset`, com carregamento
   preguiçoso (lazy loading) e cache de um ano.

Formatos aceitos: **JPG, JPEG, PNG, WEBP, AVIF** (fotos, até 25 MB) e
**MP4, MOV, WEBM** (vídeos, até 200 MB). Os limites e as larguras são
configuráveis no `.env`.

O banco guarda apenas os metadados: caminho, tamanho, dimensões e texto
alternativo. Arquivo grande nunca entra em tabela.

---

## Onde guardar os arquivos (storage)

Troque `STORAGE_DRIVER` no `.env`. Nenhuma outra linha de código muda.

### `local` (padrão)

Grava em `./storage/uploads` e serve pela rota `/api/media/...`.
Funciona em qualquer VPS, Railway, Render ou Fly **com disco persistente**.

> **Atenção:** não funciona na Vercel nem em qualquer plataforma serverless de
> disco efêmero. Lá o arquivo enviado desaparece no próximo deploy. Se o destino
> for a Vercel, use `supabase` ou `s3`.

### `supabase`

```env
STORAGE_DRIVER="supabase"
SUPABASE_URL="https://xxxxxxxx.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="..."
SUPABASE_BUCKET="villa-reis"
```

Crie o bucket como **público** no painel do Supabase. É a opção mais econômica
para um negócio pequeno: o plano gratuito cobre 1 GB de arquivos.

### `s3`

Funciona com AWS S3, **Cloudflare R2**, Backblaze B2, Wasabi e MinIO.

```env
STORAGE_DRIVER="s3"
S3_BUCKET="villa-reis"
S3_REGION="auto"
S3_ACCESS_KEY_ID="..."
S3_SECRET_ACCESS_KEY="..."
S3_ENDPOINT="https://<conta>.r2.cloudflarestorage.com"
S3_PUBLIC_URL="https://cdn.suapadaria.com.br"
```

A assinatura AWS V4 está implementada no projeto, sem SDK pesado.

**Recomendação:** comece em `local` em uma VPS ou no Railway com volume. Se o
volume de fotos crescer, migre para Cloudflare R2, que não cobra transferência
de saída.

---

## Banco de dados

Desenvolvimento usa **SQLite** (arquivo `prisma/dev.db`), zero configuração.

Para produção com **PostgreSQL**:

1. Em `prisma/schema.prisma`, troque:

   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. Ajuste `DATABASE_URL` no `.env`:

   ```env
   DATABASE_URL="postgresql://usuario:senha@host:5432/villareis?schema=public"
   ```

3. Rode:

   ```bash
   npx prisma migrate dev --name inicial   # uma vez, na sua máquina
   npx prisma migrate deploy               # no servidor, a cada deploy
   npm run seed                            # só na primeira vez
   ```

Tabelas: administradores, categorias, produtos, mídias, galeria do produto,
promoções, banners, galeria, Instagram, pedidos, itens do pedido, encomendas,
mensagens, configurações e visualizações.

---

## Deploy em produção

### Railway, Render ou Fly (recomendado, storage local)

1. Suba o repositório.
2. Crie um banco PostgreSQL no próprio provedor e copie a `DATABASE_URL`.
3. Adicione um **volume persistente** montado em `/app/storage`.
4. Configure as variáveis de ambiente (`AUTH_SECRET`, `DATABASE_URL`,
   `NEXT_PUBLIC_SITE_URL`, `UPLOAD_DIR=/app/storage/uploads`).
5. Comandos:
   - build: `npm ci && npx prisma generate && npx prisma migrate deploy && npm run build`
   - start: `npm start`

### Vercel (exige storage externo)

Mesma configuração, com duas diferenças obrigatórias:

- `STORAGE_DRIVER=supabase` ou `s3`
- Vídeos grandes devem ser enviados por um storage com upload direto, porque a
  Vercel limita o corpo da requisição a 4,5 MB. Para vídeo, prefira hospedar em
  VPS/Railway ou cadastrar apenas fotos pelo painel na Vercel.

### VPS com Docker ou PM2

```bash
npm ci
npx prisma migrate deploy
npm run build
npm start          # ou: pm2 start npm --name villa-reis -- start
```

Coloque um Nginx na frente com HTTPS (Let's Encrypt) e
`client_max_body_size 210M;` para permitir o upload de vídeo.

### Depois do deploy

- Acesse `/admin`, troque a senha e preencha **Configurações** com o WhatsApp,
  endereço, horários e Instagram reais.
- Confirme `NEXT_PUBLIC_SITE_URL` com o domínio final (afeta SEO, sitemap e
  compartilhamento).
- Cadastre o site no Google Search Console e envie `/sitemap.xml`.

---

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `DATABASE_URL` | sim | Conexão do banco |
| `AUTH_SECRET` | sim | Chave de assinatura da sessão (mín. 32 caracteres) |
| `NEXT_PUBLIC_SITE_URL` | sim | URL pública, sem barra no fim |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | seed | Primeiro administrador |
| `STORAGE_DRIVER` | não | `local` (padrão), `supabase` ou `s3` |
| `UPLOAD_DIR` | não | Pasta do driver local |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_BUCKET` | condicional | Supabase Storage |
| `S3_*` | condicional | S3, R2, B2, MinIO |
| `IMAGE_VARIANT_FORMAT` | não | `webp` (padrão) ou `avif` |
| `IMAGE_DESKTOP_WIDTH` / `IMAGE_MOBILE_WIDTH` / `IMAGE_THUMB_WIDTH` | não | Larguras das versões |
| `IMAGE_*_QUALITY` | não | Qualidade de cada versão |
| `MAX_IMAGE_MB` / `MAX_VIDEO_MB` | não | Limites de upload |

---

## Estrutura do projeto

```
prisma/
  schema.prisma          modelo de dados
  seed.ts                dados iniciais da padaria
  seed-images.ts         gerador das imagens de demonstração
src/
  app/
    (site)/              área do cliente
    admin/               painel administrativo
    api/                 rotas públicas e do painel
  components/            componentes da área pública
  components/admin/      componentes do painel (upload, formulários, listas)
  lib/
    storage/             adaptadores local, supabase e s3
    media.ts             validação, original preservado e variantes
    catalog.ts           consultas do catálogo
    pricing.ts           regra única de preço com promoção
    settings.ts          CMS de configurações
    whatsapp.ts          montagem das mensagens
  middleware.ts          proteção de /admin e /api/admin
scripts/generate-icons.ts  ícones do PWA e imagem de compartilhamento
tests/e2e.ts               teste ponta a ponta
```

---

## Testes

```bash
npm run build
npm start                 # em outro terminal
npm run test:e2e
```

São 43 verificações automatizadas cobrindo: páginas públicas, SEO, sitemap,
manifest, proteção do painel, login, upload (inclusive a checagem de que o
arquivo original chega ao storage **byte a byte idêntico**), recusa de arquivo
malicioso, cadastro de produto, publicação imediata no site, alteração de
preço, pedido com total calculado no servidor, encomenda, contato e logout.

Verificação de tipos: `npm run typecheck`.

---

## Segurança

- Sessão em cookie `httpOnly`, `sameSite=lax`, `secure` em produção, assinada
  com HS256 e validade de 8 horas
- Senhas com bcrypt (custo 12) e comparação de tempo constante no login
- Bloqueio após 8 tentativas de login em 10 minutos por IP
- `middleware.ts` protege `/admin` e `/api/admin` antes de qualquer renderização
- Upload validado por assinatura binária, com limite de tamanho e nome de
  arquivo sempre gerado pelo servidor (nunca o enviado pelo navegador)
- Proteção contra path traversal no storage
- Preço do pedido **sempre recalculado no servidor**; o valor enviado pelo
  navegador é ignorado
- Toda entrada validada com Zod
- Cabeçalhos `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` e
  `Permissions-Policy`
- `/admin` e `/api` bloqueados no `robots.txt`

---

## Rotina do dia a dia

**Cadastrar um produto:** Produtos → Novo produto → nome, preço e categoria →
Adicionar fotos e vídeos → marcar destaque/novidade → Salvar. O produto aparece
no site imediatamente.

**Colocar em promoção:** Promoções → escolher o produto → preço promocional →
período. O desconto aparece no card, na página do produto e na aba Ofertas.

**Trocar o banner da home:** Banners → Novo banner → foto ou vídeo, título,
subtítulo, botão e período.

**Responder um pedido:** Pedidos → mudar o status → Responder no WhatsApp.

**Mudar telefone, endereço ou horário:** Configurações. Nada disso exige
alterar código.

Guia completo para a equipe da padaria: [`docs/MANUAL-DO-ADMINISTRADOR.md`](docs/MANUAL-DO-ADMINISTRADOR.md).
