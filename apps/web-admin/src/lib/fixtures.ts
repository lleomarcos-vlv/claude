/**
 * ============================================================================
 *  MOCK FIXTURES — development fallback data.
 * ============================================================================
 *  These typed fixtures are returned by the API client ONLY when a real request
 *  to the backend fails (network error / server unreachable), so the whole admin
 *  UI renders while the API is not running. Everything here is fake but realistic
 *  and conforms to the shared domain contracts. Do NOT rely on this in prod.
 * ============================================================================
 */
import {
  AccessDifficulty,
  DifficultyLevel,
  Equipment,
  JobStatus,
  MediaKind,
  OfferStatus,
  RiskLevel,
  ServiceType,
  TerrainSlope,
  UserRole,
} from '@jardimja/shared';
import type {
  AdminStats,
  AuthResponse,
  Gardener,
  JobDetail,
  JobListItem,
  Paginated,
} from './types';
import { GardenerStatus } from './types';

/** Deterministic pseudo-random so mock lists stay stable across renders. */
function seeded(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// --- Auth ------------------------------------------------------------------

export const MOCK_AUTH_RESPONSE: AuthResponse = {
  accessToken: 'mock.access.token',
  refreshToken: 'mock.refresh.token',
  user: {
    id: 'usr_admin_mock',
    name: 'Operação JardimJá',
    email: 'admin@jardimja.com.br',
    role: UserRole.ADMIN,
  },
};

// --- Dashboard stats -------------------------------------------------------

function buildRevenueSeries(): { date: string; cents: number }[] {
  const rand = seeded(42);
  const days = 30;
  const out: { date: string; cents: number }[] = [];
  const now = new Date('2026-07-27T00:00:00Z');
  let base = 380_000; // ~R$ 3.800/dia
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setUTCDate(now.getUTCDate() - i);
    const weekday = d.getUTCDay();
    const weekendBoost = weekday === 5 || weekday === 6 ? 1.35 : 1;
    const noise = 0.75 + rand() * 0.6;
    base += (rand() - 0.4) * 22_000; // gentle upward drift
    out.push({
      date: d.toISOString().slice(0, 10),
      cents: Math.max(120_000, Math.round(base * weekendBoost * noise)),
    });
  }
  return out;
}

export const MOCK_STATS: AdminStats = {
  users: { total: 4820, clients: 4187, gardeners: 633 },
  jobs: { total: 2964, completed: 1877, quoted: 2611 },
  revenueCents: 11_842_300,
  profitCents: 2_310_150,
  conversionRate: 0.632,
  seriesRevenue: buildRevenueSeries(),
  jobsByStatus: [
    { status: JobStatus.QUOTED, count: 214 },
    { status: JobStatus.MATCHING, count: 132 },
    { status: JobStatus.OFFERED, count: 98 },
    { status: JobStatus.SCHEDULED, count: 76 },
    { status: JobStatus.IN_PROGRESS, count: 41 },
    { status: JobStatus.COMPLETED, count: 1877 },
    { status: JobStatus.PAID, count: 1720 },
    { status: JobStatus.CANCELLED, count: 187 },
    { status: JobStatus.DISPUTED, count: 22 },
  ],
  // Spread around São Paulo / Campinas / Rio for a believable heatmap.
  heatmap: (() => {
    const rand = seeded(7);
    const hubs = [
      { lat: -23.5505, lng: -46.6333, w: 1 }, // São Paulo
      { lat: -22.9068, lng: -43.1729, w: 0.7 }, // Rio de Janeiro
      { lat: -22.9099, lng: -47.0626, w: 0.55 }, // Campinas
      { lat: -23.9608, lng: -46.3336, w: 0.4 }, // Santos
    ];
    const points: { lat: number; lng: number; weight: number }[] = [];
    for (const hub of hubs) {
      const n = Math.round(18 * hub.w) + 6;
      for (let i = 0; i < n; i += 1) {
        points.push({
          lat: hub.lat + (rand() - 0.5) * 0.9,
          lng: hub.lng + (rand() - 0.5) * 0.9,
          weight: Math.round((0.2 + rand() * 0.8) * hub.w * 100) / 100,
        });
      }
    }
    return points;
  })(),
};

