/** Destino do link de recuperação: define a nova senha da sessão de recovery. */
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, mensagemDeErro } from '../lib/supabase'

export default function RedefinirSenha() {
  const [senha, setSenha] = useState('')
  const [confirma, setConfirma] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const navegar = useNavigate()

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (senha !== confirma) { setErro('As senhas não conferem.'); return }
    setErro(null); setEnviando(true)
    const { error } = await supabase.auth.updateUser({ password: senha })
    setEnviando(false)
    if (error) { setErro(mensagemDeErro(error)); return }
    navegar('/', { replace: true })
  }

  return (
    <div className="tela-acesso">
      <form className="cartao pilha" onSubmit={enviar}>
        <h1 style={{ fontSize: 20 }}>Definir nova senha</h1>
        {erro && <div className="aviso aviso-erro">{erro}</div>}
        <label className="campo">
          <span>Nova senha</span>
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)}
            required minLength={8} autoComplete="new-password" />
        </label>
        <label className="campo">
          <span>Repita a senha</span>
          <input type="password" value={confirma} onChange={(e) => setConfirma(e.target.value)}
            required minLength={8} autoComplete="new-password" />
        </label>
        <button className="bt-primario" disabled={enviando}>
          {enviando ? 'Salvando…' : 'Salvar senha'}
        </button>
      </form>
    </div>
  )
}
