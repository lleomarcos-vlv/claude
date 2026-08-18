/**
 * Estoque (Fase 4): saldos, alertas com previsão de ruptura, movimentação
 * manual e ficha técnica com custo real e sugestão de preço.
 * Toda escrita passa por app.movimentar_estoque / tabelas de receita sob RLS.
 */
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { supabase, rpcApp } from '../lib/supabase'
import { useAuth } from '../lib/auth'

interface Produto { id: string; nome: string; unidade: string; tipo: string; controla_estoque: boolean }
interface Saldo {
  product_id: string
  branch_id: string
  saldo: number
  minimo: number | null
  ponto_reposicao: number | null
  products: { nome: string; unidade: string } | null
}
interface Alerta {
  product_id: string
  produto: string
  saldo: number
  consumo_dia: number
  dias_restantes: number | null
  fornecedor: string | null
  situacao: string
}
interface ItemFicha {
  id: string
  insumo_id: string
  qtd: number
  unidade: string
  perda_pct: number
  insumo: { nome: string } | null
}

const TIPOS_MOVIMENTO = [
  'compra', 'venda', 'perda', 'desperdicio', 'ajuste',
  'devolucao', 'transferencia', 'producao', 'consumo_interno',
] as const

const ROTULO_SITUACAO: Record<string, { texto: string; classe: string }> = {
  ruptura: { texto: 'em ruptura', classe: 'selo-crit' },
  abaixo_do_minimo: { texto: 'abaixo do mínimo', classe: 'selo-crit' },
  repor: { texto: 'repor', classe: 'selo-atencao' },
  acaba_em_7_dias: { texto: 'acaba em ≤7 dias', classe: 'selo-atencao' },
}