// --- Jobs ------------------------------------------------------------------

const CLIENT_NAMES = [
  'Marina Alves',
  'Rodrigo Teixeira',
  'Condomínio Alphaville',
  'Beatriz Nogueira',
  'Carlos Menezes',
  'Fernanda Lima',
  'Escola Verde Vida',
  'Paulo Ribeiro',
  'Juliana Castro',
  'Hotel Jardim das Palmeiras',
  'André Fontes',
  'Camila Duarte',
];

const CITIES: { city: string; state: string }[] = [
  { city: 'São Paulo', state: 'SP' },
  { city: 'Campinas', state: 'SP' },
  { city: 'Santos', state: 'SP' },
  { city: 'Rio de Janeiro', state: 'RJ' },
  { city: 'Niterói', state: 'RJ' },
  { city: 'Curitiba', state: 'PR' },
];

const JOB_STATUS_POOL: JobStatus[] = [
  JobStatus.QUOTED,
  JobStatus.MATCHING,
  JobStatus.OFFERED,
  JobStatus.SCHEDULED,
  JobStatus.IN_PROGRESS,
  JobStatus.COMPLETED,
  JobStatus.PAID,
  JobStatus.CANCELLED,
  JobStatus.DISPUTED,
];

const SERVICE_POOL: ServiceType[] = [
  ServiceType.CORTE_GRAMA,
  ServiceType.PODA,
  ServiceType.LIMPEZA,
  ServiceType.PAISAGISMO,
  ServiceType.RETIRADA_FOLHAS,
  ServiceType.ADUBACAO,
  ServiceType.PLANTIO,
  ServiceType.CONTROLE_PRAGAS,
  ServiceType.JARDIM_COMPLETO,
];

function pick<T>(arr: readonly T[], r: number): T {
  return arr[Math.floor(r * arr.length) % arr.length] as T;
}

export const MOCK_JOBS: JobListItem[] = Array.from({ length: 54 }, (_, i) => {
  const rand = seeded(1000 + i);
  const place = pick(CITIES, rand());
  const svcCount = 1 + Math.floor(rand() * 2);
  const serviceTypes = Array.from(
    new Set(Array.from({ length: svcCount }, () => pick(SERVICE_POOL, rand()))),
  );
  const created = new Date('2026-07-27T12:00:00Z');
  created.setUTCHours(created.getUTCHours() - Math.floor(rand() * 24 * 26));
  return {
    id: `job_${(2400 + i).toString().padStart(5, '0')}`,
    client: { name: pick(CLIENT_NAMES, rand()) },
    serviceTypes,
    status: pick(JOB_STATUS_POOL, rand()),
    city: place.city,
    totalCents: 8_000 + Math.floor(rand() * 62_000),
    confidence: Math.round((0.55 + rand() * 0.44) * 100) / 100,
    createdAt: created.toISOString(),
  };
});

export function mockJobsPage(
  page: number,
  pageSize: number,
  status?: JobStatus | '',
): Paginated<JobListItem> {
  const filtered = status ? MOCK_JOBS.filter((j) => j.status === status) : MOCK_JOBS;
  const start = (page - 1) * pageSize;
  return {
    items: filtered.slice(start, start + pageSize),
    total: filtered.length,
    page,
    pageSize,
  };
}

