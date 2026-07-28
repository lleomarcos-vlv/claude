import { prisma } from "@/lib/db";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { chatSchema } from "@/lib/validation";
import { clientIp, rateLimit } from "@/lib/security";
import { estimate } from "@/lib/pricing";
import { money, moneyShort } from "@/lib/format";
import { plans } from "@/content/plans";
import { MIN_VISIT_PRICE, services } from "@/content/services";
import { cities } from "@/content/cities";
import { site, whatsappLink } from "@/lib/site";

export const dynamic = "force-dynamic";

/**
 * Atendimento automatizado do chat.
 *
 * Motor de intenção por palavra-chave, respondendo com os números reais do
 * catálogo (mesmas funções de precificação do simulador). Toda conversa fica
 * registrada em `Message` para a equipe retomar de onde parou.
 *
 * Não usa LLM de propósito: as respostas precisam ser exatas quanto a preço e
 * cobertura, e o custo por atendimento fica zero.
 */
export async function POST(request: Request) {
  try {
    const limited = rateLimit(`chat:${clientIp(request)}`, 30, 5 * 60_000);
    if (!limited.ok) return fail("Muitas mensagens. Aguarde um instante.", 429);

    const input = chatSchema.parse(await readJson(request));
    const answer = respond(input.message);

    // Registro para a equipe (best effort — o chat nunca deve falhar por isso).
    void prisma.message
      .create({
        data: {
          channel: "CHAT",
          direction: "IN",
          name: input.lead?.name ?? "Visitante do site",
          email: input.lead?.email ?? null,
          phone: input.lead?.phone ?? null,
          body: input.message,
          status: answer.needsHuman ? "NOVO" : "RESPONDIDO",
          meta: JSON.stringify({ intent: answer.intent, reply: answer.reply }),
        },
      })
      .catch(() => {});

    return ok({ reply: answer.reply, quickReplies: answer.quickReplies, link: answer.link });
  } catch (error) {
    return handleError(error, "chat");
  }
}

type Answer = {
  intent: string;
  reply: string;
  quickReplies?: string[];
  link?: { href: string; label: string };
  needsHuman?: boolean;
};

const norm = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

