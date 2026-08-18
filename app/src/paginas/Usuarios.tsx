/**
 * Gestão de usuários: membros, papéis e convites.
 * Toda mutação passa pelas funções do banco — a interface esconde o que o
 * papel não permite, mas quem barra de verdade é a RLS.
 */
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { supabase, rpcApp } from '../lib/supabase'
import { useAuth } from '../lib/auth'

interface Membro {
  id: string
  status: string
  user_id: string
  profiles: { nome: string; email: string } | null
  roles: { id: string; chave: string; nome: string } | null
}
interface Papel { id: string; chave: string; nome: string }
interface Convite {
  id: string
  email: string
  status: string
  expira_em: string
  roles: { nome: string } | null
}

export default function Usuarios() {
  const { empresa, pode, session } = useAuth()
  const [membros, setMembros] = useState<Membro[]>([])
  const [papeis, setPapeis] = useState<Papel[]>([])
  const [convites, setConvites] = useState<Convite[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  // formulário de convite
  const [convEmail, setConvEmail] = useState('')
  const [convPapel, setConvPapel] = useState('vendedor')
  const [enviando, setEnviando] = useState(false)

  const carregar = useCallback(async () => {
    if (!empresa) return
    const t = empresa.tenant_id
    const [m, p, c] = await Promise.all([
      supabase.from('memberships')
        .select('id, status, user_id, profiles:profiles!memberships_user_id_fkey(nome, email), roles(id, chave, nome)')
        .eq('tenant_id', t).neq('status', 'removido'),
      supabase.from('roles').select('id, chave, nome').eq('tenant_id', t).order('nome'),
      supabase.from('invitations')
        .select('id, email, status, expira_em, roles(nome)')
        .eq('tenant_id', t).eq('status', 'pendente'),
    ])
    if (m.error ?? p.error ?? c.error) {
      setErro((m.error ?? p.error ?? c.error)!.message)
      return
    }
    setMembros((m.data ?? []) as unknown as Membro[])
    setPapeis((p.data ?? []) as Papel[])
    setConvites((c.data ?? []) as unknown as Convite[])
  }, [empresa])

  useEffect(() => { void carregar() }, [carregar])

  async function convidar(e: FormEvent) {
    e.preventDefault()
    if (!empresa) return
    setErro(null); setAviso(null); setEnviando(true)
    const { data, error } = await rpcApp<{ convite_id: string; token: string }[]>(
      'convidar_usuario',
      { p_tenant: empresa.tenant_id, p_email: convEmail, p_role_chave: convPapel },
    )
    setEnviando(false)
    if (error) { setErro(error.message); return }
    const token = data?.[0]?.token
    // Envio de e-mail entra com a Edge Function (Fase 2 · pendência de infra).
    // Até lá o link é exibido para copiar e mandar manualmente.
    const link = `${window.location.origin}/convite/${token}`
    setAviso(`Convite criado. Envie este link para ${convEmail}: ${link}`)
    setConvEmail('')
    await carregar()
  }

  async function mudarPapel(m: Membro, roleId: string) {
    setErro(null)
    const { error } = await supabase.from('memberships')
      .update({ role_id: roleId }).eq('id', m.id)
    if (error) setErro(error.message)
    await carregar()
  }

  async function mudarStatus(m: Membro, status: 'ativo' | 'suspenso') {
    setErro(null)
    const { error } = await supabase.from('memberships')
      .update({ status }).eq('id', m.id)
    if (error) setErro(error.message)
    await carregar()
  }

  async function revogarConvite(id: string) {
    setErro(null)
    const { error } = await rpcApp('revogar_convite', { p_convite: id })
    if (error) setErro(error.message)
    await carregar()
  }

  const podeEditar = pode('usuarios.editar')

  return (
    <div className="pilha" style={{ maxWidth: 900 }}>
      <h1 style={{ fontSize: 22 }}>Usuários</h1>
      {erro && <div className="aviso aviso-erro">{erro}</div>}
      {aviso && <div className="aviso aviso-ok" style={{ wordBreak: 'break-all' }}>{aviso}</div>}

      {pode('usuarios.convidar') && (
        <form className="cartao linha" style={{ padding: 16, flexWrap: 'wrap' }} onSubmit={convidar}>
          <label className="campo crescer" style={{ margin: 0, minWidth: 220 }}>
            <span>E-mail do convidado</span>
            <input type="email" value={convEmail} onChange={(e) => setConvEmail(e.target.value)} required />
          </label>
          <label className="campo" style={{ margin: 0, width: 200 }}>
            <span>Papel</span>
            <select value={convPapel} onChange={(e) => setConvPapel(e.target.value)}>
              {papeis.map((p) => <option key={p.id} value={p.chave}>{p.nome}</option>)}
            </select>
          </label>
          <button className="bt-primario" disabled={enviando} style={{ alignSelf: 'end' }}>
            {enviando ? 'Criando…' : 'Convidar'}
          </button>
        </form>
      )}

      <div className="cartao" style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr><th>Nome</th><th>E-mail</th><th>Papel</th><th>Status</th>{podeEditar && <th />}</tr>
          </thead>
          <tbody>
            {membros.map((m) => (
              <tr key={m.id}>
                <td>{m.profiles?.nome ?? '—'}</td>
                <td>{m.profiles?.email ?? '—'}</td>
                <td>
                  {podeEditar && m.user_id !== session?.user.id ? (
                    <select
                      value={m.roles?.id ?? ''}
                      onChange={(e) => void mudarPapel(m, e.target.value)}
                    >
                      {papeis.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                    </select>
                  ) : (m.roles?.nome ?? '—')}
                </td>
                <td>
                  <span className={`selo ${m.status === 'ativo' ? 'selo-ok' : 'selo-atencao'}`}>
                    {m.status}
                  </span>
                </td>
                {podeEditar && (
                  <td>
                    {m.user_id !== session?.user.id && (
                      m.status === 'ativo'
                        ? <button className="bt-perigo" onClick={() => void mudarStatus(m, 'suspenso')}>Suspender</button>
                        : <button className="bt-fantasma" onClick={() => void mudarStatus(m, 'ativo')}>Reativar</button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {convites.length > 0 && (
        <div className="cartao" style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr><th>Convite pendente</th><th>Papel</th><th>Expira</th>{podeEditar && <th />}</tr>
            </thead>
            <tbody>
              {convites.map((c) => (
                <tr key={c.id}>
                  <td>{c.email}</td>
                  <td>{c.roles?.nome ?? '—'}</td>
                  <td>{new Date(c.expira_em).toLocaleDateString('pt-BR')}</td>
                  {podeEditar && (
                    <td>
                      <button className="bt-perigo" onClick={() => void revogarConvite(c.id)}>Revogar</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
