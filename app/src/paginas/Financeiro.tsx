/**
 * Financeiro (Fase 6): contas a pagar/receber com parcelamento e baixa,
 * fluxo de caixa realizado e DRE gerencial com CMV congelado.
 */
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { supabase, rpcApp } from '../lib/supabase'
import { useAuth } from '../lib/auth'

interface Conta {
  id: string; tipo: string; descricao: string; valor: number; vencimento: string
  status: string; parcela: number; total_parcelas: number
  bank_account_id: string | null
}
interface Banco { id: string; nome: string }
interface LinhaFluxo { dia: string; entradas: number; saidas: number; saldo_dia: number }
interface LinhaDre { linha: string; valor: number; ordem: number }

const ROTULO_DRE: Record<string, string> = {
  receita_bruta: 'Receita bruta', descontos: '(−) Descontos',
  receita_liquida: 'Receita líquida', cmv: '(−) CMV (custo congelado na venda)',
  margem_bruta: 'Margem bruta', taxas_cartao: '(−) Taxas de cartão',
  despesas: '(−) Despesas pagas', resultado: 'Resultado',
}

function primeiroDoMes(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}
function hoje(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function Financeiro() {
  const { empresa, pode } = useAuth()
  const [contas, setContas] = useState<Conta[]>([])
  const [bancos, setBancos] = useState<Banco[]>([])
  const [fluxo, setFluxo] = useState<LinhaFluxo[]>([])
  const [dre, setDre] = useState<LinhaDre[]>([])
  const [de, setDe] = useState(primeiroDoMes())
  const [ate, setAte] = useState(hoje())
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const [nova, setNova] = useState({ tipo: 'pagar', descricao: '', valor: '', vencimento: hoje(), parcelas: '1' })
  const [formAberto, setFormAberto] = useState(false)

  const carregar = useCallback(async () => {
    if (!empresa) return
    const t = empresa.tenant_id
    const [c, b, f, d] = await Promise.all([
      supabase.from('finance_entries')
        .select('id, tipo, descricao, valor, vencimento, status, parcela, total_parcelas, bank_account_id')
        .eq('tenant_id', t).eq('status', 'aberta').order('vencimento').limit(100),
      supabase.from('bank_accounts').select('id, nome').eq('tenant_id', t).eq('ativa', true),
      rpcApp<LinhaFluxo[]>('fluxo_caixa', { p_tenant: t, p_de: de, p_ate: ate }),
      rpcApp<LinhaDre[]>('dre', { p_tenant: t, p_de: de, p_ate: ate }),
    ])
    const falha = c.error ?? b.error ?? f.error ?? d.error
    if (falha) { setErro(falha.message); return }
    setContas((c.data ?? []) as Conta[])
    setBancos((b.data ?? []) as Banco[])
    setFluxo(f.data ?? [])
    setDre(d.data ?? [])
  }, [empresa, de, ate])

  useEffect(() => { void carregar() }, [carregar])

  async function lancar(e: FormEvent) {
    e.preventDefault()
    if (!empresa) return
    setErro(null)
    const { error } = await rpcApp('lancar_conta', {
      p_tenant: empresa.tenant_id,
      p_tipo: nova.tipo,
      p_descricao: nova.descricao,
      p_valor: Number(nova.valor),
      p_vencimento: nova.vencimento,
      p_parcelas: Number(nova.parcelas) || 1,
      p_categoria: null, p_cost_center: null, p_supplier: null, p_customer: null,
    })
    if (error) { setErro(error.message); return }
    setFormAberto(false)
    setNova({ tipo: 'pagar', descricao: '', valor: '', vencimento: hoje(), parcelas: '1' })
    await carregar()
  }

  async function baixar(c: Conta, banco: string | null) {
    setErro(null)
    const { error } = await rpcApp('baixar_conta', {
      p_conta: c.id, p_valor_pago: null, p_bank_account: banco, p_data: null,
    })
    if (error) { setErro(error.message); return }
    setAviso(`${c.tipo === 'pagar' ? 'Pagamento' : 'Recebimento'} de "${c.descricao}" baixado.`)
    await carregar()
  }

  const brl = (v: number) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const dataBr = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')

  return (
    <div className="pilha" style={{ maxWidth: 1000 }}>
      <div className="linha" style={{ flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 22 }} className="crescer">Financeiro</h1>
        <label className="campo" style={{ margin: 0 }}>
          <span>De</span>
          <input type="date" value={de} onChange={(e) => setDe(e.target.value)} />
        </label>
        <label className="campo" style={{ margin: 0 }}>
          <span>Até</span>
          <input type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
        </label>
        {pode('financeiro.criar') && (
          <button className="bt-primario" style={{ alignSelf: 'end' }}
            onClick={() => setFormAberto(!formAberto)}>Lançar conta</button>
        )}
      </div>
      {erro && <div className="aviso aviso-erro">{erro}</div>}
      {aviso && <div className="aviso aviso-ok">{aviso}</div>}

      {formAberto && (
        <form className="cartao linha" style={{ padding: 16, flexWrap: 'wrap' }} onSubmit={lancar}>
          <label className="campo" style={{ margin: 0, width: 120 }}>
            <span>Tipo</span>
            <select value={nova.tipo} onChange={(e) => setNova({ ...nova, tipo: e.target.value })}>
              <option value="pagar">a pagar</option>
              <option value="receber">a receber</option>
            </select>
          </label>
          <label className="campo crescer" style={{ margin: 0, minWidth: 200 }}>
            <span>Descrição</span>
            <input value={nova.descricao} onChange={(e) => setNova({ ...nova, descricao: e.target.value })} required />
          </label>
          <label className="campo" style={{ margin: 0, width: 120 }}>
            <span>Valor total</span>
            <input type="number" step="0.01" min="0.01" value={nova.valor}
              onChange={(e) => setNova({ ...nova, valor: e.target.value })} required />
          </label>
          <label className="campo" style={{ margin: 0, width: 150 }}>
            <span>1º vencimento</span>
            <input type="date" value={nova.vencimento}
              onChange={(e) => setNova({ ...nova, vencimento: e.target.value })} required />
          </label>
          <label className="campo" style={{ margin: 0, width: 100 }}>
            <span>Parcelas</span>
            <input type="number" min="1" max="120" value={nova.parcelas}
              onChange={(e) => setNova({ ...nova, parcelas: e.target.value })} />
          </label>
          <button className="bt-primario" style={{ alignSelf: 'end' }}>Lançar</button>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
        <div className="cartao pilha" style={{ padding: 16 }}>
          <h2 style={{ fontSize: 15 }}>DRE do período</h2>
          <table>
            <tbody>
              {dre.map((l) => (
                <tr key={l.linha} style={{ fontWeight: ['receita_liquida', 'margem_bruta', 'resultado'].includes(l.linha) ? 700 : 400 }}>
                  <td>{ROTULO_DRE[l.linha] ?? l.linha}</td>
                  <td className="num" style={{
                    textAlign: 'right',
                    color: l.linha === 'resultado' ? (l.valor >= 0 ? 'var(--ok)' : 'var(--crit)') : undefined,
                  }}>{brl(l.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="cartao pilha" style={{ padding: 16 }}>
          <h2 style={{ fontSize: 15 }}>Fluxo de caixa realizado</h2>
          <table>
            <thead><tr><th>Dia</th><th style={{ textAlign: 'right' }}>Entradas</th>
              <th style={{ textAlign: 'right' }}>Saídas</th><th style={{ textAlign: 'right' }}>Saldo</th></tr></thead>
            <tbody>
              {fluxo.map((l) => (
                <tr key={l.dia}>
                  <td>{dataBr(l.dia)}</td>
                  <td className="num" style={{ textAlign: 'right' }}>{brl(l.entradas)}</td>
                  <td className="num" style={{ textAlign: 'right' }}>{brl(l.saidas)}</td>
                  <td className="num" style={{ textAlign: 'right', color: l.saldo_dia >= 0 ? 'var(--ok)' : 'var(--crit)' }}>
                    {brl(l.saldo_dia)}
                  </td>
                </tr>
              ))}
              {fluxo.length === 0 && (
                <tr><td colSpan={4} style={{ color: 'var(--text-3)' }}>Sem movimentação no período.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="cartao" style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr><th>Conta aberta</th><th>Tipo</th><th>Vencimento</th>
              <th style={{ textAlign: 'right' }}>Valor</th><th /></tr>
          </thead>
          <tbody>
            {contas.map((c) => {
              const vencida = c.vencimento < hoje()
              return (
                <tr key={c.id}>
                  <td>{c.descricao}</td>
                  <td><span className={`selo ${c.tipo === 'pagar' ? 'selo-atencao' : 'selo-primario'}`}>{c.tipo}</span></td>
                  <td style={{ color: vencida ? 'var(--crit)' : undefined }}>
                    {dataBr(c.vencimento)}{vencida && ' · vencida'}
                  </td>
                  <td className="num" style={{ textAlign: 'right' }}>{brl(c.valor)}</td>
                  <td>
                    {pode('financeiro.baixar') && (
                      <div className="linha">
                        <select id={`banco-${c.id}`} defaultValue="">
                          <option value="">sem conta bancária</option>
                          {bancos.map((b) => <option key={b.id} value={b.id}>{b.nome}</option>)}
                        </select>
                        <button className="bt-primario" onClick={() => {
                          const sel = document.getElementById(`banco-${c.id}`) as HTMLSelectElement | null
                          void baixar(c, sel?.value || null)
                        }}>Baixar</button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
            {contas.length === 0 && (
              <tr><td colSpan={5} style={{ color: 'var(--text-3)' }}>Nenhuma conta aberta.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
