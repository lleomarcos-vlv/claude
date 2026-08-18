/**
 * Integrações (Fase 9): central com o estado REAL de cada conexão — sem
 * credencial e sem adapter publicado, tudo aparece como "não conectado".
 * Inclui chaves de API e webhooks (fila com retry no banco).
 */
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { supabase, rpcApp } from '../lib/supabase'
import { useAuth } from '../lib/auth'

interface Provedor { provedor: string; nome: string; categoria: string }
interface Integracao { provedor: string; status: string; ultimo_teste: string | null; ultimo_erro: string | null }
interface ApiKey { id: string; nome: string; prefixo: string; escopos: string[]; criada_em: string; revogada_em: string | null }
interface Webhook { id: string; url: string; eventos: string[]; ativa: boolean }
interface EventoCatalogo { chave: string; descricao: string }
interface Entrega { id: number; evento: string; status: string; tentativas: number; criado_em: string; ultimo_erro: string | null }

export default function Integracoes() {
  const { empresa, pode } = useAuth()
  const [provedores, setProvedores] = useState<Provedor[]>([])
  const [integracoes, setIntegracoes] = useState<Record<string, Integracao>>({})
  const [chaves, setChaves] = useState<ApiKey[]>([])
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [eventos, setEventos] = useState<EventoCatalogo[]>([])
  const [entregas, setEntregas] = useState<Entrega[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const [novoHook, setNovoHook] = useState({ url: '', eventos: [] as string[] })

  const carregar = useCallback(async () => {
    if (!empresa) return
    const t = empresa.tenant_id
    const [cat, ints, keys, hooks, evs, dels] = await Promise.all([
      supabase.from('integration_catalog').select('provedor, nome, categoria').order('ordem'),
      supabase.from('integrations').select('provedor, status, ultimo_teste, ultimo_erro').eq('tenant_id', t),
      supabase.from('api_keys').select('id, nome, prefixo, escopos, criada_em, revogada_em')
        .eq('tenant_id', t).order('criada_em', { ascending: false }),
      supabase.from('webhooks').select('id, url, eventos, ativa').eq('tenant_id', t),
      supabase.from('webhook_events').select('chave, descricao'),
      supabase.from('webhook_deliveries')
        .select('id, evento, status, tentativas, criado_em, ultimo_erro')
        .eq('tenant_id', t).order('criado_em', { ascending: false }).limit(20),
    ])
    const falha = cat.error ?? ints.error ?? keys.error ?? hooks.error ?? evs.error ?? dels.error
    if (falha) { setErro(falha.message); return }
    setProvedores((cat.data ?? []) as Provedor[])
    setIntegracoes(Object.fromEntries(((ints.data ?? []) as Integracao[]).map((i) => [i.provedor, i])))
    setChaves((keys.data ?? []) as ApiKey[])
    setWebhooks((hooks.data ?? []) as Webhook[])
    setEventos((evs.data ?? []) as EventoCatalogo[])
    setEntregas((dels.data ?? []) as Entrega[])
  }, [empresa])

  useEffect(() => { void carregar() }, [carregar])

  async function testar(provedor: string) {
    if (!empresa) return
    setErro(null); setAviso(null)
    const { data, error } = await rpcApp<string>('testar_integracao', {
      p_tenant: empresa.tenant_id, p_provedor: provedor,
    })
    if (error) { setErro(error.message); return }
    setAviso(data)
    await carregar()
  }

  async function criarChave() {
    if (!empresa) return
    const nome = window.prompt('Nome da chave (ex.: "integração site"):')
    if (!nome) return
    setErro(null)
    const { data, error } = await rpcApp<{ key_id: string; chave: string }[]>('criar_api_key', {
      p_tenant: empresa.tenant_id, p_nome: nome, p_escopos: ['leitura'],
    })
    if (error) { setErro(error.message); return }
    setAviso(`Chave criada — copie agora, ela não aparece de novo: ${data?.[0]?.chave}`)
    await carregar()
  }

  async function revogarChave(id: string) {
    setErro(null)
    const { error } = await rpcApp('revogar_api_key', { p_key: id })
    if (error) { setErro(error.message); return }
    await carregar()
  }

  async function criarWebhook(e: FormEvent) {
    e.preventDefault()
    if (!empresa) return
    setErro(null)
    const segredo = crypto.randomUUID().replace(/-/g, '')
    const { error } = await supabase.from('webhooks').insert({
      tenant_id: empresa.tenant_id, url: novoHook.url, eventos: novoHook.eventos, segredo,
    })
    if (error) { setErro(error.message); return }
    setAviso(`Webhook criado. Segredo para validar a assinatura (copie agora): ${segredo}`)
    setNovoHook({ url: '', eventos: [] })
    await carregar()
  }

  const gerencia = pode('integracoes.gerenciar')

  return (
    <div className="pilha" style={{ maxWidth: 1000 }}>
      <h1 style={{ fontSize: 22 }}>Integrações</h1>
      <div className="aviso aviso-atencao">
        Nenhuma integração externa está conectada: as credenciais dos provedores
        (bloqueios B5–B8) e os adapters (Edge Functions) ainda não existem.
        O estado abaixo é o real — o sistema não marca “conectado” sem conexão.
      </div>
      {erro && <div className="aviso aviso-erro">{erro}</div>}
      {aviso && <div className="aviso aviso-ok" style={{ wordBreak: 'break-all' }}>{aviso}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {provedores.map((p) => {
          const i = integracoes[p.provedor]
          return (
            <div key={p.provedor} className="cartao pilha" style={{ padding: 14, gap: 8 }}>
              <div className="linha">
                <strong className="crescer">{p.nome}</strong>
                <span className={`selo ${i?.status === 'conectado' ? 'selo-ok' : 'selo-neutro'}`}>
                  {i?.status?.replace('_', ' ') ?? 'não conectado'}
                </span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{p.categoria}</span>
              {i?.ultimo_erro && (
                <span style={{ fontSize: 12.5, color: 'var(--warn)' }}>{i.ultimo_erro}</span>
              )}
              {gerencia && (
                <button className="bt-fantasma" onClick={() => void testar(p.provedor)}>
                  Testar conexão
                </button>
              )}
            </div>
          )
        })}
      </div>

      <div className="cartao pilha" style={{ padding: 16 }}>
        <div className="linha">
          <h2 style={{ fontSize: 15 }} className="crescer">Chaves de API (/api/v1)</h2>
          {gerencia && <button className="bt-primario" onClick={() => void criarChave()}>Nova chave</button>}
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
          A validação das chaves já vive no banco; o endpoint REST público é uma
          Edge Function pendente de publicação (declarado em docs/PENDENCIAS.md).
        </p>
        {chaves.map((k) => (
          <div key={k.id} className="linha" style={{ fontSize: 13.5 }}>
            <code>{k.prefixo}…</code>
            <span className="crescer">{k.nome} · {k.escopos.join(', ')}</span>
            {k.revogada_em
              ? <span className="selo selo-neutro">revogada</span>
              : gerencia && <button className="bt-perigo" onClick={() => void revogarChave(k.id)}>Revogar</button>}
          </div>
        ))}
      </div>

      <div className="cartao pilha" style={{ padding: 16 }}>
        <h2 style={{ fontSize: 15 }}>Webhooks</h2>
        {gerencia && (
          <form className="pilha" onSubmit={criarWebhook}>
            <input placeholder="https://seu-sistema.com/webhook" type="url" required
              value={novoHook.url} onChange={(e) => setNovoHook({ ...novoHook, url: e.target.value })} />
            <div className="linha" style={{ flexWrap: 'wrap', gap: 6 }}>
              {eventos.map((ev) => (
                <label key={ev.chave} className={`selo ${novoHook.eventos.includes(ev.chave) ? 'selo-primario' : 'selo-neutro'}`}
                  style={{ cursor: 'pointer' }} title={ev.descricao}>
                  <input type="checkbox" hidden checked={novoHook.eventos.includes(ev.chave)}
                    onChange={(e) => setNovoHook({
                      ...novoHook,
                      eventos: e.target.checked
                        ? [...novoHook.eventos, ev.chave]
                        : novoHook.eventos.filter((x) => x !== ev.chave),
                    })} />
                  {ev.chave}
                </label>
              ))}
            </div>
            <button className="bt-primario" style={{ alignSelf: 'start' }}
              disabled={novoHook.eventos.length === 0}>Criar webhook</button>
          </form>
        )}
        {webhooks.map((w) => (
          <div key={w.id} className="linha" style={{ fontSize: 13.5 }}>
            <code className="crescer" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.url}</code>
            <span style={{ color: 'var(--text-3)' }}>{w.eventos.length} evento(s)</span>
            <span className={`selo ${w.ativa ? 'selo-ok' : 'selo-neutro'}`}>{w.ativa ? 'ativa' : 'inativa'}</span>
          </div>
        ))}
        {entregas.length > 0 && (
          <table>
            <thead><tr><th>Entrega</th><th>Status</th><th>Tentativas</th><th>Erro</th></tr></thead>
            <tbody>
              {entregas.map((d) => (
                <tr key={d.id}>
                  <td>{d.evento}</td>
                  <td><span className={`selo ${d.status === 'entregue' ? 'selo-ok' : d.status === 'abandonada' ? 'selo-crit' : 'selo-atencao'}`}>
                    {d.status}</span></td>
                  <td className="num">{d.tentativas}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{d.ultimo_erro ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
