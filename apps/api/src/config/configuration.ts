/** Typed application configuration, loaded from environment variables. */
export interface AppConfig {
  env: string;
  port: number;
  jwt: { secret: string; accessTtl: number; refreshTtl: number };
  ai: {
    providers: string;
    minQuorum: number;
    timeoutMs: number;
    openai: { apiKey?: string; model: string };
    gemini: { apiKey?: string; model: string };
    anthropic: { apiKey?: string; model: string };
  };
  payments: { provider: string; platformFeePercent: number };
  storage: { endpoint?: string; bucket: string; publicUrl?: string };
  redisUrl: string;
}

export default (): AppConfig => ({
  env: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.API_PORT ?? 3333),
  jwt: {
    secret: process.env.JWT_SECRET ?? 'dev-insecure-secret-change-me',
    accessTtl: Number(process.env.JWT_ACCESS_TTL ?? 900),
    refreshTtl: Number(process.env.JWT_REFRESH_TTL ?? 2_592_000),
  },
  ai: {
    providers: process.env.AI_VISION_PROVIDERS ?? 'openai,gemini,anthropic',
    minQuorum: Number(process.env.AI_VISION_MIN_QUORUM ?? 2),
    timeoutMs: Number(process.env.AI_VISION_TIMEOUT_MS ?? 30_000),
    openai: { apiKey: process.env.OPENAI_API_KEY, model: process.env.OPENAI_VISION_MODEL ?? 'gpt-4o' },
    gemini: { apiKey: process.env.GEMINI_API_KEY, model: process.env.GEMINI_VISION_MODEL ?? 'gemini-2.0-flash' },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.ANTHROPIC_VISION_MODEL ?? 'claude-sonnet-5',
    },
  },
  payments: {
    provider: process.env.PAYMENTS_PROVIDER ?? 'mercadopago',
    platformFeePercent: Number(process.env.PLATFORM_FEE_PERCENT ?? 10) / 100,
  },
  storage: {
    endpoint: process.env.S3_ENDPOINT,
    bucket: process.env.S3_BUCKET ?? 'jardimja-media',
    publicUrl: process.env.S3_PUBLIC_URL,
  },
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
});
