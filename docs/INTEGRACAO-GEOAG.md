# Integração geoAG — Passo a Passo do Zero

**Cliente:** geoAG — Assistência Técnica de Drones DJI Agras
**Local:** Av. Francisco de Melo, Quadra 41, Lote 06 — 74.345-210, Vila Rosa, Goiânia-GO
**Contato:** contato@geoag.com.br · +55 (62) 3914-4516 · https://geoag.com.br

Este documento é o **detalhe técnico de implantação** (servidor, Docker, `.env`,
onboarding). Para o **manual de operação do dia a dia** — como a **administração**
e os **técnicos** trabalham oficialmente, passo a passo — veja o PDF ao lado:
`Integracao-geoAG-Passo-a-Passo.pdf` (gerado por `gerar-manual-pdf.py`).

---

## 0. O que é o sistema e o que a integração entregou

A plataforma é um **SaaS de assistência técnica de drones DJI Agras**: chamados,
Ordem de Serviço por estágios com aprovação, orçamento (PDF + WhatsApp), estoque
de peças com custo/preço, IA preditiva, financeiro, auditoria imutável e
rastreabilidade vitalícia por Serial Number.

A **integração real do geoAG** (white-label + onboarding) entregou:

| # | Entrega | Onde |
|---|---------|------|
| 1 | **Marca geoAG** (nome, cores verde/laranja, logo, favicon, título) | `frontend/src/brand.ts`, `styles.css`, `index.html` |
| 2 | **Textos** do app com a marca (topo, login, WhatsApp, rodapé) | `frontend/src/App.tsx`, `i18n.ts` |
| 3 | **Contato real** do geoAG no registro da empresa + rodapé dos PDFs | `Empresa` + `V14__empresa_contato.sql`, `BrandProperties` |
| 4 | **Onboarding de produção** (cria empresa geoAG + admin no 1º boot) | `GeoagOnboardingSeeder.java` |
| 5 | **Configuração** de produção (env, Docker, CORS) | `.env.example`, `docker-compose.yml` |

> **Trocar de cliente no futuro** = editar **dois pontos**: `frontend/src/brand.ts`
> (frontend) e as chaves `app.marca.*` do backend (via variáveis de ambiente).

**Validação técnica:** backend com **41 testes de integração verdes** e frontend
compilando sem erros (`npm run build`).

---

## 1. Pré-requisitos (o que você precisa antes de começar)

Escolha **um** caminho:

- **Caminho A — Docker (recomendado p/ produção):** um servidor Linux (ou Windows
  com Docker Desktop) com **Docker + Docker Compose**. É o mais simples e já sobe
  PostgreSQL + backend + frontend juntos.
- **Caminho B — Windows 2 cliques (treinamento/local):** Windows 10/11 com
  `winget`. Os `.bat` instalam Java 21 e Node sozinhos. Dados ficam em memória.
- **Caminho C — Manual (dev):** Java 21, Node 18+, PostgreSQL 14+.

Para produção com domínio, tenha também: um **domínio** (ex.: `app.geoag.com.br`)
apontando para o servidor e portas 80/443 liberadas.

---

## 2. Obter o projeto

```bash
git clone <URL-DO-REPOSITORIO> geoag
cd geoag
```

(ou copie a pasta do projeto para o servidor, ex.: `/opt/geoag`).

---

## 3. Configurar os segredos (`.env`)

Copie o modelo e edite:

```bash
cp .env.example .env
```

Ajuste no `.env` (todos são importantes):

| Variável | O que colocar |
|----------|----------------|
| `DB_PASSWORD` | uma **senha forte** para o banco |
| `KAIROS_JWT_SECRET` | um **segredo longo e único** (32+ caracteres) — veja abaixo |
| `KAIROS_CORS_ORIGINS` | o domínio do frontend, ex.: `https://app.geoag.com.br` |
| `GEOAG_ONBOARDING_SEED` | **`true`** no primeiro boot (cria a empresa geoAG) |
| `GEOAG_CNPJ` | o **CNPJ real** do geoAG (troque o placeholder) |
| `GEOAG_ADMIN_EMAIL` | e-mail do admin (padrão `contato@geoag.com.br`) |
| `GEOAG_ADMIN_SENHA` | senha inicial do admin — **troque no 1º login** |
| `KAIROS_DEMO_SEED` | **`false`** em produção |

Gerar um `KAIROS_JWT_SECRET` forte:

```bash
openssl rand -base64 48
```

> **Nunca** versione o `.env` (já está no `.gitignore`).

---

## 4. Subir a stack

### Caminho A — Docker

```bash
docker compose up --build -d
```

Sobe três serviços:

- **Aplicação (web):** http://localhost:8080 (ou o IP do servidor)
- **API direta / health:** http://localhost:8081/api/v1/health
- **PostgreSQL:** porta 5433 (volume persistente `geoag-db`)

As tabelas são criadas sozinhas pelo **Flyway** (migrações V1…V14).

### Caminho B — Windows 2 cliques (treinamento)

1. Dois cliques em **`install.bat`** (instala Java/Node, compila).
2. Dois cliques em **`iniciar.bat`** (sobe tudo e abre o navegador).
   > Esse modo usa **dados de demonstração** em memória — ótimo para treinar a
   > equipe. Não é o ambiente de produção do geoAG.

### Caminho C — Manual (dev)

