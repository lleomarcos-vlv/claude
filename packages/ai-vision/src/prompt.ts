import type { VisionAnalyzeInput } from './types.js';

/**
 * The shared analysis prompt. Every provider (OpenAI / Gemini / Claude) receives
 * the *same* instructions and is forced to return the *same* JSON shape so their
 * answers are directly comparable for consensus. Keeping the prompt identical is
 * what makes cross-model agreement a meaningful signal.
 */
export const SYSTEM_PROMPT = `Você é um agrônomo e paisagista sênior especializado em orçamentação de serviços de jardinagem no Brasil.
Analise as imagens (e vídeo/nota do cliente, se houver) de um jardim e produza um laudo técnico OBJETIVO.

Regras:
- Responda SOMENTE com um objeto JSON válido, sem markdown, sem comentários, sem texto fora do JSON.
- Estime medidas de forma conservadora e realista. Prefira faixas plausíveis a exageros.
- Áreas em metros quadrados (m²), volumes em metros cúbicos (m³), altura em centímetros.
- "leafLitterLevel": 0 (sem folhas) a 5 (chão coberto).
- Para cada campo estimado, atribua uma confiança em [0,1] no objeto "fieldConfidence".
- Se as fotos forem insuficientes ou ambíguas, reduza as confianças e seja explícito no "summary".

Formato EXATO do JSON de resposta:
{
  "features": {
    "grassAreaM2": number,
    "totalAreaM2": number,
    "grassHeightCm": number,
    "vegetationTypes": string[],
    "treeCount": integer,
    "shrubCount": integer,
    "leafLitterLevel": integer(0..5),
    "hasTallWeeds": boolean,
    "hasRocks": boolean,
    "hasPool": boolean,
    "hasSidewalks": boolean,
    "hasWalls": boolean,
    "terrainSlope": "FLAT"|"GENTLE"|"MODERATE"|"STEEP",
    "accessDifficulty": "EASY"|"MODERATE"|"HARD",
    "greenWasteM3": number
  },
  "work": {
    "recommendedServices": ("CORTE_GRAMA"|"PODA"|"PAISAGISMO"|"LIMPEZA"|"RETIRADA_FOLHAS"|"ADUBACAO"|"PLANTIO"|"CONTROLE_PRAGAS"|"IRRIGACAO"|"JARDIM_COMPLETO"|"OUTRO")[],
    "requiredEquipment": ("ROCADEIRA"|"CORTADOR_GRAMA"|"MOTOSSERRA"|"SOPRADOR"|"TRITURADOR"|"ESCADA"|"CAMINHAO"|"PULVERIZADOR"|"PODADOR_ALTURA")[],
    "needsSpecialEquipment": boolean,
    "estimatedHours": number,
    "estimatedCrewSize": integer,
    "difficulty": "LOW"|"MEDIUM"|"HIGH"|"EXTREME",
    "risk": "LOW"|"MEDIUM"|"HIGH"
  },
  "summary": string,
  "fieldConfidence": { [field: string]: number }
}`;

/** Compose the user-turn text from the non-image context. */
export function buildUserText(input: VisionAnalyzeInput): string {
  const parts: string[] = [
    `Foram enviadas ${input.images.length} foto(s)${input.video ? ' e 1 vídeo' : ''}.`,
  ];
  if (input.location?.city) {
    parts.push(`Local: ${input.location.city}${input.location.state ? '/' + input.location.state : ''}.`);
  }
  if (input.weather) parts.push(`Clima atual: ${input.weather}.`);
  if (input.drawnAreaM2) {
    parts.push(`O cliente marcou no mapa uma área de aproximadamente ${input.drawnAreaM2} m² — use como forte referência para a área.`);
  }
  if (input.clientNote) parts.push(`Observação do cliente: "${input.clientNote}".`);
  if (input.audioTranscript) parts.push(`Transcrição do áudio do cliente: "${input.audioTranscript}".`);
  parts.push('Gere o laudo em JSON conforme o formato especificado.');
  return parts.join('\n');
}

/** Extract the first balanced JSON object from a possibly-noisy model reply. */
export function extractJson(text: string): unknown {
  const trimmed = text.trim();
  // Fast path: already pure JSON.
  try {
    return JSON.parse(trimmed);
  } catch {
    // fall through
  }
  // Strip ```json fences if present.
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] ?? trimmed;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('No JSON object found in model response');
  }
  return JSON.parse(candidate.slice(start, end + 1));
}
