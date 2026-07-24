# Conlor Drones — Guia para deixar tudo funcionando de verdade

Este guia leva o aplicativo do **teste (demo)** ao **uso real numa assistência
técnica** de drones DJI Agras. Você não precisa ser programador — siga os passos
na ordem.

---

## Parte 1 — Testar no computador (Windows, 2 cliques)

1. Baixe/descompacte a pasta do projeto num lugar simples, ex.: `C:\ConlorDrones`.
2. Dê **dois cliques em `install.bat`** e aguarde. Ele instala o Java 21 e o
   Node (se faltarem), compila o sistema e prepara o site. Na 1ª vez pode demorar
   alguns minutos e talvez peça para **rodar de novo** depois de instalar o Java/Node.
3. Dê **dois cliques em `iniciar.bat`**. Ele liga o sistema e abre o
   navegador em `http://localhost:5173`.
4. Entre com um dos usuários de demonstração (senha `kairos-demo-123`):
   - **Gerência:** `admin@conlor.com`
   - **Técnico:** `tecnico@conlor.com`
   - **Cliente:** `cliente@conlor.com`
5. Para **fechar**, feche as duas janelas pretas (“Conlor Drones - Backend” e
   “Conlor Drones - Frontend”).

> A demo apaga/recria nada: os dados ficam **em memória** (somem ao reiniciar).
> Isso é ótimo para treinar a equipe sem medo. Para dados que **ficam salvos**,
> siga a Parte 2.

---

## Parte 2 — Colocar em produção de verdade

Aqui os dados ficam guardados num banco PostgreSQL e o sistema fica pronto para o
dia a dia.

### 2.1. Banco de dados PostgreSQL (dados que não se perdem)
A forma mais simples é com **Docker** (um comando sobe tudo: banco + backend + site):

```bash
docker compose up --build -d
```

Isso usa o `docker-compose.yml` do projeto. O banco PostgreSQL já sobe junto e o
sistema **cria as tabelas sozinho** (Flyway). Acesse em `http://localhost:8080`.

> Sem Docker? Instale o PostgreSQL, crie um banco `kairos` e rode o backend com o
> perfil de produção: `--spring.profiles.active=postgres` e as variáveis
> `DB_URL`, `DB_USER`, `DB_PASSWORD`.

### 2.2. Desligar a demo e criar a SUA empresa
1. **Não** use `--kairos.demo.seed=true` em produção (o `docker-compose.yml` já
   vem sem semear dados fictícios — confira a variável `KAIROS_DEMO_SEED`).
2. Na primeira tela, clique em **Criar conta** e cadastre a **sua** assistência
   (nome, CNPJ) e o **seu** usuário administrador. Pronto: essa é a sua empresa
   (cada empresa é isolada das demais — multiempresa).

### 2.3. Senha/segurança (obrigatório)
Defina um segredo forte para os tokens de login (nunca use o valor de exemplo):

```
KAIROS_JWT_SECRET = uma-frase-bem-grande-e-secreta-com-mais-de-32-letras
```

No Docker, coloque essa variável no `docker-compose.yml` (serviço do backend) ou
num arquivo `.env`. Troque também a senha do banco (`DB_PASSWORD`).

### 2.4. Acesso pela rede / internet (opcional, mas comum)
- **Na loja (rede local):** descubra o IP do computador servidor (ex.:
  `192.168.0.10`) e acesse de outros PCs por `http://192.168.0.10:8080`. Ajuste a
  variável `KAIROS_CORS_ORIGINS` para incluir esse endereço.
