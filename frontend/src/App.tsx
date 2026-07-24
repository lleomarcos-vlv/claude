import { useEffect, useState } from "react";
import {
  api,
  clearSession,
  getUsuario,
  setTela,
  type Equipamento,
  type Evento,
  type Item,
  type OrdemServico,
  type Orcamento,
  type Observacao,
  type Timeline,
  type Agendamento,
  type Sugestao,
  type Cronico,
  type RelatorioIa,
  type ConhecimentoIa,
  type SugestaoFabricante,
  type ResumoPecas,
  type EventoAuditoria,
  type Movimentacao,
  type ClassificacaoAbc,
  type DocumentoMeta,
  type SintomaKci,
  type Diagnostico,
  type Notificacao,
  type IndicadoresBi,
  type ItemAlteracao,
  type Usuario,
} from "./api";
import { t, getLang, setLang, type Lang } from "./i18n";
import { BRAND } from "./brand";
import { Icon, TecnicoDrone, IconBell, IconLogout, IconMenu, IconPdf, IconWhatsapp, IconPlus, IconDownload } from "./icons";

type Aba =
  | "visao" | "chamados" | "agendamentos" | "estoque" | "ordens"
  | "ia" | "financeiro" | "usuarios" | "auditoria" | "desenvolvedor";

/** Rótulos amigáveis dos estágios da OS. */
export const OS_STATUS: Record<string, string> = {
  FILA_DE_ESPERA: "Fila de Espera",
  ORCAMENTO: "Orçamento",
  AGUARDANDO_APROVACAO: "Aguardando aprovação",
  APROVADO: "Aprovado",
  ESTAGIO_1: "Estágio 1",
  AGUARDANDO_APROVACAO_E2: "Aguardando aprovação (Estágio 2)",
  APROVADO_E2: "Estágio 2 aprovado",
  ESTAGIO_2: "Estágio 2",
  CONCLUIDA: "Finalizado",
  CANCELADA: "Cancelado",
};

const brl = (n: number) =>
  "R$ " + (n ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const dt = (s: string | null | undefined) => (s ? s.replace("T", " ").slice(0, 16) : "—");

interface ItemMenu { id: Aba; rotulo: string; icone: string; }

/** Modelos de drones DJI Agras atendidos. */
const MODELOS = [
  "DJI Agras T10", "DJI Agras T20", "DJI Agras T20P", "DJI Agras T25",
  "DJI Agras T25P", "DJI Agras T30", "DJI Agras T40", "DJI Agras T50",
  "DJI Agras T70P", "DJI Agras T100",
];

function menuDoPerfil(perfil: string): ItemMenu[] {
  if (perfil === "CLIENTE") {
    return [
      { id: "visao", rotulo: "Início", icone: "home" },
      { id: "agendamentos", rotulo: "Agendar", icone: "calendar" },
      { id: "ordens", rotulo: "Meus chamados", icone: "wrench" },
    ];
  }
  if (perfil === "TECNICO") {
    return [
      { id: "visao", rotulo: "Painel", icone: "home" },
      { id: "agendamentos", rotulo: "Agendamentos", icone: "calendar" },
      { id: "ordens", rotulo: "Ordens de Serviço", icone: "wrench" },
    ];
  }
  const admin: ItemMenu[] = [
    { id: "visao", rotulo: "Painel", icone: "home" },
    { id: "chamados", rotulo: "Chamados", icone: "phone" },
    { id: "ordens", rotulo: "Ordens de Serviço", icone: "wrench" },
    { id: "estoque", rotulo: "Estoque", icone: "box" },
    { id: "ia", rotulo: "IA Preditiva", icone: "ai" },
    { id: "financeiro", rotulo: "Financeiro", icone: "money" },
    { id: "usuarios", rotulo: "Usuários", icone: "users" },
    { id: "auditoria", rotulo: "Auditoria", icone: "search" },
  ];
  if (perfil === "DEV") {
    admin.push({ id: "desenvolvedor", rotulo: "Desenvolvedor", icone: "code" });
  }
  return admin;
}

export default function App() {
  const [usuario, setUsuario] = useState<Usuario | null>(getUsuario());
  const [aba, setAba] = useState<Aba>("visao");
  const [erro, setErro] = useState<string | null>(null);
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    const sair = () => setUsuario(null);
    window.addEventListener("conlor:unauthorized", sair);
    return () => window.removeEventListener("conlor:unauthorized", sair);
  }, []);

  useEffect(() => { setTela(aba); }, [aba]);

  function comErro<T>(p: Promise<T>): Promise<T | void> {
    setErro(null);
    return p.catch((e: Error) => setErro(e.message));
  }

  if (!usuario) {
    return <Autenticacao onEntrar={(u) => setUsuario(u)} />;
  }

  const perfil = usuario.perfil;
  const ehGestor = perfil === "ADMIN" || perfil === "DEV"; // DEV tem acesso total
  const menu = menuDoPerfil(perfil);
  const irPara = (a: Aba) => { setAba(a); setMenuAberto(false); };

  return (
    <div className="shell">
      <aside className={menuAberto ? "sidebar aberta" : "sidebar"}>
        <div className="marca">
          <span className="logo">▲</span>
          <span>{BRAND.marcaPre}<b>{BRAND.marcaPos}</b></span>
        </div>
        <nav className="menu">
          {menu.map((m) => (
            <button key={m.id} className={aba === m.id ? "menu-item ativo" : "menu-item"}
              onClick={() => irPara(m.id)}>
              <span className="mi-icone"><Icon name={m.icone} size={20} /></span>
              <span className="mi-rotulo">{m.rotulo}</span>
            </button>
          ))}
        </nav>
        <div className="menu-rodape">
          <span className="badge">{perfil}</span>
          <div className="muted small">{usuario.email}</div>
        </div>
      </aside>

      {menuAberto && <div className="overlay" onClick={() => setMenuAberto(false)} />}

      <div className="conteudo">
        <header className="topo">
          <button className="hamburguer" onClick={() => setMenuAberto(!menuAberto)} aria-label="menu"><IconMenu size={22} /></button>
          <h1 className="titulo-tela">{menu.find((m) => m.id === aba)?.rotulo ?? "Painel"}</h1>
          <div className="topo-dir">
            <Sino />
            <select className="lang" value={getLang()} onChange={(e) => setLang(e.target.value as Lang)}>
              <option value="pt">PT</option><option value="en">EN</option><option value="es">ES</option>
            </select>
            <button className="link sair" onClick={() => { clearSession(); setUsuario(null); }}>
              <IconLogout size={16} /> {t("auth.sair")}
            </button>
          </div>
        </header>

        {erro && <div className="erro" onClick={() => setErro(null)}>⚠ {erro}</div>}

        <main>
          {aba === "visao" && <Visao comErro={comErro} irPara={irPara} perfil={perfil} />}
          {aba === "chamados" && ehGestor && <Chamados comErro={comErro} />}
          {aba === "agendamentos" && <Agendamentos comErro={comErro} perfil={perfil} />}
          {aba === "estoque" && ehGestor && <Estoque comErro={comErro} />}
          {aba === "ordens" && <Ordens comErro={comErro} perfil={perfil} />}
          {aba === "ia" && ehGestor && <IaPreditiva comErro={comErro} />}
          {aba === "financeiro" && ehGestor && <Financeiro comErro={comErro} />}
          {aba === "usuarios" && ehGestor && <Usuarios comErro={comErro} />}
          {aba === "auditoria" && ehGestor && <Auditoria comErro={comErro} />}
          {aba === "desenvolvedor" && perfil === "DEV" && <Desenvolvedor comErro={comErro} />}
        </main>

        <footer className="rodape">{t("footer")}</footer>
      </div>
    </div>
  );
}

