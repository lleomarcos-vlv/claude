import { useEffect, useState } from "react";
import {
  api,
  clearTenant,
  getTenant,
  setTenant,
  type Equipamento,
  type Evento,
  type Item,
  type OrdemServico,
} from "./api";

type Aba = "equipamentos" | "estoque" | "ordens";

export default function App() {
  const [tenant, setTenantState] = useState<string | null>(getTenant());
  const [aba, setAba] = useState<Aba>("equipamentos");
  const [erro, setErro] = useState<string | null>(null);

  function comErro<T>(p: Promise<T>): Promise<T | void> {
    setErro(null);
    return p.catch((e: Error) => setErro(e.message));
  }

  if (!tenant) {
    return <SetupEmpresa onPronto={(id) => { setTenant(id); setTenantState(id); }} />;
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">◈</span> Drone Kairós <b>ERP</b>
        </div>
        <div className="tenant">
          <span title={tenant}>empresa: {tenant.slice(0, 8)}…</span>
          <button className="link" onClick={() => { clearTenant(); setTenantState(null); }}>
            trocar
          </button>
        </div>
      </header>

      <nav className="tabs">
        <Tab id="equipamentos" atual={aba} set={setAba}>Equipamentos</Tab>
        <Tab id="estoque" atual={aba} set={setAba}>Estoque (KSI)</Tab>
        <Tab id="ordens" atual={aba} set={setAba}>Ordens de Serviço</Tab>
      </nav>

      {erro && <div className="erro" onClick={() => setErro(null)}>⚠ {erro}</div>}

      <main>
        {aba === "equipamentos" && <Equipamentos comErro={comErro} />}
        {aba === "estoque" && <Estoque comErro={comErro} />}
        {aba === "ordens" && <Ordens comErro={comErro} />}
      </main>

      <footer className="rodape">
        Fase 3 · walking skeleton · API real · rastreabilidade por Serial Number
      </footer>
    </div>
  );
}

function Tab(props: { id: Aba; atual: Aba; set: (a: Aba) => void; children: React.ReactNode }) {
  const ativo = props.id === props.atual;
  return (
    <button className={ativo ? "tab ativo" : "tab"} onClick={() => props.set(props.id)}>
      {props.children}
    </button>
  );
}

