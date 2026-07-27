import { useEffect, useState, type ComponentType, type SVGProps } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { initialsOf } from '../lib/format';
import { userRoleLabel } from '../lib/labels';
import {
  IconDashboard,
  IconLeaf,
  IconLogout,
  IconMenu,
  IconMoon,
  IconSettings,
  IconSun,
  IconUsers,
  IconWallet,
} from './icons';

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  end?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: IconDashboard, end: true },
  { to: '/servicos', label: 'Serviços', icon: IconLeaf },
  { to: '/jardineiros', label: 'Jardineiros', icon: IconUsers },
  { to: '/financeiro', label: 'Financeiro', icon: IconWallet },
  { to: '/configuracoes', label: 'Configurações', icon: IconSettings },
];

function useTheme() {
  const [dark, setDark] = useState<boolean>(() => {
    const stored = localStorage.getItem('jj_admin_theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('jj_admin_theme', dark ? 'dark' : 'light');
  }, [dark]);

  return { dark, toggle: () => setDark((d) => !d) };
}

function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white shadow-sm">
        <IconLeaf width={20} height={20} />
      </span>
      <div className="leading-tight">
        <p className="text-sm font-bold text-gray-900 dark:text-white">
          Jardim<span className="text-brand-600">Já</span>
        </p>
        <p className="text-[11px] font-medium text-gray-400">Painel Admin</p>
      </div>
    </div>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
        >
          <Icon width={20} height={20} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function Layout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { dark, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = () => {
    signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-full">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-gray-200 bg-white pb-4 dark:border-gray-800 dark:bg-gray-900 lg:flex">
        <div className="px-5 py-5">
          <BrandMark />
        </div>
        <SidebarNav />
        <div className="mt-auto px-3">
          <button type="button" onClick={handleSignOut} className="nav-link w-full">
            <IconLogout width={20} height={20} />
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-gray-200 bg-white pb-4 dark:border-gray-800 dark:bg-gray-900">
            <div className="px-5 py-5">
              <BrandMark />
            </div>
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
            <div className="mt-auto px-3">
              <button type="button" onClick={handleSignOut} className="nav-link w-full">
                <IconLogout width={20} height={20} />
                Sair
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-gray-200 bg-white/80 px-4 backdrop-blur dark:border-gray-800 dark:bg-gray-900/80 sm:px-6">
          <button
            type="button"
            className="btn-ghost -ml-2 p-2 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
          >
            <IconMenu width={22} height={22} />
          </button>

          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              Bem-vindo de volta 👋
            </p>
            <p className="text-xs text-gray-400">Visão geral da operação JardimJá</p>
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={toggle}
              className="btn-ghost p-2"
              aria-label={dark ? 'Ativar modo claro' : 'Ativar modo escuro'}
            >
              {dark ? <IconSun width={20} height={20} /> : <IconMoon width={20} height={20} />}
            </button>

            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white py-1 pl-1 pr-3 dark:border-gray-800 dark:bg-gray-900">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-xs font-bold text-white">
                {initialsOf(user?.name ?? 'AD')}
              </span>
              <div className="hidden text-left leading-tight sm:block">
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">
                  {user?.name ?? 'Administrador'}
                </p>
                <p className="text-[11px] text-gray-400">
                  {user ? userRoleLabel[user.role] : 'Administrador'}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
