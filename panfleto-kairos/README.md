# Torrefação Kairós MF — panfleto e peças de Instagram

Panfleto A5 frente e verso, mais carrossel de feed e story, chamando o cliente
para encomendar o café personalizado.

## Arquivos

### Impresso

| Arquivo | Para quê |
| --- | --- |
| `panfleto-kairos.pdf` | **Levar na gráfica.** Duas páginas A5 (148 × 210 mm), frente e verso, na ordem certa. |
| `panfleto-frente.png` · `panfleto-verso.png` | Mandar no WhatsApp, imprimir em casa. 2240 × 3180 px (384 dpi em A5). |
| `panfleto-kairos.html` | O arquivo-fonte do panfleto. Abre em qualquer navegador; é onde se edita o texto. |

### Instagram

| Arquivo | Para quê |
| --- | --- |
| `ig-feed-1.png` · `ig-feed-2.png` | Carrossel de feed, 1080 × 1080. O card 1 é a provocação, o card 2 é o "monte o seu" com QR. |
| `ig-story.png` | Story, 1080 × 1920, com as margens de segurança já respeitadas (nada importante embaixo do nome de usuário nem em cima da barra de resposta). |
| `social-kairos.html` | O arquivo-fonte das três peças. |

## Contatos

Já estão preenchidos em todas as peças:

```
WhatsApp    (16) 99101-9797
Instagram   @cafeinadomisterioso
E-mail      curadorbebidas@gmail.com
```

**Falta a região de entrega** — não entrou em nenhuma peça. Se quiser incluir
("entregamos em Ribeirão Preto e região", por exemplo), é só dizer.

## O QR code

O QR do verso e das peças de Instagram abre a conversa no WhatsApp
(`wa.me/5516991019797`). Ele **não é uma imagem colada**: é desenhado pelo
próprio HTML a partir do número. Para trocar o número, mude só o
`data-whatsapp` e o texto ao lado:

```html
<dd data-whatsapp="5516991019797">(16) 99101-9797</dd>
```

O QR se refaz sozinho ao abrir o arquivo — não tem como ficar apontando para um
número velho. O formato é `55` + DDD + número, sem espaços nem traços.

Ele foi testado de verdade: as matrizes conferem módulo a módulo com uma
biblioteca de referência, e a imagem exportada foi lida de volta por um
decodificador, inclusive reduzida a 1/3 do tamanho.

## Para imprimir

Abra `panfleto-kairos.html` no navegador e mande imprimir (Ctrl+P / Cmd+P) com
**"imprimir cores e imagens de fundo" ligado**. Sai em A5, uma página por
folha. Ou entregue o PDF direto na gráfica.

O verso tem uma faixa preta que vai até a borda. Na gráfica, peça **3 mm de
sangria** — sem isso pode sobrar uma listra branca na beirada. Imprimindo em
casa, o mais simples é mandar em A4 e cortar.

## Conferir antes de rodar a tiragem

Escrevi supondo o que a torrefação oferece. Vale conferir no verso:

- as opções de moagem (grão inteiro, coado, V60, prensa francesa, aeropress, italiana, espresso);
- os tamanhos (250 g, 500 g, 1 kg);
- os mimos (rótulo personalizado, embalagem de presente, cartão à mão, assinatura mensal).

## Como as peças foram construídas

*Kairós*, em grego, é o momento exato de agir — o oposto de *chronos*, o tempo
que só passa. Para quem torra café, esse momento é literal: a torra inteira se
decide no segundo em que os grãos saem do tambor. A frente do panfleto é essa
ideia — uma curva de torra real, da carga ao *drop*, com o ponto final marcado
como **kairós**. O verso transforma isso em pedido: quatro decisões que o
cliente toma para o café ser dele.

- **Cores** — carvão (`#141010`) do interior do tambor, verde do grão cru
  (`#A9B77F`) e o laranja da brasa (`#F0913A`) no ponto do *drop*. O laranja
  aparece pouco, sempre onde é para agir.
- **Tipografia** — Bricolage Grotesque nos títulos, Newsreader no texto
  corrido, DM Mono nas etiquetas e nos dados. As fontes estão embutidas nos
  próprios HTMLs, então os arquivos funcionam offline, em qualquer computador,
  sem instalar nada.
- **Medidas** — tudo dentro de cada peça é medido em `cqw`, proporcional à
  largura dela. As peças escalam inteiras, sem quebrar, em qualquer tamanho.
