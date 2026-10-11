# Relatório de testes — AI Intelligence Hub v1

Testes executados em navegador real (Chromium via Playwright), abrindo o arquivo direto por `file://`, sem servidor. Esse ponto importa porque é exatamente o modo de uso que você descreveu: duplo clique no arquivo, abre e funciona.

## O que estava quebrado e foi corrigido

**1. Status errado quando a interrupção ou o timeout caem no último agente da fila.** Reproduzi com um atraso artificial controlado no Relator (o agente final) e confirmei: ao clicar "Interromper" ou ao o timeout configurado expirar durante a execução do último agente, a execução terminava marcada como "concluída" em vez de "interrompida" ou "timeout". Causa: a checagem de `sig.aborted` só acontecia no topo do laço, antes de iniciar o *próximo* agente — e quando o agente abortado é o último, não há próximo agente, então a checagem nunca rodava. Corrigido: a checagem agora também acontece depois que o laço termina. Testado de novo com o mesmo atraso artificial: agora aparece corretamente "interrompida" e "timeout".

**2. CSV com vírgula como separador e como decimal ao mesmo tempo corrompia dados silenciosamente.** Uma linha como `1,10,5` (pretendendo dizer índice 1, valor 10,5) era quebrada em três campos e o terceiro era descartado sem aviso. Causa: o parser tratava `,` e `;` como separador ao mesmo tempo, então qualquer vírgula decimal era interpretada como fim de campo. Corrigido: agora o parser decide um único separador por arquivo, olhando a primeira linha — se tiver `;`, usa `;` (liberando a vírgula para decimal); senão usa `,`. Testado: CSV com `;` como separador e `,` como decimal agora lê os números corretamente.

**3. Risco de colisão ao colar este arquivo dentro de outro HTML com abas.** Você comentou que pretende anexar isso como uma nova aba no seu HTML principal. Nessa hora, nomes genéricos expostos globalmente (`go`, `exp`, `open_`, mais as declarações de função `toast`, `render`, `init`, `save`, `csv` etc., que em um `<script>` clássico todas vazam para `window`) podiam colidir com qualquer coisa de mesmo nome no arquivo de destino. Encapsulei todo o script em uma única função (IIFE) e troquei os `onclick="..."` embutidos no HTML gerado por atributos `data-*` com um único listener delegado. Resultado: nada deste script é exposto em `window` além do comportamento padrão do navegador (todo elemento com `id` fica acessível como `window.<id>`, isso é do HTML, não do meu código, e não dá pra evitar sem também renomear os `id`). Testado: `typeof window.go`, `.exp`, `.open_`, `.render`, `.init`, `.csv` agora retornam `undefined`; todos os fluxos que usavam esses cliques (abrir detalhe do histórico, exportar execução, clicar num alerta) continuam funcionando, agora via delegação.

O que eu **não** resolvi, porque exige ver o arquivo de destino: ids como `#toast`, `#save`, `#nav`, `#main` etc. ainda colidem se o seu HTML principal já tiver elementos com esses mesmos ids. Isso só se resolve prefixando os ids (ex.: `aih-toast`) depois de eu ver a estrutura do arquivo onde você vai colar. Por ora deixei como está para não reescrever CSS e HTML que já funcionam sem necessidade.

## O que testei e confirmei funcionando (com evidência, sem simulação)

- As 5 abas carregam e alternam sem erro de console.
- Dados sintéticos: exatamente as 2 anomalias esperadas, nas linhas 22 e 27, confirmadas no z-score.
- JSON como lista de objetos: lido, colunas numéricas detectadas, anomalias/variações calculadas.
- CSV com `;` e vírgula decimal: lido corretamente após a correção.
- Dados vazios (textarea vazio ou upload de arquivo vazio): bloqueia com aviso claro, não trava, não inicia execução fantasma.
- Estrutura inválida (JSON de números soltos, texto arbitrário): Coletor rejeita com erro claro, pipeline para ali, execução marcada "concluída com erros" com o motivo registrado no log.
- Interromper no meio do pipeline: status "interrompida" (já funcionava antes da correção quando não era o último agente; agora funciona em qualquer posição).
- Timeout total configurado: aborta e marca "timeout" (idem, agora correto em qualquer posição).
- Limite de etapas (`maxSteps`): com limite 2, a execução para no segundo agente e marca "limite de etapas".
- Analista e Advogado do Diabo sem Ollama configurado: aparecem como "pendente", nada é inventado, mensagem explica o motivo.
- Teste de conexão com Ollama (sem Ollama rodando): mostra "Sem conexão" em vez de travar ou fingir sucesso.
- Histórico: busca por título/ID, filtro por agente e por data, comparação entre duas ou mais execuções, exportação por execução (JSON e Markdown) e exportação do histórico completo — todos os botões disparam download real.
- Apagar histórico: confirma antes, limpa de fato, recalcula os KPIs.
- Nenhum erro de JavaScript (console ou página) apareceu em nenhum dos cenários acima.

## Limitação conhecida, documentada e não corrigida

CSV que usa vírgula como separador **e** como decimal ao mesmo tempo, sem nenhum `;` no arquivo (ex.: `1,10,5` querendo dizer um único campo "10,5"), é uma ambiguidade real: não dá pra saber, só olhando o texto, se é um campo com decimal ou dois campos. A correção acima resolve o caso comum (planilha brasileira exportada com `;`), mas esse caso extremo continua exigindo que você use `;` como separador quando usar vírgula decimal. Vale documentar isso para quem for alimentar o sistema com dados.

## Conclusão sobre a pendência 1

Testada em navegador real, com evidência de cada cenário pedido (sintético, CSV decimal, JSON, vazio, estrutura inválida, interrupção, timeout). Dois bugs reais encontrados e corrigidos, uma limitação documentada, um ajuste de robustez feito por conta do seu plano de anexar isso em outro HTML. Arquivo continua sendo uma peça única, sem dependência externa obrigatória, funcionando por duplo clique.