function Sino() {
  const [aberto, setAberto] = useState(false);
  const [naoLidas, setNaoLidas] = useState(0);
  const [lista, setLista] = useState<Notificacao[]>([]);

  async function carregar() {
    try {
      const c = await api.notificacoes();
      setNaoLidas(c.naoLidas);
      setLista(c.notificacoes);
    } catch { /* silencioso */ }
  }
  useEffect(() => {
    void carregar();
    const h = setInterval(() => void carregar(), 30000);
    return () => clearInterval(h);
  }, []);

  async function abrir() {
    const novo = !aberto;
    setAberto(novo);
    if (novo) await carregar();
  }
  async function marcarTodas() {
    try { await api.marcarTodasNotificacoesLidas(); await carregar(); } catch { /* */ }
  }

  return (
    <div className="sino">
      <button className="sino-btn" onClick={abrir} title="Notificações" aria-label="Notificações">
        <IconBell size={20} />{naoLidas > 0 && <span className="sino-badge">{naoLidas}</span>}
      </button>
      {aberto && (
        <div className="sino-painel">
          <div className="sino-cab">
            <b>Notificações</b>
            {naoLidas > 0 && <button className="link" onClick={marcarTodas}>marcar todas lidas</button>}
          </div>
          {lista.length === 0 && <div className="muted small">Nenhuma notificação</div>}
          <ul>
            {lista.map((n) => (
              <li key={n.id} className={n.lida ? "lida" : ""}>
                <span className="badge">{n.tipo}</span> {n.mensagem}
                <div className="muted small">{dt(n.criadoEm)}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function EstagioBadge({ status }: { status: string }) {
  const cls = status === "CONCLUIDA" ? "badge ok"
    : status === "CANCELADA" ? "badge cancel"
    : status.startsWith("AGUARDANDO") ? "badge alerta"
    : status === "FILA_DE_ESPERA" ? "badge"
    : "badge etapa";
  return <span className={cls}>{OS_STATUS[status] ?? status}</span>;
}

function Autenticacao(props: { onEntrar: (u: Usuario) => void }) {
  const [modo, setModo] = useState<"login" | "criar">("login");
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [email, setEmail] = useState<string>(BRAND.email);
  const [senha, setSenha] = useState("");
  const [nomeEmpresa, setNomeEmpresa] = useState<string>(BRAND.nome);
  const [documento, setDocumento] = useState("");
  const [nomeAdmin, setNomeAdmin] = useState("Administrador");

  async function entrar() {
    setErro(null); setOcupado(true);
    try { props.onEntrar(await api.login(email.trim(), senha)); }
    catch (e) { setErro((e as Error).message); }
    finally { setOcupado(false); }
  }
  async function criarConta() {
    setErro(null); setOcupado(true);
    try {
      await api.registrar(nomeEmpresa, documento, { nome: nomeAdmin, email: email.trim(), senha });
      props.onEntrar(await api.login(email.trim(), senha));
    } catch (e) { setErro((e as Error).message); }
    finally { setOcupado(false); }
  }

  return (
    <div className="setup">
      <div className="card setup-card">
        <div className="setup-top">
          <h1><span className="logo">▲</span> {t("app.title")}</h1>
          <select className="lang" value={getLang()} onChange={(e) => setLang(e.target.value as Lang)}>
            <option value="pt">PT</option><option value="en">EN</option><option value="es">ES</option>
          </select>
        </div>
        <div className="ilustra"><TecnicoDrone size={150} /></div>
        <p className="muted small centro">{BRAND.tagline}</p>

        <div className="segmento">
          <button className={modo === "login" ? "seg ativo" : "seg"} onClick={() => setModo("login")}>{t("auth.entrar")}</button>
          <button className={modo === "criar" ? "seg ativo" : "seg"} onClick={() => setModo("criar")}>{t("auth.criar")}</button>
        </div>

        {erro && <div className="erro">⚠ {erro}</div>}

        {modo === "criar" && (
          <>
            <p className="muted">Cria a empresa e o seu primeiro usuário administrador</p>
            <label>Nome da empresa<input value={nomeEmpresa} onChange={(e) => setNomeEmpresa(e.target.value)} /></label>
            <label>Documento<input value={documento} onChange={(e) => setDocumento(e.target.value)} /></label>
            <label>Nome do administrador<input value={nomeAdmin} onChange={(e) => setNomeAdmin(e.target.value)} /></label>
          </>
        )}

        <label>{t("auth.email")}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@empresa.com" />
        </label>
        <label>{t("auth.senha")}
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} />
        </label>

        {modo === "login" ? (
          <button className="primary" disabled={ocupado || !email || !senha} onClick={entrar}>
            {ocupado ? t("auth.entrando") : t("auth.entrar")}
          </button>
        ) : (
          <button className="primary" disabled={ocupado || !email || senha.length < 8} onClick={criarConta}>
            {ocupado ? t("auth.criando") : t("auth.criarEntrar")}
          </button>
        )}

        {modo === "login" && (
          <p className="muted small dica">
            Primeiro acesso? Fale com o administrador:<br />
            <b>{BRAND.email}</b> · <b>{BRAND.telefone}</b>
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Visão geral / Início
// ---------------------------------------------------------------------------
function Visao(props: {
  comErro: <T>(p: Promise<T>) => Promise<T | void>;
  irPara: (a: Aba) => void;
  perfil: string;
}) {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [equip, setEquip] = useState<Equipamento[]>([]);
  const [repor, setRepor] = useState<Item[]>([]);
  const ehCliente = props.perfil === "CLIENTE";
  const ehAdmin = props.perfil === "ADMIN" || props.perfil === "DEV";

  async function carregar() {
    const o = await props.comErro(api.listarOrdens());
    if (o) setOrdens(o);
    if (ehAdmin) {
      const dados = await props.comErro(Promise.all([api.listarEquipamentos(), api.reposicao()]));
      if (dados) { setEquip(dados[0]); setRepor(dados[1]); }
    }
  }
  useEffect(() => {
    void carregar();
    const h = setInterval(() => void carregar(), 15000);
    return () => clearInterval(h);
  }, []);

  const abertas = ordens.filter((o) => o.status !== "CONCLUIDA" && o.status !== "CANCELADA").length;
  const concluidas = ordens.filter((o) => o.status === "CONCLUIDA").length;

  if (ehCliente) {
    return (
      <div>
        <div className="kpis">
          <button className="kpi" onClick={() => props.irPara("agendamentos")}>
            <span className="kpi-num"><IconPlus size={26} /></span><span className="kpi-lbl">Agendar manutenção</span>
          </button>
          <button className="kpi" onClick={() => props.irPara("ordens")}>
            <span className="kpi-num">{abertas}</span><span className="kpi-lbl">Em andamento</span>
          </button>
          <button className="kpi" onClick={() => props.irPara("ordens")}>
            <span className="kpi-num">{ordens.length}</span><span className="kpi-lbl">Total de chamados</span>
          </button>
        </div>
        <section className="card">
          <h2>Acompanhe suas manutenções</h2>
          {ordens.length === 0 && <p className="muted">Nenhuma manutenção ainda — agende um horário para começar</p>}
          {ordens.map((o) => <LinhaTimelineCliente key={o.id} os={o} comErro={props.comErro} />)}
        </section>
      </div>
    );
  }

  return (
    <div>
      <div className="kpis">
        <div className="kpi"><span className="kpi-num">{abertas}</span><span className="kpi-lbl">OS em andamento</span></div>
        <div className="kpi"><span className="kpi-num">{concluidas}</span><span className="kpi-lbl">OS finalizadas</span></div>
        {ehAdmin && <button className="kpi" onClick={() => props.irPara("chamados")}>
          <span className="kpi-num">{equip.length}</span><span className="kpi-lbl">Aeronaves</span></button>}
        {ehAdmin && <button className={repor.length ? "kpi alerta-kpi" : "kpi"} onClick={() => props.irPara("estoque")}>
          <span className="kpi-num">{repor.length}</span><span className="kpi-lbl">Reposição sugerida</span></button>}
      </div>

      <section className="card">
        <h2>Ordens de serviço recentes</h2>
        {ordens.length === 0 && <p className="muted">Nenhuma OS ainda</p>}
        {ordens.length > 0 && (
          <table>
            <thead><tr><th>Número</th><th>Estágio</th><th>Descrição</th></tr></thead>
            <tbody>
              {ordens.slice(0, 8).map((o) => (
                <tr key={o.id}>
                  <td className="mono">{o.numero}</td>
                  <td><EstagioBadge status={o.status} /></td>
                  <td>{o.descricao}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

/** Linha da timeline do cliente para uma OS (mensagem amigável + progresso). */
function LinhaTimelineCliente(props: { os: OrdemServico; comErro: <T>(p: Promise<T>) => Promise<T | void> }) {
  const [tl, setTl] = useState<Timeline | null>(null);
  useEffect(() => {
    void (async () => {
      const r = await props.comErro(api.timeline(props.os.id));
      if (r) setTl(r);
    })();
  }, [props.os.id]);
  return (
    <div className="tl-cliente">
      <div className="tl-cab">
        <b className="mono">{props.os.numero}</b>
        <EstagioBadge status={props.os.status} />
      </div>
      {tl && (
        <>
          <div className="tl-barra"><div className="tl-fill" style={{ width: tl.progresso + "%" }} /></div>
          <div className="tl-passos">
            {tl.passos.map((p, i) => (
              <span key={i} className={"tl-passo " + p.estado}>{p.rotulo}</span>
            ))}
          </div>
          <p className="tl-msg">{tl.mensagem}</p>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chamados (ADMIN) — Criar Novo Chamado + leads/agenda
// ---------------------------------------------------------------------------
const ORIGENS = ["WhatsApp", "Instagram", "Facebook", "Telefone", "Site", "Pessoalmente"];

/** Observações prontas para selecionar (mensagens frequentes da oficina). */
const OBSERVACOES_PADRAO = [
  "Recebemos seu equipamento para análise.",
  "Higienização da aeronave iniciada.",
  "Equipamento em desmontagem para inspeção.",
  "Manutenção iniciada.",
  "Peça substituída conforme orçamento.",
  "Equipamento em fase de testes.",
  "Aguardando aprovação do orçamento.",
  "Foram identificados novos componentes danificados (Estágio 2).",
  "Manutenção concluída — equipamento pronto para retirada.",
];

/** Link wa.me com a mensagem pronta (telefone só com dígitos). */
function linkWhatsApp(telefone: string, texto: string): string {
  const num = (telefone || "").replace(/\D/g, "");
  const t = encodeURIComponent(texto);
  return num ? `https://wa.me/${num}?text=${t}` : `https://wa.me/?text=${t}`;
}

function Chamados(props: { comErro: <T>(p: Promise<T>) => Promise<T | void> }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [serial, setSerial] = useState("");
  const [modelo, setModelo] = useState(MODELOS[0]);
  const [origem, setOrigem] = useState(ORIGENS[0]);
  const [descricao, setDescricao] = useState("");
  const [resultado, setResultado] = useState<{ protocolo: string; email: string; senha: string | null; telefone: string } | null>(null);
  const [leads, setLeads] = useState<Agendamento[]>([]);
  const [clientes, setClientes] = useState<(Usuario & { ativo: boolean })[]>([]);
  const [recentes, setRecentes] = useState<OrdemServico[]>([]);

  async function carregar() {
    const dados = await props.comErro(Promise.all([
      api.listarAgendamentos(), api.listarUsuarios(), api.listarTodasOrdens(),
    ]));
    if (dados) {
      setLeads(dados[0]);
      setClientes(dados[1].filter((u) => u.perfil === "CLIENTE"));
      setRecentes(dados[2].filter((o) => o.origem).slice(0, 10));
    }
  }
  useEffect(() => {
    void carregar();
    const h = setInterval(() => void carregar(), 12000);
    return () => clearInterval(h);
  }, []);

  async function criar() {
    if (!nome || !serial || !modelo) return;
    const r = await props.comErro(api.criarChamado(nome, email, telefone, serial, modelo, origem, descricao));
    if (r) {
      setResultado({ protocolo: r.protocolo, email: r.clienteEmail, senha: r.senhaGerada, telefone });
      setNome(""); setEmail(""); setTelefone(""); setSerial(""); setDescricao("");
      await carregar();
    }
  }
  async function confirmar(id: string) {
    const r = await props.comErro(api.confirmarAgendamento(id));
    if (r) await carregar();
  }
  async function recusar(id: string) {
    const r = await props.comErro(api.recusarAgendamento(id));
    if (r) await carregar();
  }

  return (
    <div className="grid grid-chamados">
      <section className="card destaque">
        <h2>Abrir chamado</h2>
        <p className="muted small">O cliente entra em contato (WhatsApp, Instagram, Facebook, telefone ou site).
          Ao abrir, o sistema cadastra o cliente (com login e senha), registra a aeronave, gera a OS na fila e o
          protocolo, e libera o acesso do cliente — tudo automático.</p>
        <label>Nome do cliente<input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Fazenda Boa Vista" /></label>
        <div className="row">
          <label>E-mail (acesso do cliente)<input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="cliente@email.com" /></label>
          <label>Telefone (WhatsApp)<input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="+55 62 99999-0000" /></label>
        </div>
        <div className="row">
          <label>Serial Number<input value={serial} onChange={(e) => setSerial(e.target.value)} placeholder="AGRAS-T40-0001" /></label>
          <label>Modelo
            <select value={modelo} onChange={(e) => setModelo(e.target.value)}>
              {MODELOS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
        </div>
        <div className="row">
          <label>Origem do contato
            <select value={origem} onChange={(e) => setOrigem(e.target.value)}>
              {ORIGENS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
          <label>Relato do cliente<input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Drone não liga" /></label>
        </div>
        <button className="primary grande" onClick={criar}><IconPlus size={16} /> Abrir chamado</button>

        {resultado && (
          <div className="alerta ok-alerta">
            <b>Chamado aberto — protocolo {resultado.protocolo}</b>
            <p className="small">Acesso do cliente: <b>{resultado.email}</b>
              {resultado.senha && <> · senha inicial <b>{resultado.senha}</b></>}</p>
            <p className="small muted">Envie o acesso ao cliente para ele acompanhar pelo aplicativo:</p>
            <button className="primary" onClick={() => window.open(linkWhatsApp(resultado.telefone,
              `Olá! Seu chamado na ${BRAND.nome} foi aberto (protocolo ${resultado.protocolo}). `
              + `Acesse o acompanhamento em tempo real com:\nLogin: ${resultado.email}`
              + `${resultado.senha ? `\nSenha: ${resultado.senha}` : ""}`), "_blank")}>
              <IconWhatsapp size={16} /> Enviar login por WhatsApp
            </button>
          </div>
        )}
      </section>

      <div className="coluna-dir">
        <section className="card">
          <h2>Agendamentos e leads ({leads.length})</h2>
          <table>
            <thead><tr><th>Data/hora</th><th>Cliente</th><th>Aeronave</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {leads.map((a) => (
                <tr key={a.id}>
                  <td className="mono">{dt(a.dataHora)}</td>
                  <td>{a.nomeCliente}{a.telefone && <div className="muted small">{a.telefone}</div>}</td>
                  <td>{a.modelo}<div className="muted small mono">{a.serialNumber}</div></td>
                  <td><span className={a.status === "CONFIRMADO" ? "badge ok" : a.status === "RECUSADO" ? "badge cancel" : "badge alerta"}>{a.status}</span></td>
                  <td className="acoes">
                    {a.status === "SOLICITADO" && <>
                      <button className="link" onClick={() => confirmar(a.id)}>confirmar</button>
                      <button className="link" onClick={() => recusar(a.id)}>recusar</button>
                    </>}
                  </td>
                </tr>
              ))}
              {leads.length === 0 && <tr><td colSpan={5} className="muted">Nenhum agendamento</td></tr>}
            </tbody>
          </table>
        </section>

        <section className="card">
          <h2>Chamados recentes ({recentes.length})</h2>
          <table>
            <thead><tr><th>Protocolo</th><th>Estágio</th><th>Origem</th><th>Relato</th></tr></thead>
            <tbody>
              {recentes.map((o) => (
                <tr key={o.id}>
                  <td className="mono">{o.protocolo ?? o.numero}</td>
                  <td><EstagioBadge status={o.status} /></td>
                  <td>{o.origem}</td>
                  <td className="small">{o.descricao}</td>
                </tr>
              ))}
              {recentes.length === 0 && <tr><td colSpan={4} className="muted">Nenhum chamado ainda</td></tr>}
            </tbody>
          </table>
        </section>

        <section className="card">
          <h2>Clientes ({clientes.length})</h2>
          <table>
            <thead><tr><th>Nome</th><th>E-mail (acesso)</th><th>Status</th></tr></thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id}>
                  <td>{c.nome}</td>
                  <td className="mono">{c.email}</td>
                  <td>{c.ativo ? <span className="badge ok">ativo</span> : <span className="badge cancel">bloqueado</span>}</td>
                </tr>
              ))}
              {clientes.length === 0 && <tr><td colSpan={3} className="muted">Nenhum cliente ainda</td></tr>}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Agendamentos (cliente solicita; técnico consulta)
// ---------------------------------------------------------------------------
function Agendamentos(props: { comErro: <T>(p: Promise<T>) => Promise<T | void>; perfil: string }) {
  const [lista, setLista] = useState<Agendamento[]>([]);
  const [nomeCliente, setNomeCliente] = useState("");
  const [telefone, setTelefone] = useState("");
  const [serial, setSerial] = useState("");
  const [modelo, setModelo] = useState(MODELOS[0]);
  const [dataHora, setDataHora] = useState("");
  const [obs, setObs] = useState("");
  const ehCliente = props.perfil === "CLIENTE";

  async function carregar() {
    const l = await props.comErro(api.listarAgendamentos());
    if (l) setLista(l);
  }
  useEffect(() => { void carregar(); }, []);

  async function solicitar() {
    if (!serial || !modelo || !dataHora) return;
    const r = await props.comErro(api.solicitarAgendamento(nomeCliente, telefone, serial, modelo, dataHora, obs));
    if (r) { setSerial(""); setDataHora(""); setObs(""); await carregar(); }
  }

  return (
    <div className="grid">
      {ehCliente && (
        <section className="card">
          <h2>Solicitar agendamento</h2>
          <p className="muted small">Escolha o horário e informe o Serial Number, o modelo e o seu nome.
            A gerência confirma e o seu chamado entra na fila.</p>
          <label>Seu nome<input value={nomeCliente} onChange={(e) => setNomeCliente(e.target.value)} /></label>
          <div className="row">
            <label>Telefone (WhatsApp)<input value={telefone} onChange={(e) => setTelefone(e.target.value)} /></label>
            <label>Modelo
              <select value={modelo} onChange={(e) => setModelo(e.target.value)}>
                {MODELOS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </label>
          </div>
          <label>Serial Number<input value={serial} onChange={(e) => setSerial(e.target.value)} placeholder="AGRAS-T40-0001" /></label>
          <label>Data e hora<input type="datetime-local" value={dataHora} onChange={(e) => setDataHora(e.target.value)} /></label>
          <label>Observação<input value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Revisão de safra" /></label>
          <button className="primary" onClick={solicitar}>Solicitar horário</button>
        </section>
      )}

      <section className="card">
        <h2>{ehCliente ? "Meus agendamentos" : "Agendamentos"} ({lista.length})</h2>
        <table>
          <thead><tr><th>Data/hora</th>{!ehCliente && <th>Cliente</th>}<th>Aeronave</th><th>Status</th></tr></thead>
          <tbody>
            {lista.map((a) => (
              <tr key={a.id}>
                <td className="mono">{dt(a.dataHora)}</td>
                {!ehCliente && <td>{a.nomeCliente}</td>}
                <td>{a.modelo}<div className="muted small mono">{a.serialNumber}</div></td>
                <td><span className={a.status === "CONFIRMADO" ? "badge ok" : a.status === "RECUSADO" ? "badge cancel" : "badge alerta"}>{a.status}</span></td>
              </tr>
            ))}
            {lista.length === 0 && <tr><td colSpan={ehCliente ? 3 : 4} className="muted">Nenhum agendamento</td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ordens de Serviço — fluxo com aprovações (adapta por papel)
// ---------------------------------------------------------------------------
function Ordens(props: { comErro: <T>(p: Promise<T>) => Promise<T | void>; perfil: string }) {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [todas, setTodas] = useState<OrdemServico[]>([]);
  const [itens, setItens] = useState<Item[]>([]);
  const [sintomas, setSintomas] = useState<SintomaKci[]>([]);
  const [sel, setSel] = useState<OrdemServico | null>(null);
  const [painel, setPainel] = useState<"minhas" | "geral">("minhas");

  const ehCliente = props.perfil === "CLIENTE";
  const ehTecnico = props.perfil === "TECNICO";
  const ehAdmin = props.perfil === "ADMIN" || props.perfil === "DEV";
  const podeExecutar = !ehCliente;

  async function carregar() {
    const o = await props.comErro(api.listarOrdens());
    if (o) {
      setOrdens(o);
      if (sel) setSel(o.find((x) => x.id === sel.id) ?? sel);
    }
    if (podeExecutar) {
      const dados = await props.comErro(Promise.all([api.listarItens(), api.kciSintomas()]));
      if (dados) { setItens(dados[0]); setSintomas(dados[1]); }
    }
    if (ehTecnico || ehAdmin) {
      const tt = await props.comErro(api.listarTodasOrdens());
      if (tt) setTodas(tt);
    }
  }
  // Atualização em tempo real: ADM/Técnico/Cliente veem as mudanças em segundos.
  useEffect(() => {
    void carregar();
    const h = setInterval(() => void carregar(), 12000);
    return () => clearInterval(h);
  }, []);

  async function recarregar(id?: string) {
    await carregar();
    if (id) {
      const os = await props.comErro(api.buscarOs(id));
      if (os) setSel(os);
    }
  }

  const listaAtual = painel === "geral" ? todas : ordens;

  return (
    <div className="grid grid-ordens">
      <section className="card">
        {ehTecnico && (
          <div className="subtabs">
            <button className={painel === "minhas" ? "subtab ativo" : "subtab"} onClick={() => setPainel("minhas")}>Minhas ordens</button>
            <button className={painel === "geral" ? "subtab ativo" : "subtab"} onClick={() => setPainel("geral")}>Acesso geral</button>
          </div>
        )}
        <div className="barra-acoes">
          <h2 style={{ margin: 0 }}>{painel === "geral" ? "Acesso geral (leitura)" : ehCliente ? "Meus chamados" : "Ordens"} ({listaAtual.length})</h2>
          <button className="link" onClick={() => carregar()}><IconDownload size={15} /> Atualizar</button>
        </div>
        {painel === "geral" && <p className="muted small">Todas as ordens da empresa — somente leitura e observações.</p>}
        <div className="tabela-scroll">
          <table>
            <thead>
              {ehAdmin ? <tr><th>Nº O.S.</th><th>Cliente</th><th>Modelo</th><th>Técnico</th><th>Origem</th><th>Estágio</th></tr>
                : <tr><th>Número</th><th>Estágio</th><th>Descrição</th></tr>}
            </thead>
            <tbody>
              {listaAtual.map((o) => (
                <tr key={o.id} className={(sel?.id === o.id ? "sel-row " : "")
                    + (o.status === "AGUARDANDO_APROVACAO" || o.status === "AGUARDANDO_APROVACAO_E2" ? "aguardando-row" : "")}
                  style={{ cursor: "pointer" }} onClick={() => setSel(o)}>
                  <td className="mono">{o.numero}</td>
                  {ehAdmin ? <>
                    <td>{o.clienteNome ?? "—"}</td>
                    <td>{o.equipamentoModelo ?? "—"}</td>
                    <td>{o.tecnicoNome ?? <span className="muted">não distribuída</span>}</td>
                    <td>{o.origem ?? "—"}</td>
                    <td><EstagioBadge status={o.status} /></td>
                  </> : <>
                    <td><EstagioBadge status={o.status} /></td>
                    <td>{o.descricao}</td>
                  </>}
                </tr>
              ))}
              {listaAtual.length === 0 && <tr><td colSpan={ehAdmin ? 6 : 3} className="muted">Nenhuma OS</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        {!sel && <p className="muted">Selecione uma ordem para ver os detalhes</p>}
        {sel && (
          <OsPanel os={sel} itens={itens} sintomas={sintomas} perfil={props.perfil}
            somenteLeitura={painel === "geral" && !ehAdmin}
            comErro={props.comErro} onMudou={(id) => recarregar(id)} />
        )}
      </section>
    </div>
  );
}

function OsPanel(props: {
  os: OrdemServico;
  itens: Item[];
  sintomas: SintomaKci[];
  perfil: string;
  somenteLeitura: boolean;
  comErro: <T>(p: Promise<T>) => Promise<T | void>;
  onMudou: (id: string) => void;
}) {
  const { os, comErro } = props;
  const ehAdmin = props.perfil === "ADMIN" || props.perfil === "DEV";
  const ehCliente = props.perfil === "CLIENTE";
  const ehTecnico = props.perfil === "TECNICO";
  const podeOperar = !ehCliente && !props.somenteLeitura;
  const verValores = !ehTecnico; // técnico não vê valores das peças
  const s = os.status;
  const podeEditarItens = podeOperar && (s === "ORCAMENTO" || s === "ESTAGIO_1");

  const [orc, setOrc] = useState<Orcamento | null>(null);
  const [obs, setObs] = useState<Observacao[]>([]);
  const [tl, setTl] = useState<Timeline | null>(null);
  const [itemSel, setItemSel] = useState("");
  const [qtd, setQtd] = useState(1);
  const [diagnostico, setDiagnostico] = useState(os.diagnostico ?? "");
  const [maoObra, setMaoObra] = useState(os.maoDeObra ?? 0);
  const [novaObs, setNovaObs] = useState("");
  const [visCliente, setVisCliente] = useState(true);
  const [marcados, setMarcados] = useState<Record<string, boolean>>({});
  const [diag, setDiag] = useState<Diagnostico[] | null>(null);
  const [sug, setSug] = useState<Sugestao[] | null>(null);
  const [flashMsg, setFlashMsg] = useState<string | null>(null);
  function flash(m: string) { setFlashMsg(m); setTimeout(() => setFlashMsg(null), 2500); }

  async function carregar() {
    const o = await comErro(api.orcamento(os.id));
    if (o) setOrc(o);
    const ob = await comErro(api.observacoes(os.id));
    if (ob) setObs(ob);
    if (ehCliente) {
      const t2 = await comErro(api.timeline(os.id));
      if (t2) setTl(t2);
    }
  }
  useEffect(() => {
    setDiagnostico(os.diagnostico ?? "");
    setMaoObra(os.maoDeObra ?? 0);
    setDiag(null); setSug(null);
    void carregar();
    if (props.itens.length && !itemSel) setItemSel(props.itens[0].id);
  }, [os.id, os.status]);

  const run = (p: Promise<unknown>) => comErro(p).then(() => props.onMudou(os.id));

  // Executa uma ação sobre itens do orçamento, recarrega a lista e avisa em caso de sucesso.
  async function acaoItem(p: Promise<unknown>, okMsg: string) {
    const r = await comErro(p.then(() => "OK"));
    await carregar();
    props.onMudou(os.id);
    if (r === "OK") flash(okMsg);
  }
  async function salvarInfo() {
    await acaoItem(api.orcamentoInfo(os.id, diagnostico, Number(maoObra)), "Diagnóstico salvo");
  }
  async function adicionar() {
    if (!itemSel || qtd <= 0) return;
    const nome = props.itens.find((i) => i.id === itemSel)?.sku ?? "peça";
    await acaoItem(api.adicionarItemOs(os.id, itemSel, Number(qtd)), `${nome} adicionada ao orçamento`);
  }
  async function removerLinha(linhaId: string, sku: string) {
    if (!confirm(`Remover ${sku} do orçamento?`)) return;
    await acaoItem(api.removerItemOs(os.id, linhaId), `${sku} removida do orçamento`);
  }
  async function editarLinha(linhaId: string, sku: string, atual: number) {
    const q = prompt(`Nova quantidade de ${sku}:`, String(atual));
    if (q === null) return;
    const n = Number(q.replace(",", "."));
    if (!(n > 0)) return;
    await acaoItem(api.alterarQuantidadeItemOs(os.id, linhaId, n), `Quantidade de ${sku} atualizada`);
  }
  async function comentar() {
    if (!novaObs.trim()) return;
    const r = await comErro(api.adicionarObservacao(os.id, novaObs, ehAdmin && visCliente));
    if (r) { setNovaObs(""); const ob = await comErro(api.observacoes(os.id)); if (ob) setObs(ob); }
  }
  async function diagnosticar() {
    const tags = Object.keys(marcados).filter((k) => marcados[k]);
    if (!tags.length) return;
    const r = await comErro(api.diagnosticarOs(os.id, tags));
    if (r) setDiag(r);
  }
  async function analisar() {
    if (!orc || !orc.linhas.length) return;
    const r = await comErro(api.sugestoes(orc.linhas.map((l) => `${l.sku} ${l.descricao}`)));
    if (r) setSug(r);
  }

  return (
    <div>
      <div className="os-cab">
        <h2>OS {os.numero}</h2>
        <EstagioBadge status={s} />
      </div>
      <div className="os-info">
        {os.clienteNome && <span><b>Cliente:</b> {os.clienteNome}</span>}
        {os.equipamentoModelo && <span><b>Aeronave:</b> {os.equipamentoModelo}</span>}
        {os.equipamentoSerial && <span className="mono"><b>S/N:</b> {os.equipamentoSerial}</span>}
        {verValores && os.tecnicoNome && <span><b>Técnico:</b> {os.tecnicoNome}</span>}
        {os.protocolo && <span><b>Protocolo:</b> {os.protocolo}</span>}
        {/* Origem só para gestão — o técnico não precisa saber */}
        {ehAdmin && os.origem && <span><b>Origem:</b> {os.origem}</span>}
      </div>

      {/* Linha do tempo do cliente */}
      {ehCliente && tl && (
        <div className="bloco">
          <div className="tl-barra"><div className="tl-fill" style={{ width: tl.progresso + "%" }} /></div>
          <div className="tl-passos">
            {tl.passos.map((p, i) => <span key={i} className={"tl-passo " + p.estado}>{p.rotulo}</span>)}
          </div>
          <p className="tl-msg">{tl.mensagem}</p>
        </div>
      )}

      {/* Ações do fluxo */}
      {podeOperar && (
        <div className="acoes-fluxo">
          {s === "FILA_DE_ESPERA" && <button className="primary" onClick={() => run(api.iniciarOrcamento(os.id))}>Iniciar orçamento</button>}
          {s === "ORCAMENTO" && <button className="primary" disabled={!os.diagnostico}
            title={os.diagnostico ? "" : "Preencha e salve o diagnóstico primeiro"}
            onClick={() => run(api.enviarAprovacao(os.id))}>Enviar para aprovação</button>}
          {s === "ORCAMENTO" && !os.diagnostico && <span className="muted small">O diagnóstico é obrigatório para enviar.</span>}
          {s === "AGUARDANDO_APROVACAO" && ehAdmin && <>
            <button className="primary" onClick={() => run(api.aprovarOs(os.id))}>Aprovar orçamento</button>
            <button onClick={() => run(api.reprovarOs(os.id))}>Reprovar</button>
          </>}
          {s === "AGUARDANDO_APROVACAO" && !ehAdmin && <span className="badge alerta">Aguardando aprovação do administrativo</span>}
          {s === "APROVADO" && <button className="primary" onClick={() => run(api.iniciarManutencao(os.id))}>Iniciar manutenção</button>}
          {s === "ESTAGIO_1" && <>
            <button className="primary" onClick={() => run(api.concluirOs(os.id))}>Concluir serviço</button>
            <button onClick={() => run(api.irEstagio2(os.id))}>Ir para Estágio 2</button>
          </>}
          {s === "AGUARDANDO_APROVACAO_E2" && ehAdmin && <>
            <button className="primary" onClick={() => run(api.aprovarEstagio2(os.id))}>Aprovar Estágio 2</button>
            <button onClick={() => run(api.reprovarEstagio2(os.id))}>Reprovar</button>
          </>}
          {s === "AGUARDANDO_APROVACAO_E2" && !ehAdmin && <span className="badge alerta">Aguardando aprovação do orçamento do Estágio 2</span>}
          {s === "APROVADO_E2" && <button className="primary" onClick={() => run(api.iniciarEstagio2(os.id))}>Iniciar manutenção (Estágio 2)</button>}
          {s === "ESTAGIO_2" && <button className="primary" onClick={() => run(api.concluirOs(os.id))}>Concluir serviço</button>}
        </div>
      )}

      {/* Poderes do administrativo */}
      {ehAdmin && (
        <div className="admin-powers">
          {s !== "CONCLUIDA" && s !== "CANCELADA" && <button className="link" onClick={() => run(api.cancelarOs(os.id))}>cancelar</button>}
          {(s === "CONCLUIDA" || s === "CANCELADA") && <button className="link" onClick={() => run(api.reabrirOs(os.id))}>reabrir</button>}
          <label className="inline-sel">alterar estágio
            <select value={s} onChange={(e) => {
              const novo = e.target.value;
              if (novo === s) return;
              const motivo = prompt("Motivo da alteração de estágio (fica registrado na auditoria):");
              if (!motivo || !motivo.trim()) return;
              run(api.alterarStatusOs(os.id, novo, motivo.trim()));
            }}>
              {Object.keys(OS_STATUS).map((k) => <option key={k} value={k}>{OS_STATUS[k]}</option>)}
            </select>
          </label>
        </div>
      )}

      {/* Diagnóstico (+ mão de obra, só para quem vê valores) */}
      {podeOperar && (s === "ORCAMENTO" || s === "ESTAGIO_1") && (
        <div className="bloco">
          <h3>{verValores ? "Diagnóstico e mão de obra" : "Diagnóstico"}</h3>
          <label>Diagnóstico<textarea value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)} rows={2} /></label>
          <div className="row">
            {verValores && <label>Mão de obra (R$)<input type="number" value={maoObra} onChange={(e) => setMaoObra(Number(e.target.value))} /></label>}
            <button onClick={salvarInfo}>Salvar</button>
          </div>
        </div>
      )}

      {/* Adicionar peças */}
      {podeOperar && (s === "ORCAMENTO" || s === "ESTAGIO_1") && (
        <div className="bloco">
          <h3>{s === "ORCAMENTO" ? "Adicionar peça ao orçamento" : "Adicionar peça (Estágio 2)"}</h3>
          <div className="row">
            <label>Peça
              <select value={itemSel} onChange={(e) => setItemSel(e.target.value)}>
                {props.itens.map((i) => <option key={i.id} value={i.id}>
                  {verValores ? `${i.sku} — ${brl(i.preco)} (saldo ${i.saldo})` : `${i.sku} (saldo ${i.saldo})`}
                </option>)}
              </select>
            </label>
            <label>Qtd<input type="number" min={1} value={qtd} onChange={(e) => setQtd(Number(e.target.value))} /></label>
            <button className="primary" disabled={!props.itens.length} onClick={adicionar}><IconPlus size={16} /> Adicionar</button>
          </div>
          {flashMsg && <div className="flash-ok">✓ {flashMsg}</div>}
        </div>
      )}

      {/* Lista de peças do orçamento (com editar/excluir) */}
      {orc && orc.linhas.length > 0 && (
        <div className="bloco">
          <h3>{verValores ? "Orçamento" : "Peças da ordem"} ({orc.linhas.length})</h3>
          <table>
            <thead><tr><th>Peça</th><th>Qtd</th>{verValores && <><th>Unitário</th><th>Subtotal</th></>}
              {podeEditarItens && <th></th>}</tr></thead>
            <tbody>
              {orc.linhas.map((l) => (
                <tr key={l.id} className={l.adicional ? "adicional-row" : ""}>
                  <td className="mono">{l.sku}{l.adicional && <span className="badge etapa"> adicional</span>}
                    {l.baixado && <span className="badge ok"> baixada</span>}</td>
                  <td>{l.quantidade}</td>
                  {verValores && <><td>{brl(l.precoUnitario)}</td><td>{brl(l.subtotal)}</td></>}
                  {podeEditarItens && <td className="acoes">
                    {l.baixado ? <span className="muted small">no estoque</span> : <>
                      <button className="link" onClick={() => editarLinha(l.id, l.sku, l.quantidade)}>editar</button>
                      <button className="link perigo" onClick={() => removerLinha(l.id, l.sku)}>excluir</button>
                    </>}
                  </td>}
                </tr>
              ))}
            </tbody>
            {verValores && (
              <tfoot>
                <tr><td colSpan={3}>Peças (escopo inicial)</td><td>{brl(orc.totalInicial)}</td>{podeEditarItens && <td></td>}</tr>
                {orc.totalAdicionais > 0 && <tr className="adicional-row"><td colSpan={3}>Adicionais</td><td>{brl(orc.totalAdicionais)}</td>{podeEditarItens && <td></td>}</tr>}
                {orc.maoDeObra > 0 && <tr><td colSpan={3}>Mão de obra</td><td>{brl(orc.maoDeObra)}</td>{podeEditarItens && <td></td>}</tr>}
                <tr><td colSpan={3}><b>TOTAL</b></td><td><b>{brl(orc.total)}</b></td>{podeEditarItens && <td></td>}</tr>
              </tfoot>
            )}
          </table>
          <div className="row botoes-doc">
            {verValores && <button className="link" onClick={() => comErro(api.orcamentoPdf(os.id, os.numero))}><IconPdf size={16} /> Baixar PDF</button>}
            {verValores && <button className="link" onClick={() => comErro(api.whatsappOrcamento(os.id).then((r) => r && window.open(r.url, "_blank")))}><IconWhatsapp size={16} /> WhatsApp</button>}
            {podeOperar && <button className="link" onClick={analisar}>Sugestões da IA</button>}
          </div>
          {sug && (
            <div className="historico">
              {sug.length === 0 && <p className="muted small">Nenhum padrão inferido</p>}
              {sug.map((sg, i) => (
                <div key={i} className="alerta"><b>Padrão {sg.padrao}</b><p className="small">{sg.alerta}</p>
                  <ul>{sg.verificar.map((v, j) => <li key={j}>{v}</li>)}</ul></div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Diagnóstico assistido (KCI) */}
      {podeOperar && (s === "ORCAMENTO" || s === "ESTAGIO_1") && props.sintomas.length > 0 && (
        <div className="bloco">
          <h3>Diagnóstico assistido (IA)</h3>
          <div className="sintomas">
            {props.sintomas.map((sy) => (
              <label key={sy.tag} className="check">
                <input type="checkbox" checked={!!marcados[sy.tag]}
                  onChange={(e) => setMarcados({ ...marcados, [sy.tag]: e.target.checked })} />
                {sy.rotulo}
              </label>
            ))}
          </div>
          <button onClick={diagnosticar}>Diagnosticar</button>
          {diag && (
            <div className="alerta">
              <b>Hipóteses ({diag.length})</b>
              {diag.length === 0 && <p className="muted">Nenhuma hipótese</p>}
              <ol>{diag.map((d, i) => (
                <li key={i}><b>{d.causa}</b> <span className="badge">{d.confianca}%</span>
                  <div className="muted small">Ações {d.acoes.join("; ")}{d.pecasSugeridas.length > 0 && <> · Peças {d.pecasSugeridas.join(", ")}</>}</div>
                </li>
              ))}</ol>
            </div>
          )}
        </div>
      )}

      {/* Sugestões / observações internas */}
      <div className="bloco">
        <h3>Sugestões e observações</h3>
        {!ehCliente && (
          <>
            <label>Modelos prontos
              <select value="" onChange={(e) => { if (e.target.value) setNovaObs(e.target.value); }}>
                <option value="">selecione uma sugestão…</option>
                {OBSERVACOES_PADRAO.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </label>
            <label>Observação<textarea value={novaObs} onChange={(e) => setNovaObs(e.target.value)} rows={2} /></label>
            <div className="row entre">
              {/* O técnico só registra observação interna; o cliente-visível é do administrativo */}
              {ehAdmin
                ? <label className="check"><input type="checkbox" checked={visCliente} onChange={(e) => setVisCliente(e.target.checked)} /> visível ao cliente</label>
                : <span className="muted small">Observação interna (não vai para o cliente)</span>}
              <button onClick={comentar}>Adicionar</button>
            </div>
          </>
        )}
        <ul className="obs-lista">
          {obs.map((o) => (
            <li key={o.id}>
              <b>{o.autorNome ?? "—"}</b> {o.visivelCliente && <span className="badge ok">cliente</span>}
              <div>{o.texto}</div>
              <div className="muted small">{dt(o.criadoEm)}</div>
            </li>
          ))}
          {obs.length === 0 && <li className="muted">Nenhuma observação</li>}
        </ul>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Estoque (ADMIN) — custo, venda, movimentação, previsão
// ---------------------------------------------------------------------------
function Estoque(props: { comErro: <T>(p: Promise<T>) => Promise<T | void> }) {
  const [itens, setItens] = useState<Item[]>([]);
  const [abc, setAbc] = useState<ClassificacaoAbc[]>([]);
  const [movs, setMovs] = useState<{ sku: string; lista: Movimentacao[] } | null>(null);
  const [sku, setSku] = useState("");
  const [descricao, setDescricao] = useState("");
  const [saldo, setSaldo] = useState(10);
  const [ponto, setPonto] = useState(5);
  const [preco, setPreco] = useState(0);
  const [custo, setCusto] = useState(0);
  const [fornecedor, setFornecedor] = useState("");
  // Alimentar estoque (chegada de peças)
  const [alimId, setAlimId] = useState("");
  const [alimQtd, setAlimQtd] = useState(10);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  async function carregar() {
    const dados = await props.comErro(Promise.all([api.listarItens(), api.curvaAbc()]));
    if (dados) {
      setItens(dados[0]); setAbc(dados[1]);
      if (!alimId && dados[0].length) setAlimId(dados[0][0].id);
    }
  }
  useEffect(() => { void carregar(); }, []);

  async function criar() {
    if (!sku || !descricao) return;
    const r = await props.comErro(api.criarItem(sku, descricao, Number(saldo), Number(ponto), Number(preco), Number(custo), fornecedor));
    if (r) { setSku(""); setDescricao(""); setPreco(0); setCusto(0); setFornecedor(""); await carregar(); }
  }
  async function alimentar() {
    if (!alimId || alimQtd <= 0) return;
    const r = await props.comErro(api.entrada(alimId, Number(alimQtd)));
    if (r) await carregar();
  }
  async function reprecificar(i: Item) {
    const p = prompt(`Preço de venda de ${i.sku} (R$):`, String(i.preco));
    if (p === null) return;
    const c = prompt(`Custo de compra de ${i.sku} (R$):`, String(i.custo));
    const f = prompt(`Fornecedor de ${i.sku}:`, i.fornecedor ?? "");
    const r = await props.comErro(api.precificar(i.id, Number(p.replace(",", ".")),
      c === null ? null : Number(c.replace(",", ".")), f));
    if (r) await carregar();
  }
  async function verMovs(id: string, s: string) {
    const m = await props.comErro(api.movimentacoes(id));
    if (m) setMovs({ sku: s, lista: m });
  }
  async function importar(file: File) {
    setImportMsg(null);
    const r = await props.comErro(api.importarEstoque(file));
    if (r) {
      setImportMsg(`${r.criados} peça(s) criada(s), ${r.atualizados} atualizada(s)`
        + (r.ignorados.length ? ` · ${r.ignorados.length} ignorada(s)` : ""));
      await carregar();
    }
  }

  const abcClasse = (id: string) => abc.find((c) => c.itemId === id)?.classe ?? "—";
  const repor = itens.filter((i) => i.precisaRepor);

  return (
    <div>
      {repor.length > 0 && (
        <div className="alerta pedido">
          <b>Peças que precisam de pedido ({repor.length})</b>
          <ul>{repor.map((i) => (
            <li key={i.id}><b className="mono">{i.sku}</b> — saldo {i.saldo} (mínimo {i.pontoReposicao}) ·
              pedir a <b>{i.fornecedor ?? "fornecedor não informado"}</b></li>
          ))}</ul>
        </div>
      )}

      <div className="grid">
        <section className="card">
          <h2>Alimentar estoque</h2>
          <p className="muted small">Quando chegar peça nova, registre a entrada aqui — gera movimentação no histórico.</p>
          <label>Peça
            <select value={alimId} onChange={(e) => setAlimId(e.target.value)}>
              {itens.map((i) => <option key={i.id} value={i.id}>{i.sku} — saldo {i.saldo}</option>)}
            </select>
          </label>
          <div className="row">
            <label>Quantidade recebida<input type="number" value={alimQtd} onChange={(e) => setAlimQtd(Number(e.target.value))} /></label>
            <button className="primary" disabled={!itens.length} onClick={alimentar}>Dar entrada</button>
          </div>

          <hr className="sep" />
          <h2>Importar planilha de peças</h2>
          <p className="muted small">Suba uma planilha <b>CSV</b> (colunas: sku, descricao, quantidade, custo, preco,
            fornecedor). As peças novas são criadas e as existentes têm nome, preços e fornecedor atualizados, com
            entrada da quantidade. (No Excel: Arquivo → Salvar como → CSV.)</p>
          <input type="file" accept=".csv,text/csv" onChange={(e) => {
            const f = e.target.files?.[0]; if (f) { void importar(f); e.target.value = ""; }
          }} />
          {importMsg && <div className="flash-ok">✓ {importMsg}</div>}

          <hr className="sep" />
          <h2>Nova peça</h2>
          <p className="muted small">O preço de venda alimenta o orçamento; o custo alimenta o financeiro de peças.</p>
          <label>SKU<input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="HELICE-0420" /></label>
          <label>Descrição<input value={descricao} onChange={(e) => setDescricao(e.target.value)} /></label>
          <div className="row">
            <label>Saldo inicial<input type="number" value={saldo} onChange={(e) => setSaldo(Number(e.target.value))} /></label>
            <label>Estoque mínimo<input type="number" value={ponto} onChange={(e) => setPonto(Number(e.target.value))} /></label>
          </div>
          <div className="row">
            <label>Custo (R$)<input type="number" value={custo} onChange={(e) => setCusto(Number(e.target.value))} /></label>
            <label>Venda (R$)<input type="number" value={preco} onChange={(e) => setPreco(Number(e.target.value))} /></label>
          </div>
          <label>Fornecedor<input value={fornecedor} onChange={(e) => setFornecedor(e.target.value)} placeholder="DJI Store Brasil" /></label>
          <button className="primary" onClick={criar}>Cadastrar</button>
        </section>

        <section className="card">
          <h2>Estoque ({itens.length})</h2>
          <div className="tabela-scroll">
            <table>
              <thead><tr><th>SKU</th><th>Disponível</th><th>Custo</th><th>Venda</th><th>Fornecedor</th><th>ABC</th><th></th></tr></thead>
              <tbody>
                {itens.map((i) => (
                  <tr key={i.id} className={i.precisaRepor ? "repor" : ""}>
                    <td className="mono">{i.sku}</td>
                    <td><b>{i.saldo}</b>{i.precisaRepor && <span className="tag-repor"> pedir</span>}</td>
                    <td>{brl(i.custo)}</td>
                    <td>{brl(i.preco)}</td>
                    <td className="small">{i.fornecedor ?? "—"}</td>
                    <td><span className={"abc abc-" + abcClasse(i.id)}>{abcClasse(i.id)}</span></td>
                    <td className="acoes">
                      <button className="link" onClick={() => reprecificar(i)}>editar</button>
                      <button className="link" onClick={() => verMovs(i.id, i.sku)}>histórico</button>
                    </td>
                  </tr>
                ))}
                {itens.length === 0 && <tr><td colSpan={7} className="muted">Nenhum item</td></tr>}
              </tbody>
            </table>
          </div>
          {movs && (
            <div className="historico">
              <h3>Histórico de movimentações — {movs.sku}</h3>
              <ol>{movs.lista.map((m, i) => (
                <li key={i}><b>{m.tipo}</b> {m.quantidade} <span className="muted">{m.origem} · {dt(m.criadoEm)}</span></li>
              ))}{movs.lista.length === 0 && <li className="muted">Sem movimentações</li>}</ol>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// IA Preditiva (ADMIN) — relatório + export
// ---------------------------------------------------------------------------
function IaPreditiva(props: { comErro: <T>(p: Promise<T>) => Promise<T | void> }) {
  const [rel, setRel] = useState<RelatorioIa | null>(null);
  const [texto, setTexto] = useState("HELICE-54, EIXO-BRACO");
  const [sug, setSug] = useState<Sugestao[] | null>(null);
  const [base, setBase] = useState<ConhecimentoIa[]>([]);
  const [fab, setFab] = useState<SugestaoFabricante[]>([]);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  async function carregar() {
    const dados = await props.comErro(Promise.all([api.relatorioIa(), api.iaBase(), api.sugestoesFabricante()]));
    if (dados) { setRel(dados[0]); setBase(dados[1]); setFab(dados[2]); }
  }
  useEffect(() => { void carregar(); }, []);

  async function analisar() {
    const pecas = texto.split(",").map((s) => s.trim()).filter(Boolean);
    if (!pecas.length) return;
    const r = await props.comErro(api.sugestoes(pecas));
    if (r) setSug(r);
  }
  async function importar(file: File) {
    setImportMsg(null);
    const r = await props.comErro(api.importarBaseIa(file));
    if (r) { setImportMsg(`${r.importados} item(ns) importado(s)`); await carregar(); }
  }

  return (
    <div>
      <div className="barra-acoes">
        <button className="primary" onClick={carregar}>Gerar relatório</button>
        <button onClick={() => props.comErro(api.relatorioIaPdf())}>Exportar PDF</button>
        <button onClick={() => props.comErro(api.relatorioIaExcel())}>Exportar Excel</button>
        <button onClick={() => props.comErro(api.relatorioIaCsv())}>Exportar CSV</button>
        <label className="botao-arquivo">Importar base (CSV)
          <input type="file" accept=".csv,text/csv" onChange={(e) => {
            const f = e.target.files?.[0]; if (f) { void importar(f); e.target.value = ""; }
          }} />
        </label>
        {importMsg && <span className="flash-ok">✓ {importMsg}</span>}
        {rel && <span className="muted small">Gerado em {rel.geradoEm} · {rel.osConcluidas} manutenções analisadas</span>}
      </div>

      <section className="card" style={{ marginBottom: 16 }}>
        <h2>Sugestão de melhoria para o fabricante</h2>
        <p className="muted small">Gerada do histórico dos técnicos: aeronaves que quebram uma mesma peça com
          frequência viram um texto pronto para enviar ao fabricante/indústria.</p>
        {fab.length === 0 && <p className="muted">Sem padrões suficientes ainda — aparece conforme o histórico cresce.</p>}
        {fab.map((f, i) => (
          <div key={i} className="alerta">
            <b>{f.modelo} · {f.peca} ({f.ocorrencias} manutenções)</b>
            <p className="small">{f.texto}</p>
            <button className="link" onClick={() => window.open(linkWhatsApp("",
              `Sugestão de melhoria (${BRAND.nome}): ${f.texto}`), "_blank")}>
              <IconWhatsapp size={15} /> Enviar sugestão
            </button>
          </div>
        ))}
      </section>

      <div className="grid">
        <section className="card">
          <h2>Drones com mais problemas</h2>
          <table>
            <thead><tr><th>Modelo</th><th>Manut.</th><th>Peça recorrente</th><th>Qtd</th></tr></thead>
            <tbody>
              {rel?.dronesComMaisProblemas.map((c, i) => (
                <tr key={i}><td><b>{c.modelo}</b></td><td>{c.manutencoes}</td>
                  <td className="mono">{c.pecaMaisRecorrente ?? "—"}</td><td>{c.quantidadePeca}</td></tr>
              ))}
              {!rel?.dronesComMaisProblemas.length && <tr><td colSpan={4} className="muted">Sem histórico ainda</td></tr>}
            </tbody>
          </table>
        </section>

        <section className="card">
          <h2>Peças mais trocadas</h2>
          <table>
            <thead><tr><th>SKU</th><th>Descrição</th><th>Qtd</th></tr></thead>
            <tbody>
              {rel?.pecasMaisTrocadas.map((p, i) => (
                <tr key={i}><td className="mono">{p.sku}</td><td>{p.descricao}</td><td>{p.quantidade}</td></tr>
              ))}
              {!rel?.pecasMaisTrocadas.length && <tr><td colSpan={3} className="muted">Sem consumo ainda</td></tr>}
            </tbody>
          </table>
        </section>

        <section className="card">
          <h2>Falhas recorrentes e recomendações</h2>
          {rel && rel.falhasRecorrentes.length > 0 && <>
            <h3>Falhas recorrentes</h3>
            <ul>{rel.falhasRecorrentes.map((f, i) => <li key={i}>{f}</li>)}</ul>
          </>}
          <h3>Recomendações</h3>
          <ul>{rel?.recomendacoes.map((r, i) => <li key={i}>{r}</li>)}</ul>
        </section>

        <section className="card">
          <h2>Sugestões por correlação</h2>
          <p className="muted small">Informe peças (separadas por vírgula) e a IA infere o padrão (ex.: hélices + eixos → "Queda").</p>
          <label>Peças<input value={texto} onChange={(e) => setTexto(e.target.value)} /></label>
          <button className="primary" onClick={analisar}>Analisar</button>
          {sug && (
            <div className="historico">
              {sug.length === 0 && <p className="muted">Nenhum padrão inferido</p>}
              {sug.map((s, i) => (
                <div key={i} className="alerta"><b>Padrão {s.padrao}</b><p className="small">{s.alerta}</p>
                  <ul>{s.verificar.map((v, j) => <li key={j}>{v}</li>)}</ul></div>
              ))}
            </div>
          )}
        </section>

        <section className="card" style={{ gridColumn: "1 / -1" }}>
          <h2>Base de conhecimento ({base.length})</h2>
          <p className="muted small">Importe um CSV (colunas: problema, causa, comoResolver, sugestao) pelo botão
            "Importar base" acima. Serve de apoio ao diagnóstico dos técnicos.</p>
          <div className="tabela-scroll">
            <table>
              <thead><tr><th>Problema</th><th>Causa</th><th>Como resolver</th><th>Sugestão</th></tr></thead>
              <tbody>
                {base.map((b) => (
                  <tr key={b.id}><td>{b.problema}</td><td>{b.causa ?? "—"}</td>
                    <td>{b.solucao ?? "—"}</td><td>{b.sugestao ?? "—"}</td></tr>
                ))}
                {base.length === 0 && <tr><td colSpan={4} className="muted">Base vazia — importe um arquivo</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Financeiro de peças (ADMIN)
// ---------------------------------------------------------------------------
function Financeiro(props: { comErro: <T>(p: Promise<T>) => Promise<T | void> }) {
  const [r, setR] = useState<ResumoPecas | null>(null);
  useEffect(() => {
    void (async () => { const x = await props.comErro(api.financeiroPecas()); if (x) setR(x); })();
  }, []);
  if (!r) return <div className="card"><p className="muted">Carregando…</p></div>;
  return (
    <div>
      <div className="kpis">
        <div className="kpi"><span className="kpi-num">{brl(r.receitaTotal)}</span><span className="kpi-lbl">Receita (peças vendidas)</span></div>
        <div className="kpi"><span className="kpi-num">{brl(r.lucroTotal)}</span><span className="kpi-lbl">Lucro</span></div>
        <div className="kpi"><span className="kpi-num">{r.margemMedia}%</span><span className="kpi-lbl">Margem média</span></div>
        <div className={r.itensParaRepor ? "kpi alerta-kpi" : "kpi"}><span className="kpi-num">{brl(r.valorEstoque)}</span><span className="kpi-lbl">Valor em estoque</span></div>
      </div>
      <section className="card">
        <h2>Rentabilidade por peça</h2>
        <div className="tabela-scroll">
          <table>
            <thead><tr>
              <th>SKU</th><th>Custo</th><th>Venda</th><th>Margem</th><th>%</th>
              <th>Vendidas</th><th>Lucro</th><th>Giro</th><th>Mín.</th><th>Recom.</th><th>Previsão</th>
            </tr></thead>
            <tbody>
              {r.pecas.map((p) => (
                <tr key={p.itemId}>
                  <td className="mono">{p.sku}</td>
                  <td>{brl(p.custo)}</td>
                  <td>{brl(p.preco)}</td>
                  <td>{brl(p.margemUnitaria)}</td>
                  <td>{p.margemPercentual}%</td>
                  <td>{p.volumeVendido}</td>
                  <td>{brl(p.lucro)}</td>
                  <td>{p.giro}</td>
                  <td>{p.estoqueMinimo}</td>
                  <td>{p.estoqueRecomendado}</td>
                  <td>{p.previsaoConsumo}</td>
                </tr>
              ))}
              {r.pecas.length === 0 && <tr><td colSpan={11} className="muted">Nenhuma peça cadastrada</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Usuários (ADMIN)
// ---------------------------------------------------------------------------
const PERFIS = ["ADMIN", "TECNICO", "CLIENTE"];

function Usuarios(props: { comErro: <T>(p: Promise<T>) => Promise<T | void> }) {
  const [lista, setLista] = useState<(Usuario & { ativo: boolean })[]>([]);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [perfil, setPerfil] = useState("TECNICO");

  async function carregar() {
    const l = await props.comErro(api.listarUsuarios());
    if (l) setLista(l);
  }
  useEffect(() => { void carregar(); }, []);

  async function criar() {
    if (!nome || !email || senha.length < 8) return;
    const r = await props.comErro(api.criarUsuario(nome, email, senha, perfil));
    if (r) { setNome(""); setEmail(""); setSenha(""); await carregar(); }
  }
  async function alternar(u: Usuario & { ativo: boolean }) {
    const r = await props.comErro(u.ativo ? api.bloquearUsuario(u.id) : api.reativarUsuario(u.id));
    if (r) await carregar();
  }
  async function mudarPerfil(u: Usuario, p: string) {
    const r = await props.comErro(api.editarUsuario(u.id, u.nome, p));
    if (r) await carregar();
  }
  async function resetar(u: Usuario) {
    const r = await props.comErro(api.redefinirSenha(u.id));
    if (r) alert(`Nova senha de ${u.email}: ${r.senha}`);
  }
  async function excluir(u: Usuario) {
    if (!confirm(`Excluir ${u.email}?`)) return;
    await props.comErro(api.excluirUsuario(u.id));
    await carregar();
  }

  return (
    <div className="grid">
      <section className="card">
        <h2>Novo usuário</h2>
        <p className="muted small">Três perfis: <b>ADMIN</b> (gerência), <b>TECNICO</b> (execução) e <b>CLIENTE</b> (acompanhamento).</p>
        <label>Nome<input value={nome} onChange={(e) => setNome(e.target.value)} /></label>
        <label>E-mail<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label>Senha<input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="mín. 8 caracteres" /></label>
        <label>Perfil
          <select value={perfil} onChange={(e) => setPerfil(e.target.value)}>
            {PERFIS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        <button className="primary" onClick={criar}>Criar usuário</button>
      </section>

      <section className="card">
        <h2>Usuários ({lista.length})</h2>
        <table>
          <thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {lista.map((u) => (
              <tr key={u.id} className={u.ativo ? "" : "inativo"}>
                <td>{u.nome}</td>
                <td className="mono">{u.email}</td>
                <td>
                  <select value={u.perfil} onChange={(e) => mudarPerfil(u, e.target.value)}>
                    {PERFIS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </td>
                <td>{u.ativo ? <span className="badge ok">ativo</span> : <span className="badge cancel">bloqueado</span>}</td>
                <td className="acoes">
                  <button className="link" onClick={() => alternar(u)}>{u.ativo ? "bloquear" : "reativar"}</button>
                  <button className="link" onClick={() => resetar(u)}>resetar senha</button>
                  <button className="link perigo" onClick={() => excluir(u)}>excluir</button>
                </td>
              </tr>
            ))}
            {lista.length === 0 && <tr><td colSpan={5} className="muted">Nenhum usuário</td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Auditoria (ADMIN) — IP/tela + PDF por período
// ---------------------------------------------------------------------------
function Auditoria(props: { comErro: <T>(p: Promise<T>) => Promise<T | void> }) {
  const [eventos, setEventos] = useState<EventoAuditoria[]>([]);
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");

  useEffect(() => {
    void (async () => { const e = await props.comErro(api.auditoria(200)); if (e) setEventos(e); })();
  }, []);

  return (
    <section className="card">
      <div className="barra-acoes">
        <h2 style={{ margin: 0 }}>Trilha de auditoria ({eventos.length})</h2>
        <label className="inline-sel">de<input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} /></label>
        <label className="inline-sel">até<input type="date" value={fim} onChange={(e) => setFim(e.target.value)} /></label>
        <button className="primary" onClick={() => props.comErro(api.auditoriaPdf(inicio || undefined, fim || undefined))}>Baixar PDF</button>
      </div>
      <p className="muted small">Registro imutável: usuário, data/hora, IP, ação, tela e registro afetado. Não pode ser editado nem excluído. Sem intervalo, o PDF traz a última semana.</p>
      <div className="tabela-scroll">
        <table>
          <thead><tr><th>Quando</th><th>Usuário</th><th>Ação</th><th>Recurso</th><th>IP</th><th>Tela</th><th>Detalhe</th></tr></thead>
          <tbody>
            {eventos.map((e, i) => (
              <tr key={i}>
                <td className="mono">{e.ocorridoEm.replace("T", " ").slice(0, 19)}</td>
                <td>{e.usuarioEmail ?? "—"}</td>
                <td><span className="badge">{e.acao}</span></td>
                <td className="mono">{e.recursoTipo ?? ""}</td>
                <td className="mono">{e.ip ?? "—"}</td>
                <td>{e.tela ?? "—"}</td>
                <td>{e.detalhe ?? ""}</td>
              </tr>
            ))}
            {eventos.length === 0 && <tr><td colSpan={7} className="muted">Nenhum evento</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Desenvolvedor (DEV) — console de solicitações de alteração (gera PDF)
// ---------------------------------------------------------------------------
function Desenvolvedor(props: { comErro: <T>(p: Promise<T>) => Promise<T | void> }) {
  const [titulo, setTitulo] = useState("Solicitação de alterações");
  const [itens, setItens] = useState<ItemAlteracao[]>([{ tela: "", campo: "", alteracao: "" }]);

  function atualizar(i: number, campo: keyof ItemAlteracao, valor: string) {
    setItens((xs) => xs.map((x, j) => (j === i ? { ...x, [campo]: valor } : x)));
  }
  function adicionar() { setItens((xs) => [...xs, { tela: "", campo: "", alteracao: "" }]); }
  function remover(i: number) { setItens((xs) => xs.filter((_, j) => j !== i)); }

  async function salvar() {
    const validos = itens.filter((x) => x.tela.trim() || x.campo.trim() || x.alteracao.trim());
    if (!validos.length) return;
    await props.comErro(api.devSolicitacaoPdf(titulo, validos));
  }

  return (
    <section className="card">
      <h2>Console do desenvolvedor</h2>
      <p className="muted small">Liste o que precisa ser alterado (tela, campo e a mudança). Ao salvar, o sistema
        gera um PDF para download com tudo — leve o PDF para a equipe de desenvolvimento aplicar exatamente o que foi pedido.</p>
      <label>Título<input value={titulo} onChange={(e) => setTitulo(e.target.value)} /></label>
      <div className="tabela-scroll">
        <table>
          <thead><tr><th>Tela / Área</th><th>Campo / Item</th><th>Alteração solicitada</th><th></th></tr></thead>
          <tbody>
            {itens.map((x, i) => (
              <tr key={i}>
                <td><input value={x.tela} onChange={(e) => atualizar(i, "tela", e.target.value)} placeholder="Estoque" /></td>
                <td><input value={x.campo} onChange={(e) => atualizar(i, "campo", e.target.value)} placeholder="Tamanho da fonte" /></td>
                <td><input value={x.alteracao} onChange={(e) => atualizar(i, "alteracao", e.target.value)} placeholder="Aumentar para 16px" /></td>
                <td>{itens.length > 1 && <button className="link perigo" onClick={() => remover(i)}>remover</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="row botoes-doc">
        <button onClick={adicionar}><IconPlus size={16} /> Adicionar linha</button>
        <button className="primary" onClick={salvar}><IconDownload size={16} /> Salvar e gerar PDF</button>
      </div>
    </section>
  );
}
