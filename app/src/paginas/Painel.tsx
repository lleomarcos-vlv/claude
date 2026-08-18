/** Shell do painel: navegação lateral + módulos, filtrados pela permissão do papel. */
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
import Relatorios from './Relatorios'
import Integracoes from './Integracoes'
import Auditoria from './Auditoria'
import Inicio from './Inicio'

export default function Painel() {
  const { empresa, sair, pode } = useAuth()
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
    { para: '/integracoes', rotulo: 'Integrações', ver: pode('integracoes.ver') },
    { para: '/auditoria', rotulo: 'Auditoria', ver: pode('auditoria.ver') },
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
          <Route path="/" element={<Inicio />} />
          <Route path="/pdv" element={<Pdv />} />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/nicho" element={<EscolherNicho />} />
          <Route path="/estoque" element={<Estoque />} />
          <Route path="/compras" element={<Compras />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/fornecedores" element={<Fornecedores />} />
          <Route path="/financeiro" element={<Financeiro />} />
          <Route path="/fiscal" element={<Fiscal />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/integracoes" element={<Integracoes />} />
          <Route path="/auditoria" element={<Auditoria />} />
          <Route path="/usuarios/*" element={<Usuarios />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
