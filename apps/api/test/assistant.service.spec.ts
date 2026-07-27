import { describe, expect, it } from 'vitest';
import { ServiceType } from '@jardimja/shared';
import { AssistantService } from '../src/modules/ai/assistant.service.js';

const assistant = new AssistantService();
const types = (r: ReturnType<AssistantService['reply']>) => r.suggestedServices.map((s) => s.type);

describe('AssistantService', () => {
  it('maps "deixar meu jardim bonito" to paisagismo', () => {
    const r = assistant.reply('quero deixar meu jardim bonito');
    expect(types(r)).toContain(ServiceType.PAISAGISMO);
    expect(r.nextStep).toBe('CAPTURE_PHOTOS');
  });

  it('detects grass/tall weeds → corte de grama', () => {
    expect(types(assistant.reply('a grama está muito alta e cheia de mato'))).toContain(ServiceType.CORTE_GRAMA);
  });

  it('detects pests → controle de pragas', () => {
    expect(types(assistant.reply('minhas plantas estão com formiga e fungo'))).toContain(ServiceType.CONTROLE_PRAGAS);
  });

  it('falls back to a full makeover when intent is vague', () => {
    expect(types(assistant.reply('me ajuda aí'))).toContain(ServiceType.JARDIM_COMPLETO);
  });

  it('always returns at least one suggestion with a rationale', () => {
    const r = assistant.reply('poda das árvores e plantio de mudas novas');
    expect(r.suggestedServices.length).toBeGreaterThan(0);
    for (const s of r.suggestedServices) {
      expect(s.label).toBeTruthy();
      expect(s.why).toBeTruthy();
    }
    expect(types(r)).toEqual(expect.arrayContaining([ServiceType.PODA, ServiceType.PLANTIO]));
  });
});