export function mockJobDetail(id: string): JobDetail {
  const base = MOCK_JOBS.find((j) => j.id === id) ?? MOCK_JOBS[0]!;
  const rand = seeded(id.split('').reduce((a, c) => a + c.charCodeAt(0), 0));
  const grassArea = Math.round(120 + rand() * 640);
  const laborCents = Math.round(base.totalCents * 0.62);
  const equipmentCents = Math.round(base.totalCents * 0.14);
  const travelCents = Math.round(base.totalCents * 0.08);
  const disposalCents = Math.round(base.totalCents * 0.06);
  const subtotalCents = laborCents + equipmentCents + travelCents + disposalCents;
  const platformFeeCents = Math.round(subtotalCents * 0.15);
  const totalCents = subtotalCents + platformFeeCents;

  return {
    ...base,
    analysis: {
      summary:
        'Jardim residencial de porte médio com gramado alto e presença de folhagem acumulada. ' +
        'Recomenda-se corte de grama com roçadeira nas bordas, retirada de folhas e poda leve de ' +
        'dois arbustos próximos ao muro. Terreno com leve inclinação e bom acesso para veículo.',
      confidence: base.confidence,
      features: {
        grassAreaM2: grassArea,
        totalAreaM2: Math.round(grassArea * 1.3),
        grassHeightCm: Math.round(8 + rand() * 22),
        vegetationTypes: ['grama-esmeralda', 'arbusto-buxinho', 'ipê-amarelo'],
        treeCount: Math.floor(rand() * 5),
        shrubCount: 2 + Math.floor(rand() * 6),
        leafLitterLevel: Math.floor(rand() * 6),
        hasTallWeeds: rand() > 0.5,
        hasRocks: rand() > 0.7,
        hasPool: rand() > 0.75,
        hasSidewalks: rand() > 0.4,
        hasWalls: true,
        terrainSlope: pick(
          [TerrainSlope.FLAT, TerrainSlope.GENTLE, TerrainSlope.MODERATE],
          rand(),
        ),
        accessDifficulty: pick(
          [AccessDifficulty.EASY, AccessDifficulty.MODERATE],
          rand(),
        ),
        greenWasteM3: Math.round((1 + rand() * 4) * 10) / 10,
      },
      work: {
        recommendedServices: base.serviceTypes,
        requiredEquipment: [Equipment.ROCADEIRA, Equipment.SOPRADOR, Equipment.PODADOR_ALTURA],
        needsSpecialEquipment: rand() > 0.6,
        estimatedHours: Math.round((2 + rand() * 5) * 10) / 10,
        estimatedCrewSize: 1 + Math.floor(rand() * 2),
        difficulty: pick(
          [DifficultyLevel.LOW, DifficultyLevel.MEDIUM, DifficultyLevel.HIGH],
          rand(),
        ),
        risk: pick([RiskLevel.LOW, RiskLevel.MEDIUM], rand()),
      },
      fieldAgreement: {
        grassAreaM2: 0.82,
        grassHeightCm: 0.71,
        treeCount: 0.9,
        difficulty: 0.66,
      },
      providers: [
        { id: 'openai', ok: true, latencyMs: 2140 },
        { id: 'gemini', ok: true, latencyMs: 1870 },
        { id: 'anthropic', ok: true, latencyMs: 2610 },
      ],
      warnings: rand() > 0.6 ? ['Poucas fotos do fundo do quintal'] : [],
    },
    quote: {
      currency: 'BRL',
      lineItems: [
        {
          key: 'labor',
          label: 'Mão de obra',
          amountCents: laborCents,
          explanation: 'Estimativa por horas × tamanho da equipe × produtividade da região.',
        },
        {
          key: 'equipment',
          label: 'Equipamentos',
          amountCents: equipmentCents,
          explanation: 'Roçadeira, soprador e podador de altura.',
        },
        {
          key: 'travel',
          label: 'Deslocamento',
          amountCents: travelCents,
          explanation: 'Distância estimada até o local.',
        },
        {
          key: 'disposal',
          label: 'Descarte de resíduos',
          amountCents: disposalCents,
          explanation: 'Volume de resíduo verde a ser removido.',
        },
      ],
      subtotalCents,
      platformFeeCents,
      totalCents,
      gardenerNetCents: subtotalCents - Math.round(subtotalCents * 0.1),
      confidence: base.confidence,
      bandLowCents: Math.round(totalCents * 0.88),
      bandHighCents: Math.round(totalCents * 1.14),
      breakdownVersion: 'pricing-engine@1.4.2',
    },
    offers: [
      {
        id: 'off_1',
        gardener: { name: 'Sítio & Cia Jardinagem', ratingAvg: 4.9 },
        status: OfferStatus.CHOSEN,
        priceCents: Math.round(totalCents * 0.98),
        message: 'Posso atender ainda esta semana, tenho equipamento próprio.',
        createdAt: '2026-07-25T14:12:00Z',
      },
      {
        id: 'off_2',
        gardener: { name: 'João Paisagismo', ratingAvg: 4.6 },
        status: OfferStatus.COUNTERED,
        priceCents: Math.round(totalCents * 1.08),
        message: 'Consigo, porém o valor sobe pela inclinação do terreno.',
        createdAt: '2026-07-25T15:40:00Z',
      },
      {
        id: 'off_3',
        gardener: { name: 'Verde Vivo Serviços', ratingAvg: 4.3 },
        status: OfferStatus.PENDING,
        priceCents: Math.round(totalCents * 1.0),
        createdAt: '2026-07-25T16:05:00Z',
      },
    ],
    media: [
      { id: 'm1', kind: MediaKind.PHOTO, url: '#', label: 'Frente do jardim' },
      { id: 'm2', kind: MediaKind.PHOTO, url: '#', label: 'Gramado lateral' },
      { id: 'm3', kind: MediaKind.PHOTO, url: '#', label: 'Fundo / muro' },
      { id: 'm4', kind: MediaKind.VIDEO, url: '#', label: 'Panorâmica' },
    ],
  };
}

