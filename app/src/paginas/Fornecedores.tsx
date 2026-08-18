/** Fornecedores (Fase 3, item 12). */
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

interface Fornecedor {
  id: string
  razao_social: string
  nome_fantasia: string | null
  cnpj: string | null
  email: string | null
  telefone: string | null
  whatsapp: string | null
  prazo_entrega_dias: number | null
  condicao_pagamento: string | null
  ativo: boolean
}

export default function Fornecedores() {
  const { empresa, pode } = useAuth()
  const [lista, setLista] = useState<Fornecedor[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const [editando, setEditando] = useState<Partial<Fornecedor> | null>(null)

  const carregar = useCallback(async () => {
    if (!empresa) return
    const { data, error } = await supabase.from('suppliers')
      .select('id, razao_social, nome_fantasia, cnpj, email, telefone, whatsapp, prazo_entrega_dias, condicao_pagamento, ativo')
      .eq('tenant_id', empresa.tenant_id).order('razao_social')
    if (error) { setErro(error.message); return }
    setLista((data ?? []) as Fornecedor[])
  }, [empresa])

  useEffect(() => { void carregar() }, [carregar])

  async function salvar(e: FormEvent) {
    e.preventDefault()
    if (!empresa || !editando) return
    setErro(null)
    const registro = {
      tenant_id: empresa.tenant_id,
      razao_social: editando.razao_social,
      nome_fantasia: editando.nome_fantasia || null,
      cnpj: editando.cnpj?.replace(/\D/g, '') || null,
      email: editando.email || null,
      telefone: editando.telefone || null,
      whatsapp: editando.whatsapp || null,
      prazo_entrega_dias: editando.prazo_entrega_dias ?? null,
      condicao_pagamento: editando.condicao_pagamento || null,
    }
    const { error } = editando.id
      ? await supabase.from('suppliers').update(registro).eq('id', editando.id)
      : await supabase.from('suppliers').insert(registro)
    if (error) {
      setErro(error.code === '23514' ? 'CNPJ fora do formato (14 dígitos).' : error.message)
      return
    }
    setEditando(null)
    await carregar()
  }

  const podeCriar = pode('compras.criar')

  return (
    <div className="pilha" style={{ maxWidth: 1000 }}>
      <div className="linha">
        <h1 style={{ fontSize: 22 }} className="crescer">Fornecedores</h1>
        {podeCriar && (
          <button className="bt-primario" onClick={() => setEditando({})}>Novo fornecedor</button>
        )}
      </div>
      {erro && <div className="aviso aviso-erro">{erro}</div>}

      {editando && (
        <form className="cartao pilha" style={{ padding: 16 }} onSubmit={salvar}>
          <h2 style={{ fontSize: 16 }}>{editando.id ? 'Editar fornecedor' : 'Novo fornecedor'}</h2>
          <div className="linha" style={{ flexWrap: 'wrap' }}>
            <label className="campo crescer" style={{ minWidth: 240, margin: 0 }}>
              <span>Razão social *</span>
              <input value={editando.razao_social ?? ''} required
                onChange={(e) => setEditando({ ...editando, razao_social: e.target.value })} />
            </label>
            <label className="campo" style={{ width: 180, margin: 0 }}>
              <span>Nome fantasia</span>
              <input value={editando.nome_fantasia ?? ''}
                onChange={(e) => setEditando({ ...editando, nome_fantasia: e.target.value })} />
            </label>
            <label className="campo" style={{ width: 170, margin: 0 }}>
              <span>CNPJ</span>
              <input value={editando.cnpj ?? ''} inputMode="numeric"
                onChange={(e) => setEditando({ ...editando, cnpj: e.target.value })} />
            </label>
            <label className="campo" style={{ width: 200, margin: 0 }}>
              <span>E-mail</span>
              <input type="email" value={editando.email ?? ''}
                onChange={(e) => setEditando({ ...editando, email: e.target.value })} />
            </label>
            <label className="campo" style={{ width: 150, margin: 0 }}>
              <span>WhatsApp</span>
              <input value={editando.whatsapp ?? ''}
                onChange={(e) => setEditando({ ...editando, whatsapp: e.target.value })} />
            </label>
            <label className="campo" style={{ width: 150, margin: 0 }}>
              <span>Prazo entrega (dias)</span>
              <input type="number" min="0" value={editando.prazo_entrega_dias ?? ''}
                onChange={(e) => setEditando({ ...editando, prazo_entrega_dias: e.target.value === '' ? null : Number(e.target.value) })} />
            </label>
            <label className="campo" style={{ width: 180, margin: 0 }}>
              <span>Condição de pagamento</span>
              <input placeholder="ex.: 28 dias, 30/60" value={editando.condicao_pagamento ?? ''}
                onChange={(e) => setEditando({ ...editando, condicao_pagamento: e.target.value })} />
            </label>
          </div>
          <div className="linha">
            <button type="button" className="bt-fantasma" onClick={() => setEditando(null)}>Cancelar</button>
            <button className="bt-primario">Salvar</button>
          </div>
        </form>
      )}

      <div className="cartao" style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr><th>Fornecedor</th><th>CNPJ</th><th>Contato</th><th>Prazo</th><th>Pagamento</th><th /></tr>
          </thead>
          <tbody>
            {lista.map((f) => (
              <tr key={f.id} style={{ opacity: f.ativo ? 1 : 0.55 }}>
                <td>{f.nome_fantasia ?? f.razao_social}</td>
                <td className="num">{f.cnpj ?? '—'}</td>
                <td>{f.whatsapp ?? f.telefone ?? f.email ?? '—'}</td>
                <td>{f.prazo_entrega_dias != null ? `${f.prazo_entrega_dias} dias` : '—'}</td>
                <td>{f.condicao_pagamento ?? '—'}</td>
                <td>
                  {podeCriar && (
                    <button className="bt-fantasma" onClick={() => setEditando(f)}>Editar</button>
                  )}
                </td>
              </tr>
            ))}
            {lista.length === 0 && (
              <tr><td colSpan={6} style={{ color: 'var(--text-3)' }}>Nenhum fornecedor ainda.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
