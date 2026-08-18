/** Onboarding: escolha do nicho (kit) da empresa — dados de public.verticals. */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, rpcApp } from '../lib/supabase'
import { useAuth } from '../lib/auth'

interface Vertical { chave: string; nome: string; descricao: string; cor: string; sigla: string }

export default function EscolherNicho() {
  const { empresa, recarregarEmpresas } = useAuth()
  const [verticais, setVerticais] = useState<Vertical[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState<string | null>(null)
  const navegar = useNavigate()

  useEffect(() => {
    void supabase.from('verticals')
      .select('chave, nome, descricao, cor, sigla').order('ordem')
      .then(({ data, error }) => {
        if (error) setErro(error.message)
        else setVerticais((data ?? []) as Vertical[])
      })
  }, [])

  async function escolher(chave: string) {
    if (!empresa) return
    setErro(null); setSalvando(chave)
    const { error } = await rpcApp('definir_vertical', {
      p_tenant: empresa.tenant_id, p_vertical: chave,
    })
    setSalvando(null)
    if (error) { setErro(error.message); return }
    await recarregarEmpresas()
    navegar('/catalogo', { replace: true })
  }

  return (
    <div className="pilha" style={{ maxWidth: 900 }}>
      <h1 style={{ fontSize: 22 }}>Qual é o ramo da empresa?</h1>
      <p style={{ color: 'var(--text-2)' }}>
        O kit do nicho define a terminologia, os modos de venda e um catálogo
        inicial de demonstração. Tudo pode ser ajustado depois.
      </p>
      {erro && <div className="aviso aviso-erro">{erro}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
        {verticais.map((v) => (
          <button key={v.chave} className="cartao pilha"
            style={{ padding: 16, textAlign: 'left', cursor: 'pointer', gap: 8, alignItems: 'start' }}
            disabled={salvando !== null}
            onClick={() => void escolher(v.chave)}>
            <span className="marca-logo" style={{ background: v.cor }}>{v.sigla}</span>
            <strong>{v.nome}</strong>
            <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 400 }}>{v.descricao}</span>
            {empresa?.vertical_chave === v.chave && <span className="selo selo-primario">nicho atual</span>}
            {salvando === v.chave && <span className="selo selo-neutro">salvando…</span>}
          </button>
        ))}
      </div>
    </div>
  )
}
