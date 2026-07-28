export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  cover: string;
  category: "Gramado" | "Paisagismo" | "Manutenção" | "Custos" | "Irrigação";
  tags: string[];
  author: { name: string; role: string };
  publishedAt: string;
  updatedAt?: string;
  readingMinutes: number;
  seoTitle: string;
  seoDescription: string;
  body: string;
};

export const blogPosts: BlogPost[] = [
  {
    slug: "com-que-frequencia-cortar-a-grama",
    title: "Com que frequência cortar a grama? Guia por estação e tipo de grama",
    excerpt:
      "Cortar pouco deixa o gramado feio; cortar demais o mata. Veja a frequência e a altura ideais para esmeralda, são-carlos, bermuda e batatais em cada estação do ano.",
    cover: "/img/blog/frequencia-corte.svg",
    category: "Gramado",
    tags: ["corte de grama", "gramado", "manutenção"],
    author: { name: "Rafael Menezes", role: "Engenheiro agrônomo — Verde Fixo" },
    publishedAt: "2026-06-18",
    updatedAt: "2026-07-10",
    readingMinutes: 7,
    seoTitle: "Com Que Frequência Cortar a Grama? Guia Completo por Estação",
    seoDescription:
      "Descubra a frequência e a altura ideais de corte para grama esmeralda, são-carlos, bermuda e batatais em cada estação. Guia técnico da Verde Fixo.",
    body: `
A pergunta que mais recebemos é também a mais mal respondida na internet: "de quanto em quanto tempo eu corto minha grama?" A resposta honesta é que não existe um número único — existe uma regra.

## A regra de um terço

Nunca remova mais de **um terço da altura da folha** em um único corte. Se a sua grama esmeralda está com 9 cm, corte para 6 cm, não para 3 cm.

O motivo é fisiológico. A folha é onde acontece a fotossíntese. Quando você arranca metade dela de uma vez, a planta entra em estresse, para de investir em raiz e passa a gastar toda a energia refazendo folha. O resultado é aquele gramado que fica amarelado dias depois do corte, com raiz curta e sem resistência à seca.

Corte respeitando a regra de um terço e você ganha o oposto: raiz profunda, folha densa e um gramado que abafa ervas invasoras sozinho.

## Altura ideal por tipo de grama

| Tipo de grama | Altura ideal | Corte quando chegar a |
| --- | --- | --- |
| Esmeralda | 3 a 5 cm | 7 cm |
| São-carlos | 5 a 8 cm | 11 cm |
| Bermuda | 2 a 4 cm | 6 cm |
| Batatais | 5 a 10 cm | 14 cm |
| Grama-preta (forração) | não cortar | — |

Repare que a são-carlos, muito usada em áreas de meia-sombra, precisa ficar **mais alta** que a esmeralda. Cortar são-carlos rente é o erro mais comum de quem contrata mão de obra sem orientação técnica: a grama abre falhas e o solo aparece.

## Frequência por estação (Sudeste do Brasil)

### Primavera (setembro a dezembro)
Época de crescimento explosivo. Temperatura subindo e chuva voltando significam grama crescendo até 2 cm por semana.

**Frequência ideal: a cada 10 a 15 dias.**

É também a melhor janela do ano para adubar, replantar falhas e fazer aeração. O que você faz na primavera define como o gramado atravessa o verão.

### Verão (dezembro a março)
Crescimento máximo, com chuva forte e calor. Aqui aparece um detalhe que quase ninguém considera: em período de muita chuva, atrasar o corte por duas semanas pode significar ter que remover metade da folha — violando a regra de um terço.

**Frequência ideal: a cada 10 a 14 dias.**

Dica que vale ouro no verão: eleve a altura de corte em 1 cm. Folha mais alta sombreia o solo, reduz a evaporação e protege a raiz nos dias de 35 °C.

### Outono (abril a junho)
O crescimento desacelera junto com a temperatura.

**Frequência ideal: a cada 20 a 30 dias.**

Momento de fazer a adubação de outono, rica em potássio, que fortalece a planta para o inverno em vez de forçar crescimento de folha.

### Inverno (junho a agosto)
Gramas tropicais entram em quase dormência. Esmeralda e bermuda podem até perder cor — isso é normal e reversível.

**Frequência ideal: a cada 30 a 45 dias, ou apenas um corte de acabamento.**

Erro clássico do inverno: cortar baixo "para dar uma renovada". A grama não tem energia para rebrotar e você chega em setembro com falhas que levarão três meses para fechar.

## Sinais de que está na hora de cortar (sem precisar medir)

- As folhas começam a **deitar** em vez de ficar eretas
- Aparecem **tons diferentes de verde** em manchas pelo gramado
- Você vê **hastes com sementes** despontando acima do nível da folha
- Ao caminhar, o gramado **guarda a marca** do pé por alguns segundos

## Por que a frequência importa mais que a qualidade do equipamento

Um gramado cortado a cada 15 dias com um cortador simples fica melhor que um gramado cortado a cada 45 dias com o melhor equipamento do mercado. Regularidade vence potência sempre.

É exatamente por isso que os planos de assinatura existem: eles resolvem o problema real, que não é ter alguém disponível para cortar — é **não deixar passar o ponto**.

> Nos planos da Verde Fixo a frequência é ajustada automaticamente pela estação. No verão você recebe mais visitas; no inverno, menos — pelo mesmo valor mensal.

## Resumo prático

1. Nunca remova mais de um terço da altura
2. Respeite a altura mínima do seu tipo de grama
3. Aumente a frequência na primavera e no verão, reduza no outono e inverno
4. Suba 1 cm na altura de corte durante o verão
5. Não corte baixo no inverno — a planta não tem energia para responder
`,
  },
  {
    slug: "quanto-custa-manter-um-jardim",
    title: "Quanto custa manter um jardim em 2026? Tabela real por m²",
    excerpt:
      "Números de verdade: quanto custa corte de grama, jardinagem, poda e adubação por metro quadrado, e por que a assinatura sai de 20% a 35% mais barata que o avulso.",
    cover: "/img/blog/custos-jardim.svg",
    category: "Custos",
    tags: ["preços", "orçamento", "planos"],
    author: { name: "Letícia Barros", role: "Coordenadora de operações — Verde Fixo" },
    publishedAt: "2026-07-02",
    readingMinutes: 6,
    seoTitle: "Quanto Custa Manter um Jardim em 2026? Tabela de Preços por m²",
    seoDescription:
      "Tabela real de preços de corte de grama, jardinagem, poda, adubação e paisagismo por m² em 2026. Compare avulso x assinatura e veja onde economizar.",
    body: `
Pesquisar preço de jardinagem na internet é frustrante: quase ninguém publica número. Vamos publicar.

Os valores abaixo são as faixas que praticamos na região de Campinas em 2026. Eles variam com acesso ao local, declividade, volume de resíduo e distância — mas servem como referência honesta para você avaliar qualquer orçamento.

## Corte de grama

| Área | Avulso | No plano (por visita) |
| --- | --- | --- |
| Até 100 m² | R$ 120 a R$ 160 | R$ 95 a R$ 125 |
| 100 a 300 m² | R$ 160 a R$ 280 | R$ 125 a R$ 210 |
| 300 a 600 m² | R$ 280 a R$ 450 | R$ 210 a R$ 330 |
| 600 a 1.500 m² | R$ 450 a R$ 900 | R$ 330 a R$ 650 |
| Acima de 1.500 m² | orçamento com trator | orçamento com trator |

O que **deve** estar incluído nesse valor: acabamento de bordas, sopro de calçadas e retirada dos resíduos. Se o orçamento não menciona a retirada, pergunte — é o item que aparece como "extra" depois.

## Jardinagem (canteiros, arbustos, vasos)

De R$ 150 a R$ 380 por visita, dependendo do número de canteiros e do volume de poda leve. Em jardins com muitos vasos e forrações, calcule pela hora técnica: R$ 90 a R$ 130 por hora de jardineiro.

## Poda

Poda não se cobra por m², e sim por porte:

- **Arbustos e cerca-viva:** R$ 25 a R$ 45 por metro linear
- **Árvore de pequeno porte (até 4 m):** R$ 180 a R$ 350
- **Árvore de médio porte (4 a 8 m):** R$ 350 a R$ 800
- **Árvore de grande porte (8 a 12 m):** R$ 800 a R$ 2.200

A variação enorme no grande porte se explica por três fatores: necessidade de escalada técnica, proximidade de rede elétrica e volume de galho para retirar.

## Adubação

R$ 8 a R$ 14 por m², incluindo o adubo. Uma análise de solo completa custa de R$ 180 a R$ 280 e vale a pena a partir de 200 m² — ela evita que você gaste com o adubo errado por dois anos seguidos.

## Limpeza de terreno

R$ 3,50 a R$ 9,00 por m², conforme a altura do mato e a presença de entulho. Caçamba, quando necessária, custa de R$ 350 a R$ 550 por unidade de 5 m³.

## Paisagismo

Aqui a faixa é muito mais ampla porque depende das espécies escolhidas:

- **Projeto (desenho + lista de espécies + 3D):** R$ 18 a R$ 45 por m² de área projetada
- **Execução com plantas de porte médio:** R$ 120 a R$ 380 por m²
- **Execução premium (palmeiras adultas, pedras, iluminação):** R$ 380 a R$ 900 por m²

## A conta que quase ninguém faz: avulso x assinatura

Vamos usar um caso real. Residência com **300 m² de gramado**, quintal com canteiros, uma cerca-viva de 12 metros.

**Cenário avulso, chamando quando lembra:**

| Item | Frequência real | Custo anual |
| --- | --- | --- |
| Corte de grama | 14 visitas (na prática, atrasando) | R$ 3.360 |
| Jardinagem | 4 visitas | R$ 1.000 |
| Poda de cerca-viva | 2 visitas | R$ 720 |
| Adubação | 1 visita (quando dá) | R$ 380 |
| **Total** | | **R$ 5.460** |

**Cenário assinatura (Plano Verde, R$ 429/mês):**

| Item | Frequência | Custo anual |
| --- | --- | --- |
| Plano com 4 visitas/mês, poda e adubação inclusas | 48 visitas | R$ 5.148 |

Perceba o que aconteceu: você pagou **R$ 312 menos** e recebeu **48 visitas em vez de 21**. O custo por visita caiu de R$ 260 para R$ 107.

Não é mágica de marketing. É previsibilidade de rota: quando a empresa sabe que estará na sua rua na terça-feira às 9h pelos próximos 12 meses, o custo logístico dela cai — e parte dessa economia volta para você.

## Onde as pessoas mais desperdiçam dinheiro

1. **Deixar passar o ponto do corte.** Grama muito alta exige duas passadas, gera três vezes mais resíduo e às vezes precisa de roçadeira. Você paga mais pelo mesmo serviço.
2. **Adubar sem análise de solo.** Aplicar NPK em solo com pH 4,8 é jogar dinheiro fora: a planta não absorve nutriente em solo ácido, faça o que fizer.
3. **Chegar na revitalização.** Manutenção custa R$ 100 a R$ 200 por visita. Revitalizar um jardim abandonado por dois anos custa de R$ 8.000 a R$ 40.000. É o consumidor mais caro de todos: o que economiza na manutenção.
4. **Contratar por preço, não por escopo.** O orçamento de R$ 90 que não inclui retirada de resíduo vira R$ 160 no dia. Compare escopos, não números.

> Use o simulador do site para ver a estimativa do seu caso em 30 segundos: informe os metros quadrados, o serviço e a frequência desejada.
`,
  },
  {
    slug: "grama-amarelada-causas-e-solucoes",
    title: "Grama amarelada: as 7 causas reais e como resolver cada uma",
    excerpt:
      "Antes de comprar adubo, descubra o motivo. Diagnóstico prático das sete causas de gramado amarelo — e o que fazer em cada caso, com prazo de recuperação.",
    cover: "/img/blog/grama-amarelada.svg",
    category: "Gramado",
    tags: ["gramado", "adubação", "diagnóstico"],
    author: { name: "Rafael Menezes", role: "Engenheiro agrônomo — Verde Fixo" },
    publishedAt: "2026-05-27",
    readingMinutes: 8,
    seoTitle: "Grama Amarelada: 7 Causas e Como Resolver (Guia com Diagnóstico)",
    seoDescription:
      "Gramado amarelo pode ser compactação, pH ácido, fungo, excesso de água, corte errado, praga ou falta de sol. Aprenda a diagnosticar e corrigir cada causa.",
    body: `
Gramado amarelo é sintoma, não doença. Aplicar adubo antes de descobrir a causa resolve em cerca de uma em cada quatro situações — nas outras três você gastou dinheiro e perdeu tempo.

Este é o roteiro de diagnóstico que nossa equipe usa em campo.

## Teste inicial: cave um quadrado

Com uma pá de jardinagem, retire um bloco de 15 cm × 15 cm × 15 cm do trecho amarelado. Olhe três coisas:

1. **A raiz.** Está branca e ramificada ou marrom e curta?
2. **O solo.** Quebra fácil na mão ou vem como um tijolo?
3. **O cheiro.** Terra saudável tem cheiro de chuva. Cheiro azedo indica encharcamento.

Com essa informação você já elimina metade das hipóteses.

## Causa 1: Compactação do solo

**Como identificar:** o bloco vem duro, difícil de quebrar. A raiz é curta (menos de 5 cm) e horizontal. Comum em áreas com trânsito de pessoas, brincadeira de criança ou passagem de carro.

**Por que amarela:** raiz sem espaço não busca água nem nutriente em profundidade. A planta vive do que está nos primeiros centímetros — e isso seca em dois dias sem chuva.

**Solução:** aeração mecânica (retirada de plugues de solo) seguida de aplicação de areia grossa e composto orgânico. Uma passada resolve a maior parte dos casos.

**Prazo de recuperação:** 30 a 45 dias.

## Causa 2: pH ácido

**Como identificar:** exige teste. Fita de pH de aquário serve para uma leitura aproximada; análise laboratorial dá o número real e a recomendação de calagem.

**Por que amarela:** abaixo de pH 5,5 o fósforo fica quimicamente indisponível e o alumínio se torna tóxico para a raiz. Você pode adubar todo mês e não ver diferença nenhuma.

**Solução:** calagem com calcário dolomítico, na dose indicada pela análise. Aplicar e irrigar bem.

**Prazo de recuperação:** 60 a 90 dias — o calcário age lentamente. Não tem atalho.

## Causa 3: Corte muito baixo (escalpelamento)

**Como identificar:** o amarelado apareceu **dias depois de um corte**, de forma uniforme, e você vê hastes marrons expostas onde deveria ter folha verde.

**Por que amarela:** removeu-se mais de um terço da folha. A planta perdeu a área fotossintética e expôs a haste, que não é verde.

**Solução:** nenhuma intervenção. Irrigue normalmente, não corte por 3 semanas e eleve a altura no próximo corte.

**Prazo de recuperação:** 15 a 25 dias.

## Causa 4: Excesso de água

**Como identificar:** solo úmido mesmo 48h após a última rega, cheiro azedo, presença de musgo ou cogumelos, raiz escurecida.

**Por que amarela:** raiz precisa de oxigênio. Solo saturado asfixia a raiz e favorece fungos de solo.

**Solução:** reduzir a frequência de irrigação (rega profunda 2 a 3 vezes por semana é melhor que rega leve todos os dias), verificar drenagem e corrigir setores desregulados do sistema de irrigação.

**Prazo de recuperação:** 20 a 40 dias.

## Causa 5: Fungo (mancha-marrom, antracnose)

**Como identificar:** manchas **circulares** de contorno definido, que crescem de tamanho ao longo dos dias. Costuma aparecer depois de sequências de dias úmidos e quentes. Nas bordas da mancha a folha tem lesão com halo.

**Por que amarela:** o fungo destrói o tecido da folha.

**Solução:** fungicida específico registrado, redução da irrigação noturna (folha molhada de madrugada é o cenário ideal para fungo) e correção do excesso de nitrogênio, que deixa a folha tenra e suscetível.

**Prazo de recuperação:** 25 a 50 dias.

## Causa 6: Praga de solo (lagarta-rosca, cupim, formiga cortadeira)

**Como identificar:** o amarelado tem **formato irregular e avança rápido**. Ao puxar a grama do trecho afetado, ela **sai fácil**, sem resistência — sinal de que a raiz foi consumida. Cave e procure larvas brancas em C.

**Por que amarela:** a raiz está literalmente sendo comida.

**Solução:** identificação da praga (fundamental, porque o produto muda) e controle localizado com manejo integrado.

**Prazo de recuperação:** 30 a 60 dias, com replantio das falhas maiores.

## Causa 7: Falta de sol

**Como identificar:** o amarelado é **permanente e sempre no mesmo lugar** — embaixo de árvore, ao lado de muro alto, atrás da churrasqueira. Não avança nem regride.

**Por que amarela:** grama esmeralda e bermuda precisam de sol pleno. Em menos de 4 horas de sol direto elas nunca vão prosperar.

**Solução:** trocar a espécie (são-carlos tolera meia-sombra; grama-preta e outras forrações resolvem sombra densa), abrir a copa da árvore com poda de limpeza, ou aceitar a realidade e transformar o trecho em canteiro com plantas de sombra.

**Prazo de recuperação:** imediato com a espécie correta.

## Tabela rápida de diagnóstico

| Sintoma dominante | Causa mais provável |
| --- | --- |
| Solo duro como tijolo | Compactação |
| Adubo não faz efeito nenhum | pH ácido |
| Amarelou logo após o corte | Corte baixo |
| Solo sempre úmido, cheiro azedo | Excesso de água |
| Manchas circulares que crescem | Fungo |
| Grama sai fácil ao puxar | Praga de raiz |
| Sempre no mesmo lugar sombreado | Falta de sol |

> Não conseguiu identificar? A visita técnica de diagnóstico da Verde Fixo é gratuita nas cidades que atendemos. Levamos medidor de pH e fazemos o teste do bloco na hora.
`,
  },
  {
    slug: "plantas-resistentes-para-jardim-de-pouca-manutencao",
    title: "12 plantas que sobrevivem ao esquecimento (e ainda ficam bonitas)",
    excerpt:
      "Seleção testada em campo: espécies que aguentam sol forte, rega irregular e pouca atenção, organizadas por função no jardim — forração, maciço, cerca-viva e vaso.",
    cover: "/img/blog/plantas-resistentes.svg",
    category: "Paisagismo",
    tags: ["paisagismo", "plantas", "baixa manutenção"],
    author: { name: "Bianca Ferraz", role: "Paisagista — Verde Fixo" },
    publishedAt: "2026-06-05",
    readingMinutes: 7,
    seoTitle: "12 Plantas Resistentes para Jardim de Baixa Manutenção",
    seoDescription:
      "Espécies que aguentam sol forte, rega irregular e pouca manutenção. Lista de paisagista com forrações, maciços, cercas-vivas e plantas de vaso.",
    body: `
Todo jardim bonito de manutenção baixa tem a mesma coisa em comum: escolha de espécie certa desde o começo. Nenhuma quantidade de cuidado salva uma planta plantada no lugar errado, e nenhuma negligência mata uma planta bem escolhida.

Esta lista sai de oito anos de manutenção em mais de 2.000 jardins na região de Campinas. São as espécies que, quando o cliente viaja um mês, continuam lá.

## Forrações (cobrir solo, substituir grama)

### 1. Grama-preta (*Ophiopogon japonicus*)
Aguenta sombra densa onde grama nenhuma pega. Não pede corte, nunca. Cresce devagar — plante mais denso do que parece necessário.
**Sol:** sombra a meia-sombra · **Rega:** baixa

### 2. Amendoim-rasteiro (*Arachis repens*)
Flor amarela quase o ano inteiro, fixa nitrogênio no solo (aduba sozinho) e cobre rápido. Suporta pisoteio leve.
**Sol:** pleno a meia-sombra · **Rega:** baixa

### 3. Dinheiro-em-penca (*Callisia repens*)
Cobertura densa e brilhante para canteiro pequeno e borda de vaso. Propaga só de estaca — dá para expandir o jardim de graça.
**Sol:** meia-sombra · **Rega:** média

## Maciços e touceiras (volume e movimento)

### 4. Moreia (*Dietes bicolor*)
A planta mais indestrutível desta lista. Sol forte, seca, frio, solo pobre: sobrevive a tudo e floresce em ciclos. Corte as folhas secas uma vez por ano e pronto.
**Sol:** pleno · **Rega:** muito baixa

### 5. Agapanto (*Agapanthus africanus*)
Flor azul ou branca em hastes altas, no verão. Forma touceiras que se adensam sozinhas ao longo dos anos.
**Sol:** pleno a meia-sombra · **Rega:** baixa

### 6. Capim-do-texas (*Pennisetum setaceum*)
Traz movimento — as inflorescências plumosas balançam com vento fraco. Corte rente no fim do inverno e ele rebrota inteiro.
**Sol:** pleno · **Rega:** muito baixa

### 7. Clorofito / gravatinha (*Chlorophytum comosum*)
Resolve aquele canteiro difícil embaixo de árvore. Produz mudas penduradas que você replanta sem custo.
**Sol:** sombra a meia-sombra · **Rega:** baixa

## Cercas-vivas e privacidade

### 8. Clúsia (*Clusia fluminensis*)
Folha coriácea, quase de plástico. Fecha visão em 18 a 24 meses, aguenta maresia e vento. Aceita poda em qualquer formato.
**Sol:** pleno a meia-sombra · **Rega:** baixa

### 9. Viburno (*Viburnum odoratissimum*)
A melhor relação custo-velocidade para cerca-viva alta. Cresce até 1 metro por ano e responde bem a poda de topo reta.
**Sol:** pleno · **Rega:** média

### 10. Podocarpo (*Podocarpus macrophyllus*)
Para quem quer uma parede verde impecável e tem paciência. Cresce devagar, mas a textura fina permite acabamento perfeito.
**Sol:** pleno a meia-sombra · **Rega:** média

## Vasos e áreas de piso

### 11. Zamioculca (*Zamioculcas zamiifolia*)
Reserva água no rizoma. Sobrevive a três semanas sem rega em ambiente interno. O erro com ela é sempre o mesmo: regar demais.
**Sol:** sombra a meia-sombra · **Rega:** muito baixa

### 12. Espada-de-são-jorge (*Dracaena trifasciata*)
Praticamente impossível de matar por falta de água. Vertical, escultural e ótima em vaso alto de entrada.
**Sol:** sombra a pleno · **Rega:** muito baixa

## Três regras que valem mais que a lista

**Agrupe por necessidade de água.** O erro de projeto mais comum é misturar planta de rega alta com planta de rega baixa no mesmo canteiro. Uma das duas sempre vai sofrer, porque a irrigação é a mesma para as duas.

**Use cobertura morta.** Uma camada de 5 cm de casca de pinus ou fibra de coco reduz a evaporação em até 70%, segura erva invasora e melhora a aparência do canteiro imediatamente. É o item de melhor retorno em jardinagem.

**Plante denso.** Canteiro com espaçamento generoso parece elegante no projeto e vira canteiro de mato na prática — porque solo exposto é convite para erva invasora. Plante para fechar em 12 meses, não em 36.

> Quer um projeto com espécies escolhidas para o seu sol e sua rotina? A visita técnica de paisagismo da Verde Fixo é gratuita e você recebe o projeto em 3D em até 7 dias.
`,
  },
  {
    slug: "como-economizar-agua-na-irrigacao",
    title: "Como economizar até 40% de água na irrigação do jardim",
    excerpt:
      "Sete ajustes de irrigação que reduzem a conta de água sem sacrificar o jardim — do horário de rega à setorização, com números de consumo real.",
    cover: "/img/blog/economia-agua.svg",
    category: "Irrigação",
    tags: ["irrigação", "economia", "sustentabilidade"],
    author: { name: "Rafael Menezes", role: "Engenheiro agrônomo — Verde Fixo" },
    publishedAt: "2026-07-15",
    readingMinutes: 6,
    seoTitle: "Como Economizar Água na Irrigação do Jardim (7 Ajustes Práticos)",
    seoDescription:
      "Reduza até 40% do consumo de água na irrigação do jardim com ajustes de horário, setorização, sensor de chuva e cobertura morta. Guia técnico Verde Fixo.",
    body: `
Um jardim residencial de 300 m² irrigado de forma ineficiente consome cerca de 18.000 litros por mês. O mesmo jardim, com os ajustes abaixo, consome perto de 11.000 — com a grama mais bonita, não menos.

Não é contraintuitivo: quase todo desperdício de irrigação também **prejudica** a planta.

## 1. Regue profundo e espaçado, não pouco e todo dia

Este é o ajuste de maior impacto. Rega leve diária molha apenas os 3 primeiros centímetros do solo. A raiz aprende que a água está na superfície e para de descer.

Rega profunda 2 a 3 vezes por semana molha 15 a 20 cm e obriga a raiz a se aprofundar. Raiz profunda alcança reservas que a rega diária nunca alcança — e sobrevive a uma semana de esquecimento.

**Como saber se está profundo o suficiente:** 30 minutos após a rega, enfie uma chave de fenda longa no solo. Se ela entra fácil até 15 cm, está bom.

## 2. Ajuste o horário: 4h às 6h da manhã

- **Meio-dia:** até 30% da água evapora antes de infiltrar
- **Fim da tarde/noite:** folha fica úmida por 10 horas, o cenário perfeito para fungo
- **Madrugada (4h-6h):** evaporação mínima, e o sol nascente seca a folha em pouco tempo

Só isso já economiza cerca de 15% do consumo e reduz drasticamente doença fúngica.

## 3. Setorize por insolação e tipo de planta

O erro estrutural mais caro: um único setor irrigando o canteiro de pleno sol e o canteiro embaixo da árvore com o mesmo tempo. O de sol fica seco; o de sombra encharca.

Divida em setores por **insolação** (pleno sol, meia-sombra, sombra) e por **tipo** (gramado, canteiro, vaso). Cada setor com seu próprio tempo de rega.

Em reformas de sistema, é o item que mais reduz consumo: de 20% a 25%.

## 4. Instale sensor de chuva

Custa entre R$ 120 e R$ 350 e se paga em poucos meses. Ele impede o ciclo programado de rodar depois de uma chuva — cena absurda que se vê em condomínio toda semana no verão.

## 5. Use gotejamento em canteiro

Aspersor em canteiro molha folha e caminho junto com a terra. Gotejamento entrega água direto na zona da raiz, com eficiência de 90% contra 65% do aspersor.

Regra prática: **aspersor para gramado, gotejamento para tudo o mais.**

## 6. Cobertura morta em todo canteiro exposto

Uma camada de 5 cm de casca de pinus, fibra de coco ou folha triturada reduz a evaporação do solo em até 70%. É a intervenção mais barata desta lista e a que dá resultado no mesmo dia.

## 7. Faça o teste das latinhas (auditoria de uniformidade)

Distribua 6 a 8 latas vazias iguais pelo gramado e rode um ciclo de 15 minutos. Meça a água em cada lata.

Se a variação entre a lata mais cheia e a mais vazia passar de 25%, seu sistema está desuniforme — e você está irrigando **em excesso** só para compensar os pontos secos. Causas comuns: aspersor entupido, pressão inadequada, espaçamento errado ou modelos misturados no mesmo setor.

Corrigir uniformidade costuma reduzir de 10% a 20% do consumo sozinho.

## Quanto irrigar, na prática

Um gramado saudável precisa de **20 a 30 mm de água por semana**, incluindo a chuva. Em 300 m², isso significa de 6.000 a 9.000 litros semanais.

Instale um pluviômetro simples (R$ 40) e desconte a chuva da semana. Em janeiro, na região de Campinas, muitas semanas não precisam de irrigação nenhuma — e o sistema segue rodando na maioria das casas.

## Resumindo em ordem de impacto

| Ajuste | Economia estimada |
| --- | --- |
| Rega profunda e espaçada | 20% |
| Setorização correta | 20-25% |
| Horário de madrugada | 15% |
| Correção de uniformidade | 10-20% |
| Cobertura morta em canteiros | 10% |
| Sensor de chuva | 8-12% |
| Gotejamento em canteiro | 8% |

Os ganhos não são somáveis linearmente, mas na prática o conjunto entrega de 35% a 45% de redução.

> A Verde Fixo faz auditoria de irrigação com teste de uniformidade e ajuste de setores. No Plano Premium a manutenção do sistema já está inclusa.
`,
  },
  {
    slug: "calendario-de-jardinagem-mes-a-mes",
    title: "Calendário de jardinagem: o que fazer em cada mês do ano",
    excerpt:
      "Um ano inteiro de jardim organizado mês a mês para o Sudeste do Brasil: quando adubar, quando podar, quando plantar e quando simplesmente não mexer.",
    cover: "/img/blog/calendario-jardinagem.svg",
    category: "Manutenção",
    tags: ["calendário", "manutenção", "planejamento"],
    author: { name: "Bianca Ferraz", role: "Paisagista — Verde Fixo" },
    publishedAt: "2026-04-22",
    updatedAt: "2026-07-05",
    readingMinutes: 9,
    seoTitle: "Calendário de Jardinagem Mês a Mês (Sudeste do Brasil)",
    seoDescription:
      "O que fazer no jardim em cada mês do ano: adubação, poda, plantio, controle de pragas e irrigação. Calendário completo para o clima do Sudeste.",
    body: `
Jardinagem é uma atividade de calendário. A mesma poda que fortalece a planta em agosto pode arruiná-la em novembro. Este calendário é calibrado para o clima do Sudeste — Campinas, região metropolitana de São Paulo e o interior paulista.

## Janeiro — Auge do crescimento

Chuva forte e calor. Tudo cresce, inclusive o que você não plantou.

- Corte de grama a cada 10 a 14 dias, com altura 1 cm acima do normal
- Controle de erva invasora: é agora que ela se estabelece
- Atenção a fungo: manchas circulares aparecem depois de dias úmidos
- **Não adube nitrogênio**: crescimento demais deixa a folha tenra e vulnerável
- Verifique drenagem em canteiro baixo antes da próxima chuva forte

## Fevereiro — Manutenção intensa

Padrão parecido com janeiro, com pico de pragas.

- Corte de grama a cada 10 a 14 dias
- Inspeção de praga: lagarta e formiga cortadeira estão no auge
- Poda leve de arbusto que já floriu
- Limpeza de calha e ralo antes das chuvas de março

## Março — Transição

O calor começa a ceder. Melhor janela do primeiro semestre para intervenção estrutural.

- Adubação de transição, com equilíbrio de fósforo e potássio
- Replantio de falha no gramado — ainda dá tempo de pegar antes do frio
- Divisão de touceira (agapanto, moreia, clorofito)
- Última aeração antes do inverno

## Abril — Preparação para o frio

Crescimento desacelerando visivelmente.

- Corte de grama passa para a cada 20 dias
- Adubação de outono, rica em **potássio** — fortalece a planta em vez de forçar folha
- Poda de limpeza em árvore: com menos folha, a estrutura fica visível
- Redução gradual da irrigação

## Maio — Desaceleração

- Corte a cada 25 a 30 dias
- Plantio de espécie de clima ameno: azaleia, camélia, hortênsia
- Última calagem do ano, se a análise de solo indicou
- Cobertura morta reforçada nos canteiros: protege raiz do frio

## Junho — Dormência começa

Gramas tropicais quase param. Esmeralda pode perder cor — normal.

- Corte a cada 30 a 45 dias, apenas acabamento
- **Não corte baixo.** A planta não tem energia para rebrotar
- Poda drástica de roseira e frutífera de clima temperado
- Irrigação bem reduzida: solo frio e úmido favorece podridão de raiz

## Julho — Mês do planejamento

Mês de menor atividade vegetativa. Aproveite para pensar, não para mexer.

- Corte apenas se necessário
- **Melhor mês para projeto de paisagismo**: você planeja em julho e executa em setembro, na janela ideal de plantio
- Análise de solo: o laboratório está menos cheio e você tem tempo de aplicar a correção antes da primavera
- Manutenção de equipamento e revisão do sistema de irrigação
- Poda de formação em árvore decídua

## Agosto — Preparação para a explosão

O mês mais importante do ano em jardinagem, e o mais ignorado.

- **Aeração e descompactação do solo** antes da retomada
- Aplicação de composto orgânico e correção de solo
- Preparo de canteiro para o plantio de setembro
- Poda de limpeza final antes da brotação
- Reprogramação da irrigação para o aumento de temperatura

O jardim de novembro é construído em agosto. Quem faz aeração e correção agora colhe um gramado denso na primavera; quem não faz vai adubar em outubro tentando compensar.

## Setembro — Retomada

Temperatura subindo, primeiras chuvas. A janela de ouro.

- **Adubação de primavera**, com nitrogênio: agora a planta usa
- **Melhor mês do ano para plantio** de grama, forração, arbusto e árvore
- Corte volta a cada 15 dias
- Replantio de falha: pega rápida e fechamento garantido
- Controle preventivo de praga antes que a população cresça

## Outubro — Crescimento acelerado

- Corte a cada 12 a 15 dias
- Segunda adubação, se o gramado estava muito debilitado
- Plantio de florada de verão
- Ajuste da irrigação para o calor
- Monitoramento de erva invasora, que também aproveita a primavera

## Novembro — Pico de floração

- Corte a cada 10 a 14 dias
- Poda de arbusto após a floração
- Cobertura morta renovada antes do verão: economiza água nos meses quentes
- Inspeção de praga: começa a subir

## Dezembro — Entrada do verão

- Corte a cada 10 a 14 dias, subindo a altura em 1 cm
- Verificação de drenagem antes das chuvas fortes
- Poda de galho seco ou mal fixado que pode cair com vento e chuva
- Interrupção da adubação nitrogenada

## Os quatro momentos que mais importam

Se você fizer apenas quatro coisas por ano, faça estas:

1. **Agosto:** aeração e correção de solo
2. **Setembro:** adubação de primavera e plantio
3. **Abril:** adubação de outono com potássio
4. **Todo ano, sempre:** respeitar a frequência de corte por estação

> Nos planos da Verde Fixo esse calendário roda automaticamente. A adubação de primavera, a aeração de agosto e a mudança de frequência por estação já estão no cronograma — você não precisa lembrar de nada.
`,
  },
];

export const blogBySlug = (slug: string) => blogPosts.find((p) => p.slug === slug);
export const blogCategories = Array.from(new Set(blogPosts.map((p) => p.category)));
export const recentPosts = [...blogPosts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
