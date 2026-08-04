# Fortis Data — PDF de captação

Material de captação de clientes para a Fortis Data (remoção de dados pessoais
da internet com fundamento na LGPD). 7 páginas, A4, para envio digital ou impressão.

| Arquivo | O que é |
| --- | --- |
| `fortis-data.html` | Arquivo-fonte. É aqui que se edita o conteúdo. |
| `fortis-data.pdf` | PDF gerado a partir do HTML. |

## Estrutura

1. **Capa** — headline de impacto + telefone
2. **O tamanho da exposição** — o que está público e de onde veio
3. **O que fazem com isso** — riscos, em colunas separadas para pessoa física e jurídica
4. **A lei está do seu lado** — LGPD, Constituição e Marco Civil
5. **O método Fortis** — as 5 etapas do serviço
6. **Perguntas frequentes** — quebra das objeções mais comuns
7. **Chamada final** — telefone em destaque e o que acontece na ligação

## Como editar

Abra `fortis-data.html` em qualquer editor de texto. O conteúdo está em português,
em HTML simples, com as cores da marca definidas no bloco `:root` do CSS:

```css
--ink:  #0A1226;  /* azul-marinho de fundo */
--gold: #C8A45C;  /* dourado dos destaques */
```

Para trocar o telefone, substitua todas as ocorrências de `(11) 92157-1498`.

## Como gerar o PDF novamente

Depois de editar o HTML, rode:

```bash
chromium --headless --disable-gpu --no-sandbox \
  --run-all-compositor-stages-before-draw --virtual-time-budget=6000 \
  --no-pdf-header-footer \
  --print-to-pdf=fortis-data.pdf fortis-data.html
```

As fontes usadas são **Inter** e **Manrope** (Google Fonts, licença SIL OFL).
Se não estiverem instaladas no sistema, o navegador cai para Liberation Sans e o
layout muda um pouco. Para instalá-las no Linux, baixe os `.ttf` para
`~/.local/share/fonts` e rode `fc-cache -f`.
