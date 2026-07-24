# geoAG — Assistência Técnica de Drones DJI Agras

Plataforma de **assistência técnica de drones agrícolas DJI Agras**, multiempresa,
com **três camadas de permissão** (Administrativo / Técnico / Cliente), fluxo de
Ordem de Serviço **por estágios com aprovação do administrativo**, **orçamento
automatizado** (PDF + WhatsApp), **abertura de chamados** com provisionamento
automático do cliente, **IA preditiva** offline (problemas crônicos, peças mais
trocadas, recomendações — exportável em PDF/Excel/CSV), **financeiro de peças**
(custo, venda, margem, lucro, giro, previsão), **auditoria imutável** com IP/tela
e exportação PDF por período, e **rastreabilidade vitalícia** por Serial Number.

Backend Java 21 / Spring Boot · Frontend React 18 + TypeScript (Vite) ·
PostgreSQL + Flyway · Docker Compose · 41 testes de integração verdes.

> ### 🟢🟠 Integração geoAG (este cliente)
> Esta instalação está **white-label para o geoAG** (Goiânia-GO): marca, cores
> (verde/laranja), contato e onboarding de produção já configurados.
> - **Passo a passo do zero:** [`docs/INTEGRACAO-GEOAG.md`](docs/INTEGRACAO-GEOAG.md)
>   e o PDF `docs/Integracao-geoAG-Passo-a-Passo.pdf`.
> - **Identidade da marca (fonte única):** `frontend/src/brand.ts` + `app.marca.*`
>   (backend) — trocar de cliente = editar só esses dois pontos.
> - **Onboarding automático:** `GEOAG_ONBOARDING_SEED=true` cria a empresa geoAG
>   + o admin no 1º boot (idempotente). Contato: contato@geoag.com.br ·
>   +55 (62) 3914-4516 · https://geoag.com.br

---

