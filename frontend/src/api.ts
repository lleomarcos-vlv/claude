// Cliente da API do geoAG. Autentica por JWT: guarda o token da sessão
// e o injeta como `Authorization: Bearer` em toda requisição protegida. O tenant
// vem do próprio token (claim tenant_id). Envia também X-Tela (tela de origem)
// para a trilha de auditoria.

const BASE = "/api/v1";
const TOKEN_KEY = "conlor.token";
const USER_KEY = "conlor.usuario";
const REFRESH_KEY = "conlor.refresh";

let telaAtual = "";
export function setTela(tela: string): void {
  telaAtual = tela;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: string;
  tenantId: string;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function getUsuario(): Usuario | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as Usuario) : null;
}
function setSession(token: string, usuario: Usuario, refreshToken?: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(usuario));
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
}
export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

async function tentarRenovar(): Promise<boolean> {
  const refresh = localStorage.getItem(REFRESH_KEY);
  if (!refresh) return false;
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    localStorage.setItem(TOKEN_KEY, data.token);
    if (data.refreshToken) localStorage.setItem(REFRESH_KEY, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

export interface Equipamento {
  id: string;
  serialNumber: string;
  modelo: string;
  fabricante: string | null;
  status: string;
  posseTipo: string | null;
  posseNome: string | null;
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
  preco: number;
  custo: number;
  fornecedor: string | null;
  precisaRepor: boolean;
}
export interface ItemAlteracao {
  tela: string;
  campo: string;
  alteracao: string;
}
export interface OrdemServico {
  id: string;
  numero: string;
  protocolo: string | null;
  equipamentoId: string;
  equipamentoSerial: string | null;
  equipamentoModelo: string | null;
  clienteNome: string | null;
  tecnicoNome: string | null;
  status: string;
  descricao: string | null;
  diagnostico: string | null;
  maoDeObra: number;
  origem: string | null;
  tecnicoId: string | null;
  clienteId: string | null;
  orcamentoAprovadoEm: string | null;
  adicionaisAprovadosEm: string | null;
  abertaEm: string;
  concluidaEm: string | null;
}
export interface ConhecimentoIa {
  id: string;
  problema: string;
  causa: string | null;
  solucao: string | null;
  sugestao: string | null;
}
export interface SugestaoFabricante {
  modelo: string;
  peca: string;
  ocorrencias: number;
  texto: string;
}
export interface LinhaOrcamento {
  id: string;
  itemId: string;
  sku: string;
  descricao: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
  estagio: number;
  adicional: boolean;
  baixado: boolean;
}
export interface Orcamento {
  ordemServicoId: string;
  numero: string;
  status: string;
  serialNumber: string;
  modelo: string;
  diagnostico: string | null;
  linhas: LinhaOrcamento[];
  totalInicial: number;
  totalAdicionais: number;
  maoDeObra: number;
  total: number;
}
export interface Observacao {
  id: string;
  autorNome: string | null;
  texto: string;
  visivelCliente: boolean;
  criadoEm: string;
}
export interface PassoTimeline {
  rotulo: string;
  estado: string;
}
export interface Timeline {
  status: string;
  etapaAtual: string;
  mensagem: string;
  progresso: number;
  passos: PassoTimeline[];
}
export interface Agendamento {
  id: string;
  nomeCliente: string;
  telefone: string | null;
  serialNumber: string;
  modelo: string;
  dataHora: string;
  observacao: string | null;
  status: string;
  ordemServicoId: string | null;
}
export interface Sugestao {
  padrao: string;
  alerta: string;
  verificar: string[];
}
export interface Cronico {
  modelo: string;
  manutencoes: number;
  pecaMaisRecorrente: string | null;
  quantidadePeca: number;
}
export interface PecaTroca {
  sku: string;
  descricao: string;
  quantidade: number;
}
export interface RelatorioIa {
  geradoEm: string;
  osConcluidas: number;
  dronesComMaisProblemas: Cronico[];
  pecasMaisTrocadas: PecaTroca[];
  falhasRecorrentes: string[];
  recomendacoes: string[];
}
export interface PecaFinanceiro {
  itemId: string;
  sku: string;
  descricao: string;
  custo: number;
  preco: number;
  margemUnitaria: number;
  margemPercentual: number;
  saldo: number;
  volumeVendido: number;
  receita: number;
  lucro: number;
  giro: number;
  estoqueMinimo: number;
  estoqueRecomendado: number;
  previsaoConsumo: number;
}
export interface ResumoPecas {
  receitaTotal: number;
  custoTotal: number;
  lucroTotal: number;
  margemMedia: number;
  valorEstoque: number;
  itens: number;
  itensParaRepor: number;
  pecas: PecaFinanceiro[];
}
export interface DocumentoMeta {
  id: string;
  nome: string;
  tipoConteudo: string;
  tamanho: number;
  criadoEm: string;
}
export interface Movimentacao {
  tipo: string;
  quantidade: number;
  origem: string | null;
  criadoEm: string;
}
export interface ClassificacaoAbc {
  itemId: string;
  sku: string;
  descricao: string;
  consumo: number;
  classe: string;
}
export interface IndicadoresBi {
  equipamentos: number;
  itens: number;
  osAbertas: number;
  osConcluidas: number;
  itensParaRepor: number;
  curvaAbc: Record<string, number>;
  osPorStatus: Record<string, number>;
  estoquePorItem: { sku: string; saldo: number }[];
}
export interface Notificacao {
  id: string;
  tipo: string;
  mensagem: string;
  lida: boolean;
  criadoEm: string;
}
export interface CentralNotificacoes {
  naoLidas: number;
  notificacoes: Notificacao[];
}
export interface SintomaKci {
  tag: string;
  rotulo: string;
}
export interface Diagnostico {
  causa: string;
  confianca: number;
  acoes: string[];
  pecasSugeridas: string[];
}
export interface EventoAuditoria {
  usuarioEmail: string | null;
  acao: string;
  recursoTipo: string | null;
  recursoId: string | null;
  detalhe: string | null;
  ip: string | null;
  tela: string | null;
  ocorridoEm: string;
}
export interface Chamado {
  ordemServicoId: string;
  numero: string;
  protocolo: string;
  status: string;
  clienteEmail: string;
  senhaGerada: string | null;
  clienteNovo: boolean;
}

async function req<T>(method: string, path: string, body?: unknown, withAuth = true,
                      jaRenovou = false): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (telaAtual) headers["X-Tela"] = telaAtual;
  if (withAuth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    if (res.status === 401 && withAuth && !jaRenovou) {
      if (await tentarRenovar()) {
        return req<T>(method, path, body, withAuth, true);
      }
      clearSession();
      window.dispatchEvent(new CustomEvent("conlor:unauthorized"));
    } else if (res.status === 401 && withAuth) {
      clearSession();
      window.dispatchEvent(new CustomEvent("conlor:unauthorized"));
    }
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

async function baixar(path: string, nome: string): Promise<void> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Falha ao gerar o arquivo");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}

async function baixarPost(path: string, body: unknown, nome: string): Promise<void> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Falha ao gerar o arquivo");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}

async function enviarArquivo<T>(path: string, file: File): Promise<T> {
  const token = getToken();
  const fd = new FormData();
  fd.append("arquivo", file);
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try { const p = await res.json(); if (p?.detail) detail = p.detail; } catch { /* */ }
    throw new Error(detail);
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  tipo: string;
  expiraEmSegundos: number;
  usuario: Usuario;
}

export const api = {
  // --- Identidade e acesso ---
  registrar: (nome: string, documento: string, admin: { nome: string; email: string; senha: string }) =>
    req<{ id: string; nome: string; adminEmail: string }>(
      "POST", "/empresas", { nome, documento, admin }, false),

  login: async (email: string, senha: string): Promise<Usuario> => {
    const r = await req<LoginResponse>("POST", "/auth/login", { email, senha }, false);
    setSession(r.token, r.usuario, r.refreshToken);
    return r.usuario;
  },

  // --- Usuários (ADMIN) ---
  criarUsuario: (nome: string, email: string, senha: string, perfil: string) =>
    req<Usuario>("POST", "/usuarios", { nome, email, senha, perfil }),
  listarUsuarios: () => req<(Usuario & { ativo: boolean })[]>("GET", "/usuarios"),
  editarUsuario: (id: string, nome: string, perfil: string) =>
    req<Usuario & { ativo: boolean }>("POST", `/usuarios/${id}`, { nome, perfil }),
  bloquearUsuario: (id: string) => req<Usuario & { ativo: boolean }>("POST", `/usuarios/${id}/bloquear`),
  reativarUsuario: (id: string) => req<Usuario & { ativo: boolean }>("POST", `/usuarios/${id}/reativar`),
  redefinirSenha: (id: string) => req<{ senha: string }>("POST", `/usuarios/${id}/redefinir-senha`),
  excluirUsuario: (id: string) => req<void>("DELETE", `/usuarios/${id}`),

  auditoria: (limite = 200) => req<EventoAuditoria[]>("GET", `/auditoria?limite=${limite}`),
  auditoriaPdf: (inicio?: string, fim?: string) => {
    const q = [inicio ? `inicio=${inicio}` : "", fim ? `fim=${fim}` : ""].filter(Boolean).join("&");
    return baixar(`/auditoria/relatorio.pdf${q ? "?" + q : ""}`, "auditoria.pdf");
  },

  biIndicadores: () => req<IndicadoresBi>("GET", "/bi/indicadores"),

  // --- Financeiro de peças ---
  financeiroPecas: () => req<ResumoPecas>("GET", "/financeiro/pecas"),

  notificacoes: () => req<CentralNotificacoes>("GET", "/notificacoes"),
  marcarNotificacaoLida: (id: string) => req<void>("POST", `/notificacoes/${id}/lida`),
  marcarTodasNotificacoesLidas: () => req<void>("POST", "/notificacoes/marcar-todas-lidas"),

  // --- Aeronaves ---
  listarEquipamentos: () => req<Equipamento[]>("GET", "/equipamentos"),
  registrarEquipamento: (serialNumber: string, modelo: string, fabricante: string) =>
    req<Equipamento>("POST", "/equipamentos", { serialNumber, modelo, fabricante }),
  historico: (id: string) => req<Evento[]>("GET", `/equipamentos/${id}/historico`),
  transferir: (id: string, paraTipo: string, paraNome: string, observacao: string) =>
    req<Equipamento>("POST", `/equipamentos/${id}/transferencias`, { paraTipo, paraNome, observacao }),

  listarDocumentos: (eqId: string) => req<DocumentoMeta[]>("GET", `/equipamentos/${eqId}/documentos`),
  anexarDocumento: async (eqId: string, arquivo: File): Promise<DocumentoMeta> => {
    const fd = new FormData();
    fd.append("arquivo", arquivo);
    const token = getToken();
    const res = await fetch(`${BASE}/equipamentos/${eqId}/documentos`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });
    if (!res.ok) {
      if (res.status === 401) { clearSession(); window.dispatchEvent(new CustomEvent("conlor:unauthorized")); }
      let detail = `${res.status} ${res.statusText}`;
      try { const p = await res.json(); if (p?.detail) detail = p.detail; } catch { /* */ }
      throw new Error(detail);
    }
    return (await res.json()) as DocumentoMeta;
  },
  baixarDocumento: (docId: string, nome: string) => baixar(`/documentos/${docId}/download`, nome),

  // --- Estoque (KSI) ---
  listarItens: () => req<Item[]>("GET", "/estoque/itens"),
  criarItem: (sku: string, descricao: string, saldoInicial: number, pontoReposicao: number,
              preco: number, custo: number, fornecedor: string) =>
    req<Item>("POST", "/estoque/itens", { sku, descricao, saldoInicial, pontoReposicao, preco, custo, fornecedor }),
  precificar: (id: string, preco: number | null, custo: number | null, fornecedor: string | null) =>
    req<Item>("POST", `/estoque/itens/${id}/preco`, { preco, custo, fornecedor }),
  entrada: (id: string, quantidade: number) =>
    req<Item>("POST", `/estoque/itens/${id}/entradas`, { quantidade }),
  reposicao: () => req<Item[]>("GET", "/estoque/itens/reposicao"),
  movimentacoes: (id: string) => req<Movimentacao[]>("GET", `/estoque/itens/${id}/movimentacoes`),
  curvaAbc: () => req<ClassificacaoAbc[]>("GET", "/estoque/itens/abc"),
  importarEstoque: (file: File) =>
    enviarArquivo<{ criados: number; atualizados: number; ignorados: string[] }>("/estoque/itens/importar", file),

  // --- Ordens de Serviço (fluxo com aprovações) ---
  listarOrdens: () => req<OrdemServico[]>("GET", "/ordens-servico"),
  listarTodasOrdens: () => req<OrdemServico[]>("GET", "/ordens-servico/todas"),
  buscarOs: (osId: string) => req<OrdemServico>("GET", `/ordens-servico/${osId}`),
  abrirOs: (equipamentoId: string, descricao: string) =>
    req<OrdemServico>("POST", "/ordens-servico", { equipamentoId, descricao }),
  atribuirTecnico: (osId: string, tecnicoId: string) =>
    req<OrdemServico>("POST", `/ordens-servico/${osId}/atribuir-tecnico`, { tecnicoId }),
  iniciarOrcamento: (osId: string) => req<OrdemServico>("POST", `/ordens-servico/${osId}/iniciar-orcamento`),
  orcamentoInfo: (osId: string, diagnostico: string, maoDeObra: number) =>
    req<OrdemServico>("POST", `/ordens-servico/${osId}/orcamento-info`, { diagnostico, maoDeObra }),
  adicionarItemOs: (osId: string, itemId: string, quantidade: number) =>
    req<void>("POST", `/ordens-servico/${osId}/itens`, { itemId, quantidade }),
  removerItemOs: (osId: string, itemOsId: string) =>
    req<void>("DELETE", `/ordens-servico/${osId}/itens/${itemOsId}`),
  alterarQuantidadeItemOs: (osId: string, itemOsId: string, quantidade: number) =>
    req<void>("POST", `/ordens-servico/${osId}/itens/${itemOsId}`, { quantidade }),
  enviarAprovacao: (osId: string) => req<OrdemServico>("POST", `/ordens-servico/${osId}/enviar-aprovacao`),
  aprovarOs: (osId: string) => req<OrdemServico>("POST", `/ordens-servico/${osId}/aprovar`),
  reprovarOs: (osId: string) => req<OrdemServico>("POST", `/ordens-servico/${osId}/reprovar`),
  iniciarManutencao: (osId: string) => req<OrdemServico>("POST", `/ordens-servico/${osId}/iniciar-manutencao`),
  irEstagio2: (osId: string) => req<OrdemServico>("POST", `/ordens-servico/${osId}/ir-estagio2`),
  aprovarEstagio2: (osId: string) => req<OrdemServico>("POST", `/ordens-servico/${osId}/aprovar-estagio2`),
  reprovarEstagio2: (osId: string) => req<OrdemServico>("POST", `/ordens-servico/${osId}/reprovar-estagio2`),
  iniciarEstagio2: (osId: string) => req<OrdemServico>("POST", `/ordens-servico/${osId}/iniciar-estagio2`),
  concluirOs: (osId: string) => req<OrdemServico>("POST", `/ordens-servico/${osId}/concluir`),
  cancelarOs: (osId: string) => req<OrdemServico>("POST", `/ordens-servico/${osId}/cancelar`),
  reabrirOs: (osId: string) => req<OrdemServico>("POST", `/ordens-servico/${osId}/reabrir`),
  alterarStatusOs: (osId: string, status: string, motivo: string) =>
    req<OrdemServico>("POST", `/ordens-servico/${osId}/status`, { status, motivo }),
  orcamento: (osId: string) => req<Orcamento>("GET", `/ordens-servico/${osId}/orcamento`),
  orcamentoPdf: (osId: string, numero: string) =>
    baixar(`/ordens-servico/${osId}/orcamento.pdf`, `orcamento-${numero}.pdf`),
  whatsappOrcamento: (osId: string, telefone?: string) =>
    req<{ url: string }>("GET",
      `/ordens-servico/${osId}/whatsapp${telefone ? `?telefone=${encodeURIComponent(telefone)}` : ""}`),
  timeline: (osId: string) => req<Timeline>("GET", `/ordens-servico/${osId}/timeline`),
  observacoes: (osId: string) => req<Observacao[]>("GET", `/ordens-servico/${osId}/observacoes`),
  adicionarObservacao: (osId: string, texto: string, visivelCliente: boolean) =>
    req<Observacao>("POST", `/ordens-servico/${osId}/observacoes`, { texto, visivelCliente }),

  // --- Chamados (ADMIN) ---
  criarChamado: (nomeCliente: string, emailCliente: string, telefone: string,
                 serialNumber: string, modelo: string, origem: string, descricao: string) =>
    req<Chamado>("POST", "/chamados",
      { nomeCliente, emailCliente, telefone, serialNumber, modelo, origem, descricao }),

  // --- Agendamento ---
  listarAgendamentos: () => req<Agendamento[]>("GET", "/agendamentos"),
  agendaDoDia: (data: string) => req<Agendamento[]>("GET", `/agendamentos/agenda?data=${data}`),
  solicitarAgendamento: (nomeCliente: string, telefone: string, serialNumber: string,
                         modelo: string, dataHora: string, observacao: string) =>
    req<Agendamento>("POST", "/agendamentos",
      { nomeCliente, telefone, serialNumber, modelo, dataHora, observacao }),
  confirmarAgendamento: (id: string, tecnicoId?: string, dataHora?: string) =>
    req<Agendamento>("POST", `/agendamentos/${id}/confirmar`, { tecnicoId, dataHora }),
  recusarAgendamento: (id: string) => req<Agendamento>("POST", `/agendamentos/${id}/recusar`),

  // --- KCI / IA preditiva ---
  kciSintomas: () => req<SintomaKci[]>("GET", "/kci/sintomas"),
  diagnosticarOs: (osId: string, sintomas: string[]) =>
    req<Diagnostico[]>("POST", `/ordens-servico/${osId}/diagnostico`, { sintomas }),
  sugestoes: (pecas: string[]) => req<Sugestao[]>("POST", "/kci/sugestoes", { pecas }),
  cronicos: () => req<Cronico[]>("GET", "/kci/cronicos"),
  relatorioIa: () => req<RelatorioIa>("GET", "/kci/relatorio"),
  relatorioIaPdf: () => baixar("/kci/relatorio.pdf", "relatorio-ia.pdf"),
  relatorioIaCsv: () => baixar("/kci/relatorio.csv", "relatorio-ia.csv"),
  relatorioIaExcel: () => baixar("/kci/relatorio.xls", "relatorio-ia.xls"),

  iaBase: () => req<ConhecimentoIa[]>("GET", "/kci/base"),
  importarBaseIa: (file: File) =>
    enviarArquivo<{ importados: number; ignorados: string[] }>("/kci/base/importar", file),
  sugestoesFabricante: () => req<SugestaoFabricante[]>("GET", "/kci/sugestoes-fabricante"),

  // --- Desenvolvedor (DEV) ---
  devSolicitacaoPdf: (titulo: string, itens: ItemAlteracao[]) =>
    baixarPost("/dev/solicitacoes.pdf", { titulo, itens }, "solicitacao-alteracoes.pdf"),
};