```bash
# backend (porta 8080)
cd backend && ./mvnw spring-boot:run
# frontend (porta 5173)
cd frontend && npm install && npm run dev
```

---

## 5. Onboarding automático do geoAG (1º boot)

Com `GEOAG_ONBOARDING_SEED=true`, no primeiro boot o sistema **cria sozinho**:

- a **empresa geoAG** (com CNPJ e contato: e-mail, telefone, endereço, site);
- o **usuário ADMIN** (`GEOAG_ADMIN_EMAIL`).

Confirme no log do backend a linha:

```
[geoag] Pronto. Empresa 'geoAG' criada (tenant …). ADMIN: contato@geoag.com.br — TROQUE A SENHA no primeiro acesso.
```

É **idempotente**: se a empresa já existe (mesmo CNPJ), não duplica.

**Primeiro acesso:**
1. Abra a aplicação (ex.: http://localhost:8080).
2. Entre com `GEOAG_ADMIN_EMAIL` e `GEOAG_ADMIN_SENHA`.
3. Vá em **Usuários → (seu usuário) → Redefinir senha** e **troque a senha**.
4. (Opcional) volte `GEOAG_ONBOARDING_SEED=false` no `.env`.

---

## 6. Configurar a operação (dentro do app, como ADMIN)

1. **Usuários** — cadastre a equipe: **TÉCNICO** (executa as OS) e, quando quiser,
   **CLIENTE** (o próprio cliente também é criado ao abrir um chamado).
2. **Estoque (KSI)** — cadastre as peças com **custo de compra**, **preço de
   venda** e **fornecedor** (habilita margem, giro e reposição automática).
3. **Aeronaves** — registre os drones por **Serial Number** (rastreabilidade
   vitalícia).
4. **Chamados** — abra o primeiro chamado; o sistema gera protocolo, cria o
   acesso do cliente e envia o login por **WhatsApp**.

Fluxo da OS: `FILA → ORÇAMENTO → AGUARDANDO APROVAÇÃO → APROVADO → ESTÁGIO 1 →
(Estágio 2 se preciso) → FINALIZADO` (baixa de peças + histórico + auditoria).

---

## 7. Domínio e HTTPS (produção)

Aponte `app.geoag.com.br` para o servidor e coloque um **reverse proxy** com
HTTPS automático. Exemplo com **Caddy**:

```
app.geoag.com.br {
    reverse_proxy localhost:8080
}
```

Depois ajuste `KAIROS_CORS_ORIGINS=https://app.geoag.com.br` no `.env` e reinicie
(`docker compose up -d`).

---

## 8. Checklist de validação (antes de liberar para a equipe)

- [ ] `docker compose up --build -d` sem erros; `curl http://localhost:8081/api/v1/health` responde.
- [ ] Login do ADMIN funciona; **senha inicial trocada**.
- [ ] Marca **geoAG** no topo, no título da aba e no rodapé (verde/laranja).
- [ ] Abrir um chamado gera protocolo e o botão **WhatsApp** cita "geoAG".
- [ ] Exportar o **PDF de Auditoria** — cabeçalho traz **geoAG** + contato.
- [ ] `GEOAG_CNPJ` real preenchido; `KAIROS_JWT_SECRET` e `DB_PASSWORD` fortes.
- [ ] `KAIROS_DEMO_SEED=false`; HTTPS ativo; `KAIROS_CORS_ORIGINS` com o domínio.
- [ ] **Backup** do banco agendado (seção 9).

---

## 9. Backup, restauração e atualização

**Backup diário (agende no cron):**

```bash
docker compose exec postgres pg_dump -U geoag geoag > backup-$(date +%F).sql
```

**Restauração:**

```bash
docker compose exec -T postgres psql -U geoag geoag < backup-2026-01-01.sql
```

**Atualizar a versão:** substitua os arquivos e rode
`docker compose up --build -d` — o Flyway aplica novas migrações sozinho.

---

## 10. Onde a marca vive (referência técnica)

| Camada | Arquivo / chave | Papel |
|--------|------------------|-------|
| Frontend | `frontend/src/brand.ts` | **Fonte única**: nome, cores, contato, WhatsApp |
| Frontend | `frontend/src/styles.css` (`:root`) | Paleta verde/laranja |
| Frontend | `frontend/index.html` | Título da aba + favicon |
| Frontend | `frontend/src/i18n.ts`, `App.tsx` | Textos com a marca |
| Backend | `app.marca.*` (env `APP_MARCA_*`) | Marca nos relatórios PDF |
| Backend | `BrandProperties.java` | Bind das propriedades de marca |
| Backend | `GeoagOnboardingSeeder.java` | Onboarding da empresa geoAG |
| Banco | `V14__empresa_contato.sql` | Contato no registro da empresa |

---

## 11. Solução de problemas rápida

| Sintoma | Solução |
|---------|---------|
| Onboarding não criou a empresa | confirme `GEOAG_ONBOARDING_SEED=true` e veja o log `[geoag]` |
| "Já existe empresa com o documento" | o CNPJ já foi usado — o seed é idempotente, ignore |
| Frontend não fala com a API | inclua o domínio em `KAIROS_CORS_ORIGINS` |
| PDF de auditoria sem a marca | defina `APP_MARCA_*` (ou use os defaults geoAG) |
| Login bloqueado | ADMIN → Usuários → **reativar** |

---

**Suporte geoAG:** contato@geoag.com.br · +55 (62) 3914-4516 · https://geoag.com.br
