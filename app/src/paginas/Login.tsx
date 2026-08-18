/**
 * Entrar · Criar conta · Recuperar senha — Supabase Auth.
 * Rate limit, confirmação de e-mail e refresh de sessão são do GoTrue
 * (configuração no painel do Supabase; ver supabase/README.md).
 */
import { useState, type FormEvent } from 'react'
import { supabase, mensagemDeErro } from '../lib/supabase'

type Modo = 'entrar' | 'cadastro' | 'recuperar'

export default function Login() {
  const [modo, setModo] = useState<Modo>('entrar')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setErro(null); setAviso(null); setEnviando(true)
    try {
      if (modo === 'entrar') {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
        if (error) setErro(mensagemDeErro(error))
        // Sucesso: onAuthStateChange no AuthProvider redireciona sozinho.
      } else if (modo === 'cadastro') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: { data: { nome } },
        })
        if (error) { setErro(mensagemDeErro(error)); return }
        // O perfil é criado por trigger no banco (migration 0006).
        if (!data.session) {
          setAviso('Cadastro criado. Confirme o link enviado para o seu e-mail para entrar.')
        }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/redefinir-senha`,
        })
        if (error) { setErro(mensagemDeErro(error)); return }
        setAviso('Se este e-mail tiver cadastro, o link de redefinição foi enviado.')
      }
    } finally {
      setEnviando(false)
    }
  }

  const titulo =
    modo === 'entrar' ? 'Entrar' : modo === 'cadastro' ? 'Criar conta' : 'Recuperar senha'

  return (
    <div className="tela-acesso">
      <form className="cartao pilha" onSubmit={enviar}>
        <div className="marca">
          <div className="marca-logo">G</div>
          <div>
            <h1 style={{ fontSize: 20 }}>Grafista ERP</h1>
            <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>{titulo}</div>
          </div>
        </div>

        {erro && <div className="aviso aviso-erro">{erro}</div>}
        {aviso && <div className="aviso aviso-ok">{aviso}</div>}

        {modo === 'cadastro' && (
          <label className="campo">
            <span>Seu nome</span>
            <input value={nome} onChange={(e) => setNome(e.target.value)} required autoComplete="name" />
          </label>
        )}

        <label className="campo">
          <span>E-mail</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>

        {modo !== 'recuperar' && (
          <label className="campo">
            <span>Senha</span>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              minLength={8}
              autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
            />
          </label>
        )}

        <button className="bt-primario" disabled={enviando}>
          {enviando ? 'Enviando…' : titulo}
        </button>

        <div className="linha" style={{ justifyContent: 'space-between', fontSize: 13 }}>
          {modo !== 'entrar' && (
            <a href="#" onClick={(e) => { e.preventDefault(); setModo('entrar') }}>Já tenho conta</a>
          )}
          {modo !== 'cadastro' && (
            <a href="#" onClick={(e) => { e.preventDefault(); setModo('cadastro') }}>Criar conta</a>
          )}
          {modo !== 'recuperar' && (
            <a href="#" onClick={(e) => { e.preventDefault(); setModo('recuperar') }}>Esqueci a senha</a>
          )}
        </div>
      </form>
    </div>
  )
}