- **Pela internet (clientes agendando de casa):** publique numa VPS/servidor com
  um domínio (ex.: `app.suaassistencia.com.br`) e um **HTTPS** (certificado
  gratuito Let's Encrypt via nginx/Caddy). Aponte `KAIROS_CORS_ORIGINS` para o
  seu domínio.

---

## Parte 3 — Configurar para a sua operação

### 3.1. Cadastre sua equipe (3 camadas de permissão)
Como **ADM**, vá em **Usuários** e crie:
- **TECNICO** — cada técnico da bancada (vê só as OS atribuídas a ele).
- **CLIENTE** — cada cliente que vai agendar/acompanhar pelo app (ou deixe que
  eles mesmos usem quando você habilitar o cadastro externo).
- **ADMIN** — sócios/gerência que enxergam tudo.

### 3.2. Monte o estoque com CUSTO e PREÇO
Em **Estoque**, cadastre as peças com **SKU, saldo, estoque mínimo, custo de
compra e preço de venda**. O **preço** alimenta o orçamento automático; o **custo**
alimenta o **Financeiro de peças** (margem, lucro, giro, previsão). Exemplos da
linha DJI Agras: hélices, anel da bomba, bicos, radar, baterias, eixos do braço.
Use o botão **preço** para reajustar (os orçamentos já montados mantêm o preço
congelado).

### 3.3. Cadastre as aeronaves
Em **Aeronaves**, registre cada drone por **Serial Number** e modelo (T10…T40). O
histórico de tudo que acontece com aquele drone fica guardado para sempre.

### 3.4. Fluxo do dia a dia (com aprovação do administrativo)
1. **Abrir chamado:** em **Chamados → Criar novo chamado**, informe o contato do
   cliente (WhatsApp/Instagram/Facebook/telefone/site). O sistema cadastra o
   cliente (com login e senha), a aeronave, abre a OS na **Fila de Espera** e gera
   o **protocolo**. (O cliente também pode se auto-agendar; a gerência confirma.)
2. **Técnico** conduz a OS:
   - **Iniciar orçamento** → preenche diagnóstico, peças (preço do estoque) e mão
     de obra → **Enviar para aprovação**.
   - **Administrativo aprova** (ou reprova) → o técnico vê **Iniciar manutenção**
     (Estágio 1).
   - Achou novo defeito? Adiciona a **peça adicional** → **Ir para Estágio 2** →
     **administrativo aprova o Estágio 2** → técnico inicia e conclui.
   - **Concluir**: baixa as peças do estoque e grava no histórico da aeronave.
3. **Cliente** acompanha tudo pela **linha do tempo**, com mensagens amigáveis.
4. **Orçamento** vira **PDF** e **link de WhatsApp** com um clique.

### 3.5. WhatsApp
O sistema gera um **link `wa.me`** com a mensagem pronta do orçamento — clique e
envie pelo WhatsApp. Para envio **100% automático**, integra-se a **WhatsApp
Business API** numa evolução futura (ver ADR-0007).

---

## Parte 4 — Rotina de manutenção do sistema

- **Backup:** faça cópia regular do banco PostgreSQL (ex.: `pg_dump`). Esse é o
  seu bem mais precioso.
- **Atualizações:** ao receber uma nova versão, rode `docker compose up --build -d`
  novamente (as tabelas se atualizam sozinhas via Flyway).
- **Monitoramento:** `http://SEU-SERVIDOR:8081/api/v1/health` responde se está no
  ar. As portas: site `:8080`, API/Swagger `:8081`, banco `:5433`.
- **Suporte a decisões:** use o **Painel** (indicadores), a **IA Preditiva**
  (peças crônicas por modelo → compre estoque na medida certa), o **Financeiro de
  peças** (margem/lucro/giro) e a **Auditoria** (quem fez o quê, com PDF por período).

---

## Resumo rápido (checklist de produção)
- [ ] `docker compose up --build -d` (ou PostgreSQL + perfil `postgres`).
- [ ] `KAIROS_DEMO_SEED` desligado; **Criar conta** com a sua empresa.
- [ ] `KAIROS_JWT_SECRET` forte + senha do banco trocada.
- [ ] `KAIROS_CORS_ORIGINS` com o seu endereço/domínio; HTTPS se for pela internet.
- [ ] Equipe cadastrada (ADM/Técnico/Cliente).
- [ ] Estoque **com preço** e aeronaves cadastradas.
- [ ] Backup do banco agendado.
