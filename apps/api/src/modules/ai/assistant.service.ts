import { Injectable } from '@nestjs/common';
import { ServiceType, ServiceTypeLabel } from '@jardimja/shared';

export interface AssistantReply {
  message: string;
  suggestedServices: { type: ServiceType; label: string; why: string }[];
  nextStep: 'CAPTURE_PHOTOS' | 'ASK_MORE';
}

/**
 * Conversational assistant. Turns a free-text wish ("quero deixar meu jardim
 * bonito") into concrete service suggestions and a next action. Implemented as a
 * transparent keyword/intent mapper with a clean seam to swap in an LLM
 * (`@jardimja/ai-vision` text model) for richer dialogue — the contract stays
 * the same so the client UI never changes.
 */
@Injectable()
export class AssistantService {
  reply(text: string): AssistantReply {
    const t = text.toLowerCase();
    const picks = new Map<ServiceType, string>();

    const add = (s: ServiceType, why: string) => {
      if (!picks.has(s)) picks.set(s, why);
    };

    if (/(grama|gramado|mato|alto|corta)/.test(t)) add(ServiceType.CORTE_GRAMA, 'Você mencionou grama/mato alto.');
    if (/(poda|árvore|arvore|galho|arbusto)/.test(t)) add(ServiceType.PODA, 'Árvores/arbustos costumam precisar de poda.');
    if (/(folha|folhas|limpar|limpeza|sujo|bagunça)/.test(t)) add(ServiceType.RETIRADA_FOLHAS, 'Limpeza e retirada de folhas deixam o jardim apresentável.');
    if (/(bonito|lindo|reformar|projeto|paisag)/.test(t)) add(ServiceType.PAISAGISMO, 'Para "deixar bonito", o paisagismo redesenha canteiros e espécies.');
    if (/(praga|inseto|doente|amarel|fungo|formiga|cupim)/.test(t)) add(ServiceType.CONTROLE_PRAGAS, 'Sinais de pragas/doenças pedem controle específico.');
    if (/(plantar|muda|flor|nova|adub)/.test(t)) {
      add(ServiceType.PLANTIO, 'Você quer novas plantas/mudas.');
      add(ServiceType.ADUBACAO, 'Adubação melhora o vigor após o plantio.');
    }
    if (/(irriga|regar|água|agua|seco)/.test(t)) add(ServiceType.IRRIGACAO, 'Um sistema de irrigação mantém tudo saudável.');

    // Default: a full makeover.
    if (picks.size === 0) {
      add(ServiceType.JARDIM_COMPLETO, 'Vamos avaliar tudo com um serviço de jardim completo.');
      add(ServiceType.CORTE_GRAMA, 'Começar pelo corte costuma ser o primeiro passo.');
    }

    const suggestedServices = [...picks.entries()].map(([type, why]) => ({
      type,
      label: ServiceTypeLabel[type],
      why,
    }));

    return {
      message:
        'Entendi! Com base no que você descreveu, sugiro os serviços abaixo. ' +
        'Para eu gerar um orçamento estimado agora, tire de 4 a 30 fotos do jardim (e um vídeo, se puder).',
      suggestedServices,
      nextStep: 'CAPTURE_PHOTOS',
    };
  }
}
