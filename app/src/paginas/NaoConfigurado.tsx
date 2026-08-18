/**
 * Tela exibida quando as variáveis do Supabase não estão preenchidas.
 * O app nunca finge estar conectado (briefing, seção 50).
 */
export default function NaoConfigurado() {
  return (
    <div className="tela-acesso">
      <div className="cartao pilha">
        <div className="marca">
          <div className="marca-logo">G</div>
          <h1 style={{ fontSize: 20 }}>Grafista ERP</h1>
        </div>
        <span className="selo selo-atencao">Banco de dados não configurado</span>
        <p style={{ color: 'var(--text-2)' }}>
          Este ambiente ainda não está conectado a um projeto Supabase, então
          nenhuma tela de operação é exibida — nada aqui simula estar funcionando.
        </p>
        <p style={{ color: 'var(--text-2)' }}>Para conectar:</p>
        <ol style={{ color: 'var(--text-2)', margin: 0, paddingLeft: 20 }}>
          <li>Crie um projeto em supabase.com e aplique as migrations de <code>supabase/migrations/</code>.</li>
          <li>Em Settings → API, adicione <code>app</code> aos <em>Exposed schemas</em>.</li>
          <li>Copie <code>.env.example</code> para <code>app/.env.local</code> e preencha
            {' '}<code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code>.</li>
          <li>Reinicie o servidor de desenvolvimento.</li>
        </ol>
      </div>
    </div>
  )
}
