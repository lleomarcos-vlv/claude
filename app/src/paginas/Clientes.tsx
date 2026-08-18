/** Clientes (Fase 3, item 21): cadastro completo com LGPD. */
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

interface Cliente {
  id: string
  nome: string
  apelido: string | null
  cpf_cnpj: string | null
  email: string | null
  telefone: string | null
  whatsapp: string | null
  aniversario: string | null
  preferencias: string | null
  endereco: { cidade?: string; uf?: string }
  consentimento_lgpd: boolean
  ativo: boolean
}

export default function Clientes() {
  const { empresa, pode } = useAuth()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [filtro, setFiltro] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [editando, setEditando] = useState<Partial<Cliente> | null>(null)

  const carregar = useCallback(async () => {
    if (!empresa) return
    const { data, error } = await supabase.from('customers')
      .select('id, nome, apelido, cpf_cnpj, email, telefone, whatsapp, aniversario, preferencias, endereco, consentimento_lgpd, ativo')
      .eq('tenant_id', empresa.tenant_id).order('nome')
    if (error) { setErro(error.message); return }
    setClientes((data ?? []) as Cliente[])
  }, [empresa])

  useEffect(() => { void carregar() }, [carregar])

  const visiveis = useMemo(() => {
    const f = filtro.trim().toLowerCase()
    if (!f) return clientes
    return clientes.filter((c) =>
      c.nome.toLowerCase().includes(f) || c.cpf_cnpj?.includes(f) || c.telefone?.includes(f),
    )
  }, [clientes, filtro])

  async function salvar(e: FormEvent) {
    e.preventDefault()
    if (!empresa || !editando) return
    setErro(null)
    const registro = {
      tenant_id: empresa.tenant_id,
      nome: editando.nome,
      apelido: editando.apelido || null,
      cpf_cnpj: editando.cpf_cnpj?.replace(/\D/g, '') || null,
      email: editando.email || null,
      telefone: editando.telefone || null,
      whatsapp: editando.whatsapp || null,
      aniversario: editando.aniversario || null,
      preferencias: editando.preferencias || null,
      endereco: editando.endereco ?? {},
      consentimento_lgpd: editando.consentimento_lgpd ?? false,
      consentimento_em: editando.consentimento_lgpd ? new Date().toISOString() : null,
    }
    const { error } = editando.id
      ? await supabase.from('customers').update(registro).eq('id', editando.id)
      : await supabase.from('customers').insert(registro)
    if (error) {
      setErro(error.code === '23514'
        ? 'CPF/CNPJ fora do formato (11 ou 14 dígitos).' : error.message)
      return
    }
    setEditando(null)
    await carregar()
  }

  return (
    <div className="pilha" style={{ maxWidth: 1000 }}>
      <div className="linha">
        <h1 style={{ fontSize: 22 }} className="crescer">Clientes</h1>
        {pode('clientes.criar') && (
          <button className="bt-primario" onClick={() => setEditando({})}>Novo cliente</button>
        )}
      </div>
      {erro && <div className="aviso aviso-erro">{erro}</div>}

      {editando && (
        <form className="cartao pilha" style={{ padding: 16 }} onSubmit={salvar}>
          <h2 style={{ fontSize: 16 }}>{editando.id ? 'Editar cliente' : 'Novo cliente'}</h2>
          <div className="linha" style={{ flexWrap: 'wrap' }}>
            <label className="campo crescer" style={{ minWidth: 220, margin: 0 }}>
              <span>Nome *</span>
              <input value={editando.nome ?? ''} required
                onChange={(e) => setEditando({ ...editando, nome: e.target.value })} />
            </label>
            <label className="campo" style={{ width: 150, margin: 0 }}>
              <span>Apelido</span>
              <input value={editando.apelido ?? ''}
                onChange={(e) => setEditando({ ...editando, apelido: e.target.value })} />
            </label>
            <label className="campo" style={{ width: 170, margin: 0 }}>
              <span>CPF/CNPJ</span>
              <input value={editando.cpf_cnpj ?? ''} inputMode="numeric"
                onChange={(e) => setEditando({ ...editando, cpf_cnpj: e.target.value })} />
            </label>
            <label className="campo" style={{ width: 140, margin: 0 }}>
              <span>Aniversário</span>
              <input type="date" value={editando.aniversario ?? ''}
                onChange={(e) => setEditando({ ...editando, aniversario: e.target.value })} />
            </label>
            <label className="campo" style={{ width: 200, margin: 0 }}>
              <span>E-mail</span>
              <input type="email" value={editando.email ?? ''}
                onChange={(e) => setEditando({ ...editando, email: e.target.value })} />
            </label>
            <label className="campo" style={{ width: 150, margin: 0 }}>
              <span>Telefone</span>
              <input value={editando.telefone ?? ''}
                onChange={(e) => setEditando({ ...editando, telefone: e.target.value })} />
            </label>
            <label className="campo" style={{ width: 150, margin: 0 }}>
              <span>WhatsApp</span>
              <input value={editando.whatsapp ?? ''}
                onChange={(e) => setEditando({ ...editando, whatsapp: e.target.value })} />
            </label>
            <label className="campo" style={{ width: 180, margin: 0 }}>
              <span>Cidade</span>
              <input value={editando.endereco?.cidade ?? ''}
                onChange={(e) => setEditando({ ...editando, endereco: { ...editando.endereco, cidade: e.target.value } })} />
            </label>
            <label className="campo crescer" style={{ minWidth: 220, margin: 0 }}>
              <span>Preferências / observações</span>
              <input value={editando.preferencias ?? ''}
                onChange={(e) => setEditando({ ...editando, preferencias: e.target.value })} />
            </label>
          </div>
          <label className="linha" style={{ fontSize: 13.5, cursor: 'pointer' }}>
            <input type="checkbox" style={{ width: 'auto' }}
              checked={editando.consentimento_lgpd ?? false}
              onChange={(e) => setEditando({ ...editando, consentimento_lgpd: e.target.checked })} />
            Cliente consentiu com o uso dos dados para contato e ofertas (LGPD)
          </label>
          <div className="linha">
            <button type="button" className="bt-fantasma" onClick={() => setEditando(null)}>Cancelar</button>
            <button className="bt-primario">Salvar</button>
          </div>
        </form>
      )}

      <input placeholder="Buscar por nome, documento ou telefone…"
        value={filtro} onChange={(e) => setFiltro(e.target.value)} />

      <div className="cartao" style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr><th>Nome</th><th>Documento</th><th>Contato</th><th>Aniversário</th><th>LGPD</th><th /></tr>
          </thead>
          <tbody>
            {visiveis.map((c) => (
              <tr key={c.id} style={{ opacity: c.ativo ? 1 : 0.55 }}>
                <td>{c.nome}{c.apelido && <span style={{ color: 'var(--text-3)' }}> ({c.apelido})</span>}</td>
                <td className="num">{c.cpf_cnpj ?? '—'}</td>
                <td>{c.whatsapp ?? c.telefone ?? c.email ?? '—'}</td>
                <td>{c.aniversario ? new Date(c.aniversario + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</td>
                <td>
                  <span className={`selo ${c.consentimento_lgpd ? 'selo-ok' : 'selo-neutro'}`}>
                    {c.consentimento_lgpd ? 'consentiu' : 'sem consentimento'}
                  </span>
                </td>
                <td>
                  {pode('clientes.editar') && (
                    <button className="bt-fantasma" onClick={() => setEditando(c)}>Editar</button>
                  )}
                </td>
              </tr>
            ))}
            {visiveis.length === 0 && (
              <tr><td colSpan={6} style={{ color: 'var(--text-3)' }}>Nenhum cliente ainda.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
