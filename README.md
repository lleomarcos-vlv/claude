# Estação de Trabalho — Prospecção Comercial Inteligente

Aplicação **desktop local** e completa para prospecção comercial: cadastro de
clientes, funil de prospecção, **pesquisa automática de empresas em fontes
públicas e gratuitas**, revisão de resultados, controle inteligente de
duplicidade, importação/exportação de planilhas e integração com o WhatsApp.

Funciona **100% no seu computador** (offline, exceto a pesquisa automática, que
consulta bases públicas na internet). Nenhum dado é enviado para servidores de
terceiros.

> **Instalação em dois cliques:** execute `instalar.bat` uma vez e depois
> `iniciar.bat` sempre que quiser abrir o sistema.

---

## Índice

1. [Tecnologias](#tecnologias)
2. [Requisitos](#requisitos)
3. [Instalação](#instalação)
4. [Como iniciar](#como-iniciar)
5. [Primeiro acesso / Login](#primeiro-acesso--login)
6. [Como usar](#como-usar)
   - [Clientes Fixos](#clientes-fixos)
   - [Prospectando](#prospectando)
   - [Pesquisa Automática](#pesquisa-automática)
   - [Revisão](#revisão)
   - [Nichos](#nichos)
   - [Histórico](#histórico)
7. [Como importar](#como-importar)
8. [Como pesquisar](#como-pesquisar)
9. [Como exportar](#como-exportar)
10. [WhatsApp](#whatsapp)
11. [Controle de duplicidade](#controle-de-duplicidade)
12. [Banco de dados](#banco-de-dados)
13. [Backup](#backup)
14. [Atualização](#atualização)
15. [Estrutura do projeto](#estrutura-do-projeto)
16. [Configuração](#configuração)
17. [Segurança](#segurança)
18. [Notas técnicas e substituições](#notas-técnicas-e-substituições)
19. [Solução de problemas](#solução-de-problemas)
20. [Testes](#testes)

---

## Tecnologias

- **HTML5, CSS3 e JavaScript (ES2024)** — interface (tema escuro, responsivo).
- **Node.js + Express** — servidor local e API REST.
- **Electron** — janela do aplicativo desktop.
- **SQLite** (via `better-sqlite3`) — banco de dados local, criado
  automaticamente.
- **SheetJS (xlsx)** — leitura/geração de Excel/CSV.
- **PDFKit** — geração de relatórios em PDF.
- **OpenStreetMap** (Nominatim + Overpass API) — fonte pública e gratuita da
  Pesquisa Automática.

Sem frameworks de front-end e sem serviços pagos.

---

## Requisitos

- **Windows** (os arquivos `.bat` são para Windows; em Linux/macOS use os
  comandos `npm`).
- **Node.js 18 ou superior** — baixe a versão **LTS** em
  <https://nodejs.org/pt-br/download>.
  - O instalador verifica automaticamente se o Node está presente e orienta
    o download caso não esteja.
- Conexão com a internet **apenas** para: instalar as dependências (uma vez) e
  usar a **Pesquisa Automática**.

---

## Instalação

1. Descompacte o projeto em uma pasta de sua preferência.
2. Dê **dois cliques** em **`instalar.bat`**.
   O instalador irá:
   - verificar se o Node.js está instalado (e orientar caso não esteja);
   - instalar todas as dependências (`npm install`);
   - criar o banco de dados, as pastas e a base de nichos;
   - criar o usuário administrador padrão.
3. Ao final aparecerá **"INSTALAÇÃO CONCLUÍDA COM SUCESSO!"**.

> Em Linux/macOS: `npm install` (equivale ao `instalar.bat`).

---

## Como iniciar

- Dê **dois cliques** em **`iniciar.bat`**.
- A janela do aplicativo abrirá automaticamente.
- Mantenha a janela do prompt aberta enquanto usa o sistema.

Se a janela do aplicativo (Electron) não abrir por algum motivo, o
`iniciar.bat` automaticamente inicia o **modo navegador**: basta acessar
<http://127.0.0.1:4599> no seu navegador.

> Em Linux/macOS: `npm start` (Electron) ou `npm run web` (navegador).

---

## Primeiro acesso / Login

- **Login:** `admin`
- **Senha:** `admin123`

**Altere a senha** logo após o primeiro acesso, no botão **"Alterar senha"**
(canto inferior esquerdo). A sessão fica salva (login persistente) mesmo após
fechar e reabrir o aplicativo, até você clicar em **Sair**.

---

## Como usar

Após o login, a **estação de trabalho** abre com um menu lateral:

### Clientes Fixos
Clientes já conquistados. Cada cliente possui: Nome, Telefone, WhatsApp,
Cidade, Instagram, Site, E-mail, Observações, Data de cadastro e Último
contato. Permite **pesquisar, ordenar, editar, excluir, abrir WhatsApp,
importar** e **exportar** (Excel, CSV, PDF).

### Prospectando
Empresas em negociação. Campos: Empresa, Cidade, Estado, Nicho, Telefone,
WhatsApp, Instagram, Site, E-mail, Responsável, Status, Origem, Data, Último
contato, **Probabilidade de fechamento** e Observações. Possui **filtros**
(cidade, estado, nicho, status, probabilidade), além de **abrir WhatsApp,
editar, excluir** e **mover para Clientes Fixos**.

### Pesquisa Automática
Ferramenta que **coleta empresas automaticamente** a partir de Cidade, Estado,
Nicho e Quantidade máxima, usando **somente fontes públicas e gratuitas**
(OpenStreetMap). Veja [Como pesquisar](#como-pesquisar).

### Revisão
Todas as pesquisas realizadas aparecem aqui. Para cada empresa encontrada é
possível **selecionar, visualizar, editar, adicionar à Prospecção ou
descartar**, individualmente ou **em lote** (selecionar todos, mover em lote,
excluir em lote), com busca e ordenação.

### Nichos
Base pesquisável com **mais de 270 nichos** prontos (padarias, farmácias,
oficinas, dentistas, advogados, etc.), organizados por categoria. Você também
pode digitar **qualquer termo livre** na Pesquisa Automática — nichos fora da
base são buscados por nome. Clique em um nicho para já iniciar uma pesquisa.

### Histórico
Auditoria de tudo: logins, pesquisas, importações, exclusões, alterações,
movimentações e erros, com filtro por tipo e paginação.

---

## Como importar

1. Em **Clientes Fixos** clique em **"Importar Meus Clientes"** (ou em
   **Prospectando → Importar**).
2. Selecione um arquivo **`.csv`, `.xls` ou `.xlsx`**.
3. O sistema **lê e detecta as colunas automaticamente** (reconhece nomes em
   português como *Nome, Empresa, Telefone, Celular, Cidade, E-mail,
   Instagram, Site, Nicho, Observações*, entre outros sinônimos).
4. Ao final é exibido um resumo: **inseridos, duplicados e inválidos**, com
   detalhamento das linhas com erro.

Recursos da importação:
- Mapeamento automático de campos (com dezenas de sinônimos).
- Ignora linhas inválidas (sem nome).
- Detecta e ignora **duplicidades** (dentro do arquivo e contra o banco).
- Suporta **milhares de registros**.

> Dica: a primeira linha da planilha deve conter os **títulos das colunas**.

---

## Como pesquisar

1. Vá em **Pesquisa Automática**.
2. Preencha **Cidade** (obrigatório), **Estado (UF)**, **Nicho** (obrigatório,
   com sugestões) e **Quantidade máxima**.
3. Clique em **Pesquisar**.

O sistema:
- localiza a cidade no **Nominatim** (OpenStreetMap);
- consulta empresas do nicho na **Overpass API** (OpenStreetMap);
- para cada empresa coleta, quando disponível: **Nome, Telefone, WhatsApp,
  Instagram, Site, E-mail, Cidade, Endereço, Latitude, Longitude, Categoria,
  Horário, Origem, URL da origem e Data da coleta**;
- **remove duplicados** e o que já existe no sistema;
- salva o resultado na aba **Revisão**.

> **Importante:** a Pesquisa Automática precisa de **internet** e usa apenas
> fontes abertas e gratuitas. Avaliações/quantidade de avaliações só são
> preenchidas quando existirem publicamente na fonte (o OpenStreetMap
> normalmente não fornece esse dado).

### Modo demonstração (offline)
Para testar todo o fluxo **sem internet**, ative o modo demonstração — ele gera
resultados de **exemplo claramente rotulados** (não reais). Edite
`config/default.json` e defina `"modoDemonstracao": true` (ou inicie com a
variável de ambiente `ET_MODO_DEMO=1`). Lembre-se de desativar depois.

---

## Como exportar

Nas telas **Clientes Fixos** e **Prospectando**, use os botões **Excel**,
**CSV** e **PDF** na barra de ferramentas. O arquivo é gerado e baixado na
hora, com todos os registros da tabela.

- **Excel (.xlsx):** planilha completa.
- **CSV:** separado por `;` e com BOM (abre corretamente no Excel em
  português, com acentuação).
- **PDF:** relatório paginado com as principais colunas.

---

## WhatsApp

Sempre que houver telefone/WhatsApp, aparece o botão **WhatsApp**, que abre a
conversa via `https://wa.me/…`. O número é normalizado automaticamente (o DDI
`55` do Brasil é adicionado quando necessário).

---

## Controle de duplicidade

O sistema **nunca cadastra a mesma empresa duas vezes**. O motor de
deduplicação compara por:

- **Telefone, Site, Instagram e E-mail** (identificadores fortes, normalizados);
- **Nome + Cidade** por **similaridade textual** (Levenshtein + Jaccard),
  apenas quando não há identificador forte — assim **filiais/unidades
  diferentes** (mesmo nome, telefones diferentes) **não** são fundidas por
  engano;
- **hash interno** estável e **normalização** (acentos, caixa, pontuação,
  sufixos societários como LTDA/ME).

A verificação ocorre em **Clientes Fixos, Prospectando e Pesquisas** ao mesmo
tempo. Ao tentar cadastrar um duplicado manualmente, o sistema avisa e permite
confirmar caso você realmente queira prosseguir.

---

## Banco de dados

- **SQLite**, arquivo `database/estacao.db`, criado **automaticamente** na
  primeira execução.
- Usa **índices**, **relacionamentos** (chaves estrangeiras), **triggers**
  (atualização automática de datas) e o modo **WAL** para desempenho.
- Todo acesso usa **prepared statements** (proteção contra SQL Injection).

Principais tabelas: `usuarios`, `sessoes`, `clientes`, `prospeccao`,
`pesquisas`, `pesquisa_resultados`, `nichos`, `historico`, `tentativas_login`.

---

## Backup

- **Backup automático** a cada 24h (configurável), mantendo os últimos 10.
- **Backup manual:** botão **"Backup"** na barra superior, ou `npm run backup`.
- Os arquivos ficam em `database/backups/`.

Para **restaurar**: feche o aplicativo e substitua `database/estacao.db` por um
arquivo de backup (renomeando-o para `estacao.db`).

---

## Atualização

Para atualizar para uma nova versão do projeto:

1. Feche o aplicativo.
2. **Faça um backup** (`database/estacao.db` e a pasta `database/backups/`).
3. Substitua os arquivos do projeto pelos novos **mantendo** a pasta
   `database/` (para preservar seus dados).
4. Execute novamente **`instalar.bat`** (ou `npm install`) para aplicar
   eventuais novas dependências e migrações de schema (o schema é idempotente).

---

## Estrutura do projeto

```
estacao-trabalho/
├── instalar.bat            # Instalador (dois cliques)
├── instalador.bat          # Atalho para instalar.bat
├── iniciar.bat             # Inicia o aplicativo (dois cliques)
├── main.js                 # Processo principal do Electron
├── preload.js              # Bridge segura do Electron
├── server.js               # Servidor Express + API
├── package.json
├── config/                 # Configuração central
│   ├── config.js
│   └── default.json
├── database/               # Banco SQLite, schema, seeds e backups
│   ├── db.js
│   ├── schema.sql
│   ├── seed.js
│   ├── seeds/nichos.js     # Base de 270+ nichos
│   └── backups/
├── routes/                 # Rotas da API (Express)
├── services/               # Regras de negócio (auth, dedupe, pesquisa, ...)
├── middleware/             # Sessão, autenticação, tratamento de erros
├── utils/                  # Utilitários (normalização, similaridade, ...)
├── public/                 # Interface (HTML, CSS, JS)
│   ├── login.html
│   ├── index.html
│   ├── css/styles.css
│   ├── js/                 # api, ui, app e telas (views)
│   └── assets/             # logo e ícones
├── scripts/                # postinstall / setup
├── tests/                  # Suíte de testes automatizados
├── uploads/  temp/  logs/  # Pastas de trabalho (em tempo de execução)
└── README.md
```

---

## Configuração

Ajuste sem alterar o código-fonte, em `config/default.json` (ou crie um
`config/local.json` para sobrescrever). Principais opções:

| Chave | Descrição | Padrão |
|-------|-----------|--------|
| `server.port` | Porta do servidor local | `4599` |
| `session.duracaoDias` | Duração do login persistente | `30` |
| `paginacao.pageSizePadrao` | Itens por página | `50` |
| `pesquisa.maxAbsoluto` | Limite de resultados por pesquisa | `300` |
| `pesquisa.modoDemonstracao` | Dados de exemplo offline | `false` |
| `backup.intervaloHoras` | Intervalo do backup automático | `24` |
| `admin.senhaPadrao` | Senha inicial do admin | `admin123` |

Variáveis de ambiente: `PORT`, `HOST`, `ET_MODO_DEMO`, `ET_DEBUG`.

---

## Segurança

- **Senhas** armazenadas com **scrypt** (crypto nativo do Node) + salt
  aleatório — nunca em texto puro.
- **Sessões** com token aleatório de 256 bits, cookie `HttpOnly` + `SameSite`,
  com expiração e limpeza automática.
- **Rate limiting** de tentativas de login.
- **Prepared statements** em todas as consultas (anti-SQL Injection).
- **Sanitização e validação** de todas as entradas; colunas de ordenação
  restritas a listas permitidas.
- Cabeçalhos de segurança (`X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`).
- Electron com `contextIsolation` ativo e `nodeIntegration` desativado.
- **Registro de auditoria** (Histórico) de todas as operações.

---

## Notas técnicas e substituições

Conforme boas práticas legais e técnicas, algumas escolhas foram feitas para
manter tudo **gratuito, estável e dentro dos termos de uso**:

- **Fonte da Pesquisa Automática — OpenStreetMap em vez do Google Maps.**
  O Google Maps **proíbe** a coleta automatizada/scraping em seus Termos de
  Uso, e sua API oficial (Places) é **paga**. Adotamos o **OpenStreetMap**
  (Nominatim + Overpass API), que é **público, aberto (licença ODbL) e
  gratuito** — a alternativa legal e estável equivalente. Nenhuma proteção de
  terceiros é burlada. A cobertura varia por região e nicho, pois depende dos
  dados colaborativos do OpenStreetMap.
- **Avaliações públicas.** O OpenStreetMap normalmente não expõe nota/qtde de
  avaliações; por isso esses campos podem ficar vazios (são preenchidos apenas
  quando a fonte fornecer o dado publicamente).
- **SheetJS (xlsx).** Usamos a versão publicada no npm (`0.18.5`). Ela possui
  advisories conhecidos (prototype pollution / ReDoS) que afetam o
  **processamento de planilhas maliciosas**. Como o aplicativo é local e
  importa **arquivos do próprio usuário**, o risco prático é baixo; ainda
  assim, mitigamos lendo as planilhas como **matriz por índice de coluna**
  (`header:1`), evitando o vetor de prototype pollution. Importe apenas
  arquivos de fontes confiáveis.

---

## Solução de problemas

- **"Node.js não foi encontrado"** — instale o Node.js LTS
  (<https://nodejs.org/pt-br/download>) e rode `instalar.bat` novamente.
- **A janela não abre** — o `iniciar.bat` cai automaticamente no modo
  navegador; acesse <http://127.0.0.1:4599>.
- **"A porta já está em uso"** — feche outra instância do sistema ou altere
  `server.port` em `config/default.json`.
- **Pesquisa não retorna resultados** — verifique a internet e o nome da
  cidade; alguns nichos têm poucos dados no OpenStreetMap. Use o **modo
  demonstração** para validar o fluxo offline.
- **Falha ao instalar `better-sqlite3`** — atualize o Node.js para a versão
  **LTS** e rode `instalar.bat` novamente (ele baixa binários pré-compilados).

---

## Testes

Suíte de testes automatizados (sem dependências externas), cobrindo
normalização, similaridade, deduplicação, autenticação, importação,
exportação, geração de consultas OSM, mapeamento de resultados e a **API HTTP
de ponta a ponta**:

```bash
npm test
```

---

Feito para funcionar **localmente**, com foco em **produtividade de prospecção**
e **dados sob seu controle**.