function SetupEmpresa(props: { onPronto: (id: string) => void }) {
  const [nome, setNome] = useState("Drones Kairós Ltda");
  const [documento, setDocumento] = useState("11.111.111/0001-11");
  const [idManual, setIdManual] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  async function criar() {
    setErro(null);
    try {
      const e = await api.criarEmpresa(nome, documento);
      props.onPronto(e.id);
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  return (
    <div className="setup">
      <div className="card setup-card">
        <h1><span className="logo">◈</span> Drone Kairós ERP</h1>
        <p className="muted">Crie uma empresa (tenant) para começar, ou informe o ID de uma existente.</p>
        {erro && <div className="erro">⚠ {erro}</div>}
        <label>Nome<input value={nome} onChange={(e) => setNome(e.target.value)} /></label>
        <label>Documento<input value={documento} onChange={(e) => setDocumento(e.target.value)} /></label>
        <button className="primary" onClick={criar}>Criar empresa</button>
        <div className="ou">ou</div>
        <label>ID de empresa existente
          <input value={idManual} onChange={(e) => setIdManual(e.target.value)} placeholder="uuid do tenant" />
        </label>
        <button disabled={!idManual} onClick={() => props.onPronto(idManual.trim())}>Usar este ID</button>
      </div>
    </div>
  );
}

function Equipamentos(props: { comErro: <T>(p: Promise<T>) => Promise<T | void> }) {
  const [lista, setLista] = useState<Equipamento[]>([]);
  const [sn, setSn] = useState("");
  const [modelo, setModelo] = useState("");
  const [fabricante, setFabricante] = useState("Kairós");
  const [historico, setHistorico] = useState<{ id: string; eventos: Evento[] } | null>(null);

  async function carregar() {
    const l = await props.comErro(api.listarEquipamentos());
    if (l) setLista(l);
  }
  useEffect(() => { void carregar(); }, []);

  async function registrar() {
    if (!sn || !modelo) return;
    const r = await props.comErro(api.registrarEquipamento(sn, modelo, fabricante));
    if (r) { setSn(""); setModelo(""); await carregar(); }
  }
  async function verHistorico(id: string) {
    const ev = await props.comErro(api.historico(id));
    if (ev) setHistorico({ id, eventos: ev });
  }

  return (
    <div className="grid">
      <section className="card">
        <h2>Registrar equipamento</h2>
        <label>Serial Number<input value={sn} onChange={(e) => setSn(e.target.value)} placeholder="SN-DRONE-0001" /></label>
        <label>Modelo<input value={modelo} onChange={(e) => setModelo(e.target.value)} placeholder="KX-10" /></label>
        <label>Fabricante<input value={fabricante} onChange={(e) => setFabricante(e.target.value)} /></label>
        <button className="primary" onClick={registrar}>Registrar</button>
      </section>

      <section className="card">
        <h2>Equipamentos ({lista.length})</h2>
        <table>
          <thead><tr><th>Serial Number</th><th>Modelo</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {lista.map((e) => (
              <tr key={e.id}>
                <td className="mono">{e.serialNumber}</td>
                <td>{e.modelo}</td>
                <td><span className="badge">{e.status}</span></td>
                <td><button className="link" onClick={() => verHistorico(e.id)}>histórico</button></td>
              </tr>
            ))}
            {lista.length === 0 && <tr><td colSpan={4} className="muted">Nenhum equipamento ainda.</td></tr>}
          </tbody>
        </table>
        {historico && (
          <div className="historico">
            <h3>Histórico vitalício</h3>
            <ol>
              {historico.eventos.map((ev) => (
                <li key={ev.sequencia}><b>{ev.tipo}</b> — {ev.descricao} <span className="muted">({ev.ocorridoEm.replace("T", " ").slice(0, 19)})</span></li>
              ))}
            </ol>
          </div>
        )}
      </section>
    </div>
  );
}

function Estoque(props: { comErro: <T>(p: Promise<T>) => Promise<T | void> }) {
  const [itens, setItens] = useState<Item[]>([]);
  const [repor, setRepor] = useState<Item[]>([]);
  const [sku, setSku] = useState("");
  const [descricao, setDescricao] = useState("");
  const [saldo, setSaldo] = useState(10);
  const [ponto, setPonto] = useState(4);

  async function carregar() {
    const [l, r] = await Promise.all([api.listarItens(), api.reposicao()]);
    setItens(l);
    setRepor(r);
  }
  useEffect(() => { void props.comErro(carregar()); }, []);

  async function criar() {
    if (!sku || !descricao) return;
    const r = await props.comErro(api.criarItem(sku, descricao, Number(saldo), Number(ponto)));
    if (r) { setSku(""); setDescricao(""); await props.comErro(carregar()); }
  }
  async function entrada(id: string) {
    const r = await props.comErro(api.entrada(id, 5));
    if (r) await props.comErro(carregar());
  }

  return (
    <div className="grid">
      <section className="card">
        <h2>Novo item</h2>
        <label>SKU<input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="HELICE-9450" /></label>
        <label>Descrição<input value={descricao} onChange={(e) => setDescricao(e.target.value)} /></label>
        <div className="row">
          <label>Saldo inicial<input type="number" value={saldo} onChange={(e) => setSaldo(Number(e.target.value))} /></label>
          <label>Ponto reposição<input type="number" value={ponto} onChange={(e) => setPonto(Number(e.target.value))} /></label>
        </div>
        <button className="primary" onClick={criar}>Cadastrar</button>

        {repor.length > 0 && (
          <div className="alerta">
            <b>Reposição sugerida ({repor.length})</b>
            <ul>{repor.map((i) => <li key={i.id}>{i.sku} — saldo {i.saldo}</li>)}</ul>
          </div>
        )}
      </section>

      <section className="card">
        <h2>Estoque ({itens.length})</h2>
        <table>
          <thead><tr><th>SKU</th><th>Descrição</th><th>Saldo</th><th></th></tr></thead>
          <tbody>
            {itens.map((i) => (
              <tr key={i.id} className={i.precisaRepor ? "repor" : ""}>
                <td className="mono">{i.sku}</td>
                <td>{i.descricao}</td>
                <td>{i.saldo}{i.precisaRepor && <span className="tag-repor"> repor</span>}</td>
                <td><button className="link" onClick={() => entrada(i.id)}>+5</button></td>
              </tr>
            ))}
            {itens.length === 0 && <tr><td colSpan={4} className="muted">Nenhum item ainda.</td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Ordens(props: { comErro: <T>(p: Promise<T>) => Promise<T | void> }) {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [itens, setItens] = useState<Item[]>([]);
  const [equipamentoId, setEquipamentoId] = useState("");
  const [descricao, setDescricao] = useState("Manutenção preventiva");
  const [osSel, setOsSel] = useState("");
  const [itemSel, setItemSel] = useState("");
  const [qtd, setQtd] = useState(1);

  async function carregar() {
    const [o, e, i] = await Promise.all([api.listarOrdens(), api.listarEquipamentos(), api.listarItens()]);
    setOrdens(o);
    setEquipamentos(e);
    setItens(i);
    if (!equipamentoId && e.length) setEquipamentoId(e[0].id);
    if (!itemSel && i.length) setItemSel(i[0].id);
  }
  useEffect(() => { void props.comErro(carregar()); }, []);

  async function abrir() {
    if (!equipamentoId) return;
    const r = await props.comErro(api.abrirOs(equipamentoId, descricao));
    if (r) { setOsSel(r.id); await props.comErro(carregar()); }
  }
  async function adicionar() {
    if (!osSel || !itemSel) return;
    await props.comErro(api.adicionarItemOs(osSel, itemSel, Number(qtd)));
  }
  async function concluir(id: string) {
    const r = await props.comErro(api.concluirOs(id));
    if (r) await props.comErro(carregar());
  }

  return (
    <div className="grid">
      <section className="card">
        <h2>Abrir OS</h2>
        <label>Equipamento
          <select value={equipamentoId} onChange={(e) => setEquipamentoId(e.target.value)}>
            {equipamentos.map((e) => <option key={e.id} value={e.id}>{e.serialNumber} — {e.modelo}</option>)}
          </select>
        </label>
        <label>Descrição<input value={descricao} onChange={(e) => setDescricao(e.target.value)} /></label>
        <button className="primary" disabled={!equipamentos.length} onClick={abrir}>Abrir</button>

        <h3>Adicionar peça à OS</h3>
        <label>OS
          <select value={osSel} onChange={(e) => setOsSel(e.target.value)}>
            <option value="">selecione…</option>
            {ordens.filter((o) => o.status !== "CONCLUIDA").map((o) => <option key={o.id} value={o.id}>{o.numero}</option>)}
          </select>
        </label>
        <div className="row">
          <label>Item
            <select value={itemSel} onChange={(e) => setItemSel(e.target.value)}>
              {itens.map((i) => <option key={i.id} value={i.id}>{i.sku} (saldo {i.saldo})</option>)}
            </select>
          </label>
          <label>Qtd<input type="number" value={qtd} onChange={(e) => setQtd(Number(e.target.value))} /></label>
        </div>
        <button disabled={!osSel || !itens.length} onClick={adicionar}>Adicionar peça</button>
      </section>

      <section className="card">
        <h2>Ordens ({ordens.length})</h2>
        <table>
          <thead><tr><th>Número</th><th>Status</th><th>Descrição</th><th></th></tr></thead>
          <tbody>
            {ordens.map((o) => (
              <tr key={o.id}>
                <td className="mono">{o.numero}</td>
                <td><span className={o.status === "CONCLUIDA" ? "badge ok" : "badge"}>{o.status}</span></td>
                <td>{o.descricao}</td>
                <td>{o.status !== "CONCLUIDA" && <button className="link" onClick={() => concluir(o.id)}>concluir</button>}</td>
              </tr>
            ))}
            {ordens.length === 0 && <tr><td colSpan={4} className="muted">Nenhuma OS ainda.</td></tr>}
          </tbody>
        </table>
        <p className="muted small">Concluir uma OS baixa as peças no estoque e registra o serviço no histórico do equipamento.</p>
      </section>
    </div>
  );
}
