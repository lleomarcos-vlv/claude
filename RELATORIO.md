# Prospecção Ribeirão Preto, lote 04

Data do levantamento: 17/09/2026.

## O que foi entregue

| Arquivo | O que é |
|---|---|
| `painel/index.html` | Seu painel, com os 146 leads novos já dentro da aba **Clientes p/ Ligar (RP)**, filtro por nicho e botão **Importar CSV** |
| `dados/clientes-ligar-ribeirao-preto-NOVOS.csv` | Só os 146 leads novos, no formato que o painel importa |
| `dados/demais-empresas-ribeirao-preto-LIMPO.csv` | Sua base atual de 144 linhas, corrigida |
| `dados/leads-brutos-coletados.tsv` | Coleta crua (nicho, nome, telefone, endereço), para auditoria |
| `scripts/processar.py` | O script que limpa, deduplica e gera os CSVs |

## Leads novos: 146

Todos em Ribeirão Preto, todos com DDD 16, todos com nicho preenchido, nenhum
repetindo empresa que já estava em qualquer uma das três abas do painel. São 136
telefones fixos e 10 celulares (só esses 10 aceitam WhatsApp).

Nichos com mais volume: padaria (8), farmácia (8), embalagens (8), lanchonete (7),
clínica odontológica (5), supermercado (5), veterinária (5), papelaria (5),
restaurante (4), ótica (4). No total, 69 nichos diferentes.

**Origem e limite deste lote.** Os lotes 01 a 03 da sua lista vieram do Google
Places. Este veio de busca em diretórios públicos (Guia Fácil e similares), porque
o ambiente onde rodei não tem acesso ao Google Places nem à API da Casa dos Dados.
A diferença prática: telefone de diretório envelhece mais rápido e a situação
cadastral não é verificada. Por isso cada registro traz "Telefone não confirmado
por ligação" na observação. Espere algo entre 10% e 20% de números desatualizados,
e trate a primeira ligação como a validação.

## Base atual: o que foi corrigido nas 144 linhas

- **41 telefones** normalizados para `(16) 9XXXX-XXXX` / `(16) XXXX-XXXX`. Estavam
  como `16 99241-4323`, `1699160 8566`, `16) 99755-5566`, `16 98801 9040`.
- **83 nichos** preenchidos a partir do nome da empresa (119 linhas estavam sem
  categoria). São dedução, não confirmação: "Panificadora Catedral" virou Padaria.
- **9 duplicatas** encontradas (linhas 76 a 84 repetem as 67 a 75). Elas não foram
  apagadas: os campos que só existiam na segunda cópia foram levados para a
  primeira antes de marcar. Isso recuperou **7 nomes de responsável** (Andreia,
  Inácio, Cristiano Bezerra, Fábio, Bruno, Fatima, Sr. Roberto) e, no caso da
  New Tons Beleza, telefone e CNPJ que estavam faltando na linha original.
- **Cidade** preenchida como Ribeirão Preto onde estava vazia (122 linhas).
- **CNPJ** formatado com pontuação e conferido no dígito verificador.

### Três coisas que precisam de você

1. **37 empresas sem telefone nenhum.** Não dá para ligar para elas: Valmac,
   Açougue Almir Rodrigues, A Toca, Motel A2, Alubri Lux, Vilagem Classe A,
   Pradinho, Menu Autopeças, Grupo Cargo Polo, Martifer, Fava Comida de Verdade,
   Boi Bom, Joiois, Augusta, Fina Gourmet, Piper, Robusti, Sushi Fã, Canomi,
   Porti Horse, City Invictus, Posto CBW, Garar 78, Tom Tintas, Atenas,
   Tapeçaria Chia, Vila Chique, RF Facas, Shopping dos Animais, Eletromontagem,
   Indústria Gráfica, FMX, Vitória, La Vitória, Auto Mecânica, Anchieta Pet Shop,
   Panificadora Progresso 2.
2. **CNPJ da Punch (`357982150001-18`) não fecha no dígito verificador** e o
   telefone cadastrado é `(34) 3224-4444`, DDD de Uberlândia. Vale reconferir se
   é a unidade certa.
