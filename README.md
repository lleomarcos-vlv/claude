# Prospectar

Dashboard de prospecção B2B e inteligência de empresas — HTML5, CSS3 e JavaScript puro.
Sem backend e sem build: basta abrir `index.html` no navegador.

```
index.html        estrutura da interface
style.css         tema SaaS corporativo (claro, responsivo, com regras de impressão)
geodata.js        contornos geográficos reais em SVG (gerado, não editar à mão)
script.js         dados simulados, filtros, agregações, mapa, gráficos e exportações
prospectar.html   versão única autocontida (CSS + geodata + JS embutidos)
```

Para usar em um único arquivo, abra `prospectar.html`. Para trabalhar no código, use
`index.html` com os arquivos separados — os dois têm exatamente as mesmas funcionalidades.

## Recursos

- **Filtros laterais colapsáveis**: Região e Estados, Setor (Setores, CNAE Primário, CNAE
  Secundário, NCM, Palavras-chave), Porte, Decisores e Colaboradores, Cadastrais e
  tributários, Saúde financeira e Presença digital. Todos com busca, multisseleção,
  contadores ao vivo, sliders de faixa e botão *Limpar Filtros*.
- **Cards dinâmicos** de Empresas e Faturamento Anual, recalculados a cada filtro.
- **Abas**: Região e Setor (mapa do Brasil em SVG + Top Cidades + gráfico por setor),
  Porte, Decisores e Colaboradores, Cadastrais/Legais/tributários, Saúde financeira e
  Presença digital — todas com gráficos Chart.js.
- **Mapa da América do Sul em SVG**, com contornos geográficos reais e sem API key: os 27
  estados brasileiros preenchidos em escala de azuis por concentração, países vizinhos como
  contexto, contorno nacional destacado, rótulos com linha-guia para os estados pequenos,
  tooltip com empresas e faturamento, clique para filtrar e legenda vertical.
- **Tabelas** de cidades e empresas com ordenação, busca e paginação.
- **Exportação CSV** (separador `;` e BOM, abre direto no Excel) de qualquer painel,
  cópia para a área de transferência, impressão (`window.print()`) e resumo de mercado.
- **Rodapé de atalhos** — setores, estados, seções CNAE, empresas mais buscadas e
  ferramentas — todos aplicam filtros reais ou navegam pela aplicação.
- **Responsivo**, com sidebar off-canvas no mobile.

## Como os números funcionam

A base nacional (23.702.546 empresas / R$ 152 trilhões) é representada por uma **amostra
ponderada** de ~1.560 registros gerados por um PRNG com semente fixa (resultado idêntico a
cada carregamento). Cada registro carrega um peso `w` — quantas empresas reais ele
representa — e a amostra é **estratificada por município e por porte**, de modo que:

- sem filtros, as somas ponderadas batem exatamente com os totais nacionais;
- o ranking de cidades reproduz os números de referência (São Paulo 2.248.955, Rio de
  Janeiro 912.008, …);
- todos os painéis leem da mesma amostra filtrada, então mapa, tabelas, gráficos e cards
  nunca se contradizem.

Os dados são **simulados**: nenhuma informação real de empresas é utilizada.

## Dependências (CDN)

Chart.js 4.4.1 e Font Awesome 6.5.1, carregados via `cdnjs.cloudflare.com`. Se o CDN
estiver indisponível, a interface continua funcionando e os gráficos exibem um aviso no
lugar do canvas.

## Dados geográficos

`geodata.js` é gerado offline e contém apenas os `path` já projetados (Mercator, viewBox
400x470), então não há Leaflet, tiles nem chaves de API — o mapa é SVG puro:

- **Estados do Brasil**: malha do IBGE (via `geodata-br-states`), simplificada com
  `topojson-simplify` preservando as fronteiras compartilhadas, de modo que estados vizinhos
  continuam encaixados sem frestas.
- **América do Sul**: Natural Earth 1:50m (domínio público, via `world-atlas`), com 14 países
  vizinhos — incluindo a Guiana Francesa, recortada da geometria da França.
- **Contorno nacional**: união topológica dos 27 estados.
