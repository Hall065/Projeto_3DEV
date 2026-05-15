import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { 
  LayoutDashboard, 
  FileText, 
  Plus, 
  BarChart3, 
  Package, 
  Settings,
  Bell,
  User,
  Menu,
  X
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/meus-chamados', icon: FileText, label: 'Meus Chamados' },
    { path: '/abrir-chamado', icon: Plus, label: 'Abrir Chamado' },
    { path: '/relatorios', icon: BarChart3, label: 'Relatórios' },
    { path: '/estoque', icon: Package, label: 'Estoque' },
    { path: '/configuracoes', icon: Settings, label: 'Configurações' },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between px-4 md:px-6 h-16">
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="bg-[#005EB8] px-3 md:px-4 py-2 rounded">
              <span className="text-white font-bold text-base md:text-lg">SENAI</span>
            </div>
          </div>

          {/* Title - Hidden on mobile */}
          <h1 className="hidden lg:block text-lg xl:text-xl text-gray-800 font-semibold absolute left-1/2 transform -translate-x-1/2">
            Sistema de Manutenção
          </h1>

          {/* User section */}
          <div className="flex items-center gap-2 md:gap-4">
            <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#F15A22] rounded-full"></span>
            </button>
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 bg-[#005EB8] rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <span className="hidden sm:block text-sm text-gray-700">João Silva</span>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex pt-16 flex-1">
        {/* Sidebar */}
        <aside className={`
          w-64 bg-white border-r border-gray-200 fixed left-0 top-16 bottom-0 overflow-y-auto z-40 transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}>
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    active
                      ? 'bg-[#005EB8] text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:ml-64 p-4 md:p-6">
          {children}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="px-4 md:px-6 md:ml-64 text-center text-xs md:text-sm text-gray-600">
          © 2026 SENAI SP - Serviço Nacional de Aprendizagem Industrial. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}