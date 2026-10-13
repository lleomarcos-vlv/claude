# Apresentação institucional JP Alumínios

Material comercial para envio pelo WhatsApp, feito a partir do catálogo oficial da empresa.

## Entregas (`entregas/`)

| Arquivo | Uso |
|---|---|
| `JP-Aluminios-Apresentacao.pdf` | Versão em alta qualidade, com links clicáveis para o WhatsApp do Felipe |
| `JP-Aluminios-Apresentacao-leve.pdf` | Versão leve para envio pelo WhatsApp (mesmos links) |
| `JP-Aluminios-Apresentacao-editavel.pptx` | Versão editável (PowerPoint, Google Slides ou Keynote) |
| `paginas-para-whatsapp/` | Cada página como imagem JPG, para enviar direto na conversa |
| `mensagem-para-whatsapp.txt` | Textos sugeridos para acompanhar o envio |
| `fontes-para-o-pptx/` | Fontes Barlow e Barlow Condensed (licença OFL). Instale antes de editar o PPTX no PowerPoint; no Google Slides elas já existem |

## Gerar novamente

O arquivo `fonte/build.py` define as páginas e usa o motor compartilhado em `../motor/` para gerar todas as versões.
Para gerar uma versão para outro vendedor, altere `CONTATO_NOME`, `CONTATO_TEL` e `WA` no topo do script e rode:

```bash
pip install python-pptx pillow segno pypdf
python3 fonte/build.py
```

Requer Chromium (para o PDF) e `pdftoppm` (para os JPGs).
