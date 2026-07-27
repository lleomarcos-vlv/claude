import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { IconLeaf } from '../components/icons';
import { useAuth } from '../lib/auth';
import { useLogin } from '../lib/queries';

interface LocationState {
  from?: { pathname?: string };
}

export default function Login() {
  const { isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const login = useLogin();

  const [email, setEmail] = useState('admin@jardimja.com.br');
  const [password, setPassword] = useState('');

  const from = (location.state as LocationState | null)?.from?.pathname ?? '/';

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    login.mutate(
      { email, password },
      {
        onSuccess: (auth) => {
          signIn(auth);
          navigate(from, { replace: true });
        },
      },
    );
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-brand-700 lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, white 0, transparent 40%), radial-gradient(circle at 80% 70%, white 0, transparent 35%)',
          }}
        />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 backdrop-blur">
              <IconLeaf width={24} height={24} />
            </span>
            <span className="text-xl font-bold">
              Jardim<span className="text-brand-200">Já</span>
            </span>
          </div>
          <div className="max-w-md">
            <h1 className="text-3xl font-bold leading-tight">
              O Uber da jardinagem, agora no seu painel.
            </h1>
            <p className="mt-4 text-brand-100">
              Orçamentos por IA, marketplace de jardineiros e acompanhamento em tempo real —
              tudo em um só lugar para a operação.
            </p>
          </div>
          <p className="text-sm text-brand-200/80">© 2026 JardimJá · Painel administrativo</p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-white">
              <IconLeaf width={22} height={22} />
            </span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              Jardim<span className="text-brand-600">Já</span>
            </span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Entrar no painel</h2>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            Acesse com suas credenciais de administrador.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="email" className="label">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                required
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@jardimja.com.br"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Senha
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {login.isError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
                Não foi possível entrar. Verifique suas credenciais.
              </p>
            )}

            <button type="submit" className="btn-primary w-full" disabled={login.isPending}>
              {login.isPending ? 'Entrando…' : 'Entrar'}
            </button>
          </form>

          <p className="mt-6 rounded-xl bg-gray-50 px-4 py-3 text-xs leading-relaxed text-gray-500 dark:bg-gray-900 dark:text-gray-400">
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              Modo de desenvolvimento:
            </span>{' '}
            com a API offline, qualquer credencial autentica você com dados simulados (mock).
          </p>
        </div>
      </div>
    </div>
  );
}
