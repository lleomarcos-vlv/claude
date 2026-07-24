// Internacionalização (doc 23): pt-BR / en / es. Simples e sem dependências.
// A troca de idioma recarrega a página (abordagem determinística e leve).

import { BRAND } from "./brand";

export type Lang = "pt" | "en" | "es";

const LANG_KEY = "kairos.lang";

const dict: Record<Lang, Record<string, string>> = {
  pt: {
    "app.title": BRAND.nome,
    "nav.visao": "Visão geral",
    "nav.agendamentos": "Agendamentos",
    "nav.equipamentos": "Aeronaves",
    "nav.estoque": "Estoque (KSI)",
    "nav.ordens": "Ordens de Serviço",
    "nav.ia": "IA Preditiva",
    "nav.crm": "CRM",
    "nav.financeiro": "Financeiro",
    "nav.bi": "BI",
    "nav.usuarios": "Usuários",
    "nav.auditoria": "Auditoria",
    "nav.webhooks": "Webhooks",
    "auth.entrar": "Entrar",
    "auth.criar": "Criar conta",
    "auth.email": "E-mail",
    "auth.senha": "Senha",
    "auth.entrando": "Entrando…",
    "auth.criando": "Criando…",
    "auth.criarEntrar": "Criar conta e entrar",
    "auth.sair": "sair",
    "auth.demo": "Demonstração",
    "footer": `${BRAND.nome} · manutenção DJI Agras rastreável por Serial Number · IA preditiva`,
  },
  en: {
    "app.title": BRAND.nome,
    "nav.visao": "Overview",
    "nav.agendamentos": "Scheduling",
    "nav.equipamentos": "Aircraft",
    "nav.estoque": "Inventory (KSI)",
    "nav.ordens": "Work Orders",
    "nav.ia": "Predictive AI",
    "nav.crm": "CRM",
    "nav.financeiro": "Finance",
    "nav.bi": "BI",
    "nav.usuarios": "Users",
    "nav.auditoria": "Audit",
    "nav.webhooks": "Webhooks",
    "auth.entrar": "Sign in",
    "auth.criar": "Sign up",
    "auth.email": "Email",
    "auth.senha": "Password",
    "auth.entrando": "Signing in…",
    "auth.criando": "Creating…",
    "auth.criarEntrar": "Create account and sign in",
    "auth.sair": "sign out",
    "auth.demo": "Demo",
    "footer": `${BRAND.nome} · DJI Agras maintenance traceable by Serial Number · predictive AI`,
  },
  es: {
    "app.title": BRAND.nome,
    "nav.visao": "Resumen",
    "nav.agendamentos": "Agendamientos",
    "nav.equipamentos": "Aeronaves",
    "nav.estoque": "Inventario (KSI)",
    "nav.ordens": "Órdenes de servicio",
    "nav.ia": "IA Predictiva",
    "nav.crm": "CRM",
    "nav.financeiro": "Finanzas",
    "nav.bi": "BI",
    "nav.usuarios": "Usuarios",
    "nav.auditoria": "Auditoría",
    "nav.webhooks": "Webhooks",
    "auth.entrar": "Iniciar sesión",
    "auth.criar": "Crear cuenta",
    "auth.email": "Correo",
    "auth.senha": "Contraseña",
    "auth.entrando": "Entrando…",
    "auth.criando": "Creando…",
    "auth.criarEntrar": "Crear cuenta e iniciar sesión",
    "auth.sair": "salir",
    "auth.demo": "Demostración",
    "footer": `${BRAND.nome} · mantenimiento DJI Agras trazable por Serial Number · IA predictiva`,
  },
};

export function getLang(): Lang {
  const l = localStorage.getItem(LANG_KEY);
  return l === "en" || l === "es" ? l : "pt";
}

export function setLang(l: Lang): void {
  localStorage.setItem(LANG_KEY, l);
  location.reload();
}

export function t(key: string): string {
  const l = getLang();
  return dict[l][key] ?? dict.pt[key] ?? key;
}
