# Capacitação em Drones — material de apresentação para corporações

Gerador dos dois PDFs de apresentação do trabalho de **Mizael Lucas da Silva**,
instrutor de operação de aeronaves não tripuladas:

| # | Arquivo | Para que serve |
|---|---------|----------------|
| 1 | `saida/1 - Proposta de Capacitacao em Drones - Seguranca Publica e Defesa.pdf` | Proposta pronta para apresentar a Polícia Militar, Civil, Penal, Científica, Corpo de Bombeiros, Guarda Municipal, Defesa Civil e Forças Armadas. 22 páginas. |
| 2 | `saida/2 - Rotas Legais de Certificacao - Cursos de Drones.pdf` | Documento interno sobre como emitir certificado com validade real e quais são as rotas de reconhecimento oficial existentes. 15 páginas. |

## Como gerar

```bash
pip install reportlab
python3 gerar_pdfs.py
```

Os arquivos são escritos em `saida/`.

## Como colocar seus dados

Edite **apenas** `src/dados.py` e rode `python3 gerar_pdfs.py` de novo.

Enquanto um campo estiver como `None`, o PDF mostra no lugar dele uma marca
dourada `[ preencher: ... ]`. Isso é intencional: nenhum dado curricular,
credencial, número ou valor foi inventado. Troque o `None` pelo dado verdadeiro
entre aspas:

```python
INSTRUTOR = {
    "telefone": "(16) 99999-0000",
    "email": "contato@exemplo.com.br",
    "cidade_uf": "Ribeirão Preto / SP",
    ...
}
```

Se você ainda não tem uma credencial, **deixe `None`**. O documento
simplesmente não afirma aquilo — é melhor um campo em branco do que uma
informação que não sobrevive a uma checagem do órgão.

## O que o documento 1 contém

Sumário executivo · o que mudou no marco regulatório de 2026 · perfil do
instrutor · por que capacitar · aplicações operacionais por força · cinco
trilhas de formação com matriz curricular e carga horária · **protocolo de
abordagem a operador de drone em cinco fases** · quadro de documentos exigíveis
na abordagem · quadro de enquadramentos e encaminhamentos · metodologia e
logística · certificação · investimento · diferenciais · próximos passos.

Anexos: ficha de abordagem para uso em campo (reproduzível), checklist de voo
institucional e base normativa consultada.

## O que o documento 2 contém

A resposta honesta sobre o MEC, o mapa de quem regula o quê na educação
brasileira e as **seis rotas** de certificação — curso livre fundamentado,
extensão universitária, qualificação técnica de nível médio, cadastro de
entidade de ensino no MAPA (CAAR), alinhamento ao exame teórico da ANAC e
reconhecimento institucional pela corporação — com comparativo, roteiro de
implantação em quatro fases, anatomia de um certificado em conformidade,
rastreabilidade, lista do que nunca escrever e base legal consolidada.

## Base normativa

O conteúdo foi escrito para o marco vigente em 2026, e não para o regime
anterior:

- **RBAC nº 100** (Resolução ANAC nº 805), em vigor desde 16/6/2026,
  substituindo integralmente o RBAC-E nº 94 — categorias Aberta, Específica e
  Certificada, no lugar das classes 1, 2 e 3.
- **Exame teórico de piloto remoto da ANAC** obrigatório a partir de
  **1º/1/2027**, dispensado até 31/12/2026 pela Resolução nº 805.
- **ICA 100-40** (nova edição pela Portaria DECEA nº 2094/DNOR8, de 18/3/2026)
  e **ICA 100-48**, em vigor desde 1º/7/2026.
- **Resoluções ANAC nº 761 e 762/2024**, vigentes desde 1º/1/2026, com as novas
  tabelas de infrações.
- **Portaria MAPA nº 298/2021** para aviação agrícola, com o CAAR e o
  cadastramento de entidades de ensino.
- **Lei nº 9.394/1996, art. 42**, e **Decreto nº 5.154/2004**, fundamento dos
  cursos livres.

A regulação de drones está em ciclo de alteração acelerado. Confira a versão
vigente de cada norma junto ao órgão emissor antes de usar em caso concreto —
os dois documentos trazem essa ressalva por escrito.

## Estrutura

```
gerar_pdfs.py                    ponto de entrada
src/dados.py                     >>> seus dados vão aqui <<<
src/design.py                    paleta, fontes, tabelas, caixas, capa, rodapé
src/doc1_proposta_capacitacao.py conteúdo do documento 1
src/doc2_rotas_certificacao.py   conteúdo do documento 2
saida/                           PDFs gerados
```

Fontes usadas: Liberation Sans e DejaVu Sans Mono (presentes na maioria das
distribuições Linux; em outro sistema, ajuste os caminhos no topo de
`src/design.py`).
