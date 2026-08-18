/**
 * /convite/:token — aceite de convite.
 * Sem sessão: mostra o login primeiro (o convite é nominal: o e-mail precisa
 * bater com o do convidado — validado no banco por app.aceitar_convite).
 */
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { rpcApp } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import Login from './Login'

export default function AceitarConvite() {
  const { token } = useParams()
  const { session, escolherEmpresa, recarregarEmpresas } = useAuth()
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const navegar = useNavigate()

  if (!session) {
    return (
      <div>
        <div className="tela-acesso" style={{ paddingBottom: 0 }}>
          <div className="aviso aviso-atencao" style={{ maxWidth: 420, width: '100%' }}>
            Você recebeu um convite. Entre (ou crie sua conta com o e-mail
            convidado) para aceitá-lo.
          </div>
        </div>
        <Login />
      </div>
    )
  }

  async function aceitar() {
    if (!token) return
    setErro(null); setEnviando(true)
    const { data, error } = await rpcApp<string>('aceitar_convite', { p_token: token })
    setEnviando(false)
    if (error) { setErro(error.message); return }
    await recarregarEmpresas()
    if (data) escolherEmpresa(data)
    navegar('/', { replace: true })
  }

  return (
    <div className="tela-acesso">
      <div className="cartao pilha">
        <h1 style={{ fontSize: 20 }}>Aceitar convite</h1>
        <p style={{ color: 'var(--text-2)' }}>
          Ao aceitar, você passa a fazer parte da empresa com o papel definido
          por quem convidou.
        </p>
        {erro && <div className="aviso aviso-erro">{erro}</div>}
        <button className="bt-primario" onClick={aceitar} disabled={enviando}>
          {enviando ? 'Confirmando…' : 'Aceitar convite'}
        </button>
      </div>
    </div>
  )
}
