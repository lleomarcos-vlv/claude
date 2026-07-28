import { createHmac, timingSafeEqual } from "node:crypto";

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/**
 * Rate limit em memória por chave (IP + rota). Suficiente para uma instância;
 * em deploy multi-instância troque o store por Redis/Upstash mantendo a mesma assinatura.
 */
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false, remaining: 0, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { ok: true, remaining: limit - bucket.count, retryAfter: 0 };
}

/** Limpeza periódica para o Map não crescer indefinidamente. */
if (typeof setInterval !== "undefined") {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
  }, 60_000);
  // Não impede o processo de encerrar.
  timer.unref?.();
}

export function clientIp(req: Request) {
  const headers = req.headers;
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? headers.get("cf-connecting-ip") ?? "0.0.0.0";
}

// ---------------------------------------------------------------------------
// Captcha
// ---------------------------------------------------------------------------

function captchaSecret() {
  return process.env.AUTH_SECRET ?? "verde-fixo-dev-secret-nao-usar-em-producao";
}

export type CaptchaChallenge = { question: string; token: string };

/**
 * Desafio aritmético assinado, sem estado no servidor e sem script de terceiro.
 * O token guarda a resposta esperada + validade, assinados por HMAC.
 *
 * Quando `HCAPTCHA_SECRET` está configurado, `verifyCaptcha` aceita também
 * o token do hCaptcha — permitindo trocar de mecanismo sem alterar os formulários.
 */
export function createCaptcha(): CaptchaChallenge {
  const a = 2 + Math.floor(Math.random() * 8);
  const b = 1 + Math.floor(Math.random() * 8);
  const operation = Math.random() > 0.45 ? "+" : "-";
  const [x, y] = operation === "-" && b > a ? [b, a] : [a, b];
  const answer = operation === "+" ? x + y : x - y;
  const exp = Date.now() + 15 * 60_000;

  const payload = `${answer}.${exp}`;
  const mac = createHmac("sha256", captchaSecret()).update(payload).digest("base64url");

  return {
    question: `Quanto é ${numberWord(x)} ${operation === "+" ? "mais" : "menos"} ${numberWord(y)}?`,
    token: `${Buffer.from(payload).toString("base64url")}.${mac}`,
  };
}

const words = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez"];
const numberWord = (n: number) => words[n] ?? String(n);

export async function verifyCaptcha(token: string | undefined, answer: string | undefined) {
  if (process.env.CAPTCHA_DISABLED === "true") return true;

  // hCaptcha / reCAPTCHA, quando configurado
  if (process.env.HCAPTCHA_SECRET && token && token.length > 120) {
    return verifyHCaptcha(token);
  }

  if (!token || answer === undefined || answer === "") return false;

  const [dataB64, mac] = token.split(".");
  if (!dataB64 || !mac) return false;

  const payload = Buffer.from(dataB64, "base64url").toString();
  const expected = createHmac("sha256", captchaSecret()).update(payload).digest("base64url");
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  const [expectedAnswer, exp] = payload.split(".");
  if (Number(exp) < Date.now()) return false;

  return Number(answer.trim()) === Number(expectedAnswer);
}

async function verifyHCaptcha(token: string) {
  try {
    const res = await fetch("https://api.hcaptcha.com/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: process.env.HCAPTCHA_SECRET!, response: token }),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Anti-spam adicional
// ---------------------------------------------------------------------------

/**
 * Heurísticas contra bots que não executam JavaScript ou preenchem tudo:
 *  · honeypot: campo oculto que humano nunca preenche;
 *  · time trap: formulário enviado em menos de 2,5 s.
 */
export function isLikelySpam(input: { honeypot?: unknown; renderedAt?: unknown }) {
  if (typeof input.honeypot === "string" && input.honeypot.trim() !== "") return true;

  const renderedAt = Number(input.renderedAt);
  if (Number.isFinite(renderedAt) && renderedAt > 0) {
    const elapsed = Date.now() - renderedAt;
    if (elapsed < 2_500 || elapsed > 6 * 60 * 60_000) return true;
  }
  return false;
}

const SUSPICIOUS = [/\bhttps?:\/\/\S+\b.*\bhttps?:\/\/\S+/i, /\[url=/i, /\bviagra\b/i, /\bcasino\b/i, /\bcrypto\s*invest/i];

export function looksLikeSpamContent(text: string) {
  return SUSPICIOUS.some((re) => re.test(text));
}
