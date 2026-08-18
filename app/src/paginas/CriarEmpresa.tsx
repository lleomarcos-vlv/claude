/**
 * Onboarding, etapa 1: provisionar a empresa (app.provisionar_tenant).
 * Cria empresa + matriz + 13 papéis e vincula o usuário como Proprietário.
 */
import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { rpcApp } from '../lib/supabase'
import { useAuth } from '../lib/auth'

const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

function gerarSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
}

export default function CriarEmpresa() {
  const [razao, setRazao] = useState('')
  const [fantasia, setFantasia] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [uf, setUf] = useState('')
  const [municipio, setMunicipio] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const { escolherEmpresa, recarregarEmpresas } = useAuth()
  const navegar = useNavigate()

  const slug = useMemo(() => gerarSlug(fantasia || razao), [fantasia, razao])

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setErro(null); setEnviando(true)
    const { data, error } = await rpcApp<string>('provisionar_tenant', {
      p_razao_social: razao,
      p_slug: slug,
      p_nome_fantasia: fantasia || null,
      p_cnpj: cnpj.replace(/\D/g, '') || null,
      p_uf: uf || null,
      p_municipio: municipio || null,
    })
    setEnviando(false)
    if (error) {
      setErro(error.code === '23505'
        ? 'Já existe uma empresa com esse nome — ajuste o nome fantasia.'
        : error.message)
      return
    }
    await recarregarEmpresas()
    if (data) escolherEmpresa(data)
    navegar('/', { replace: true })
  }

  return (
    <div className="tela-acesso">
      <form className="cartao pilha" style={{ maxWidth: 480 }} onSubmit={enviar}>
        <h1 style={{ fontSize: 20 }}>Criar empresa</h1>
        {erro && <div className="aviso aviso-erro">{erro}</div>}

        <label className="campo">
          <span>Razão social *</span>
          <input value={razao} onChange={(e) => setRazao(e.target.value)} required />
        </label>
        <label className="campo">
          <span>Nome fantasia</span>
          <input value={fantasia} onChange={(e) => setFantasia(e.target.value)} />
        </label>
        <label className="campo">
          <span>CNPJ (somente números, opcional)</span>
          <input value={cnpj} onChange={(e) => setCnpj(e.target.value)} inputMode="numeric" />
        </label>
        <div className="linha">
          <label className="campo" style={{ width: 110 }}>
            <span>UF</span>
            <select value={uf} onChange={(e) => setUf(e.target.value)}>
              <option value="">—</option>
              {UFS.map((u) => <option key={u}>{u}</option>)}
            </select>
          </label>
          <label className="campo crescer">
            <span>Município</span>
            <input value={municipio} onChange={(e) => setMunicipio(e.target.value)} />
          </label>
        </div>

        {slug && (
          <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
            Endereço interno: <code>{slug}</code>
          </div>
        )}

        <div className="linha">
          <button type="button" className="bt-fantasma" onClick={() => navegar(-1)}>Voltar</button>
          <button className="bt-primario crescer" disabled={enviando || !slug}>
            {enviando ? 'Criando…' : 'Criar empresa'}
          </button>
        </div>
      </form>
    </div>
  )
}
