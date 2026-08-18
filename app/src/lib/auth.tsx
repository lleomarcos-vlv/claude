/**
 * Contexto de sessão e de empresa ativa.
 *
 * - Sessão: delegada ao Supabase Auth (login, cadastro, recuperação, refresh).
 * - Empresa ativa: escolhida pelo usuário entre app.minhas_empresas(); fica no
 *   localStorage. As permissões vêm do papel do vínculo — e são apenas para a
 *   interface: a autoridade final é sempre a RLS no banco.
 */
import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, supabaseConfigurado, rpcApp } from './supabase'

export interface Empresa {
  tenant_id: string
  slug: string
  razao_social: string
  nome_fantasia: string | null
  vertical_chave: string | null
  papel_chave: string
  papel_nome: string
  branch_id: string | null
}

interface EstadoAuth {
  carregando: boolean
  session: Session | null
  empresas: Empresa[]
  empresa: Empresa | null
  permissoes: Set<string>
  pode: (permissao: string) => boolean
  escolherEmpresa: (tenantId: string) => void
  recarregarEmpresas: () => Promise<void>
  sair: () => Promise<void>
}

const Ctx = createContext<EstadoAuth | null>(null)
const CHAVE_EMPRESA = 'grafista.empresa'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [carregando, setCarregando] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [empresaId, setEmpresaId] = useState<string | null>(
    () => localStorage.getItem(CHAVE_EMPRESA),
  )
  const [permissoes, setPermissoes] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!supabaseConfigurado) { setCarregando(false); return }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setCarregando(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, s) => {
      setSession(s)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const recarregarEmpresas = useCallback(async () => {
    if (!session) { setEmpresas([]); return }
    const { data, error } = await rpcApp<Empresa[]>('minhas_empresas')
    if (!error && data) setEmpresas(data)
  }, [session])

  useEffect(() => { void recarregarEmpresas() }, [recarregarEmpresas])

  const empresa = useMemo(
    () => empresas.find((e) => e.tenant_id === empresaId) ?? null,
    [empresas, empresaId],
  )

  // Permissões do papel na empresa ativa (para esconder o que o usuário não pode).
  useEffect(() => {
    let ativo = true
    async function carregar() {
      if (!empresa || !session) { setPermissoes(new Set()); return }
      const { data } = await supabase
        .from('memberships')
        .select('role_id, role_permissions:roles(role_permissions(permission_chave))')
        .eq('tenant_id', empresa.tenant_id)
        .eq('user_id', session.user.id)
        .maybeSingle()
      if (!ativo) return
      const chaves =
        (data as { role_permissions?: { role_permissions?: { permission_chave: string }[] } } | null)
          ?.role_permissions?.role_permissions?.map((p) => p.permission_chave) ?? []
      setPermissoes(new Set(chaves))
    }
    void carregar()
    return () => { ativo = false }
  }, [empresa, session])

  const escolherEmpresa = useCallback((tenantId: string) => {
    localStorage.setItem(CHAVE_EMPRESA, tenantId)
    setEmpresaId(tenantId)
  }, [])

  const sair = useCallback(async () => {
    await supabase.auth.signOut()
    localStorage.removeItem(CHAVE_EMPRESA)
    setEmpresaId(null)
  }, [])

  const valor: EstadoAuth = {
    carregando,
    session,
    empresas,
    empresa,
    permissoes,
    pode: (p) => permissoes.has(p),
    escolherEmpresa,
    recarregarEmpresas,
    sair,
  }

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

export function useAuth(): EstadoAuth {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}
