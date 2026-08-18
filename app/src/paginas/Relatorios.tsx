/**
 * Relatórios (Fase 8): catálogo com estado real de cada relatório,
 * execução com dados do banco, exportação CSV e pacote mensal do contador.
 */
import { useCallback, useEffect, useState } from 'react'
import { supabase, rpcApp } from '../lib/supabase'
import { useAuth } from '../lib/auth'

interface ItemCatalogo { chave: string; nome: string; descricao: string; implementado: boolean }
interface Tabela { colunas: string[]; linhas: (string | number | boolean | null)[][] }
interface Pacote { id: string; titulo: string; status: string; criado_em: string; conteudo: unknown }

function paraCsv(t: Tabela): string {
  const escapar = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [t.colunas.map(escapar).join(';'), ...t.linhas.map((l) => l.map(escapar).join(';'))].join('\n')
}

function baixar(nome: string, conteudo: string, tipo: string) {
  const blob = new Blob(['﻿' + conteudo], { type: tipo })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = nome; a.click()
  URL.revokeObjectURL(url)
}

function primeiroDoMes(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

export default function Relatorios() {
  const { empresa, pode } = useAuth()
  const [catalogo, setCatalogo] = useState<ItemCatalogo[]>([])
  const [pacotes, setPacotes] = useState<Pacote[]>([])
  const [ativo, setAtivo] = useState<string | null>(null)
  const [tabela, setTabela] = useState<Tabela | null>(null)
  const [de, setDe] = useState(primeiroDoMes())
  const [ate, setAte] = useState(new Date().toISOString().slice(0, 10))
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    if (!empresa) return
    const [c, p] = await Promise.all([
      supabase.from('report_catalog').select('chave, nome, descricao, implementado').order('ordem'),
      supabase.from('accountant_packages')
        .select('id, titulo, status, criado_em, conteudo')
        .eq('tenant_id', empresa.tenant_id).order('competencia', { ascending: false }).limit(12),
    ])
    if (c.error ?? p.error) { setErro((c.error ?? p.error)!.message); return }
    setCatalogo((c.data ?? []) as ItemCatalogo[])
    setPacotes((p.data ?? []) as Pacote[])
  }, [empresa])

  useEffect(() => { void carregar() }, [carregar])

  const rodar = useCallback(async (chave: string) => {
    if (!empresa) return
    setErro(null); setAtivo(chave); setTabela(null)
    const { data, error } = await rpcApp<Tabela>('relatorio', {
      p_tenant: empresa.tenant_id, p_chave: chave, p_de: de, p_ate: ate,
    })
    if (error) { setErro(error.message); return }
    setTabela(data)
  }, [empresa, de, ate])

  async function gerarPacote() {
    if (!empresa) return
    setErro(null)
    const { error } = await rpcApp('gerar_pacote_contador', {
      p_tenant: empresa.tenant_id, p_competencia: de,
    })
    if (error) { setErro(error.message); return }
    await carregar()
  }

  return (
    <div className="pilha" style={{ maxWidth: 1000 }}>
      <div className="linha" style={{ flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 22 }} className="crescer">Relatórios</h1>
        <label className="campo" style={{ margin: 0 }}>
          <span>De</span><input type="date" value={de} onChange={(e) => setDe(e.target.value)} />
        </label>
        <label className="campo" style={{ margin: 0 }}>
          <span>Até</span><input type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
        </label>
      </div>
      {erro && <div className="aviso aviso-erro">{erro}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '260px minmax(0,1fr)', gap: 14 }}>
        <div className="pilha" style={{ gap: 6 }}>
          {catalogo.map((c) => (
            <button key={c.chave}
              className={ativo === c.chave ? 'bt-primario' : 'bt-fantasma'}
              style={{ textAlign: 'left', opacity: c.implementado ? 1 : 0.5 }}
              disabled={!c.implementado}
              title={c.implementado ? c.descricao : `${c.descricao} — ainda não implementado`}
              onClick={() => void rodar(c.chave)}>
              {c.nome}{!c.implementado && ' (em breve)'}
            </button>
          ))}
        </div>

        <div className="pilha">
          {tabela ? (
            <>
              <div className="linha">
                <span className="crescer" style={{ color: 'var(--text-3)', fontSize: 13 }}>
                  {tabela.linhas.length} linha(s)
                </span>
                {pode('relatorios.exportar') && (
                  <button className="bt-fantasma"
                    onClick={() => baixar(`${ativo}-${de}-a-${ate}.csv`, paraCsv(tabela), 'text/csv;charset=utf-8')}>
                    Exportar CSV
                  </button>
                )}
              </div>
              <div className="cartao" style={{ overflowX: 'auto', maxHeight: 480, overflowY: 'auto' }}>
                <table>
                  <thead><tr>{tabela.colunas.map((c) => <th key={c}>{c}</th>)}</tr></thead>
                  <tbody>
                    {tabela.linhas.map((l, i) => (
                      <tr key={i}>{l.map((v, j) => (
                        <td key={j} className={typeof v === 'number' ? 'num' : undefined}>
                          {v == null ? '—' : typeof v === 'boolean' ? (v ? 'sim' : 'não') : String(v)}
                        </td>
                      ))}</tr>
                    ))}
                    {tabela.linhas.length === 0 && (
                      <tr><td colSpan={tabela.colunas.length} style={{ color: 'var(--text-3)' }}>
                        Sem dados no período.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="cartao" style={{ padding: 24, color: 'var(--text-3)' }}>
              Escolha um relatório à esquerda.
            </div>
          )}
        </div>
      </div>

      <div className="cartao pilha" style={{ padding: 16 }}>
        <div className="linha">
          <h2 style={{ fontSize: 15 }} className="crescer">Central do Contador</h2>
          {pode('relatorios.exportar') && (
            <button className="bt-primario" onClick={() => void gerarPacote()}>
              Gerar pacote do mês selecionado
            </button>
          )}
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
          O envio automático por e-mail/API ao contador depende de credencial de
          e-mail (pendência declarada). O download do pacote é real. Para dar ao
          contador acesso direto, convide-o em Usuários com o papel “Contador”
          (somente leitura contábil).
        </p>
        {pacotes.map((p) => (
          <div key={p.id} className="linha" style={{ fontSize: 13.5 }}>
            <strong className="crescer">{p.titulo}</strong>
            <span className="selo selo-neutro">{p.status}</span>
            <button className="bt-fantasma"
              onClick={() => baixar(`${p.titulo}.json`, JSON.stringify(p.conteudo, null, 2), 'application/json')}>
              Baixar JSON
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
