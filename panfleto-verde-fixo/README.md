# Panfleto Verde Fixo

Panfleto A4 frente e verso da **Verde Fixo** — plataforma de agendamento de jardinagem,
em Ribeirão Preto — SP.

## Arquivos

| Arquivo | Para que serve |
| --- | --- |
| `verde-fixo-panfleto-a4.pdf` | Versão final A4 (210 × 297 mm). Use para imprimir em casa/escritório ou enviar por WhatsApp e e-mail. |
| `verde-fixo-panfleto-a4-sangria.pdf` | Mesma arte com 3 mm de sangria (216 × 303 mm). **É esta que você manda para a gráfica.** |
| `panfleto.html` | O arquivo-fonte do layout. É onde se edita texto, cor e serviços. |
| `build.py` | Script que gera os QR Codes e os dois PDFs. |
| `assets/qr-site.svg` | QR Code de `https://www.verdefixo.com` (aparece na frente). |
| `assets/qr-whatsapp.svg` | QR Code de `https://wa.me/5511926857062` (aparece no verso). |

## O que tem no panfleto

**Frente** — chamada principal, selo "Chegou em Ribeirão Preto — SP", como funciona em
3 passos, os 6 serviços e o bloco de contato com telefone, WhatsApp, site e QR Code.

**Verso** — "Por que a Verde Fixo?" com 6 diferenciais, para quem a empresa atende,
opções de frequência (avulso / quinzenal / mensal) e o bloco final de contato com
QR Code do WhatsApp.

## Gerar os PDFs de novo

```bash
python3 build.py
```

Requisitos: Python 3, a biblioteca `qrcode` (`pip install qrcode`) e o Chromium
(o script procura sozinho em `/opt/pw-browsers` e no PATH).

## Como editar

Abra `panfleto.html` em qualquer navegador para ver o resultado antes de gerar o PDF.

- **Telefone, site e textos**: estão direto no HTML, em português, fáceis de achar.
- **Cores**: ficam agrupadas no bloco `:root`, no topo do `<style>`.
- **Serviços**: cada item é um bloco `<div class="svc">` na seção "O que a gente faz".
- **Se mudar o telefone ou o site**: altere também `SITE_URL` / `WHATSAPP_URL` no
  `build.py` e rode o script de novo, para os QR Codes acompanharem.

## Instruções para a gráfica

- Formato final (corte): **A4, 210 × 297 mm**
- Arquivo a enviar: `verde-fixo-panfleto-a4-sangria.pdf` — 216 × 303 mm, já com
  **3 mm de sangria** em cada lado
- **Frente e verso**, colorido
- Sugestão de papel: couché brilho 115 g ou 150 g
- Todos os textos estão a 13 mm da linha de corte, dentro da área de segurança

## Observações sobre o conteúdo

Alguns textos foram escritos com base na descrição do negócio e podem ser ajustados
antes de imprimir em volume:

- A lista de serviços (corte de grama, poda, limpeza de canteiros, roçada e capina,
  adubação e plantio, retirada de resíduos) é a de uma operação de jardinagem típica —
  vale conferir se bate exatamente com o que a plataforma oferece hoje.
- As frequências (avulso, quinzenal e mensal) aparecem **sem preço**, de propósito.
- Não há promessas de prazo, garantia, avaliação de profissionais nem número de
  clientes — nada que não tenha sido confirmado foi afirmado na peça.
