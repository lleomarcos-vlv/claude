/**
 * Catálogo (Fase 3): produtos reais no banco.
 * Inclui o kit inicial do nicho (catálogo vazio) e o importador CSV com
 * mapeamento de colunas e preview (item 45).
 */
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { supabase, rpcApp } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { lerCsv, lerNumeroBr, sugerirMapeamento, type TabelaCsv } from '../lib/csv'

interface Categoria { id: string; nome: string }
interface Produto {
  id: string
  nome: string
  sku: string | null
  codigo_barras: string | null
  tipo: string
  unidade: string
  preco_venda: number
  custo: number
  ativo: boolean
  categoria_id: string | null
}
interface Unidade { chave: string; nome: string }

const CAMPOS_IMPORT = ['ignorar', 'nome', 'categoria', 'sku', 'codigo_barras', 'preco', 'custo', 'unidade'] as const

export default function Catalogo() {
  const { empresa, pode } = useAuth()
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [filtro, setFiltro] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [editando, setEditando] = useState<Partial<Produto> | null>(null)
  const [importando, setImportando] = useState<TabelaCsv | null>(null)
  const [mapa, setMapa] = useState<Record<string, string>>({})

  const carregar = useCallback(async () => {
    if (!empresa) return
    const t = empresa.tenant_id
    const [c, p, u] = await Promise.all([
      supabase.from('product_categories').select('id, nome').eq('tenant_id', t).order('ordem'),
      supabase.from('products')
        .select('id, nome, sku, codigo_barras, tipo, unidade, preco_venda, custo, ativo, categoria_id')
        .eq('tenant_id', t).order('nome'),
      supabase.from('units').select('chave, nome').order('chave'),
    ])
    const falha = c.error ?? p.error ?? u.error
    if (falha) { setErro(falha.message); return }
    setCategorias(c.data ?? [])
    setProdutos((p.data ?? []) as Produto[])
    setUnidades(u.data ?? [])
  }, [empresa])

  useEffect(() => { void carregar() }, [carregar])

  const visiveis = useMemo(() => {
    const f = filtro.trim().toLowerCase()
    if (!f) return produtos
    return produtos.filter((p) =>
      p.nome.toLowerCase().includes(f) || p.sku?.toLowerCase().includes(f) || p.codigo_barras?.includes(f),
    )
  }, [produtos, filtro])

  async function aplicarKit() {
    if (!empresa) return
    setErro(null)
    const { data, error } = await rpcApp<number>('aplicar_kit_inicial', { p_tenant: empresa.tenant_id })
    if (error) { setErro(error.message); return }
    setAviso(`Kit inicial aplicado: ${data} itens de demonstração criados.`)
    await carregar()
  }

  async function salvar(e: FormEvent) {
    e.preventDefault()
    if (!empresa || !editando) return
    setErro(null)
    const registro = {
      tenant_id: empresa.tenant_id,
      nome: editando.nome,
      sku: editando.sku || null,
      codigo_barras: editando.codigo_barras || null,
      tipo: editando.tipo ?? 'produto',
      unidade: editando.unidade ?? 'un',
      preco_venda: editando.preco_venda ?? 0,
      categoria_id: editando.categoria_id || null,
      controla_estoque: (editando.tipo ?? 'produto') !== 'servico',
    }
    const { error } = editando.id
      ? await supabase.from('products').update(registro).eq('id', editando.id)
      : await supabase.from('products').insert(registro)
    if (error) { setErro(error.message); return }
    setEditando(null)
    await carregar()
  }

  async function alternarAtivo(p: Produto) {
    setErro(null)
    const { error } = await supabase.from('products').update({ ativo: !p.ativo }).eq('id', p.id)
    if (error) setErro(error.message)
    await carregar()
  }

  function abrirCsv(arquivo: File) {
    void arquivo.text().then((texto) => {
      const tabela = lerCsv(texto)
      if (tabela.cabecalho.length === 0) { setErro('Arquivo vazio ou ilegível.'); return }
      setImportando(tabela)
      setMapa(sugerirMapeamento(tabela.cabecalho))
    })
  }

  const previa = useMemo(() => {
    if (!importando) return []
    return importando.linhas.slice(0, 500).map((linha) => {
      const item: Record<string, unknown> = {}
      importando.cabecalho.forEach((coluna, i) => {
        const campo = mapa[coluna]
        if (!campo || campo === 'ignorar') return
        const bruto = linha[i] ?? ''
        item[campo] = campo === 'preco' || campo === 'custo' ? lerNumeroBr(bruto) : bruto.trim()
      })
      return item
    }).filter((i) => i.nome)
  }, [importando, mapa])

  async function confirmarImportacao() {
    if (!empresa) return
    setErro(null)
    const { data, error } = await rpcApp<{ inseridos: number; atualizados: number; erros: unknown[] }>(
      'importar_produtos', { p_tenant: empresa.tenant_id, p_itens: previa },
    )
    if (error) { setErro(error.message); return }
    setImportando(null)
    setAviso(`Importação: ${data?.inseridos} inseridos, ${data?.atualizados} atualizados, ${data?.erros.length} erros.`)
    await carregar()
  }

  const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div className="pilha" style={{ maxWidth: 1000 }}>
      <div className="linha">
        <h1 style={{ fontSize: 22 }} className="crescer">Catálogo</h1>
        {pode('catalogo.criar') && produtos.length === 0 && empresa?.vertical_chave && (
          <button className="bt-fantasma" onClick={() => void aplicarKit()}>Aplicar kit do nicho</button>
        )}
        {pode('catalogo.criar') && (
          <>
            <label className="bt-fantasma" style={{ cursor: 'pointer' }}>
              Importar CSV
              <input type="file" accept=".csv,text/csv" hidden
                onChange={(e) => { const f = e.target.files?.[0]; if (f) abrirCsv(f); e.target.value = '' }} />
            </label>
            <button className="bt-primario" onClick={() => setEditando({})}>Novo produto</button>
          </>
        )}
      </div>

      {erro && <div className="aviso aviso-erro">{erro}</div>}
      {aviso && <div className="aviso aviso-ok">{aviso}</div>}

      {importando && (
        <div className="cartao pilha" style={{ padding: 16 }}>
          <h2 style={{ fontSize: 16 }}>Importar CSV — mapeie as colunas</h2>
          <div className="linha" style={{ flexWrap: 'wrap' }}>
            {importando.cabecalho.map((coluna) => (
              <label key={coluna} className="campo" style={{ margin: 0, width: 180 }}>
                <span>{coluna}</span>
                <select value={mapa[coluna] ?? 'ignorar'}
                  onChange={(e) => setMapa({ ...mapa, [coluna]: e.target.value })}>
                  {CAMPOS_IMPORT.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
            ))}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
            {previa.length} linhas válidas de {importando.linhas.length} (primeiras 500 consideradas).
            Upsert por SKU: linhas com SKU existente atualizam o produto.
          </div>
          <div style={{ overflowX: 'auto', maxHeight: 220 }}>
            <table>
              <thead><tr><th>nome</th><th>categoria</th><th>sku</th><th>preço</th></tr></thead>
              <tbody>
                {previa.slice(0, 8).map((i, n) => (
                  <tr key={n}>
                    <td>{String(i.nome ?? '')}</td><td>{String(i.categoria ?? '')}</td>
                    <td>{String(i.sku ?? '')}</td><td className="num">{String(i.preco ?? '')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="linha">
            <button className="bt-fantasma" onClick={() => setImportando(null)}>Cancelar</button>
            <button className="bt-primario" disabled={previa.length === 0}
              onClick={() => void confirmarImportacao()}>
              Importar {previa.length} itens
            </button>
          </div>
        </div>
      )}

      {editando && (
        <form className="cartao pilha" style={{ padding: 16 }} onSubmit={salvar}>
          <h2 style={{ fontSize: 16 }}>{editando.id ? 'Editar produto' : 'Novo produto'}</h2>
          <div className="linha" style={{ flexWrap: 'wrap' }}>
            <label className="campo crescer" style={{ minWidth: 240, margin: 0 }}>
              <span>Nome *</span>
              <input value={editando.nome ?? ''} required
                onChange={(e) => setEditando({ ...editando, nome: e.target.value })} />
            </label>
            <label className="campo" style={{ width: 160, margin: 0 }}>
              <span>Categoria</span>
              <select value={editando.categoria_id ?? ''}
                onChange={(e) => setEditando({ ...editando, categoria_id: e.target.value || null })}>
                <option value="">—</option>
                {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </label>
            <label className="campo" style={{ width: 130, margin: 0 }}>
              <span>Tipo</span>
              <select value={editando.tipo ?? 'produto'}
                onChange={(e) => setEditando({ ...editando, tipo: e.target.value })}>
                <option value="produto">Produto</option>
                <option value="servico">Serviço</option>
                <option value="insumo">Insumo</option>
                <option value="composto">Composto</option>
              </select>
            </label>
            <label className="campo" style={{ width: 120, margin: 0 }}>
              <span>Unidade</span>
              <select value={editando.unidade ?? 'un'}
                onChange={(e) => setEditando({ ...editando, unidade: e.target.value })}>
                {unidades.map((u) => <option key={u.chave} value={u.chave}>{u.chave}</option>)}
              </select>
            </label>
            <label className="campo" style={{ width: 130, margin: 0 }}>
              <span>Preço (R$)</span>
              <input type="number" step="0.01" min="0" value={editando.preco_venda ?? 0}
                onChange={(e) => setEditando({ ...editando, preco_venda: Number(e.target.value) })} />
            </label>
            <label className="campo" style={{ width: 140, margin: 0 }}>
              <span>SKU</span>
              <input value={editando.sku ?? ''}
                onChange={(e) => setEditando({ ...editando, sku: e.target.value })} />
            </label>
            <label className="campo" style={{ width: 170, margin: 0 }}>
              <span>Código de barras</span>
              <input value={editando.codigo_barras ?? ''} inputMode="numeric"
                onChange={(e) => setEditando({ ...editando, codigo_barras: e.target.value })} />
            </label>
          </div>
          <div className="linha">
            <button type="button" className="bt-fantasma" onClick={() => setEditando(null)}>Cancelar</button>
            <button className="bt-primario">Salvar</button>
          </div>
        </form>
      )}

      <input placeholder="Buscar por nome, SKU ou código de barras…"
        value={filtro} onChange={(e) => setFiltro(e.target.value)} />

      <div className="cartao" style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr><th>Produto</th><th>Categoria</th><th>SKU</th><th>Un.</th><th style={{ textAlign: 'right' }}>Preço</th><th>Status</th><th /></tr>
          </thead>
          <tbody>
            {visiveis.map((p) => (
              <tr key={p.id} style={{ opacity: p.ativo ? 1 : 0.55 }}>
                <td>{p.nome}{p.tipo !== 'produto' && <span className="selo selo-neutro" style={{ marginLeft: 8 }}>{p.tipo}</span>}</td>
                <td>{categorias.find((c) => c.id === p.categoria_id)?.nome ?? '—'}</td>
                <td className="num">{p.sku ?? '—'}</td>
                <td>{p.unidade}</td>
                <td className="num" style={{ textAlign: 'right' }}>{brl(p.preco_venda)}</td>
                <td><span className={`selo ${p.ativo ? 'selo-ok' : 'selo-neutro'}`}>{p.ativo ? 'ativo' : 'inativo'}</span></td>
                <td>
                  {pode('catalogo.editar') && (
                    <div className="linha">
                      <button className="bt-fantasma" onClick={() => setEditando(p)}>Editar</button>
                      <button className="bt-fantasma" onClick={() => void alternarAtivo(p)}>
                        {p.ativo ? 'Desativar' : 'Reativar'}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {visiveis.length === 0 && (
              <tr><td colSpan={7} style={{ color: 'var(--text-3)' }}>
                Nenhum produto{filtro ? ' para esse filtro' : ' cadastrado ainda'}.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
