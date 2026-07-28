export type FaqItem = { q: string; a: string; group: FaqGroup };
export type FaqGroup = "Serviços" | "Planos e assinatura" | "Agendamento" | "Preços e pagamento" | "Atendimento";

export const faqGroups: FaqGroup[] = ["Serviços", "Planos e assinatura", "Agendamento", "Preços e pagamento", "Atendimento"];

export const faq: FaqItem[] = [
  {
    group: "Serviços",
    q: "Quais serviços a Verde Fixo faz?",
    a: "Corte de grama, paisagismo, jardinagem, poda, limpeza de terreno, plantio, adubação, controle de pragas, irrigação e revitalização de jardins. Tudo com equipe própria, sem terceirização.",
  },
  {
    group: "Serviços",
    q: "Preciso fornecer equipamentos, água ou energia?",
    a: "Não. Levamos cortadores, roçadeiras, sopradores, motosserras, ferramentas manuais e combustível. Só pedimos acesso ao local no horário agendado.",
  },
  {
    group: "Serviços",
    q: "O que vocês fazem com a grama cortada e os galhos?",
    a: "Recolhemos e levamos embora com descarte correto, incluso no preço. Em volumes muito grandes (limpeza de terreno, por exemplo) a caçamba entra no orçamento de forma transparente.",
  },
  {
    group: "Serviços",
    q: "Vocês atendem condomínios e empresas com nota fiscal?",
    a: "Sim. Emitimos nota fiscal de serviço para PF e PJ, atendemos processos de compras, fornecemos ART quando aplicável e trabalhamos com contrato mensal para condomínios, escolas, hotéis e pousadas.",
  },
  {
    group: "Serviços",
    q: "A equipe tem seguro e EPI?",
    a: "Toda a equipe usa EPI completo, é registrada em CLT e temos seguro de responsabilidade civil. Se algo for danificado durante o serviço, resolvemos sem burocracia.",
  },
  {
    group: "Planos e assinatura",
    q: "Qual a vantagem de assinar um plano em vez de chamar avulso?",
    a: "Três coisas: sai de 20% a 35% mais barato que a soma das visitas avulsas, você tem data fixa reservada na agenda (não disputa horário na alta temporada) e o jardim nunca chega ao estado em que precisa de uma revitalização caríssima.",
  },
  {
    group: "Planos e assinatura",
    q: "Existe fidelidade ou multa para cancelar?",
    a: "Nenhuma fidelidade e nenhuma multa. Você cancela quando quiser pelo painel do cliente, em dois cliques. O plano segue ativo até o fim do período já pago.",
  },
  {
    group: "Planos e assinatura",
    q: "Posso mudar de plano depois?",
    a: "Sim, quantas vezes quiser. No upgrade a diferença é proporcional e vale na hora; no downgrade a mudança entra no próximo ciclo de cobrança.",
  },
  {
    group: "Planos e assinatura",
    q: "Posso pausar o plano nas férias ou no inverno?",
    a: "Pode pausar por até 60 dias por ano sem perder o preço contratado. É só solicitar no painel do cliente.",
  },
  {
    group: "Planos e assinatura",
    q: "Meu jardim é maior que a área inclusa no plano. E aí?",
    a: "Adicionamos a área excedente por m² com valor fixo informado antes da contratação. Sem surpresa na fatura.",
  },
  {
    group: "Agendamento",
    q: "Quanto tempo antes preciso agendar?",
    a: "Serviços avulsos costumam ter vaga em 48 a 72 horas. Assinantes têm data fixa reservada. Para urgência (notificação da prefeitura, evento, visita de compra do imóvel) temos encaixe em até 24h no WhatsApp.",
  },
  {
    group: "Agendamento",
    q: "Preciso estar em casa no dia do serviço?",
    a: "Não. Muitos clientes deixam o portão destravado ou combinam a chave com o zelador. Enviamos fotos antes e depois pelo WhatsApp e o relatório fica no seu painel.",
  },
  {
    group: "Agendamento",
    q: "E se chover no dia agendado?",
    a: "Reagendamos sem custo para a primeira data disponível — normalmente em 48 horas. Avisamos por WhatsApp com antecedência assim que a previsão fecha.",
  },
  {
    group: "Agendamento",
    q: "Consigo escolher o horário?",
    a: "Sim. O calendário online mostra os horários realmente disponíveis, das 7h às 17h, de segunda a sábado.",
  },
  {
    group: "Preços e pagamento",
    q: "Como o preço é calculado?",
    a: "Por área (m²), tipo de serviço e frequência. O simulador do site dá uma estimativa na hora; o valor fechado sai depois que confirmamos a área — e nunca sobe sem sua aprovação.",
  },
  {
    group: "Preços e pagamento",
    q: "Quais formas de pagamento vocês aceitam?",
    a: "PIX, cartão de crédito (com assinatura recorrente automática), boleto para PJ e link de pagamento. Serviços avulsos podem ser pagos após a execução.",
  },
  {
    group: "Preços e pagamento",
    q: "O orçamento é realmente gratuito?",
    a: "Sim, orçamento e visita técnica de avaliação são gratuitos e sem compromisso em todas as cidades que atendemos.",
  },
  {
    group: "Preços e pagamento",
    q: "Tem cobrança de taxa de deslocamento?",
    a: "Não nas cidades da nossa área de cobertura. Em regiões limítrofes informamos a taxa no orçamento, antes de você decidir.",
  },
  {
    group: "Atendimento",
    q: "Quais cidades vocês atendem?",
    a: "Campinas e região, com 14 cidades cobertas. Veja o mapa completo na página Atendemos — e se a sua não estiver lá, nos chame no WhatsApp: estamos expandindo todo mês.",
  },
  {
    group: "Atendimento",
    q: "E se eu não gostar do serviço?",
    a: "Garantia de satisfação: avise em até 72 horas e refazemos o que não ficou bom, sem cobrar nada. Se ainda assim não resolver, devolvemos o valor da visita.",
  },
  {
    group: "Atendimento",
    q: "Como acompanho meus serviços?",
    a: "Pelo painel do cliente: próximos serviços, histórico completo, fotos antes e depois, faturas e status em tempo real. Também avisamos por WhatsApp em cada etapa.",
  },
  {
    group: "Atendimento",
    q: "Vocês atendem fazendas e sítios?",
    a: "Sim, com equipe e equipamento dimensionados para grandes áreas: roçadeiras costais, trator cortador e equipes de até 6 pessoas. O orçamento é sempre personalizado.",
  },
];

export const faqHome = faq.filter((_, i) => [0, 5, 6, 10, 11, 14, 15, 19].includes(i));