function respond(raw: string): Answer {
  const text = norm(raw);
  const area = extractArea(text);
  const service = matchService(text);

  // --- Preço ---
  if (/(quanto|preco|preço|valor|custa|orcamento|orçamento|cobram|tabela)/.test(text)) {
    if (area) {
      const result = estimate({ serviceSlug: service?.slug ?? "corte-de-grama", areaM2: area, frequency: "quinzenal" });
      if (result && !result.quoteOnly && result.perVisit) {
        const plan = result.recommended;
        return {
          intent: "preco_com_area",
          reply:
            `Para ${area} m² de ${result.service.name.toLowerCase()}, a faixa é de ${moneyShort(result.perVisit.min)} a ${moneyShort(result.perVisit.max)} por visita no avulso.` +
            (result.minVisitApplied ? `\n\nNessa metragem vale o mínimo de visita de ${money(MIN_VISIT_PRICE)}.` : "") +
            (plan?.price
              ? `\n\nMas o ${plan.plan.name} sai ${moneyShort(plan.price)}/mês com ${plan.plan.visitsPerMonth === -1 ? "visitas ilimitadas" : `${plan.plan.visitsPerMonth} visitas`} — costuma valer bem mais a pena.`
              : ""),
          quickReplies: ["Quero assinar um plano", "Quero agendar avulso", "O que está incluído?"],
          link: { href: `/simulador?area=${area}`, label: "Ver simulação completa" },
        };
      }
      return {
        intent: "preco_projeto",
        reply: `${service?.name ?? "Esse serviço"} depende de projeto e material, então trabalhamos com orçamento personalizado. A visita técnica de avaliação é gratuita e o orçamento sai em até 2 horas úteis.`,
        quickReplies: ["Pedir orçamento", "Quais serviços vocês fazem?"],
        link: { href: `/orcamento?servico=${service?.slug ?? ""}`, label: "Pedir orçamento gratuito" },
      };
    }

    return {
      intent: "preco_sem_area",
      reply:
        `Nosso preço é por metro quadrado:\n\n· Corte de grama: R$ 2,50 a R$ 4,50/m²\n· Adubação e tratamentos: R$ 3,00 a R$ 6,00/m²\n· Limpeza pesada: R$ 8,00 a R$ 12,00/m²\n\n` +
        `O mínimo de visita para avulso é ${money(MIN_VISIT_PRICE)}. Me diz quantos m² tem seu jardim que eu calculo na hora.`,
      quickReplies: ["Tenho 100 m²", "Tenho 300 m²", "Não sei a metragem", "Ver planos"],
    };
  }

  // --- Planos ---
  if (/(plano|assinatura|assinar|clube|mensal|mensalidade|recorrente)/.test(text)) {
    return {
      intent: "planos",
      reply:
        `O Clube Verde Fixo tem três pacotes:\n\n` +
        plans
          .map(
            (p) =>
              `· ${p.name} — a partir de ${moneyShort(p.priceMonthly)}/mês (${p.visitsPerMonth === -1 ? "visitas ilimitadas" : `${p.visitsPerMonth} visitas/mês`})`,
          )
          .join("\n") +
        `\n\nSem fidelidade e sem multa: cancela quando quiser. O valor varia com o porte do terreno.`,
      quickReplies: ["Qual plano é melhor pra mim?", "Quanto custa pro meu jardim?", "O que está incluído?"],
      link: { href: "/planos", label: "Comparar os planos" },
    };
  }

  // --- Agendamento ---
  if (/(agendar|agendamento|marcar|horario|horário|data|disponibilidade|quando|amanha|amanhã)/.test(text)) {
    return {
      intent: "agendamento",
      reply:
        `Dá para agendar em 1 minuto aqui no site: você escolhe o serviço, vê os horários realmente livres (7h às 17h, de segunda a sábado) e recebe o protocolo na hora.\n\n` +
        `Avulso costuma ter vaga em 48 a 72 horas. Para urgência, chame no WhatsApp que a gente encaixa em até 24h.`,
      quickReplies: ["Quanto custa?", "Quais serviços vocês fazem?"],
      link: { href: "/agendamento", label: "Abrir o agendamento" },
    };
  }

  // --- Cobertura ---
  if (/(atende|atendem|cidade|regiao|região|onde|local|bairro|mora)/.test(text)) {
    const found = cities.find((c) => text.includes(norm(c.city)));
    if (found) {
      return {
        intent: "cobertura_cidade",
        reply: `Sim, atendemos ${found.city}! Resposta em até ${found.responseTime} e orçamento gratuito. Quer agendar ou prefere um orçamento primeiro?`,
        quickReplies: ["Quero agendar", "Quero orçamento", "Quanto custa?"],
        link: { href: `/atendemos/${found.slug}`, label: `Ver página de ${found.city}` },
      };
    }
    return {
      intent: "cobertura",
      reply:
        `Atendemos ${cities.length} cidades na região de Campinas: ${cities.map((c) => c.city).join(", ")}.\n\n` +
        `Se a sua não está na lista, me diz qual é — estamos expandindo todo mês.`,
      quickReplies: ["Quanto custa?", "Quero agendar"],
      link: { href: "/atendemos", label: "Ver mapa de cobertura" },
    };
  }

  // --- Serviços ---
  if (/(servico|serviço|fazem|fazer|corte|grama|poda|paisagismo|jardinagem|limpeza|irrigacao|irrigação|praga|aduba|plantio)/.test(text)) {
    if (service) {
      return {
        intent: "servico_especifico",
        reply:
          `${service.name}: ${service.shortDesc}\n\nO que está incluído:\n` +
          service.includes.map((i) => `· ${i}`).join("\n"),
        quickReplies: ["Quanto custa?", "Quero agendar", "Ver planos"],
        link: { href: `/servicos/${service.slug}`, label: `Ver ${service.name}` },
      };
    }
    return {
      intent: "servicos",
      reply:
        `Fazemos 10 serviços com equipe própria:\n\n` +
        services.map((s) => `· ${s.name}`).join("\n") +
        `\n\nSobre qual deles você quer saber?`,
      quickReplies: ["Corte de grama", "Paisagismo", "Limpeza de terreno", "Quanto custa?"],
      link: { href: "/servicos", label: "Ver todos os serviços" },
    };
  }

  // --- Objeções comuns ---
  if (/(fidelidade|multa|cancelar|cancelamento|contrato)/.test(text)) {
    return {
      intent: "cancelamento",
      reply:
        `Nenhuma fidelidade e nenhuma multa. Você cancela em dois cliques no painel do cliente e o plano segue ativo até o fim do período já pago.\n\n` +
        `Também pode pausar por até 60 dias por ano sem perder o preço contratado.`,
      quickReplies: ["Ver planos", "Quanto custa?"],
    };
  }

  if (/(garantia|nao gostar|não gostar|reclamacao|reclamação|refazer)/.test(text)) {
    return {
      intent: "garantia",
      reply: `Garantia de satisfação: se algo não ficou bom, avise em até 72 horas e refazemos sem cobrar. Se ainda assim não resolver, devolvemos o valor da visita.`,
      quickReplies: ["Ver planos", "Quero agendar"],
    };
  }

  if (/(pagamento|pagar|pix|cartao|cartão|boleto|nota fiscal|nf)/.test(text)) {
    return {
      intent: "pagamento",
      reply:
        `Aceitamos PIX, cartão de crédito (com assinatura recorrente automática), boleto para PJ e link de pagamento.\n\n` +
        `Emitimos nota fiscal para pessoa física e jurídica. Serviços avulsos podem ser pagos depois da execução.`,
      quickReplies: ["Ver planos", "Quero agendar"],
    };
  }

  if (/(falar|humano|atendente|pessoa|ligar|telefone|whatsapp)/.test(text)) {
    return {
      intent: "humano",
      reply: `Claro! Fala com a nossa equipe no WhatsApp ${site.whatsappLabel} — atendemos de segunda a sexta das 7h às 19h e sábado até as 15h.`,
      link: { href: whatsappLink("Olá! Vim pelo chat do site e gostaria de falar com um atendente."), label: "Abrir WhatsApp" },
      needsHuman: true,
    };
  }

  if (/(oi|ola|olá|bom dia|boa tarde|boa noite|tudo bem)/.test(text)) {
    return {
      intent: "saudacao",
      reply: `Olá! 🌿 Posso te ajudar com preço, agendamento, planos ou tirar dúvidas sobre os serviços. O que você precisa?`,
      quickReplies: ["Quanto custa?", "Ver planos", "Quero agendar", "Vocês atendem minha cidade?"],
    };
  }

  // --- Fallback ---
  return {
    intent: "desconhecido",
    reply:
      `Não tenho certeza se entendi. Posso ajudar com:\n\n· Preço e simulação por m²\n· Agendamento de serviço\n· Planos do Clube Verde Fixo\n· Cidades atendidas\n\n` +
      `Ou, se preferir, chamo alguém da equipe no WhatsApp.`,
    quickReplies: ["Quanto custa?", "Ver planos", "Quero agendar", "Falar com atendente"],
    needsHuman: true,
  };
}

