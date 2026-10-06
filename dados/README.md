# Base de prospecção — Cafeterias, Bares, Restaurantes, Padarias e Panificadoras (Ribeirão Preto e região)

Dados coletados em 2026-10-06 para uso em prospecção comercial B2B. Formato: CSV (`estabelecimentos_ribeirao_preto_regiao.csv`, delimitador `;`) e JSON (`estabelecimentos_ribeirao_preto_regiao.json`), mesmo conteúdo nos dois formatos.

## Colunas

| Coluna | Descrição |
|---|---|
| nome | Nome do estabelecimento (ou razão social/nome do responsável, quando foi o único dado encontrado) |
| categoria | Cafeteria, Bar, Restaurante, Padaria ou Panificadora |
| segmento | Observação específica (ex.: "churrascaria", "padaria artesanal"), quando a fonte trazia esse detalhe. Vazio quando não informado |
| cidade | Município |
| endereco | Rua, número e bairro, quando confirmados. "não encontrado" ou parcial quando a fonte não trazia o dado completo |
| telefone | Com DDD. "não encontrado" quando nenhuma fonte confirmou um número |
| fonte_url | Página onde o dado foi confirmado — use para revalidar antes de contato |
| data_coleta | Data da coleta (2026-10-06) |

## Cobertura e números

| Cidade | Estabelecimentos |
|---|---|
| Ribeirão Preto | 66 |
| Sertãozinho | 47 |
| Jaboticabal | 24 |
| Cravinhos | 14 |
| Serrana | 12 |
| Guatapará | 7 |
| Jardinópolis | 0 — não pesquisado |
| Dumont | 0 — não pesquisado |

Por categoria: Restaurante 58, Bar 50, Padaria 34, Cafeteria 19, Panificadora 9. Total: 170 linhas (169 estabelecimentos únicos; um deles, em Guatapará, aparece em duas linhas porque funciona simultaneamente como bar e restaurante no mesmo endereço).

## Metodologia

Pesquisa feita via busca na web, cruzando diretórios comerciais (guiatelefone.com, guiafacil.com, apontador.com.br, solutudo.com.br, telelistas.net, benditoguia.com.br, listamais.com.br), TripAdvisor, imprensa/blogs locais (ex. CNN Viagem e Gastronomia, Perfect Daily Grind) e sites oficiais de turismo municipal. Cada linha tem a URL exata onde o dado foi confirmado.

Regra seguida à risca: nenhum nome, telefone ou endereço foi inventado. Quando um dado não pôde ser confirmado, o campo ficou como "não encontrado" em vez de uma suposição. Candidatos com indícios de serem ruído (telefones em padrão redondo suspeito, nomes homônimos de outro município, estabelecimentos marcados como fechados pela própria fonte) foram descartados deliberadamente.

## Limitações conhecidas (leia antes de usar para contato)

1. **Não é um censo completo.** "Todos os estabelecimentos" de uma região inteira não é algo verificável por busca; isto é uma base ampla e sourceada, não uma lista exaustiva. Há certamente estabelecimentos reais, principalmente informais ou sem presença on-line, que não aparecem aqui.
2. **Jardinópolis e Dumont ficaram zerados.** Não é porque não existam estabelecimentos nessas cidades — é porque o orçamento de busca da sessão (compartilhado entre as seis pesquisas feitas em paralelo) se esgotou antes de cobri-las. Dumont também sofreu com ruído de busca (muitos resultados eram sobre a Avenida Santos Dumont em São Paulo capital, não o município).
3. **Acesso a página de origem foi bloqueado.** A política de rede deste ambiente bloqueou a ferramenta de abrir páginas diretamente (WebFetch) para praticamente todo domínio de terceiro. Toda a coleta veio dos resumos que a busca retornou sobre essas páginas, sem confirmação adicional abrindo a página original — por isso telefone e número de endereço ficam "não encontrado" com mais frequência do que seria o caso com acesso direto.
4. **Validar antes de usar em campanha.** Dados comerciais mudam (empresa fecha, troca de telefone, muda de endereço). Antes de uma campanha de ligações ou visitas, especialmente nas linhas com "não encontrado" ou com observação de divergência entre fontes, recomendo confirmar por telefone ou Google Maps.
5. **Categorias "Cafeteria" e "Panificadora" ficaram mais fracas** em várias cidades menores — não necessariamente por escassez real, mas porque eram as últimas categorias pesquisadas quando o orçamento de busca esgotou.

## Para continuar o levantamento

Esta base pode ser ampliada numa nova rodada (orçamento de busca é por sessão/turno, então uma nova mensagem libera mais buscas): completar Jardinópolis e Dumont do zero, reforçar Cafeteria/Panificadora nas cidades menores, e confirmar telefone/endereço das linhas marcadas "não encontrado".
