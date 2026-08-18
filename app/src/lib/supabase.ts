/**
 * Cliente Supabase.
 *
 * As credenciais vêm de variáveis de ambiente (ver .env.example na raiz).
 * Sem elas o app NÃO finge estar conectado: `supabaseConfigurado` fica falso
 * e a interface mostra a tela "Não configurado" — honestidade antes de tudo.
 *
 * As funções de negócio vivem no schema `app` do Postgres. Para o PostgREST
 * enxergá-las, adicione "app" em Settings → API → Exposed schemas no Supabase.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabaseConfigurado = Boolean(url && anon)

export const supabase: SupabaseClient = createClient(
  url ?? 'http://supabase-nao-configurado.invalid',
  anon ?? 'anon-key-ausente',
)

/** Atalho para chamar funções do schema app (provisionar_tenant, convidar_usuario...). */
export function rpcApp<T = unknown>(fn: string, args?: Record<string, unknown>) {
  return supabase.schema('app').rpc(fn, args) as unknown as PromiseLike<{
    data: T | null
    error: { message: string; code?: string } | null
  }>
}

/** Converte erro do Supabase/PostgREST em mensagem apresentável. */
export function mensagemDeErro(error: { message?: string; code?: string } | null): string {
  if (!error) return 'Erro desconhecido.'
  const m = error.message ?? ''
  if (m.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.'
  if (m.includes('Email not confirmed')) return 'Confirme seu e-mail antes de entrar.'
  if (m.includes('User already registered')) return 'Este e-mail já tem cadastro. Use "Entrar".'
  if (m.includes('Password should be')) return 'A senha precisa ter ao menos 8 caracteres.'
  if (m.includes('rate limit') || error.code === '429') return 'Muitas tentativas. Aguarde um instante.'
  return m || 'Erro desconhecido.'
}
