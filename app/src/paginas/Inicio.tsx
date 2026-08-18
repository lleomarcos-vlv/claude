/** Início: boas-vindas + central de alertas inteligentes (item 40). */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { rpcApp } from '../lib/supabase'
import { useAuth } from '../lib/auth'

interface Alerta { tipo: string; severidade: string; mensagem: string }

const CLASSE: Record<string, string> = {
  critica: 'selo-crit', atencao: 'selo-atencao', info: 'selo-primario',
}

export default function Inicio() {
  const { empresa, session, pode } = useAuth()
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const navegar = useNavigate()

  useEffect(() => {
    if (!empresa) return
    void rpcApp<Alerta[]>('alertas', { p_tenant: empresa.tenant_id })
      .then(({ data }) => setAlertas(data ?? []))
  }, [empresa])

  return (
    <div className="pilha" style={{ maxWidth: 760 }}>
      <h1 style={{ fontSize: 22 }}>
        Bem-vindo, {(session?.user.user_metadata?.nome as string | undefined) ?? session?.user.email}
      </h1>

      {!empresa?.vertical_chave && pode('empresa.editar') && (
        <div className="aviso aviso-atencao">
          A empresa ainda não tem nicho definido.{' '}
          <a href="/nicho" onClick={(e) => { e.preventDefault(); navegar('/nicho') }}>
            Escolher o ramo da empresa
          </a>{' '}
          libera a terminologia e o catálogo inicial.
        </div>
      )}

      {alertas.length > 0 ? (
        <div className="cartao pilha" style={{ padding: 16 }}>
          <h2 style={{ fontSize: 15 }}>Alertas ({alertas.length})</h2>
          {alertas.map((a, i) => (
            <div key={i} className="linha" style={{ fontSize: 13.5 }}>
              <span className={`selo ${CLASSE[a.severidade] ?? 'selo-neutro'}`}>{a.tipo.replace(/_/g, ' ')}</span>
              <span className="crescer">{a.mensagem}</span>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: 'var(--text-2)' }}>Nenhum alerta no momento.</p>
      )}
    </div>
  )
}
