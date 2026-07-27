import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Protected from './components/Protected';
import { AuthProvider } from './lib/auth';
import Configuracoes from './pages/Configuracoes';
import Dashboard from './pages/Dashboard';
import Financeiro from './pages/Financeiro';
import Gardeners from './pages/Gardeners';
import JobDetail from './pages/JobDetail';
import Jobs from './pages/Jobs';
import Login from './pages/Login';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              element={
                <Protected>
                  <Layout />
                </Protected>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/servicos" element={<Jobs />} />
              <Route path="/servicos/:id" element={<JobDetail />} />
              <Route path="/jardineiros" element={<Gardeners />} />
              <Route path="/financeiro" element={<Financeiro />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
            </Route>

            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
