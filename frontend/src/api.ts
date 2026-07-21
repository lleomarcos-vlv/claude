// Cliente da API do Drone Kairós ERP. Injeta o header de tenant (X-Tenant-Id)
// em toda requisição autenticada por empresa.

const BASE = "/api/v1";
const TENANT_KEY = "kairos.tenantId";

export function getTenant(): string | null {
  return localStorage.getItem(TENANT_KEY);
}
export function setTenant(id: string): void {
  localStorage.setItem(TENANT_KEY, id);
}
export function clearTenant(): void {
  localStorage.removeItem(TENANT_KEY);
}

export interface Equipamento {
  id: string;
  serialNumber: string;
  modelo: string;
  fabricante: string | null;
  status: string;
}
export interface Evento {
  sequencia: number;
  tipo: string;
  descricao: string | null;
  dados: string | null;
  ocorridoEm: string;
}
export interface Item {
  id: string;
  sku: string;
  descricao: string;
  saldo: number;
  pontoReposicao: number;
  precisaRepor: boolean;
}
export interface OrdemServico {
  id: string;
  numero: string;
  equipamentoId: string;
  status: string;
  descricao: string | null;
  abertaEm: string;
  concluidaEm: string | null;
}

async function req<T>(method: string, path: string, body?: unknown, withTenant = true): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (withTenant) {
    const tenant = getTenant();
    if (tenant) headers["X-Tenant-Id"] = tenant;
  }
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const problem = await res.json();
      if (problem && problem.detail) detail = problem.detail;
    } catch {
      /* corpo não-JSON */
    }
    throw new Error(detail);
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const api = {
  criarEmpresa: (nome: string, documento: string) =>
    req<{ id: string; nome: string }>("POST", "/empresas", { nome, documento }, false),

  listarEquipamentos: () => req<Equipamento[]>("GET", "/equipamentos"),
  registrarEquipamento: (serialNumber: string, modelo: string, fabricante: string) =>
    req<Equipamento>("POST", "/equipamentos", { serialNumber, modelo, fabricante }),
  historico: (id: string) => req<Evento[]>("GET", `/equipamentos/${id}/historico`),

  listarItens: () => req<Item[]>("GET", "/estoque/itens"),
  criarItem: (sku: string, descricao: string, saldoInicial: number, pontoReposicao: number) =>
    req<Item>("POST", "/estoque/itens", { sku, descricao, saldoInicial, pontoReposicao }),
  entrada: (id: string, quantidade: number) =>
    req<Item>("POST", `/estoque/itens/${id}/entradas`, { quantidade }),
  reposicao: () => req<Item[]>("GET", "/estoque/itens/reposicao"),

  listarOrdens: () => req<OrdemServico[]>("GET", "/ordens-servico"),
  abrirOs: (equipamentoId: string, descricao: string) =>
    req<OrdemServico>("POST", "/ordens-servico", { equipamentoId, descricao }),
  adicionarItemOs: (osId: string, itemId: string, quantidade: number) =>
    req<void>("POST", `/ordens-servico/${osId}/itens`, { itemId, quantidade }),
  concluirOs: (osId: string) => req<OrdemServico>("POST", `/ordens-servico/${osId}/concluir`),
};
