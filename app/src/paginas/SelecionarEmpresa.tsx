/** Troca de empresa: lista os vínculos ativos (app.minhas_empresas). */
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function SelecionarEmpresa() {
  const { empresas, escolherEmpresa, sair, session } = useAuth()
  const navegar = useNavigate()

  return (
    <div className="tela-acesso">
      <div className="cartao pilha" style={{ maxWidth: 480 }}>
        <div className="linha">
          <h1 style={{ fontSize: 20 }} className="crescer">Suas empresas</h1>
          <button className="bt-fantasma" onClick={() => void sair()}>Sair</button>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-3)' }}>{session?.user.email}</div>

        {empresas.length === 0 && (
          <div className="aviso aviso-atencao">
            Você ainda não faz parte de nenhuma empresa. Crie a sua ou peça um
            convite a quem administra uma.
          </div>
        )}

        {empresas.map((e) => (
          <button
            key={e.tenant_id}
            className="bt-fantasma"
            style={{ textAlign: 'left', padding: 14 }}
            onClick={() => { escolherEmpresa(e.tenant_id); navegar('/', { replace: true }) }}
          >
            <div style={{ fontWeight: 700 }}>{e.nome_fantasia ?? e.razao_social}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
              {e.papel_nome} · {e.slug}
            </div>
          </button>
        ))}

        <Link to="/empresas/nova">
          <button className="bt-primario" style={{ width: '100%' }}>Criar nova empresa</button>
        </Link>
      </div>
    </div>
  )
}
