/**
 * Shell do painel: navegação lateral + módulos.
 * Módulo sem tela pronta aparece como "em construção" — nunca como algo
 * que finge funcionar (briefing, seção 50).
 */
import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import Usuarios from './Usuarios'
import Catalogo from './Catalogo'
import Clientes from './Clientes'
import Fornecedores from './Fornecedores'
import EscolherNicho from './EscolherNicho'
import Estoque from './Estoque'
import Pdv from './Pdv'
import Compras from './Compras'
import Financeiro from './Financeiro'
import Fiscal from './Fiscal'

function EmConstrucao({ nome, fase }: { nome: string; fase: string }) {
  return (
    <div className="cartao pilha" style={{ padding: 24, maxWidth: 560 }}>
      <h2 style={{ fontSize: 18 }}>{nome}</h2>
      <span className="selo selo-atencao">Em construção — {fase}</span>
      <p style={{ color: 'var(--text-2)' }}>
        Este módulo ainda não foi conectado ao banco. Ele entra na {fase} do
        plano (docs/PENDENCIAS.md) e só aparecerá aqui quando gravar de verdade.
      </p>
    </div>
  )
}

export default function Painel() {
  const { empresa, sair, pode, session } = useAuth()
  const navegar = useNavigate()

  const itens = [
    { para: '/', rotulo: 'Início', fim: true, ver: true },
    { para: '/pdv', rotulo: 'PDV', ver: pode('vendas.criar') },
    { para: '/catalogo', rotulo: 'Catálogo', ver: pode('catalogo.ver') },
    { para: '/estoque', rotulo: 'Estoque', ver: pode('estoque.ver') },
    { para: '/compras', rotulo: 'Compras', ver: pode('compras.ver') },
    { para: '/fornecedores', rotulo: 'Fornecedores', ver: pode('compras.ver') },
    { para: '/clientes', rotulo: 'Clientes', ver: pode('clientes.ver') },
    { para: '/financeiro', rotulo: 'Financeiro', ver: pode('financeiro.ver') },
    { para: '/fiscal', rotulo: 'Fiscal', ver: pode('fiscal.ver') },
    { para: '/relatorios', rotulo: 'Relatórios', ver: pode('relatorios.ver') },
    { para: '/usuarios', rotulo: 'Usuários', ver: pode('usuarios.ver') },
  ]

  return (
    <div className="shell">
      <aside className="shell-lateral">
        <div className="linha" style={{ padding: '0 8px 12px' }}>
          <div className="marca-logo">G</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {empresa?.nome_fantasia ?? empresa?.razao_social}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{empresa?.papel_nome}</div>
          </div>
        </div>

        {itens.filter((i) => i.ver).map((i) => (
          <NavLink
            key={i.para}
            to={i.para}
            end={i.fim}
            className={({ isActive }) => `nav-item${isActive ? ' ativo' : ''}`}
          >
            {i.rotulo}
          </NavLink>
        ))}

        <div className="crescer" />
        <button className="bt-fantasma" onClick={() => navegar('/empresas')}>Trocar empresa</button>
        <button className="bt-fantasma" onClick={() => void sair()}>Sair</button>
      </aside>

      <main className="shell-conteudo">
        <Routes>
          <Route path="/" element={
            <div className="pilha">
              <h1 style={{ fontSize: 22 }}>Bem-vindo, {session?.user.user_metadata?.nome ?? session?.user.email}</h1>
              <p style={{ color: 'var(--text-2)' }}>
                A fundação (empresas, papéis, permissões, convites e auditoria) está
                ativa. Os módulos de operação entram fase a fase — o menu mostra o
                estado real de cada um.
              </p>
              {!empresa?.vertical_chave && pode('empresa.editar') && (
                <div className="aviso aviso-atencao">
                  A empresa ainda não tem nicho definido.{' '}
                  <a href="/nicho" onClick={(e) => { e.preventDefault(); navegar('/nicho') }}>
                    Escolher o ramo da empresa
                  </a>{' '}
                  libera a terminologia e o catálogo inicial.
                </div>
              )}
            </div>
          } />
          <Route path="/pdv" element={<Pdv />} />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/nicho" element={<EscolherNicho />} />
          <Route path="/estoque" element={<Estoque />} />
          <Route path="/compras" element={<Compras />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/fornecedores" element={<Fornecedores />} />
          <Route path="/financeiro" element={<Financeiro />} />
          <Route path="/fiscal" element={<Fiscal />} />
          <Route path="/relatorios" element={<EmConstrucao nome="Relatórios" fase="Fase 8" />} />
          <Route path="/usuarios/*" element={<Usuarios />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