function extractArea(text: string) {
  const match =
    /(\d{1,6})\s*(m2|m²|metros quadrados|metros|mts)/.exec(text) ??
    /(?:tenho|area de|área de|sao|são|uns|cerca de)\s*(\d{1,6})/.exec(text);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) && value >= 5 && value <= 200_000 ? value : null;
}

function matchService(text: string) {
  const aliases: Record<string, string> = {
    "corte-de-grama": "corte|grama|gramado|cortar|aparar",
    paisagismo: "paisagismo|paisagista|projeto|redesenh",
    jardinagem: "jardinagem|jardineiro|manutencao|canteiro",
    poda: "poda|podar|arvore|árvore|cerca viva|cerca-viva|topiaria|arbusto",
    "limpeza-de-terreno": "limpeza de terreno|terreno|mato alto|rocada|roçada|capina|lote|entulho",
    plantio: "plantio|plantar|muda|placa de grama|forracao",
    adubacao: "aduba|adubo|nutri|solo pobre|amarel",
    "controle-de-pragas": "praga|formiga|cupim|lagarta|fungo|inseto",
    irrigacao: "irriga|aspersor|gotejamento|rega|molhar",
    "revitalizacao-de-jardins": "revitaliza|recuperar|abandonado|recupera",
  };

  for (const [slug, pattern] of Object.entries(aliases)) {
    if (new RegExp(pattern).test(text)) return services.find((s) => s.slug === slug);
  }
  return undefined;
}
