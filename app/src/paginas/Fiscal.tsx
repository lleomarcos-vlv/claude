/**
 * Fiscal (Fase 7): regras tributárias versionadas, simulador do motor de
 * cálculo e fila de documentos. Nada aqui transmite à SEFAZ: a emissão real
 * depende do agente local (Windows + ACBr + certificado A1) — enquanto ele
 * não estiver conectado, a tela diz isso com todas as letras.
 */
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { supabase, rpcApp } from '../lib/supabase'
import { useAuth } from '../lib/auth'

interface Regra {
  id: string; tipo_imposto: string; uf: string | null; ncm_padrao: string | null
  cst: string | null; cclasstrib: string | null; aliquota_pct: number
  reducao_base_pct: number; versao: number; vigencia_inicio: string
  vigencia_fim: string | null; fonte: string; validacao_contador: boolean
}
interface Doc {
  id: string; tipo: string; status: string; ambiente: string; criado_em: string
  sales: { numero: number } | null
}
interface Produto { id: string; nome: string }
interface Calculo {
  tipo_imposto: string; cst: string | null; aliquota_pct: number
  base: number; valor: number; validacao_contador: boolean; fonte: string
}

const IMPOSTOS = ['icms', 'ipi', 'pis', 'cofins', 'iss', 'ibs', 'cbs', 'is']

