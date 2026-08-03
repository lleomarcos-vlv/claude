# Palavra que Liberta

Projeto cultural completo para submissão à **Lei Federal de Incentivo à Cultura**
(Lei nº 8.313/1991) e a editais públicos e privados de fomento.

**Proponente:** Associação Franz de Castro Holzwarth (AFCH) — CNPJ 33.704.307/0001-22
· Ribeirão Preto/SP
**Norma de referência:** Instrução Normativa MinC nº 29, de 29 de janeiro de 2026
**Enquadramento:** art. 18 da Lei nº 8.313/1991 — dedução de 100%
**Segmento:** Humanidades — livro, leitura, literatura e bibliotecas
**Valor:** R$ 2.100.360,00 · **Prazo:** 16 meses

---

## O que é o projeto

Uma rede de leitura, escrita e cidadania em territórios periféricos de Ribeirão
Preto. Em 16 meses: 2 núcleos comunitários de leitura permanentes, 24 jovens
formados como mediadores com bolsa, 3.400 livros em acervo, 288 horas de oficinas,
12 sessões de circuito itinerante (incluindo unidades prisionais e socioeducativas)
e a publicação da antologia *Palavra que Liberta* — 3.000 exemplares gratuitos,
mais audiolivro, e-book acessível e edição em braile.

O tema foi escolhido a partir de pesquisa de demanda: pela primeira vez na série
histórica o Brasil tem mais não leitores (53%) do que leitores; o país perdeu 764
bibliotecas públicas entre 2015 e 2020; e apenas 1,38% dos recursos da Lei Rouanet
chegaram às periferias de São Paulo entre 2014 e 2023.

## Entregáveis

| Arquivo | Conteúdo |
|---|---|
| `dist/PALAVRA-QUE-LIBERTA-Projeto-Completo.pdf` | Dossiê completo, 74 páginas, 24 seções — pronto para envio |
| `dist/GUIA-CONFORMIDADE-LEI-ROUANET-2026.pdf` | Guia de tudo que a lei exige para aprovar um projeto, 13 páginas |
| `dist/PALAVRA-QUE-LIBERTA-Planilha-Orcamentaria.csv` | Planilha analítica em CSV para preenchimento no SALIC |

## Estrutura do repositório

```
build/
  orcamento.py           planilha analítica + verificação automática dos limites da IN 29/2026
  exportar_planilha.py   export da planilha em CSV
  gerar.py               monta o HTML e renderiza os PDFs via Chromium headless
src/
  estilo.css             folha de estilo de impressão (A4)
  partes/*.html          seções do dossiê, concatenadas em ordem alfabética
  guia.html              guia de conformidade
dist/                    PDFs e CSV gerados
```

## Como regerar

```bash
python3 build/orcamento.py          # confere a planilha e os limites normativos
python3 build/gerar.py              # gera os dois PDFs
python3 build/exportar_planilha.py  # gera o CSV
```

Requisitos: Python 3.11+ e Chromium (o build procura em `/opt/pw-browsers/` e nos
caminhos usuais do sistema).

## Verificação de conformidade

`orcamento.py` calcula os percentuais a partir das rubricas e confronta cada um com
o limite normativo — o build falha se algum estourar. Situação atual:

| Item | Limite | Apurado |
|---|---|---|
| Custos administrativos | 15% | 7,66% |
| Maior despesa isolada na etapa administrativa | 50% | 26,1% |
| Acessibilidade, comunicação e divulgação acessível | 20% | 13,59% |
| Veiculação publicitária | 5% / R$ 100.000 | 1,52% / R$ 32.000 |
| Captação de recursos | 10% / R$ 150.000 | 4,38% / R$ 92.000 |
| Prazo de execução | 36 meses | 16 meses |

Atividades finalísticas concentram 74,37% do orçamento.

## Antes de enviar

O dossiê marca com `[preencher]` e `[anexar]` os pontos que dependem de documentos
internos da Associação. A Seção 22.7 do PDF traz a lista completa; os principais são:

1. Confirmar **CNAE cultural** no cartão CNPJ — causa frequente de inadmissibilidade
2. Certidões negativas (federal, estadual, municipal, FGTS, trabalhista)
3. Estatuto social consolidado e ata de eleição e posse, registrados
4. Cadastro do agente cultural no SALIC
5. Portfólio com dados oficiais (o material institucional atual traz números
   marcados como ilustrativos, que não devem ser usados em submissão)
6. Termos de cessão dos espaços dos núcleos e cartas de parceria
7. Três cotações por item de bens e serviços de terceiros

## Nota sobre a norma

A regulamentação do mecanismo é revisada com frequência. Confirme no portal do
Ministério da Cultura a Instrução Normativa vigente e o Anexo II (relação de
documentos obrigatórios por tipo de proposta) antes de cada submissão.
