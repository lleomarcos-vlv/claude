# Apresentação — Monitoramento Aéreo Industrial

Material comercial de 3 páginas (A4) para prospecção de indústrias.
Entregável final: **`Monitoramento-Aereo-Industrial.pdf`**

## Estrutura

| Página | Conteúdo |
|---|---|
| 1 | Capa — headline de impacto, promessa e 3 provas rápidas |
| 2 | Dor × Solução — 5 pares lado a lado + faixa de custo de oportunidade |
| 3 | Onde atuamos, tecnologia embarcada, economia/sustentabilidade e CTA |

## O que falta preencher

Dois campos ficaram em branco de propósito, na caixa de CTA da página 3:

- **Telefone / WhatsApp**
- **E-mail**

E, opcionalmente, o slot `[ sua logo aqui ]` no topo da capa.

Para preencher, edite `apresentacao.html`:

- telefone → busque `class="v">(` (dentro do bloco `.contact`)
- e-mail → a `.cbox` seguinte, com o rótulo `E-mail`
- logo → substitua a `div.logo-slot` por `<img src="logo.png" style="height:12mm">`

## Regerar o PDF

```bash
npm install            # apenas na primeira vez
node build.js          # gera Monitoramento-Aereo-Industrial.pdf
node shot.js           # opcional: PNG de cada página, para conferência
```

O build usa o Chromium do ambiente (`executablePath` em `build.js`); ajuste esse
caminho se rodar em outra máquina.

## Arquivos

- `apresentacao.html` — fonte único do documento (layout, texto e ícones SVG inline)
- `fonts.css` — Inter e Barlow Condensed embutidas em base64 (documento não depende de rede)
- `build.js` — HTML → PDF
- `shot.js` — HTML → PNG por página

## Nota sobre as afirmações

O texto usa apenas afirmações estruturais do método (sem parada de produção, sem
trabalho em altura, cobertura total do ativo, relatório georreferenciado). Não há
percentual de economia declarado. Se for incluir número de ROI ou "% de redução de
custo", use dados dos seus próprios casos e cite a fonte no rodapé.