export default function Fiscal() {
  const { empresa, pode } = useAuth()
  const [regras, setRegras] = useState<Regra[]>([])
  const [docs, setDocs] = useState<Doc[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const [nova, setNova] = useState({
    tipo: 'icms', aliquota: '', vigencia: new Date().toISOString().slice(0, 10),
    fonte: '', uf: '', ncm: '', cst: '', cclasstrib: '', reducao: '',
  })
  const [formAberto, setFormAberto] = useState(false)

  const [simProduto, setSimProduto] = useState('')
  const [simValor, setSimValor] = useState('100')
  const [simulacao, setSimulacao] = useState<Calculo[] | null>(null)

  const carregar = useCallback(async () => {
    if (!empresa) return
    const t = empresa.tenant_id
    const [r, d, p] = await Promise.all([
      supabase.from('tax_rules')
        .select('id, tipo_imposto, uf, ncm_padrao, cst, cclasstrib, aliquota_pct, reducao_base_pct, versao, vigencia_inicio, vigencia_fim, fonte, validacao_contador')
        .eq('tenant_id', t).order('tipo_imposto').order('versao', { ascending: false }),
      supabase.from('fiscal_documents')
        .select('id, tipo, status, ambiente, criado_em, sales(numero)')
        .eq('tenant_id', t).order('criado_em', { ascending: false }).limit(30),
      supabase.from('products').select('id, nome').eq('tenant_id', t).eq('ativo', true).order('nome'),
    ])
    const falha = r.error ?? d.error ?? p.error
    if (falha) { setErro(falha.message); return }
    setRegras((r.data ?? []) as Regra[])
    setDocs((d.data ?? []) as unknown as Doc[])
    setProdutos((p.data ?? []) as Produto[])
  }, [empresa])

  useEffect(() => { void carregar() }, [carregar])

  async function criarRegra(e: FormEvent) {
    e.preventDefault()
    if (!empresa) return
    setErro(null)
    const { error } = await rpcApp('criar_regra_fiscal', {
      p_tenant: empresa.tenant_id,
      p_tipo: nova.tipo,
      p_aliquota: Number(nova.aliquota),
      p_vigencia_inicio: nova.vigencia,
      p_fonte: nova.fonte,
      p_uf: nova.uf || null,
      p_regime: null,
      p_ncm_padrao: nova.ncm || null,
      p_cfop: null,
      p_cst: nova.cst || null,
      p_cclasstrib: nova.cclasstrib || null,
      p_reducao_base: Number(nova.reducao) || 0,
      p_validacao_contador: true,
      p_observacoes: null,
    })
    if (error) { setErro(error.message); return }
    setAviso('Regra criada como nova versão, marcada para validação do contador.')
    setFormAberto(false)
    await carregar()
  }

  async function simular() {
    if (!empresa || !simProduto) return
    setErro(null)
    const { data, error } = await rpcApp<Calculo[]>('calcular_impostos', {
      p_tenant: empresa.tenant_id, p_produto: simProduto,
      p_valor: Number(simValor) || 0, p_uf: null, p_data: null,
    })
    if (error) { setErro(error.message); return }
    setSimulacao(data ?? [])
  }

  const brl = (v: number) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const dataBr = (d: string) => new Date(d + (d.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('pt-BR')

  const pendentes = docs.filter((d) => d.status === 'pendente').length

  return (
    <div className="pilha" style={{ maxWidth: 1000 }}>
      <div className="linha">
        <h1 style={{ fontSize: 22 }} className="crescer">Fiscal</h1>
        {pode('fiscal.regras') && (
          <button className="bt-primario" onClick={() => setFormAberto(!formAberto)}>Nova regra</button>
        )}
      </div>

      <div className="aviso aviso-atencao">
        <strong>Agente local: não conectado.</strong> A transmissão à SEFAZ exige o
        agente Windows com ACBr e certificado A1 (bloqueios B2/B10 em
        docs/PENDENCIAS.md). Documentos solicitados ficam na fila como
        “pendente” até o agente existir — nada aqui simula autorização.
        {pendentes > 0 && <> Há <strong>{pendentes}</strong> documento(s) aguardando.</>}
      </div>

      {erro && <div className="aviso aviso-erro">{erro}</div>}
      {aviso && <div className="aviso aviso-ok">{aviso}</div>}

      {formAberto && (
        <form className="cartao linha" style={{ padding: 16, flexWrap: 'wrap' }} onSubmit={criarRegra}>
          <label className="campo" style={{ margin: 0, width: 110 }}>
            <span>Imposto</span>
            <select value={nova.tipo} onChange={(e) => setNova({ ...nova, tipo: e.target.value })}>
              {IMPOSTOS.map((i) => <option key={i} value={i}>{i.toUpperCase()}</option>)}
            </select>
          </label>
          <label className="campo" style={{ margin: 0, width: 110 }}>
            <span>Alíquota %</span>
            <input type="number" step="0.0001" min="0" required value={nova.aliquota}
              onChange={(e) => setNova({ ...nova, aliquota: e.target.value })} />
          </label>
          <label className="campo" style={{ margin: 0, width: 130 }}>
            <span>Redução base %</span>
            <input type="number" step="0.001" min="0" max="100" value={nova.reducao}
              onChange={(e) => setNova({ ...nova, reducao: e.target.value })} />
          </label>
          <label className="campo" style={{ margin: 0, width: 145 }}>
            <span>Vigência a partir de</span>
            <input type="date" required value={nova.vigencia}
              onChange={(e) => setNova({ ...nova, vigencia: e.target.value })} />
          </label>
          <label className="campo" style={{ margin: 0, width: 80 }}>
            <span>UF</span>
            <input maxLength={2} value={nova.uf}
              onChange={(e) => setNova({ ...nova, uf: e.target.value.toUpperCase() })} />
          </label>
          <label className="campo" style={{ margin: 0, width: 130 }}>
            <span>NCM (ou prefixo)</span>
            <input value={nova.ncm} onChange={(e) => setNova({ ...nova, ncm: e.target.value })} />
          </label>
          <label className="campo" style={{ margin: 0, width: 100 }}>
            <span>CST/CSOSN</span>
            <input value={nova.cst} onChange={(e) => setNova({ ...nova, cst: e.target.value })} />
          </label>
          <label className="campo" style={{ margin: 0, width: 110 }}>
            <span>cClassTrib</span>
            <input value={nova.cclasstrib} onChange={(e) => setNova({ ...nova, cclasstrib: e.target.value })} />
          </label>
          <label className="campo crescer" style={{ margin: 0, minWidth: 260 }}>
            <span>Fonte legal (obrigatória — lei, convênio, NT)</span>
            <input required value={nova.fonte} onChange={(e) => setNova({ ...nova, fonte: e.target.value })} />
          </label>
          <button className="bt-primario" style={{ alignSelf: 'end' }}>Criar versão</button>
        </form>
      )}

      <div className="cartao pilha" style={{ padding: 16 }}>
        <h2 style={{ fontSize: 15 }}>Simulador do motor de cálculo</h2>
        <div className="linha" style={{ flexWrap: 'wrap' }}>
          <select className="crescer" style={{ minWidth: 220 }} value={simProduto}
            onChange={(e) => setSimProduto(e.target.value)}>
            <option value="">produto…</option>
            {produtos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
          <input style={{ width: 120 }} type="number" step="0.01" min="0" value={simValor}
            onChange={(e) => setSimValor(e.target.value)} />
          <button className="bt-fantasma" onClick={() => void simular()} disabled={!simProduto}>Calcular</button>
        </div>
        {simulacao !== null && (
          simulacao.length === 0 ? (
            <div className="aviso aviso-atencao">
              Nenhuma regra vigente casa com este produto — o motor não inventa
              alíquota. Cadastre a regra com o contador.
            </div>
          ) : (
            <table>
              <thead><tr><th>Imposto</th><th>CST</th><th style={{ textAlign: 'right' }}>Alíq.</th>
                <th style={{ textAlign: 'right' }}>Base</th><th style={{ textAlign: 'right' }}>Valor</th><th>Fonte</th></tr></thead>
              <tbody>
                {simulacao.map((c) => (
                  <tr key={c.tipo_imposto}>
                    <td>{c.tipo_imposto.toUpperCase()}
                      {c.validacao_contador && <span className="selo selo-atencao" style={{ marginLeft: 6 }}>validar c/ contador</span>}
                    </td>
                    <td>{c.cst ?? '—'}</td>
                    <td className="num" style={{ textAlign: 'right' }}>{c.aliquota_pct}%</td>
                    <td className="num" style={{ textAlign: 'right' }}>{brl(c.base)}</td>
                    <td className="num" style={{ textAlign: 'right' }}>{brl(c.valor)}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{c.fonte}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>

      <div className="cartao" style={{ overflowX: 'auto' }}>
        <table>
          <thead><tr><th>Regra</th><th>Escopo</th><th style={{ textAlign: 'right' }}>Alíq.</th>
            <th>Vigência</th><th>Versão</th><th>Fonte</th></tr></thead>
          <tbody>
            {regras.map((r) => (
              <tr key={r.id} style={{ opacity: r.vigencia_fim ? 0.55 : 1 }}>
                <td>{r.tipo_imposto.toUpperCase()}{r.cst && ` · CST ${r.cst}`}
                  {r.cclasstrib && ` · cClassTrib ${r.cclasstrib}`}</td>
                <td>{[r.uf, r.ncm_padrao && `NCM ${r.ncm_padrao}`].filter(Boolean).join(' · ') || 'geral'}</td>
                <td className="num" style={{ textAlign: 'right' }}>
                  {r.aliquota_pct}%{r.reducao_base_pct > 0 && ` (base −${r.reducao_base_pct}%)`}
                </td>
                <td>{dataBr(r.vigencia_inicio)} → {r.vigencia_fim ? dataBr(r.vigencia_fim) : 'vigente'}</td>
                <td className="num">v{r.versao}</td>
                <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{r.fonte}</td>
              </tr>
            ))}
            {regras.length === 0 && (
              <tr><td colSpan={6} style={{ color: 'var(--text-3)' }}>
                Nenhuma regra cadastrada. Regras tributárias entram com o seu contador —
                o sistema não traz alíquota pré-pronta.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {docs.length > 0 && (
        <div className="cartao" style={{ overflowX: 'auto' }}>
          <table>
            <thead><tr><th>Documento</th><th>Venda</th><th>Ambiente</th><th>Status</th><th>Solicitado em</th></tr></thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id}>
                  <td>{d.tipo.toUpperCase()}</td>
                  <td className="num">#{d.sales?.numero ?? '—'}</td>
                  <td>{d.ambiente}</td>
                  <td><span className={`selo ${d.status === 'autorizada' ? 'selo-ok' : d.status === 'rejeitada' ? 'selo-crit' : 'selo-atencao'}`}>
                    {d.status === 'pendente' ? 'pendente — aguardando agente local' : d.status}
                  </span></td>
                  <td>{new Date(d.criado_em).toLocaleString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
