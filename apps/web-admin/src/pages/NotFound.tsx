import { Link } from 'react-router-dom';
import { IconLeaf } from '../components/icons';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-600 text-white shadow-card">
        <IconLeaf width={32} height={32} />
      </span>
      <p className="mt-6 text-5xl font-bold tracking-tight text-gray-900 dark:text-white">404</p>
      <h1 className="mt-2 text-lg font-semibold text-gray-700 dark:text-gray-200">
        Página não encontrada
      </h1>
      <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
        O endereço que você tentou acessar não existe ou foi movido.
      </p>
      <Link to="/" className="btn-primary mt-6">
        Voltar ao dashboard
      </Link>
    </div>
  );
}