3. **Copert está com `(19) 2106-7700`**, DDD de Campinas. É a matriz da Koppert;
   se o alvo é a unidade de Ribeirão, o número é outro.

## O que mudou no painel

O painel só exportava CSV, não importava. Agora tem:

- **Importar CSV** ao lado de Baixar CSV. Importa para a aba aberta, aceita o
  mesmo formato que o próprio painel exporta, ignora linhas já existentes (por
  nome ou por telefone) e pula as marcadas como DUPLICADO. Importar o mesmo
  arquivo duas vezes não cria nada repetido.
- **Filtro por nicho** na barra de ferramentas, montado com os nichos da aba
  aberta. É o que permite ligar em lote: escolher "Padaria" e trabalhar as 8.
- **Nicho e telefone visíveis na linha**, sem precisar abrir o detalhe.
- A busca passou a enxergar nicho e cidade, além de nome, CNPJ e telefone.

## Como continuar sozinho

A aba **Leads Casa dos Dados** já existe no seu painel e faz exatamente este
trabalho com dado de fonte melhor: busca por município e CNAE, filtra por situação
cadastral ativa, traz CNPJ e telefone. Ela só precisa da chave em
`portal.casadosdados.com.br/plataforma/api/chave`. Com a chave configurada, o
caminho de cada lote novo passa a ser: buscar por CNAE, mandar para a aba, e o
painel deduplica. Este lote 04 foi feito por fora porque o ambiente não alcança
essa API, não porque o caminho não exista.

## Lote 05 (segunda rodada)

Mais 86 empresas, em nichos que a primeira varredura não tinha coberto:
refrigeração comercial (6), distribuidora de gás (6), clínica médica (6),
açougue (5), motos e moto peças (5), auto elétrica (4), tapeçaria e persianas (3),
distribuidoras (3), materiais de construção (3), segurança eletrônica (3),
extintores e EPI, ferragens e parafusos, gesso, pisos, joalheria, locadora,
academia, churrascaria, hospital e outros. São 43 nichos no total, 81 fixos e
5 celulares.

Arquivo: `dados/clientes-ligar-ribeirao-preto-LOTE05.csv`.

Três empresas coletadas nesta rodada foram descartadas porque já estavam na sua
lista com o mesmo telefone: Casa de Carnes Primeiro de Maio, Carnes Almir
Rodrigues e Casa do Açougueiro. Isso é um bom sinal: a busca pública bateu com o
que o Google Places já tinha te dado.

Dois registros levam aviso na observação. **Kim Moto Peças** aparece com telefone
diferente do "Kim Moto Peça" que você já tem, então confirme se é a mesma antes
de ligar. **Mialich Supermercados** é outra unidade (Ipiranga), já que a Loja 07
está na sua lista.

Rendimento por rodada: os nichos de comércio de rua estão ficando saturados. A
primeira varredura rendeu 146 leads, esta rendeu 86 com mais buscas. A próxima
tende a render menos ainda por esse caminho, o que reforça configurar a chave da
Casa dos Dados no painel para buscar por CNAE.

## Lote 06 (terceira rodada)

Mais 37 empresas, nenhuma repetindo o que já existe: telecomunicações e provedores
de internet (4), farmácia (3), perfumaria e cosméticos (2), odontologia e prótese
dentária (5 no conjunto), reciclagem e ferro velho (3), livraria e papelaria (4),
móveis para escritório, despachante, funilaria, máquinas agrícolas, instalações
elétricas e outros.

Arquivo: `dados/clientes-ligar-ribeirao-preto-LOTE06.csv`.
Os três lotes juntos estão em `dados/clientes-ligar-ribeirao-preto-TODOS.csv`
(269 empresas). Importar o consolidado é seguro mesmo depois de já ter importado
os lotes separados, porque o importador ignora quem já está na lista.

A curva de rendimento por rodada: 146, depois 86, agora 37, com um número parecido
de buscas em cada uma. Os diretórios públicos de Ribeirão Preto estão no fim para
este tipo de varredura. Uma quarta rodada por aqui renderia poucas dezenas e cada
vez mais empresa de porte pequeno sem cadastro atualizado.
