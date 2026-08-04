# Folheto para lojas — Kairós MF Aplicativos Personalizados

Material impresso A4 frente e verso para entregar em lojas durante a prospecção.

- **Frente:** headline + checklist de dores que o lojista marca ali mesmo, no balcão.
- **Verso:** como funciona, o que dá para resolver, comparativo com sistema pronto
  e a chamada final para o diagnóstico gratuito, com QR code do WhatsApp.

Não cita preço. A conversa sobre valor fica para a visita.

---

## Antes de imprimir: preencha os contatos

Abra `config.json` e troque tudo que começa com `PREENCHER`:

| Campo | O que é |
|---|---|
| `whatsapp` | Como o número aparece impresso, ex. `(16) 99123-4567` |
| `whatsapp_numero_internacional` | Só dígitos, com 55 na frente, ex. `5516991234567` — é o que gera o QR code |
| `whatsapp_mensagem` | Texto que já vem digitado quando o lojista abre o QR |
| `email`, `site`, `instagram` | Contatos secundários |
| `cidade` | Região de atendimento |
| `atendimento` | Horário |
| `cnpj` | Opcional. Vazio, some do rodapé |
| `consultor` | Opcional. Vazio, vira uma linha em branco para assinar à mão |

Campos ainda não preenchidos saem **destacados em amarelo com sublinhado
tracejado** no PDF, e o script avisa no terminal. É de propósito: é para ninguém
mandar mil folhas para a gráfica com o telefone errado.

## Gerar o PDF

```bash
python3 gerar_pdf.py
```

Saem dois PDFs em `dist/`:

| Arquivo | Quando usar |
|---|---|
| `kairos-mf-folheto-lojas.pdf` | **Gráfica.** Arte até a borda da folha |
| `kairos-mf-folheto-lojas-impressora-comum.pdf` | **Impressora de casa ou escritório.** Arte reduzida para 93%, com margem branca |

A versão "impressora comum" existe porque impressora doméstica tem uma faixa de
4 a 6 mm nas bordas onde simplesmente não imprime — na versão de gráfica, as
tarjas azul e amarela sairiam cortadas.

Sai junto um `.html` de cada versão, útil para conferir na tela antes de gastar papel.

### Configuração de impressão

- Papel A4, **frente e verso**, virando pela borda maior (borda longa)
- Escala **100%** — desligue "ajustar à página" / "fit to page"
- Cor ativada
- Sugestão de papel: sulfite 120 g ou couché fosco 150 g. No sulfite 75 g comum
  o azul do verso aparece por transparência na frente

## Mudar os textos

Todo o texto está em `conteudo.json` — headline, checklist, etapas, exemplos e
comparativo. Dá para editar sem tocar em código. Um `\n` dentro de um título
força a quebra de linha naquele ponto.

Depois de mexer nos textos, confira se ainda cabe na folha:

```bash
python3 gerar_pdf.py && python3 conferir_layout.py
```

`conferir_layout.py` mede a altura real de cada página e avisa se algum bloco
estourou. Isso importa porque **texto que não cabe não dá erro na geração**: ele
simplesmente some na borda do PDF, e você só descobre depois de imprimir.

## Adaptar para outro segmento

O folheto está escrito para varejo de balcão em geral. Para atacar um nicho
específico, troque o `checklist` da frente e os `exemplos` do verso por dores
daquele setor — o resto da estrutura continua servindo:

- **Alimentação:** comanda, fila, delivery, cardápio, controle de insumo
- **Serviços com agenda:** agendamento, no-show, ficha do cliente, comissão
- **Atacado:** pedido do representante, tabela de preço, rota, catálogo

## Requisitos

```bash
pip install qrcode pillow
```

A geração do PDF usa o Chromium que já vem no ambiente; se não achar, cai
automaticamente para o WeasyPrint (`pip install weasyprint`).

O `conferir_layout.py` é opcional e precisa do `playwright`
(`pip install playwright` — usa o mesmo Chromium, não baixa navegador novo).

## Arquivos

```
config.json           contatos e identidade
conteudo.json         todos os textos do folheto
gerar_pdf.py          monta o HTML e imprime em PDF
conferir_layout.py    confere se o conteúdo cabe no A4
fontes/               Inter (licença SIL OFL 1.1, em fontes/LICENSE-Inter.txt)
dist/                 os PDFs gerados
```