// --- Gardeners -------------------------------------------------------------

const GARDENER_NAMES = [
  'Sítio & Cia Jardinagem',
  'João Paisagismo',
  'Verde Vivo Serviços',
  'Antônio Prado',
  'EcoJardim ME',
  'Marcos Vinícius',
  'Raízes Paisagismo',
  'Cleber Souza',
  'Bela Grama Ltda',
  'Sandra Oliveira',
  'Gramado Nobre',
  'Tião Jardins',
  'Flora & Folha',
  'Rafael Campos',
  'Jardins do Vale',
  'Denise Martins',
];

const GARDENER_STATUS_POOL: GardenerStatus[] = [
  GardenerStatus.VERIFIED,
  GardenerStatus.VERIFIED,
  GardenerStatus.VERIFIED,
  GardenerStatus.PENDING,
  GardenerStatus.SUSPENDED,
];

export const MOCK_GARDENERS: Gardener[] = GARDENER_NAMES.map((name, i) => {
  const rand = seeded(500 + i);
  const place = pick(CITIES, rand());
  const specialties = Array.from(
    new Set(Array.from({ length: 1 + Math.floor(rand() * 3) }, () => pick(SERVICE_POOL, rand()))),
  );
  return {
    id: `grd_${(300 + i).toString().padStart(4, '0')}`,
    user: { name },
    city: place.city,
    state: place.state,
    ratingAvg: Math.round((3.9 + rand() * 1.1) * 10) / 10,
    ratingCount: 8 + Math.floor(rand() * 240),
    jobsCompleted: Math.floor(rand() * 420),
    status: pick(GARDENER_STATUS_POOL, rand()),
    specialties,
  };
});

export function mockGardenersPage(
  page: number,
  pageSize: number,
  status?: GardenerStatus | '',
): Paginated<Gardener> {
  const filtered = status ? MOCK_GARDENERS.filter((g) => g.status === status) : MOCK_GARDENERS;
  const start = (page - 1) * pageSize;
  return {
    items: filtered.slice(start, start + pageSize),
    total: filtered.length,
    page,
    pageSize,
  };
}
