# Panfleto — Torrefação Kairós MF

Panfleto frente e verso, A5 (148 × 210 mm), chamando o cliente para entrar em
contato e encomendar o café personalizado.

## Arquivos

| Arquivo | Para quê |
| --- | --- |
| `panfleto-kairos.pdf` | **Levar na gráfica.** Duas páginas A5, frente e verso, na ordem certa. |
| `panfleto-frente.png` · `panfleto-verso.png` | Mandar no WhatsApp, postar no Instagram, imprimir em casa. 2240 × 3180 px (384 dpi em A5). |
| `panfleto-kairos.html` | O arquivo-fonte. Abre em qualquer navegador, é onde se edita o texto. |

## Antes de imprimir: preencher os contatos

Os quatro contatos estão em **laranja e sublinhados de pontinhos** no fim do
verso — é o único lugar do panfleto com informação de exemplo:

```
WHATSAPP    (00) 00000-0000
INSTAGRAM   @torrefacaokairosmf
E-MAIL      contato@kairosmf.com.br
ENTREGAS    sua cidade e região
```

Para trocar: abra `panfleto-kairos.html` em um editor de texto, procure por
`PREENCHER` e substitua os valores dentro de `<span data-preencher>`.
Depois de preencher, apague a palavra `data-preencher` de cada linha para o
laranja e o pontilhado sumirem.

Vale conferir também, no verso: as opções de moagem, os tamanhos (250 g / 500 g
/ 1 kg) e os mimos oferecidos — estão escritos como suposição do que a
torrefação faz.

## Para imprimir

Abra `panfleto-kairos.html` no navegador e mande imprimir (Ctrl+P / Cmd+P),
com **"imprimir cores e imagens de fundo" ligado**. Sai em A5, uma página por
folha. Ou entregue o PDF direto na gráfica.

O verso tem uma faixa preta que vai até a borda. Se for imprimir em gráfica,
peça **3 mm de sangria** — sem isso pode sobrar uma listra branca na beirada.
Imprimindo em casa, o mais simples é mandar em A4 e cortar.

## Como o panfleto foi construído

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
  corrido, DM Mono nas etiquetas e nos dados. As fontes estão embutidas no
  próprio HTML, então o arquivo funciona offline e em qualquer computador.
- **Medidas** — tudo dentro da folha é medido em `cqw`, proporcional à
  largura da página. O panfleto escala inteiro, sem quebrar, de A6 a A3.
