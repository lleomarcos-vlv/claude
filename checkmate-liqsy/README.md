# Portfólio Checkmate + Liqsy

Apresentação comercial do representante Felipe para bares, cafeterias, restaurantes e lanchonetes, feita a partir dos catálogos oficiais Checkmate e Liqsy (marcas Baldo) e das fichas técnicas de drinks de Antonio Marcos Monteiro (O Homem Drink).

## Entregas (`entregas/`)

| Arquivo | Uso |
|---|---|
| `Checkmate-Liqsy-Portfolio.pdf` | Versão em alta qualidade, com links clicáveis para o WhatsApp |
| `Checkmate-Liqsy-Portfolio-leve.pdf` | Versão leve para envio pelo WhatsApp (mesmos links) |
| `Checkmate-Liqsy-Portfolio-editavel.pptx` | Versão editável (PowerPoint, Google Slides ou Keynote) |
| `paginas-para-whatsapp/` | Cada página como imagem JPG |
| `Fichas-Tecnicas-Drinks.pdf` | Fichas técnicas completas, para enviar depois do primeiro interesse |
| `mensagem-para-whatsapp.txt` | Textos sugeridos para o envio e o acompanhamento |
| `fontes-para-o-pptx/` | Barlow, Barlow Condensed e Playfair Display (licença OFL). Instale antes de editar no PowerPoint; no Google Slides elas já existem |

## Gerar novamente

`fonte/build.py` define as 9 páginas; os números das fichas vêm de `fonte/fichas.json` (extraído do PDF das fichas e conferido: somas, operação de 12%, lucro, percentual e markup). O motor de renderização é compartilhado em `../motor/`.

```bash
pip install python-pptx pillow segno pypdf
python3 fonte/build.py
```

Requer Chromium (para o PDF) e `pdftoppm` (para os JPGs).