export default function Estoque() {
  const { empresa, pode } = useAuth()
  const [saldos, setSaldos] = useState<Saldo[]>([])
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [branchId, setBranchId] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  // movimentação manual
  const [movProduto, setMovProduto] = useState('')
  const [movTipo, setMovTipo] = useState<string>('compra')
  const [movQtd, setMovQtd] = useState('')
  const [movCusto, setMovCusto] = useState('')
  const [movSaida, setMovSaida] = useState(false)

  // ficha técnica
  const [fichaDe, setFichaDe] = useState<Produto | null>(null)
  const [ficha, setFicha] = useState<ItemFicha[]>([])
  const [custoReal, setCustoReal] = useState<{ custo: number; preco_sugerido: number; margem_atual_pct: number | null } | null>(null)
  const [margem, setMargem] = useState('60')
  const [novoInsumo, setNovoInsumo] = useState({ insumo_id: '', qtd: '', unidade: 'un' })

  const carregar = useCallback(async () => {
    if (!empresa) return
    const t = empresa.tenant_id
    const [b, s, p, a] = await Promise.all([
      supabase.from('branches').select('id, matriz').eq('tenant_id', t).eq('ativa', true),
      supabase.from('stock_levels')
        .select('product_id, branch_id, saldo, minimo, ponto_reposicao, products(nome, unidade)')
        .eq('tenant_id', t),
      supabase.from('products')
        .select('id, nome, unidade, tipo, controla_estoque')
        .eq('tenant_id', t).eq('ativo', true).order('nome'),
      rpcApp<Alerta[]>('alertas_estoque', { p_tenant: t }),
    ])
    const falha = b.error ?? s.error ?? p.error ?? a.error
    if (falha) { setErro(falha.message); return }
    setBranchId((b.data?.find((x) => x.matriz) ?? b.data?.[0])?.id ?? null)
    setSaldos((s.data ?? []) as unknown as Saldo[])
    setProdutos((p.data ?? []) as Produto[])
    setAlertas(a.data ?? [])
  }, [empresa])

  useEffect(() => { void carregar() }, [carregar])

  async function movimentar(e: FormEvent) {
    e.preventDefault()
    if (!empresa || !branchId) return
    setErro(null); setAviso(null)
    const { data, error } = await rpcApp<number>('movimentar_estoque', {
      p_tenant: empresa.tenant_id,
      p_branch: branchId,
      p_produto: movProduto,
      p_tipo: movTipo,
      p_qtd: Number(movQtd),
      p_unidade: null,
      p_custo_unitario: movCusto ? Number(movCusto) : null,
      p_referencia: null,
      p_observacao: 'lançamento manual',
      p_saida: movTipo === 'ajuste' || movTipo === 'transferencia' ? movSaida : null,
    })
    if (error) { setErro(error.message); return }
    setAviso(`Movimentado. Novo saldo: ${data}`)
    setMovQtd(''); setMovCusto('')
    await carregar()
  }

  const abrirFicha = useCallback(async (p: Produto) => {
    setFichaDe(p); setFicha([]); setCustoReal(null)
    const { data } = await supabase.from('recipe_items')
      .select('id, insumo_id, qtd, unidade, perda_pct, insumo:products!recipe_items_insumo_id_fkey(nome)')
      .eq('product_id', p.id)
    setFicha((data ?? []) as unknown as ItemFicha[])
    const { data: sug } = await rpcApp<{ custo: number; preco_sugerido: number; margem_atual_pct: number | null }[]>(
      'sugerir_preco', { p_produto: p.id, p_margem_pct: Number(margem) || 60 })
    setCustoReal(sug?.[0] ?? null)
  }, [margem])

  async function adicionarInsumo(e: FormEvent) {
    e.preventDefault()
    if (!fichaDe) return
    setErro(null)
    // garante o cabeçalho da receita
    await supabase.from('recipes').upsert({ product_id: fichaDe.id })
    const { error } = await supabase.from('recipe_items').insert({
      product_id: fichaDe.id,
      insumo_id: novoInsumo.insumo_id,
      qtd: Number(novoInsumo.qtd),
      unidade: novoInsumo.unidade,
    })
    if (error) { setErro(error.message); return }
    setNovoInsumo({ insumo_id: '', qtd: '', unidade: 'un' })
    await abrirFicha(fichaDe)
  }

  async function removerInsumo(id: string) {
    if (!fichaDe) return
    await supabase.from('recipe_items').delete().eq('id', id)
    await abrirFicha(fichaDe)
  }

  const fmt = (v: number) => Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 2 })
  const brl = (v: number) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div className="pilha" style={{ maxWidth: 1000 }}>
      <h1 style={{ fontSize: 22 }}>Estoque</h1>
      {erro && <div className="aviso aviso-erro">{erro}</div>}
      {aviso && <div className="aviso aviso-ok">{aviso}</div>}

      {alertas.length > 0 && (
        <div className="cartao" style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr><th>Alerta</th><th>Situação</th><th style={{ textAlign: 'right' }}>Saldo</th>
                <th style={{ textAlign: 'right' }}>Consumo/dia</th><th>Acaba em</th><th>Fornecedor sugerido</th></tr>
            </thead>
            <tbody>
              {alertas.map((a) => (
                <tr key={`${a.product_id}`}>
                  <td>{a.produto}</td>
                  <td><span className={`selo ${ROTULO_SITUACAO[a.situacao]?.classe ?? 'selo-neutro'}`}>
                    {ROTULO_SITUACAO[a.situacao]?.texto ?? a.situacao}</span></td>
                  <td className="num" style={{ textAlign: 'right' }}>{fmt(a.saldo)}</td>
                  <td className="num" style={{ textAlign: 'right' }}>{fmt(a.consumo_dia)}</td>
                  <td>{a.dias_restantes != null ? `~${fmt(a.dias_restantes)} dias` : '—'}</td>
                  <td>{a.fornecedor ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pode('estoque.movimentar') && (
        <form className="cartao linha" style={{ padding: 16, flexWrap: 'wrap' }} onSubmit={movimentar}>
          <label className="campo crescer" style={{ margin: 0, minWidth: 220 }}>
            <span>Produto</span>
            <select value={movProduto} onChange={(e) => setMovProduto(e.target.value)} required>
              <option value="">—</option>
              {produtos.filter((p) => p.controla_estoque).map((p) => (
                <option key={p.id} value={p.id}>{p.nome} ({p.unidade})</option>
              ))}
            </select>
          </label>
          <label className="campo" style={{ margin: 0, width: 160 }}>
            <span>Tipo</span>
            <select value={movTipo} onChange={(e) => setMovTipo(e.target.value)}>
              {TIPOS_MOVIMENTO.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </label>
          <label className="campo" style={{ margin: 0, width: 110 }}>
            <span>Quantidade</span>
            <input type="number" step="0.001" min="0.001" value={movQtd}
              onChange={(e) => setMovQtd(e.target.value)} required />
          </label>
          {movTipo === 'compra' && (
            <label className="campo" style={{ margin: 0, width: 130 }}>
              <span>Custo unitário (R$)</span>
              <input type="number" step="0.0001" min="0" value={movCusto}
                onChange={(e) => setMovCusto(e.target.value)} />
            </label>
          )}
          {(movTipo === 'ajuste' || movTipo === 'transferencia') && (
            <label className="campo" style={{ margin: 0, width: 110 }}>
              <span>Sentido</span>
              <select value={movSaida ? 'saida' : 'entrada'}
                onChange={(e) => setMovSaida(e.target.value === 'saida')}>
                <option value="entrada">entrada</option>
                <option value="saida">saída</option>
              </select>
            </label>
          )}
          <button className="bt-primario" style={{ alignSelf: 'end' }}>Lançar</button>
        </form>
      )}

      {fichaDe && (
        <div className="cartao pilha" style={{ padding: 16 }}>
          <div className="linha">
            <h2 style={{ fontSize: 16 }} className="crescer">Ficha técnica · {fichaDe.nome}</h2>
            <button className="bt-fantasma" onClick={() => setFichaDe(null)}>Fechar</button>
          </div>
          {custoReal && (
            <div className="linha" style={{ flexWrap: 'wrap', gap: 18 }}>
              <span>Custo real: <strong className="num">{brl(custoReal.custo)}</strong></span>
              <span className="linha" style={{ gap: 6 }}>
                Margem alvo
                <input style={{ width: 70 }} type="number" min="0" max="99" value={margem}
                  onChange={(e) => setMargem(e.target.value)}
                  onBlur={() => void abrirFicha(fichaDe)} />%
                → sugerido <strong className="num">{brl(custoReal.preco_sugerido)}</strong>
              </span>
              {custoReal.margem_atual_pct != null && (
                <span>Margem atual: <strong className="num">{fmt(custoReal.margem_atual_pct)}%</strong></span>
              )}
            </div>
          )}
          <table>
            <thead><tr><th>Insumo</th><th style={{ textAlign: 'right' }}>Qtd</th><th>Un.</th><th>Perda %</th><th /></tr></thead>
            <tbody>
              {ficha.map((i) => (
                <tr key={i.id}>
                  <td>{i.insumo?.nome ?? i.insumo_id}</td>
                  <td className="num" style={{ textAlign: 'right' }}>{fmt(i.qtd)}</td>
                  <td>{i.unidade}</td>
                  <td className="num">{fmt(i.perda_pct)}</td>
                  <td>{pode('catalogo.editar') && (
                    <button className="bt-perigo" onClick={() => void removerInsumo(i.id)}>Remover</button>
                  )}</td>
                </tr>
              ))}
              {ficha.length === 0 && (
                <tr><td colSpan={5} style={{ color: 'var(--text-3)' }}>
                  Sem ficha técnica: a venda baixa o próprio produto.
                </td></tr>
              )}
            </tbody>
          </table>
          {pode('catalogo.editar') && (
            <form className="linha" style={{ flexWrap: 'wrap' }} onSubmit={adicionarInsumo}>
              <select className="crescer" style={{ minWidth: 200 }} required
                value={novoInsumo.insumo_id}
                onChange={(e) => {
                  const p = produtos.find((x) => x.id === e.target.value)
                  setNovoInsumo({ ...novoInsumo, insumo_id: e.target.value, unidade: p?.unidade ?? 'un' })
                }}>
                <option value="">adicionar insumo…</option>
                {produtos.filter((p) => p.id !== fichaDe.id).map((p) => (
                  <option key={p.id} value={p.id}>{p.nome} ({p.unidade})</option>
                ))}
              </select>
              <input style={{ width: 110 }} type="number" step="0.001" min="0.001" placeholder="qtd"
                value={novoInsumo.qtd} onChange={(e) => setNovoInsumo({ ...novoInsumo, qtd: e.target.value })} required />
              <input style={{ width: 80 }} value={novoInsumo.unidade}
                onChange={(e) => setNovoInsumo({ ...novoInsumo, unidade: e.target.value })} />
              <button className="bt-primario">Adicionar</button>
            </form>
          )}
        </div>
      )}

      <div className="cartao" style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr><th>Produto</th><th style={{ textAlign: 'right' }}>Saldo (un. base)</th>
              <th style={{ textAlign: 'right' }}>Mínimo</th><th /></tr>
          </thead>
          <tbody>
            {saldos.map((s) => (
              <tr key={`${s.product_id}-${s.branch_id}`}>
                <td>{s.products?.nome ?? s.product_id}</td>
                <td className="num" style={{ textAlign: 'right', color: s.saldo <= 0 ? 'var(--crit)' : undefined }}>
                  {fmt(s.saldo)}
                </td>
                <td className="num" style={{ textAlign: 'right' }}>{s.minimo != null ? fmt(s.minimo) : '—'}</td>
                <td>
                  <button className="bt-fantasma"
                    onClick={() => { const p = produtos.find((x) => x.id === s.product_id); if (p) void abrirFicha(p) }}>
                    Ficha técnica
                  </button>
                </td>
              </tr>
            ))}
            {saldos.length === 0 && (
              <tr><td colSpan={4} style={{ color: 'var(--text-3)' }}>
                Nenhum saldo ainda — lance uma compra para começar.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