## Sumário
1. [Requisitos](#1-requisitos)
2. [Instalação do zero (Windows, 2 cliques)](#2-instalação-do-zero-windows-2-cliques)
3. [Instalação com Docker](#3-instalação-com-docker)
4. [Execução em desenvolvimento (sem Docker)](#4-execução-em-desenvolvimento-sem-docker)
5. [Usuários padrão e senhas iniciais](#5-usuários-padrão-e-senhas-iniciais)
6. [Fluxo completo do sistema](#6-fluxo-completo-do-sistema)
7. [Variáveis de ambiente](#7-variáveis-de-ambiente)
8. [Banco de dados](#8-banco-de-dados)
9. [Atualização, backup e restauração](#9-atualização-backup-e-restauração)
10. [Implantação em produção](#10-implantação-em-produção)
11. [Boas práticas de segurança](#11-boas-práticas-de-segurança)
12. [Checklist de produção](#12-checklist-de-produção)
13. [Solução de problemas](#13-solução-de-problemas)
14. [Estrutura do projeto e arquitetura](#14-estrutura-do-projeto-e-arquitetura)

---

## 1. Requisitos

**Para testar (Windows, sem Docker):** Windows 10/11 com `winget` (os `.bat`
instalam Java e Node automaticamente). Conexão com a internet na primeira vez.

**Para produção / desenvolvimento:**
- **Java 21** (Temurin/Adoptium) — backend.
- **Node.js 18+** — frontend.
- **PostgreSQL 14+** — banco de produção (o dev usa H2 em memória).
- **Docker + Docker Compose** (opcional, recomendado para produção simples).

---

## 2. Instalação do zero (Windows, 2 cliques)

1. Baixe/descompacte o projeto numa pasta simples, ex.: `C:\ConlorDrones`.
2. Dê **dois cliques em `install.bat`** — instala Java 21 e Node (via winget, se
   faltarem), compila o backend e prepara o frontend. Na 1ª vez pode pedir para
   **rodar de novo** depois de instalar o Java/Node.
3. Dê **dois cliques em `iniciar.bat`** — sobe backend + frontend, semeia a demo
   e abre o navegador em `http://localhost:5173`.
4. Entre com um usuário de demonstração (ver [seção 5](#5-usuários-padrão-e-senhas-iniciais)).
5. Para **fechar**, feche as duas janelas “Conlor Drones - Backend” e
   “Conlor Drones - Frontend”.

> Na demo os dados ficam **em memória** (somem ao reiniciar) — ótimo para treinar
> a equipe. Para dados persistentes, use Docker/PostgreSQL (seções 3 e 10).

---

## 3. Instalação com Docker

Requer apenas **Docker**. Na raiz do projeto:

```bash
docker compose up --build -d
```

Sobe **PostgreSQL + backend + frontend**. As tabelas são criadas sozinhas
(Flyway). Acesse `http://localhost:8080`.

- Aplicação (web): `http://localhost:8080`
- API direta / Swagger: `http://localhost:8081/swagger-ui.html`
- Health: `http://localhost:8081/api/v1/health`
- PostgreSQL: porta `5433`

Para ligar a demo semeada, defina `KAIROS_DEMO_SEED=true` no serviço backend do
`docker-compose.yml`. **Em produção, deixe-a desligada** e crie a sua empresa.

---

## 4. Execução em desenvolvimento (sem Docker)

Backend (H2 em memória) e frontend em terminais separados:

```bash
# Terminal 1 — backend (porta 8080), com a demo semeada
cd backend
./mvnw spring-boot:run -Dspring-boot.run.arguments=--kairos.demo.seed=true

# Terminal 2 — frontend (porta 5173)
cd frontend
npm install
npm run dev
```

Testes do backend: `cd backend && ./mvnw test` (41 testes de integração).
Build do frontend: `cd frontend && npm run build`.

---

## 5. Usuários padrão e senhas iniciais

Com a demo semeada (`kairos.demo.seed=true`), a empresa **Conlor Drones (Demo)**
já vem com três acessos — **senha `kairos-demo-123`**:

| Perfil | E-mail | O que enxerga |
|---|---|---|
| **Desenvolvedor (DEV)** | `dev@conlor.com` | acesso total + console **Desenvolvedor** (gera PDF das solicitações de alteração) |
| **Administrativo (ADMIN)** | `admin@conlor.com` | tudo: chamados, aprovações, estoque, IA, financeiro, usuários, auditoria |
| **Técnico (TECNICO)** | `tecnico@conlor.com` | as OS atribuídas + as da fila (não distribuídas) + acesso geral (leitura); executa o fluxo |
| **Cliente (CLIENTE)** | `cliente@conlor.com` | agenda e acompanha os próprios chamados (linha do tempo) |

> **Produção (geoAG):** não use a demo. Ligue `GEOAG_ONBOARDING_SEED=true` no
> primeiro boot (ver `.env.example`) — o sistema cria a empresa **geoAG** e o
> usuário **ADMIN** (`contato@geoag.com.br`) automaticamente. Entre, **troque a
> senha** e crie a equipe em **Usuários** (ADMIN, TECNICO, CLIENTE). Alternativa
> manual: clique em **Criar conta** e cadastre nome + CNPJ. Passo a passo
> completo em [`docs/INTEGRACAO-GEOAG.md`](docs/INTEGRACAO-GEOAG.md).

---

## 6. Fluxo completo do sistema

**Abertura de chamado (Administrativo).** O cliente contata por WhatsApp,
Instagram, Facebook, telefone ou site. Em **Chamados → Criar novo chamado**, o
sistema, de uma vez: cadastra o cliente (com usuário + senha), registra a
aeronave (Serial Number + modelo), abre a OS na **Fila de Espera**, gera o
**protocolo** e libera o painel do cliente. (O cliente também pode se
**auto-agendar** em Agendamentos; a gerência confirma o lead.)

**Ciclo da Ordem de Serviço (por estágios, com aprovação):**

```
FILA_DE_ESPERA → ORCAMENTO → AGUARDANDO_APROVACAO → APROVADO → ESTAGIO_1
                                                         │
                          ┌──────────────────────────────┴─ Concluir → FINALIZADO
                          └─ Ir p/ Estágio 2 → AGUARDANDO_APROVACAO_E2 →
                             APROVADO_E2 → ESTAGIO_2 → Concluir → FINALIZADO
```

1. **Técnico** abre o orçamento (diagnóstico, peças do estoque com preço, mão de
   obra, observações) e **envia para aprovação**.
2. **Administrativo** aprova ou reprova. Aprovado, libera **Iniciar manutenção**.
3. **Técnico** executa o **Estágio 1**; ao terminar, **conclui** ou, se surgirem
   novos defeitos, monta um **novo orçamento (Estágio 2)** e envia para aprovação.
4. **Administrativo** conversa com o cliente e aprova o Estágio 2; a manutenção é
   liberada, executada e **concluída**.
5. Na conclusão: baixa automática das peças no estoque, evento no **histórico
   vitalício** da aeronave, atualização de auditoria, financeiro de peças e
   notificações.

**Cliente** acompanha em tempo real uma **linha do tempo** com mensagens
amigáveis (“A manutenção foi iniciada”, “Seu drone entrou no Estágio 2…”,
“Equipamento pronto para retirada”) e vê apenas o próprio chamado.

**Poderes do administrativo:** editar/alterar estágio, cancelar, reabrir, aprovar/
reprovar e corrigir qualquer OS; editar e apagar peças do orçamento.

---

## 7. Variáveis de ambiente

| Variável | Descrição | Padrão |
|---|---|---|
| `KAIROS_JWT_SECRET` | Segredo HS256 dos tokens (**troque em produção**, ≥ 32 bytes) | valor de dev |
| `KAIROS_CORS_ORIGINS` | Origens permitidas do frontend (CSV) | `http://localhost:5173,...` |
| `KAIROS_DEMO_SEED` | Semeia a empresa de demonstração no boot | `false` |
| `KAIROS_LOGIN_MAX_TENTATIVAS` | Tentativas antes de bloquear o login | `5` |
| `DB_URL` / `DB_USER` / `DB_PASSWORD` | Conexão PostgreSQL (perfil `postgres`) | `localhost:5432/kairos` |
| `DB_POOL_MAX` / `DB_POOL_MIN` | Pool de conexões | `10` / `2` |
| `GEOAG_ONBOARDING_SEED` | Cria a empresa geoAG + admin no 1º boot (idempotente) | `false` |
| `GEOAG_CNPJ` | CNPJ real do geoAG (troque o placeholder) | `00.000.000/0001-00` |
| `GEOAG_ADMIN_EMAIL` / `GEOAG_ADMIN_SENHA` | Acesso inicial do admin (troque a senha) | `contato@geoag.com.br` |
| `APP_MARCA_NOME` / `APP_MARCA_COR` | Marca nos relatórios PDF (nome + cor hex) | `geoAG` / `#2f6a1e` |
| `APP_MARCA_SITE` / `APP_MARCA_EMAIL` / `APP_MARCA_TELEFONE` / `APP_MARCA_ENDERECO` | Contato institucional (rodapé dos PDFs) | dados do geoAG |

---

## 8. Banco de dados

- **Dev/testes:** H2 em memória (modo PostgreSQL) — nada a instalar.
- **Produção:** PostgreSQL, perfil `postgres`
  (`--spring.profiles.active=postgres` + `DB_URL/DB_USER/DB_PASSWORD`).
- **Migrações:** Flyway (`backend/src/main/resources/db/migration`, V1–V11)
  aplicadas automaticamente no boot. Nunca edite uma migração já aplicada — crie
  a próxima (`V12__...`).

---

## 9. Atualização, backup e restauração

**Atualizar:** substitua os arquivos pela nova versão e rode
`docker compose up --build -d` (ou recompile com `install.bat`). As tabelas se
atualizam sozinhas via Flyway.

**Backup (PostgreSQL):**
```bash
docker compose exec postgres pg_dump -U kairos kairos > backup-$(date +%F).sql
```

**Restauração:**
```bash
docker compose exec -T postgres psql -U kairos kairos < backup-2026-01-01.sql
```

Agende o backup diário (cron/Agendador de Tarefas). O banco é o seu bem mais
precioso.

---

## 10. Implantação em produção

### 10.1. Servidor Linux (recomendado)
1. Instale Docker + Docker Compose.
2. Copie o projeto, ajuste o `docker-compose.yml` (senha do banco, `KAIROS_JWT_SECRET`).
3. `docker compose up --build -d`.
4. Coloque um **reverse proxy** (nginx/Caddy) na frente com **HTTPS**.

### 10.2. Servidor Windows
1. Rode `install.bat` uma vez (compila) e use `iniciar.bat`, **ou** instale o
   Docker Desktop e use o compose.
2. Para rodar como serviço, use o Agendador de Tarefas apontando para
   `iniciar.bat` no logon, ou empacote o backend (`java -jar`) com NSSM.

### 10.3. Domínio e HTTPS
- Aponte um domínio (ex.: `app.suaassistencia.com.br`) para o servidor.
- **Caddy** (HTTPS automático via Let's Encrypt):
  ```
  app.suaassistencia.com.br {
      reverse_proxy localhost:8080
  }
  ```
- Ajuste `KAIROS_CORS_ORIGINS` para o seu domínio (`https://app.suaassistencia.com.br`).

### 10.4. Banco em produção
- Use um PostgreSQL gerenciado ou o container do compose com **volume persistente**
  (o `docker-compose.yml` já define o volume). Troque a senha padrão.

---

## 11. Boas práticas de segurança

- **Troque `KAIROS_JWT_SECRET`** por um segredo forte e único (nunca versionado).
- Troque a **senha do PostgreSQL** (`DB_PASSWORD`).
- Sempre atrás de **HTTPS** quando exposto à internet.
- Restrinja `KAIROS_CORS_ORIGINS` ao(s) seu(s) domínio(s).
- Perfis mínimos: dê **CLIENTE** a clientes e **TECNICO** a técnicos; **ADMIN** só
  para a gerência.
- A **auditoria é imutável** (não há como editar/excluir) e registra usuário,
  data/hora, IP, ação e tela — exporte o PDF por período para conformidade.
- Anti-brute-force no login (bloqueio após N tentativas) já vem ativo.

---

## 12. Checklist de produção

- [ ] `docker compose up --build -d` (ou PostgreSQL + perfil `postgres`).
- [ ] `KAIROS_DEMO_SEED` **desligado**; empresa criada via **Criar conta**.
- [ ] `KAIROS_JWT_SECRET` forte + senha do banco trocada.
- [ ] `KAIROS_CORS_ORIGINS` com o seu domínio; **HTTPS** ativo.
- [ ] Equipe cadastrada (ADMIN/TECNICO/CLIENTE).
- [ ] Estoque com **custo e preço**; aeronaves cadastradas.
- [ ] **Backup** do banco agendado.
- [ ] `./mvnw test` verde e `npm run build` sem erros.

---

## 13. Solução de problemas

| Sintoma | Causa provável | Solução |
|---|---|---|
| `iniciar.bat` diz que não foi instalado | `install.bat` não rodou / falhou | rode `install.bat` (e de novo, se pediu, após instalar Java/Node) |
| “Invalid or corrupt jarfile” | jar corrompido por cópia em modo texto | `iniciar.bat` já recopia em modo binário; rode-o de novo |
| Backend não sobe (porta 8080) | porta ocupada / Java ausente | feche o que usa a 8080; confirme Java 21 (`java -version`) |
| Login falha para um usuário | usuário **bloqueado** | Admin → Usuários → **reativar** |
| “Unsupported Database: PostgreSQL” | driver/módulo Flyway | já incluído (`flyway-database-postgresql`); confirme o perfil `postgres` |
| Frontend não conecta na API | CORS | inclua a origem em `KAIROS_CORS_ORIGINS` |

---

## 14. Estrutura do projeto e arquitetura

```
/install.bat          → instala tudo (Java/Node), compila o backend, prepara o frontend
/iniciar.bat          → sobe backend + frontend e abre o navegador
/backend              → API Java 21 / Spring Boot (monólito modular DDD)
/frontend             → painel web React 18 + TypeScript (Vite)
/docker-compose.yml   → PostgreSQL + backend + frontend
/adr                  → Architecture Decision Records (0001–0007)
/docs                 → documentação técnica (02 Project Bible, ORIENTACAO-ASSISTENCIA-TECNICA…)
```

**Arquitetura:** monólito modular (DDD) por *bounded contexts* — `identity`
(usuários/RBAC), `tenancy` (multiempresa), `equipment` (aeronaves + histórico),
`inventory` (KSI: estoque, custo/preço, ABC), `workorder` (OS por estágios,
orçamento, chamados, observações), `scheduling` (agendamentos), `kci` (IA
preditiva/diagnóstico), `finance` (financeiro de peças), `audit` (trilha
imutável), `notification`, `bi`. Segurança: Spring Security + JWT (HS256) +
refresh token + RBAC (`@PreAuthorize`). Multi-tenant por `tenant_id` do token.
Decisões em `/adr` (ver **ADR-0006** e **ADR-0007**) e no **Project Bible**
(`docs/02-project-bible.md`).

Guia de implantação para assistências técnicas:
[`docs/ORIENTACAO-ASSISTENCIA-TECNICA.md`](docs/ORIENTACAO-ASSISTENCIA-TECNICA.md).
