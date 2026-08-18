# Banco de dados

Postgres com Row Level Security. O isolamento entre empresas é garantido **no
banco**, não na interface — uma falha no frontend não vaza dado entre clientes.

Atalho: `./supabase/testar.sh` recria um banco limpo, aplica todas as
migrations em ordem e roda todos os testes.

## Aplicar as migrations

**Local (desenvolvimento):**

```bash
# subir um Postgres local na porta 55432
initdb -D ./pgdata -U grafista --auth=trust
pg_ctl -D ./pgdata -o "-p 55432" -l ./pgdata/server.log start

# aplicar em ordem
for f in supabase/migrations/*.sql; do
  psql -p 55432 -U grafista -d postgres -v ON_ERROR_STOP=1 -f "$f"
done
```

**Supabase:** `supabase db push` (as migrations são compatíveis; o schema `auth`
já existe lá e o shim local não sobrescreve nada).

Depois do push, três configurações no painel do Supabase:

1. **Settings → API → Exposed schemas:** adicione `app`. É por onde o
   frontend chama `provisionar_tenant`, `convidar_usuario`, `minhas_empresas`…
2. **Authentication → Rate limits:** os limites de login/cadastro são do
   GoTrue; os padrões já servem, aperte se necessário.
3. **Authentication → MFA (TOTP):** habilite para atender o item 34 do
   briefing. O fluxo no app usa a API nativa (`supabase.auth.mfa`).

Pendência declarada da Fase 2: o **envio do e-mail de convite** exige uma Edge
Function com provedor de e-mail (Resend/SMTP). Até existir, a tela de usuários
mostra o link do convite para copiar e enviar manualmente — sem fingir envio.

## Rodar os testes

```bash
PGHOST=localhost PGPORT=55432 PGUSER=grafista ./supabase/testar.sh
```

O script recria um banco limpo, aplica as 16 migrations em ordem e roda as
8 suítes — **76 asserções** cobrindo isolamento, permissões, convites,
cadastros, conversão de unidades, baixa em cascata, PDV, caixa, financeiro,
DRE, regras fiscais versionadas, webhooks, planos e LGPD. As suítes são
encadeadas: rodam em ordem no mesmo banco (0002 reusa dados do 0001, etc.).

> Os testes rodam como o papel `authenticated`, sem privilégios de superusuário.
> Rodar como superusuário invalidaria o resultado — superusuário ignora RLS.

## Como o isolamento funciona

```
auth.uid()  →  memberships (status = 'ativo')  →  tenant_id  →  policy
```

Duas funções sustentam tudo:

| Função | Uso |
|---|---|
| `app.tenants_do_usuario()` | tenants com vínculo ativo do usuário logado |
| `app.pode(tenant, permissao)` | verdadeiro se o usuário tem a permissão naquele tenant |

Ambas são `SECURITY DEFINER` e leem `auth.uid()` do token — **não aceitam
tenant_id vindo do cliente**. Um `tenant_id` enviado na requisição só restringe
mais o resultado; nunca amplia o acesso.

## Papéis

13 perfis-modelo em `role_templates`, copiados para cada empresa no
provisionamento. Cada empresa pode ajustar as permissões dos seus papéis sem
afetar as demais. Permissões novas entram por migration, nunca como dado.

## Auditoria

`app.fn_auditoria()` é um gatilho genérico que grava usuário, ação, valor
anterior, valor novo e a lista de campos alterados. Aplicar em toda tabela
sensível ou financeira:

```sql
create trigger trg_audit_<tabela> after insert or update or delete on public.<tabela>
  for each row execute function app.fn_auditoria();
```

A trilha é somente-inserção: não há policy de `update` nem de `delete`, portanto
nem o proprietário consegue reescrever o histórico pela aplicação.
