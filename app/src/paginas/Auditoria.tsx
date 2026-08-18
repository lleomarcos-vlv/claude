/**
 * Auditoria (item 32): o banco grava desde a Fase 1; esta é a janela.
 * Trilha imutável — nem o proprietário edita ou apaga registros.
 */
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

interface Registro {
  id: number
  tabela: string
  acao: string
  registro_id: string | null
  campos_alterados: string[] | null
  criado_em: string
  profiles: { nome: string } | null
  valor_anterior: Record<string, unknown> | null
  valor_novo: Record<string, unknown> | null
}

export default function Auditoria() {
  const { empresa } = useAuth()
  const [registros, setRegistros] = useState<Registro[]>([])
  const [tabela, setTabela] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [aberto, setAberto] = useState<number | null>(null)

  const carregar = useCallback(async () => {
    if (!empresa) return
    let q = supabase.from('audit_log')
      .select('id, tabela, acao, registro_id, campos_alterados, criado_em, profiles(nome), valor_anterior, valor_novo')
      .eq('tenant_id', empresa.tenant_id)
      .order('criado_em', { ascending: false })
      .limit(100)
    if (tabela) q = q.eq('tabela', tabela)
    const { data, error } = await q
    if (error) { setErro(error.message); return }
    setRegistros((data ?? []) as unknown as Registro[])
  }, [empresa, tabela])

  useEffect(() => { void carregar() }, [carregar])

  const tabelas = [...new Set(registros.map((r) => r.tabela))].sort()

  return (
    <div className="pilha" style={{ maxWidth: 1000 }}>
      <div className="linha">
        <h1 style={{ fontSize: 22 }} className="crescer">Auditoria</h1>
        <select value={tabela} onChange={(e) => setTabela(e.target.value)} style={{ width: 200 }}>
          <option value="">todas as tabelas</option>
          {tabelas.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      {erro && <div className="aviso aviso-erro">{erro}</div>}
      <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
        Trilha somente-inserção: registros não podem ser editados nem apagados
        pela aplicação, por ninguém. Últimos 100 eventos.
      </p>

      <div className="cartao" style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr><th>Quando</th><th>Quem</th><th>Tabela</th><th>Ação</th><th>Campos alterados</th><th /></tr>
          </thead>
          <tbody>
            {registros.map((r) => (
              <>
                <tr key={r.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{new Date(r.criado_em).toLocaleString('pt-BR')}</td>
                  <td>{r.profiles?.nome ?? 'sistema'}</td>
                  <td><code>{r.tabela}</code></td>
                  <td><span className={`selo ${r.acao === 'DELETE' ? 'selo-crit' : r.acao === 'INSERT' ? 'selo-ok' : 'selo-atencao'}`}>
                    {r.acao}</span></td>
                  <td style={{ fontSize: 12.5 }}>{r.campos_alterados?.join(', ') ?? '—'}</td>
                  <td>
                    <button className="bt-fantasma" onClick={() => setAberto(aberto === r.id ? null : r.id)}>
                      {aberto === r.id ? 'Fechar' : 'Detalhes'}
                    </button>
                  </td>
                </tr>
                {aberto === r.id && (
                  <tr key={`${r.id}-det`}>
                    <td colSpan={6}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
                        <div>
                          <strong>Antes</strong>
                          <pre style={{ overflow: 'auto', maxHeight: 200, background: 'var(--panel-2)', padding: 8, borderRadius: 8 }}>
                            {JSON.stringify(r.valor_anterior, null, 1) ?? '—'}
                          </pre>
                        </div>
                        <div>
                          <strong>Depois</strong>
                          <pre style={{ overflow: 'auto', maxHeight: 200, background: 'var(--panel-2)', padding: 8, borderRadius: 8 }}>
                            {JSON.stringify(r.valor_novo, null, 1) ?? '—'}
                          </pre>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {registros.length === 0 && (
              <tr><td colSpan={6} style={{ color: 'var(--text-3)' }}>Nada registrado ainda.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
