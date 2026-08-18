import { Navigate, Route, Routes } from 'react-router-dom'
import { supabaseConfigurado } from './lib/supabase'
import { useAuth } from './lib/auth'
import NaoConfigurado from './paginas/NaoConfigurado'
import Login from './paginas/Login'
import RedefinirSenha from './paginas/RedefinirSenha'
import AceitarConvite from './paginas/AceitarConvite'
import SelecionarEmpresa from './paginas/SelecionarEmpresa'
import CriarEmpresa from './paginas/CriarEmpresa'
import Painel from './paginas/Painel'

export default function App() {
  const { carregando, session, empresa } = useAuth()

  if (!supabaseConfigurado) return <NaoConfigurado />
  if (carregando) {
    return <div className="tela-acesso"><p>Carregando…</p></div>
  }

  if (!session) {
    return (
      <Routes>
        <Route path="/entrar" element={<Login />} />
        <Route path="/convite/:token" element={<AceitarConvite />} />
        <Route path="*" element={<Navigate to="/entrar" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/redefinir-senha" element={<RedefinirSenha />} />
      <Route path="/convite/:token" element={<AceitarConvite />} />
      <Route path="/empresas" element={<SelecionarEmpresa />} />
      <Route path="/empresas/nova" element={<CriarEmpresa />} />
      <Route
        path="/*"
        element={empresa ? <Painel /> : <Navigate to="/empresas" replace />}
      />
    </Routes>
  )
}
