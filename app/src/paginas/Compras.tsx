/**
 * Compras (Fase 6): pedidos com 6 status, recebimento que dá entrada no
 * estoque e importação de XML de NFe com tela de conferência (item 14).
 * O OCR de DANFE/PDF (item 15) depende de serviço externo — pendência
 * declarada em docs/PENDENCIAS.md, sem tela fingindo.
 */
import { useCallback, useEffect, useState } from 'react'
import { supabase, rpcApp } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { lerNfe, type NotaFiscal } from '../lib/nfe'

interface Fornecedor { id: string; razao_social: string; nome_fantasia: string | null; cnpj: string | null }
interface Produto { id: string; nome: string; sku: string | null; codigo_barras: string | null; unidade: string }
interface Pedido {
  id: string; numero: number; status: string; total: number; criado_em: string
  suppliers: { razao_social: string; nome_fantasia: string | null } | null
}
interface ItemConferencia {
  descricao_nfe: string
  qtd: number
  unidade: string
  custo_unitario: number
  product_id: string | null       // mapeado pelo operador
}

const PROXIMO: Record<string, string> = {
  rascunho: 'enviado', enviado: 'confirmado', confirmado: 'em_transito',
}

export default function Compras() {
  const { empresa, pode } = useAuth()
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [branchId, setBranchId] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  // conferência de NFe
  const [nota, setNota] = useState<NotaFiscal | null>(null)
  const [fornecedorNota, setFornecedorNota] = useState<string>('')
  const [conferencia, setConferencia] = useState<ItemConferencia[]>([])

  const carregar = useCallback(async () => {
    if (!empresa) return
    const t = empresa.tenant_id
    const [po, f, p, b] = await Promise.all([
      supabase.from('purchase_orders')
        .select('id, numero, status, total, criado_em, suppliers(razao_social, nome_fantasia)')
        .eq('tenant_id', t).order('criado_em', { ascending: false }).limit(50),
      supabase.from('suppliers').select('id, razao_social, nome_fantasia, cnpj')
        .eq('tenant_id', t).eq('ativo', true),
      supabase.from('products').select('id, nome, sku, codigo_barras, unidade')
        .eq('tenant_id', t).eq('ativo', true).order('nome'),
      supabase.from('branches').select('id, matriz').eq('tenant_id', t).eq('ativa', true),
    ])
    const falha = po.error ?? f.error ?? p.error ?? b.error
    if (falha) { setErro(falha.message); return }
    setPedidos((po.data ?? []) as unknown as Pedido[])
    setFornecedores((f.data ?? []) as Fornecedor[])
    setProdutos((p.data ?? []) as Produto[])
    setBranchId((b.data?.find((x) => x.matriz) ?? b.data?.[0])?.id ?? null)
  }, [empresa])

  useEffect(() => { void carregar() }, [carregar])

  function abrirXml(arquivo: File) {
    setErro(null); setAviso(null)
    void arquivo.text().then((texto) => {
      try {
        const nf = lerNfe(texto)
        setNota(nf)
        // pré-mapeia por EAN, depois por SKU igual ao cProd
        setConferencia(nf.itens.map((i) => ({
          descricao_nfe: i.descricao,
          qtd: i.qtd,
          unidade: i.unidade,
          custo_unitario: i.valor_unitario,
          product_id:
            (i.ean && produtos.find((p) => p.codigo_barras === i.ean)?.id) ||
            produtos.find((p) => p.sku && p.sku === i.codigo)?.id || null,
        })))
        const fornecedorExistente = fornecedores.find((f) => f.cnpj === nf.emitente.cnpj)
        setFornecedorNota(fornecedorExistente?.id ?? '')
      } catch (e) {
        setErro(e instanceof Error ? e.message : String(e))
      }
    })
  }

  async function criarPedidoDaNota() {
    if (!empresa || !branchId || !nota) return
    setErro(null)
    if (!fornecedorNota) { setErro('Selecione (ou cadastre) o fornecedor da nota.'); return }
    const mapeados = conferencia.filter((c) => c.product_id)
    if (mapeados.length === 0) { setErro('Mapeie ao menos um item a um produto.'); return }

    const { data, error } = await rpcApp<string>('criar_pedido_compra', {
      p_tenant: empresa.tenant_id,
      p_branch: branchId,
      p_supplier: fornecedorNota,
      p_itens: mapeados.map((c) => ({
        product_id: c.product_id, qtd: c.qtd, unidade: c.unidade, custo_unitario: c.custo_unitario,
      })),
      p_observacao: `Importado do XML NFe ${nota.numero ?? ''}`,
      p_chave_nfe: nota.chave,
    })
    if (error) { setErro(error.message); return }
    // nota já foi entregue: envia → confirma para permitir o recebimento
    await rpcApp('atualizar_status_compra', { p_pedido: data, p_status: 'enviado' })
    await rpcApp('atualizar_status_compra', { p_pedido: data, p_status: 'confirmado' })
    setAviso(`Pedido criado a partir da NFe com ${mapeados.length} itens. Confira e clique em Receber para dar entrada.`)
    setNota(null)
    await carregar()
  }

  async function avancar(p: Pedido) {
    const prox = PROXIMO[p.status]
    if (!prox) return
    const { error } = await rpcApp('atualizar_status_compra', { p_pedido: p.id, p_status: prox })
    if (error) { setErro(error.message); return }
    await carregar()
  }

  async function receber(p: Pedido) {
    setErro(null)
    const { error } = await rpcApp('receber_compra', { p_pedido: p.id, p_itens: null, p_vencimento: null })
    if (error) { setErro(error.message); return }
    setAviso(`Pedido #${p.numero} recebido: estoque atualizado e conta a pagar criada.`)
    await carregar()
  }

  const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const podeCriar = pode('compras.criar')
  const podeReceber = pode('compras.aprovar')

  return (
    <div className="pilha" style={{ maxWidth: 1000 }}>
      <div className="linha">
        <h1 style={{ fontSize: 22 }} className="crescer">Compras</h1>
        {podeCriar && (
          <label className="bt-primario" style={{ cursor: 'pointer' }}>
            Importar XML de NFe
            <input type="file" accept=".xml,text/xml" hidden
              onChange={(e) => { const f = e.target.files?.[0]; if (f) abrirXml(f); e.target.value = '' }} />
          </label>
        )}
      </div>
      {erro && <div className="aviso aviso-erro">{erro}</div>}
      {aviso && <div className="aviso aviso-ok">{aviso}</div>}

      {nota && (
        <div className="cartao pilha" style={{ padding: 16 }}>
          <h2 style={{ fontSize: 16 }}>Conferência da NFe {nota.numero ?? ''}</h2>
          <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
            Emitente: <strong>{nota.emitente.nome ?? '—'}</strong> · CNPJ {nota.emitente.cnpj ?? '—'} ·
            Total da nota: <strong>{nota.valor_total != null ? brl(nota.valor_total) : '—'}</strong>
          </div>
          <label className="campo" style={{ maxWidth: 380 }}>
            <span>Fornecedor no sistema</span>
            <select value={fornecedorNota} onChange={(e) => setFornecedorNota(e.target.value)}>
              <option value="">— selecionar —</option>
              {fornecedores.map((f) => (
                <option key={f.id} value={f.id}>{f.nome_fantasia ?? f.razao_social}</option>
              ))}
            </select>
          </label>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr><th>Item da nota</th><th style={{ textAlign: 'right' }}>Qtd</th><th>Un.</th>
                  <th style={{ textAlign: 'right' }}>Custo</th><th>Produto no sistema</th></tr>
              </thead>
              <tbody>
                {conferencia.map((c, i) => (
                  <tr key={i}>
                    <td>{c.descricao_nfe}</td>
                    <td className="num" style={{ textAlign: 'right' }}>{c.qtd}</td>
                    <td>{c.unidade}</td>
                    <td className="num" style={{ textAlign: 'right' }}>{brl(c.custo_unitario)}</td>
                    <td>
                      <select value={c.product_id ?? ''}
                        onChange={(e) => setConferencia(conferencia.map((x, j) =>
                          j === i ? { ...x, product_id: e.target.value || null } : x))}>
                        <option value="">não lançar este item</option>
                        {produtos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="linha">
            <button className="bt-fantasma" onClick={() => setNota(null)}>Descartar</button>
            <button className="bt-primario" onClick={() => void criarPedidoDaNota()}>
              Criar pedido conferido
            </button>
          </div>
        </div>
      )}

      <div className="cartao" style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr><th>Pedido</th><th>Fornecedor</th><th>Status</th>
              <th style={{ textAlign: 'right' }}>Total</th><th /></tr>
          </thead>
          <tbody>
            {pedidos.map((p) => (
              <tr key={p.id}>
                <td className="num">#{p.numero}</td>
                <td>{p.suppliers?.nome_fantasia ?? p.suppliers?.razao_social ?? '—'}</td>
                <td><span className={`selo ${p.status === 'recebido' ? 'selo-ok' : p.status === 'cancelado' ? 'selo-neutro' : 'selo-primario'}`}>
                  {p.status.replace('_', ' ')}</span></td>
                <td className="num" style={{ textAlign: 'right' }}>{brl(p.total)}</td>
                <td>
                  <div className="linha">
                    {PROXIMO[p.status] && podeCriar && (
                      <button className="bt-fantasma" onClick={() => void avancar(p)}>
                        → {PROXIMO[p.status].replace('_', ' ')}
                      </button>
                    )}
                    {['confirmado', 'em_transito', 'recebido_parcial'].includes(p.status) && podeReceber && (
                      <button className="bt-primario" onClick={() => void receber(p)}>Receber</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {pedidos.length === 0 && (
              <tr><td colSpan={5} style={{ color: 'var(--text-3)' }}>
                Nenhum pedido — importe um XML de NFe ou crie a partir dos alertas de estoque.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
