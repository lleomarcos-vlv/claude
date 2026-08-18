/**
 * PDV (Fase 5): a venda que grava.
 * - Caixa: abrir, sangria, suprimento, fechar com conferência.
 * - Venda: grid de produtos, carrinho, cliente, mesa (modo de serviço),
 *   pagamento dividido, desconto com limite.
 * - Pedidos abertos com fluxo de status (base do KDS).
 * - Offline: venda finalizada sem internet entra na fila e sincroniza depois.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase, rpcApp } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { FilaOffline, type VendaOffline } from '../lib/fila-offline'

interface Produto {
  id: string; nome: string; unidade: string; preco_venda: number
  categoria_id: string | null; tipo: string
}
interface Categoria { id: string; nome: string }
interface Mesa { id: string; numero: number }
interface Cliente { id: string; nome: string }
interface Sessao { id: string; saldo_abertura: number; aberto_em: string }
interface ItemCarrinho { produto: Produto; qtd: number; observacao?: string }
interface Pagamento { forma: string; valor: string }
interface Pedido {
  id: string; numero: number; status: string; modo: string; total: number
  subtotal: number; mesa_id: string | null
}

const FORMAS = ['dinheiro', 'pix', 'credito', 'debito', 'vale', 'transferencia', 'prazo']
const PROXIMO_STATUS: Record<string, string> = {
  aberta: 'enviada', enviada: 'preparando', preparando: 'pronta', pronta: 'entregue',
}

const fila = new FilaOffline(localStorage)

export default function Pdv() {
  const { empresa, pode } = useAuth()
  const [branchId, setBranchId] = useState<string | null>(null)
  const [sessao, setSessao] = useState<Sessao | null>(null)
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [mesas, setMesas] = useState<Mesa[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [online, setOnline] = useState(navigator.onLine)
  const [pendentes, setPendentes] = useState(fila.pendentes())

  const [filtro, setFiltro] = useState('')
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | null>(null)
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([])
  const [modo, setModo] = useState('Balcão')
  const [modos, setModos] = useState<string[]>(['Balcão'])
  const [mesaId, setMesaId] = useState<string | null>(null)
  const [clienteId, setClienteId] = useState<string | null>(null)
  const [pagando, setPagando] = useState(false)
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([{ forma: 'dinheiro', valor: '' }])
  const [desconto, setDesconto] = useState('')

  const [caixaForm, setCaixaForm] = useState<'abrir' | 'sangria' | 'suprimento' | 'fechar' | null>(null)
  const [caixaValor, setCaixaValor] = useState('')

  const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const carregar = useCallback(async () => {
    if (!empresa) return
    const t = empresa.tenant_id
    const [b, p, c, m, cl, s, vm] = await Promise.all([
      supabase.from('branches').select('id, matriz').eq('tenant_id', t).eq('ativa', true),
      supabase.from('products').select('id, nome, unidade, preco_venda, categoria_id, tipo')
        .eq('tenant_id', t).eq('ativo', true).neq('tipo', 'insumo').order('nome'),
      supabase.from('product_categories').select('id, nome').eq('tenant_id', t).order('ordem'),
      supabase.from('dining_tables').select('id, numero').eq('tenant_id', t).eq('ativa', true).order('numero'),
      supabase.from('customers').select('id, nome').eq('tenant_id', t).eq('ativo', true).order('nome'),
      supabase.from('register_sessions').select('id, saldo_abertura, aberto_em, branch_id')
        .eq('tenant_id', t).eq('status', 'aberto'),
      empresa.vertical_chave
        ? supabase.from('vertical_modes').select('nome').eq('vertical_chave', empresa.vertical_chave).order('ordem')
        : Promise.resolve({ data: null, error: null }),
    ])
    const branch = (b.data?.find((x) => x.matriz) ?? b.data?.[0])?.id ?? null
    setBranchId(branch)
    setProdutos((p.data ?? []) as Produto[])
    setCategorias((c.data ?? []) as Categoria[])
    setMesas((m.data ?? []) as Mesa[])
    setClientes((cl.data ?? []) as Cliente[])
    const aberta = (s.data ?? []).find((x) => x.branch_id === branch)
    setSessao(aberta ? { id: aberta.id, saldo_abertura: aberta.saldo_abertura, aberto_em: aberta.aberto_em } : null)
    const nomes = (vm.data as { nome: string }[] | null)?.map((x) => x.nome)
    if (nomes?.length) { setModos(nomes); setModo(nomes[0]) }

    const { data: pd } = await supabase.from('sales')
      .select('id, numero, status, modo, total, subtotal, mesa_id')
      .eq('tenant_id', t)
      .not('status', 'in', '("fechada","cancelada")')
      .order('aberta_em')
    setPedidos((pd ?? []) as Pedido[])
  }, [empresa])

  useEffect(() => { void carregar() }, [carregar])

  // Sincronização da fila offline
  const sincronizar = useCallback(async () => {
    const ok = await fila.sincronizar(async (v: VendaOffline) => {
      const { data: vendaId, error: e1 } = await rpcApp<string>('abrir_venda', {
        p_tenant: v.tenant_id, p_branch: v.branch_id, p_modo: v.modo,
        p_mesa: null, p_cliente: v.customer_id, p_vendedor: null,
      })
      if (e1 || !vendaId) throw new Error(e1?.message ?? 'falha ao abrir venda')
      for (const item of v.itens) {
        const { error: e2 } = await rpcApp('lancar_item', {
          p_venda: vendaId, p_produto: item.product_id, p_qtd: item.qtd,
          p_preco: item.preco_unitario, p_desconto: 0,
          p_observacao: item.observacao ?? 'venda offline sincronizada',
        })
        if (e2) throw new Error(e2.message)
      }
      const { error: e3 } = await rpcApp('fechar_venda', {
        p_venda: vendaId, p_pagamentos: v.pagamentos, p_desconto: v.desconto,
        p_acrescimo: 0, p_taxa_entrega: null,
      })
      if (e3) throw new Error(e3.message)
    })
    setPendentes(fila.pendentes())
    if (ok > 0) {
      setAviso(`${ok} venda(s) offline sincronizada(s).`)
      await carregar()
    }
  }, [carregar])

  useEffect(() => {
    const aoConectar = () => { setOnline(true); void sincronizar() }
    const aoDesconectar = () => setOnline(false)
    window.addEventListener('online', aoConectar)
    window.addEventListener('offline', aoDesconectar)
    if (navigator.onLine && fila.pendentes() > 0) void sincronizar()
    return () => {
      window.removeEventListener('online', aoConectar)
      window.removeEventListener('offline', aoDesconectar)
    }
  }, [sincronizar])

  const visiveis = useMemo(() => {
    const f = filtro.trim().toLowerCase()
    return produtos.filter((p) =>
      (!categoriaAtiva || p.categoria_id === categoriaAtiva) &&
      (!f || p.nome.toLowerCase().includes(f)),
    )
  }, [produtos, filtro, categoriaAtiva])

  const subtotal = useMemo(
    () => carrinho.reduce((s, i) => s + i.qtd * i.produto.preco_venda, 0),
    [carrinho],
  )
  const totalPagar = Math.max(0, subtotal - (Number(desconto) || 0))
  const somaPagamentos = pagamentos.reduce((s, p) => s + (Number(p.valor) || 0), 0)

  function adicionar(p: Produto) {
    setCarrinho((c) => {
      const existente = c.find((i) => i.produto.id === p.id)
      if (existente) return c.map((i) => i.produto.id === p.id ? { ...i, qtd: i.qtd + 1 } : i)
      return [...c, { produto: p, qtd: 1 }]
    })
  }

  function mudarQtd(id: string, delta: number) {
    setCarrinho((c) => c
      .map((i) => i.produto.id === id ? { ...i, qtd: i.qtd + delta } : i)
      .filter((i) => i.qtd > 0))
  }

  async function operarCaixa() {
    if (!empresa || !branchId) return
    setErro(null); setAviso(null)
    const valor = Number(caixaValor) || 0
    if (caixaForm === 'abrir') {
      const { data, error } = await rpcApp<string>('abrir_caixa', {
        p_tenant: empresa.tenant_id, p_branch: branchId, p_saldo_abertura: valor,
      })
      if (error) { setErro(error.message); return }
      setSessao({ id: data!, saldo_abertura: valor, aberto_em: new Date().toISOString() })
    } else if (caixaForm === 'fechar' && sessao) {
      const { data, error } = await rpcApp<{ saldo_esperado: number; diferenca: number }[]>('fechar_caixa', {
        p_session: sessao.id, p_saldo_contado: valor,
      })
      if (error) { setErro(error.message); return }
      const r = data?.[0]
      setAviso(`Caixa fechado. Esperado ${brl(r?.saldo_esperado ?? 0)} · contado ${brl(valor)} · diferença ${brl(r?.diferenca ?? 0)}.`)
      setSessao(null)
    } else if (sessao && (caixaForm === 'sangria' || caixaForm === 'suprimento')) {
      const { error } = await rpcApp('movimentar_caixa', {
        p_session: sessao.id, p_tipo: caixaForm, p_valor: valor, p_observacao: null,
      })
      if (error) { setErro(error.message); return }
      setAviso(`${caixaForm === 'sangria' ? 'Sangria' : 'Suprimento'} de ${brl(valor)} registrado.`)
    }
    setCaixaForm(null); setCaixaValor('')
  }

  async function finalizar() {
    if (!empresa || !branchId || carrinho.length === 0) return
    setErro(null); setAviso(null)

    if (Math.round(somaPagamentos * 100) !== Math.round(totalPagar * 100)) {
      setErro(`Pagamentos somam ${brl(somaPagamentos)}, mas o total é ${brl(totalPagar)}.`)
      return
    }
    const listaPagamentos = pagamentos
      .filter((p) => Number(p.valor) > 0)
      .map((p) => ({ forma: p.forma, valor: Number(p.valor) }))

    if (!online) {
      fila.enfileirar({
        id: crypto.randomUUID(),
        criada_em: new Date().toISOString(),
        tenant_id: empresa.tenant_id,
        branch_id: branchId,
        modo,
        customer_id: clienteId,
        itens: carrinho.map((i) => ({
          product_id: i.produto.id, qtd: i.qtd, preco_unitario: i.produto.preco_venda,
        })),
        pagamentos: listaPagamentos,
        desconto: Number(desconto) || 0,
      })
      setPendentes(fila.pendentes())
      setAviso('Sem internet: venda guardada na fila e será sincronizada ao reconectar.')
      limparVenda()
      return
    }

    const { data: vendaId, error: e1 } = await rpcApp<string>('abrir_venda', {
      p_tenant: empresa.tenant_id, p_branch: branchId, p_modo: modo,
      p_mesa: modo === 'Mesa' ? mesaId : null, p_cliente: clienteId, p_vendedor: null,
    })
    if (e1 || !vendaId) { setErro(e1?.message ?? 'Falha ao abrir a venda.'); return }
    for (const item of carrinho) {
      const { error: e2 } = await rpcApp('lancar_item', {
        p_venda: vendaId, p_produto: item.produto.id, p_qtd: item.qtd,
        p_preco: null, p_desconto: 0, p_observacao: item.observacao ?? null,
      })
      if (e2) { setErro(e2.message); return }
    }
    const { data: total, error: e3 } = await rpcApp<number>('fechar_venda', {
      p_venda: vendaId, p_pagamentos: listaPagamentos,
      p_desconto: Number(desconto) || 0, p_acrescimo: 0, p_taxa_entrega: null,
    })
    if (e3) { setErro(e3.message); return }
    setAviso(`Venda fechada: ${brl(total ?? totalPagar)}.`)
    limparVenda()
    await carregar()
  }

  async function abrirComanda() {
    if (!empresa || !branchId || carrinho.length === 0) return
    setErro(null)
    const { data: vendaId, error: e1 } = await rpcApp<string>('abrir_venda', {
      p_tenant: empresa.tenant_id, p_branch: branchId, p_modo: modo,
      p_mesa: modo === 'Mesa' ? mesaId : null, p_cliente: clienteId, p_vendedor: null,
    })
    if (e1 || !vendaId) { setErro(e1?.message ?? 'Falha ao abrir a comanda.'); return }
    for (const item of carrinho) {
      const { error: e2 } = await rpcApp('lancar_item', {
        p_venda: vendaId, p_produto: item.produto.id, p_qtd: item.qtd,
        p_preco: null, p_desconto: 0, p_observacao: item.observacao ?? null,
      })
      if (e2) { setErro(e2.message); return }
    }
    setAviso('Comanda aberta e enviada.')
    limparVenda()
    await carregar()
  }

  function limparVenda() {
    setCarrinho([]); setPagando(false); setDesconto('')
    setPagamentos([{ forma: 'dinheiro', valor: '' }])
    setMesaId(null); setClienteId(null)
  }

  async function avancarStatus(p: Pedido) {
    const proximo = PROXIMO_STATUS[p.status]
    if (!proximo) return
    const { error } = await rpcApp('atualizar_status_venda', { p_venda: p.id, p_status: proximo })
    if (error) { setErro(error.message); return }
    await carregar()
  }

  return (
    <div className="pilha" style={{ maxWidth: 1100 }}>
      <div className="linha" style={{ flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 22 }} className="crescer">PDV</h1>
        {!online && <span className="selo selo-atencao">offline — vendas entram na fila</span>}
        {pendentes > 0 && (
          <span className="selo selo-atencao">{pendentes} venda(s) na fila offline</span>
        )}
        {sessao ? (
          <>
            <span className="selo selo-ok">caixa aberto</span>
            <button className="bt-fantasma" onClick={() => setCaixaForm('suprimento')}>Suprimento</button>
            <button className="bt-fantasma" onClick={() => setCaixaForm('sangria')}>Sangria</button>
            <button className="bt-fantasma" onClick={() => setCaixaForm('fechar')}>Fechar caixa</button>
          </>
        ) : (
          <>
            <span className="selo selo-crit">caixa fechado</span>
            <button className="bt-primario" onClick={() => setCaixaForm('abrir')}>Abrir caixa</button>
          </>
        )}
      </div>

      {erro && <div className="aviso aviso-erro">{erro}</div>}
      {aviso && <div className="aviso aviso-ok">{aviso}</div>}

      {caixaForm && (
        <div className="cartao linha" style={{ padding: 16 }}>
          <label className="campo crescer" style={{ margin: 0 }}>
            <span>
              {caixaForm === 'abrir' && 'Saldo de abertura (fundo de troco)'}
              {caixaForm === 'fechar' && 'Dinheiro contado na gaveta'}
              {caixaForm === 'sangria' && 'Valor retirado'}
              {caixaForm === 'suprimento' && 'Valor colocado'}
            </span>
            <input type="number" step="0.01" min="0" value={caixaValor}
              onChange={(e) => setCaixaValor(e.target.value)} autoFocus />
          </label>
          <button className="bt-fantasma" onClick={() => setCaixaForm(null)}>Cancelar</button>
          <button className="bt-primario" onClick={() => void operarCaixa()}>Confirmar</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 14 }}>
        {/* grade de produtos */}
        <div className="pilha">
          <div className="linha" style={{ flexWrap: 'wrap' }}>
            <input className="crescer" style={{ minWidth: 180 }} placeholder="Buscar produto…"
              value={filtro} onChange={(e) => setFiltro(e.target.value)} />
            <select value={categoriaAtiva ?? ''} onChange={(e) => setCategoriaAtiva(e.target.value || null)}
              style={{ width: 170 }}>
              <option value="">Todas as categorias</option>
              {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
            {visiveis.map((p) => (
              <button key={p.id} className="cartao" style={{ padding: 12, textAlign: 'left', cursor: 'pointer' }}
                onClick={() => adicionar(p)}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{p.nome}</div>
                <div className="num" style={{ color: 'var(--primary-ink)', marginTop: 4 }}>{brl(p.preco_venda)}</div>
              </button>
            ))}
            {visiveis.length === 0 && (
              <div style={{ color: 'var(--text-3)' }}>Nenhum produto — cadastre no Catálogo.</div>
            )}
          </div>
        </div>

        {/* carrinho */}
        <div className="cartao pilha" style={{ padding: 14, alignSelf: 'start' }}>
          <div className="linha" style={{ flexWrap: 'wrap' }}>
            <select value={modo} onChange={(e) => setModo(e.target.value)} className="crescer">
              {modos.map((m) => <option key={m}>{m}</option>)}
            </select>
            {modo === 'Mesa' && (
              <select value={mesaId ?? ''} onChange={(e) => setMesaId(e.target.value || null)} style={{ width: 110 }}>
                <option value="">mesa…</option>
                {mesas.map((m) => <option key={m.id} value={m.id}>Mesa {m.numero}</option>)}
              </select>
            )}
          </div>
          <select value={clienteId ?? ''} onChange={(e) => setClienteId(e.target.value || null)}>
            <option value="">sem cliente vinculado</option>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>

          {carrinho.map((i) => (
            <div key={i.produto.id} className="linha" style={{ fontSize: 13.5 }}>
              <span className="crescer">{i.produto.nome}</span>
              <button className="bt-fantasma" style={{ padding: '2px 9px' }}
                onClick={() => mudarQtd(i.produto.id, -1)}>−</button>
              <span className="num">{i.qtd}</span>
              <button className="bt-fantasma" style={{ padding: '2px 9px' }}
                onClick={() => mudarQtd(i.produto.id, 1)}>+</button>
              <span className="num" style={{ width: 76, textAlign: 'right' }}>
                {brl(i.qtd * i.produto.preco_venda)}
              </span>
            </div>
          ))}
          {carrinho.length === 0 && (
            <div style={{ color: 'var(--text-3)', fontSize: 13.5 }}>Toque nos produtos para lançar.</div>
          )}

          <div className="linha" style={{ borderTop: '1px solid var(--line)', paddingTop: 10 }}>
            <strong className="crescer">Total</strong>
            <strong className="num">{brl(totalPagar)}</strong>
          </div>

          {!pagando ? (
            <div className="linha">
              <button className="bt-fantasma crescer" disabled={carrinho.length === 0}
                onClick={() => void abrirComanda()}>
                Abrir comanda
              </button>
              <button className="bt-primario crescer" disabled={carrinho.length === 0}
                onClick={() => { setPagando(true); setPagamentos([{ forma: 'dinheiro', valor: String(totalPagar || '') }]) }}>
                Receber
              </button>
            </div>
          ) : (
            <div className="pilha">
              <label className="campo" style={{ margin: 0 }}>
                <span>Desconto (R$)</span>
                <input type="number" step="0.01" min="0" value={desconto}
                  onChange={(e) => {
                    setDesconto(e.target.value)
                    const novoTotal = Math.max(0, subtotal - (Number(e.target.value) || 0))
                    if (pagamentos.length === 1) setPagamentos([{ ...pagamentos[0], valor: String(novoTotal) }])
                  }} />
              </label>
              {pagamentos.map((p, idx) => (
                <div key={idx} className="linha">
                  <select value={p.forma} className="crescer"
                    onChange={(e) => setPagamentos(pagamentos.map((x, i) => i === idx ? { ...x, forma: e.target.value } : x))}>
                    {FORMAS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <input style={{ width: 100 }} type="number" step="0.01" min="0" value={p.valor}
                    onChange={(e) => setPagamentos(pagamentos.map((x, i) => i === idx ? { ...x, valor: e.target.value } : x))} />
                  {pagamentos.length > 1 && (
                    <button className="bt-fantasma" onClick={() => setPagamentos(pagamentos.filter((_, i) => i !== idx))}>×</button>
                  )}
                </div>
              ))}
              <button className="bt-fantasma"
                onClick={() => setPagamentos([...pagamentos, {
                  forma: 'pix', valor: String(Math.max(0, totalPagar - somaPagamentos).toFixed(2)),
                }])}>
                + dividir pagamento
              </button>
              <div className="linha" style={{ fontSize: 13 }}>
                <span className="crescer">Informado</span>
                <span className="num" style={{ color: Math.round(somaPagamentos * 100) === Math.round(totalPagar * 100) ? 'var(--ok)' : 'var(--crit)' }}>
                  {brl(somaPagamentos)}
                </span>
              </div>
              <div className="linha">
                <button className="bt-fantasma" onClick={() => setPagando(false)}>Voltar</button>
                <button className="bt-primario crescer" onClick={() => void finalizar()}>
                  Confirmar pagamento
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* pedidos em andamento (base do KDS) */}
      {pedidos.length > 0 && (
        <div className="cartao" style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr><th>Pedido</th><th>Modo</th><th>Status</th>
                <th style={{ textAlign: 'right' }}>Valor</th><th /></tr>
            </thead>
            <tbody>
              {pedidos.map((p) => (
                <tr key={p.id}>
                  <td className="num">#{p.numero}</td>
                  <td>{p.modo}{p.mesa_id ? ` · mesa ${mesas.find((m) => m.id === p.mesa_id)?.numero ?? ''}` : ''}</td>
                  <td><span className="selo selo-primario">{p.status}</span></td>
                  <td className="num" style={{ textAlign: 'right' }}>{brl(p.subtotal)}</td>
                  <td>
                    <div className="linha">
                      {PROXIMO_STATUS[p.status] && (pode('pedidos.gerenciar') || pode('pedidos.cozinha')) && (
                        <button className="bt-fantasma" onClick={() => void avancarStatus(p)}>
                          → {PROXIMO_STATUS[p.status]}
                        </button>
                      )}
                      {pode('vendas.cancelar') && (
                        <button className="bt-perigo" onClick={() => {
                          const motivo = window.prompt('Motivo do cancelamento:')
                          if (motivo) void rpcApp('cancelar_venda', { p_venda: p.id, p_motivo: motivo }).then(() => carregar())
                        }}>Cancelar</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
