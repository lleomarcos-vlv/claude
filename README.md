# Prospectar

Dashboard de prospecção B2B e inteligência de empresas — HTML5, CSS3 e JavaScript puro.
Sem backend e sem build: basta abrir `index.html` no navegador.

```
index.html   estrutura da interface
style.css    tema SaaS corporativo (claro, responsivo, com regras de impressão)
script.js    dados simulados, filtros, agregações, mapa, gráficos e exportações
```

## Recursos

- **Filtros laterais colapsáveis**: Região e Estados, Setor (Setores, CNAE Primário, CNAE
  Secundário, NCM, Palavras-chave), Porte, Decisores e Colaboradores, Cadastrais e
  tributários, Saúde financeira e Presença digital. Todos com busca, multisseleção,
  contadores ao vivo, sliders de faixa e botão *Limpar Filtros*.
- **Cards dinâmicos** de Empresas e Faturamento Anual, recalculados a cada filtro.
- **Abas**: Região e Setor (mapa do Brasil em SVG + Top Cidades + gráfico por setor),
  Porte, Decisores e Colaboradores, Cadastrais/Legais/tributários, Saúde financeira e
  Presença digital — todas com gráficos Chart.js.
- **Mapa por estado em SVG**, sem API key: escala de azuis por concentração, tooltip com
  empresas e faturamento, clique para filtrar, legenda vertical.
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

O mapa é SVG próprio (grid cartogram dos 27 estados, posicionados conforme a geografia
real), o que dispensa Leaflet, tiles e chaves de API e mantém tudo offline.
