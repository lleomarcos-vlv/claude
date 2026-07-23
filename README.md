# Estação de Trabalho — versão HTML único

Aplicação completa de **prospecção comercial** empacotada em **um único arquivo
HTML** que funciona **offline** e **memoriza todos os dados no próprio navegador**
(via `localStorage`). Basta abrir o arquivo — não precisa instalar nada, não
precisa de servidor, Node, banco de dados nem internet (exceto para a Pesquisa
Automática, que é opcional).

> Esta é a conversão do projeto original (Node + Express + SQLite + Electron)
> para um **único `.html` autossuficiente**. Toda a lógica que ficava no
> servidor foi reescrita para rodar no navegador.

## Como usar

1. Abra **`estacao-trabalho.html`** com duplo clique (Chrome, Edge, Firefox…).
2. Faça login com **`admin` / `admin123`** (altere a senha depois, no menu lateral).
3. Pronto. Cadastre clientes, faça prospecção, importe planilhas etc.

Os dados ficam salvos **neste navegador, neste computador**. Ao fechar e reabrir
o arquivo, tudo continua lá.

## Funcionalidades

- **Dashboard** com indicadores e atalhos.
- **Clientes Fixos** — cadastro, edição, exclusão, busca, ordenação, paginação e WhatsApp.
- **Prospectando** — funil com status, probabilidade de fechamento, filtros e “mover para Clientes”.
- **Pesquisa Automática** — coleta empresas em fontes públicas e gratuitas
  (OpenStreetMap: Nominatim + Overpass). Requer internet; há um **Modo
  demonstração** para testar offline. Em **⚙ Servidores** você pode **adicionar
  seus próprios servidores e uma chave de API** (ver abaixo).
- **Revisão** — revisar, mover em lote para prospecção, descartar ou excluir resultados.
- **Nichos** — base pesquisável com **272 nichos** prontos, organizados por categoria.
- **Histórico** — auditoria de logins, importações, exclusões, alterações e pesquisas.
- **Controle de duplicidade** — nunca cadastra a mesma empresa duas vezes
  (compara telefone, site, instagram, e-mail e nome+cidade por similaridade).

### Importar e exportar planilhas — **dentro do próprio HTML**

- **Importar Excel (`.xlsx`) e CSV**: em *Clientes Fixos* ou *Prospectando* clique
  em **Importar**, escolha o arquivo e o sistema lê os dados, **detecta as
  colunas automaticamente** (Nome, Telefone, Cidade, E-mail, Instagram, Site,
  Nicho, Observações… com dezenas de sinônimos em português), ignora duplicados
  e mostra um resumo. O leitor de `.xlsx` é **100% embutido e offline** (não usa
  nenhuma biblioteca externa nem internet).
- **Exportar**: botões **Excel**, **CSV** e **PDF** geram o arquivo na hora.
  O Excel é um `.xlsx` real; o PDF usa a janela de impressão (escolha
  “Salvar como PDF”).

### Servidores de pesquisa (com chave de API)

Na tela **Pesquisa Automática**, o botão **⚙ Servidores** abre um gerenciador onde você pode:

- **Geocodificação** (encontrar a cidade): além do OpenStreetMap padrão, adicionar
  serviços **compatíveis com Nominatim** — inclui um atalho para o **LocationIQ**
  (mais estável, com limites maiores), bastando colar sua **API key**.
- **Overpass** (buscar as empresas): já vêm **3 servidores públicos globais**
  (overpass-api.de, kumi.systems, private.coffee). Você pode adicionar outros
  (públicos ou privados) e, se o seu exigir, uma **chave de API**.

Cada servidor pode ser **ativado/desativado**, **testado** (botão *Testar*),
**editado** ou **removido**. A pesquisa tenta os servidores **ativos na ordem**,
de cima para baixo, até um responder — então adicionar mais servidores aumenta a
taxa de sucesso. Tudo fica salvo no navegador.

> Como a chave é enviada: para cada servidor você informa o **parâmetro** (ex.:
> `key` no LocationIQ, ou `token` num Overpass privado) e a **chave**; o sistema
> anexa `&parâmetro=chave` à URL da requisição.

### Backup e restauração

O botão **Backup** (topo) baixa um arquivo `.json` com **todos os seus dados** e
permite **restaurar** a partir dele — útil para guardar cópias ou levar os dados
para outro computador/navegador.

## Onde os dados ficam guardados

No `localStorage` do navegador, na chave `estacaoTrabalhoDB_v1`. Isso significa:

- Os dados **não saem** do seu computador.
- São específicos por navegador/perfil (Chrome e Firefox não compartilham).
- Limpar os “dados de navegação/site” apaga também estes dados — por isso,
  use o **Backup** regularmente.

## Estrutura do repositório

```
estacao-trabalho.html     ← o aplicativo (arquivo único — é só isto que você precisa)
src/                      ← fontes usadas para gerar o HTML (para manutenção)
  sheetlib.js               leitura/escrita de .xlsx e .csv, 100% em JS (unzip+inflate+zip)
  app-core.js               dados (localStorage), dedupe, pesquisa OSM, serviços, API local
  app-ui.js                 interface, telas, controlador, login
  styles.css                estilos (tema escuro)
  nichos.json               base de 272 nichos
  build.js                  monta o estacao-trabalho.html a partir das fontes
  test_sheetlib.js          testes da biblioteca de planilhas
```

## Regerar o HTML (opcional)

Se editar as fontes em `src/`, gere novamente o arquivo único com:

```bash
node src/build.js
```

E rode os testes da biblioteca de planilhas com:

```bash
node src/test_sheetlib.js
```
