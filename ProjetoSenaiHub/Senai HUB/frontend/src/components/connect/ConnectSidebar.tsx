import {
  BookOpen,
  CalendarCheck,
  ChevronRight,
  ClipboardList,
  FileText,
  GraduationCap,
  Headphones,
  LayoutDashboard,
  MapPin,
  School,
  Shield,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { logoConnectBlack } from '../../assets/brand'

interface ConnectSidebarProps {
  collapsed: boolean
  mobileOpen?: boolean
  onMobileClose?: () => void
}

const mainNav = [
  { to: '/connect', label: 'Visao Geral', icon: LayoutDashboard, end: true },
  { to: '/connect/alunos', label: 'Alunos', icon: GraduationCap },
  { to: '/connect/professores', label: 'Professores', icon: Users },
  { to: '/connect/turmas', label: 'Turmas', icon: School },
  { to: '/connect/cursos', label: 'Cursos', icon: BookOpen },
  { to: '/connect/frequencia', label: 'Frequencia', icon: CalendarCheck },
  { to: '/connect/gerenciar-frequencia', label: 'Gerenciar Frequencia', icon: ClipboardList },
  { to: '/connect/relatorio', label: 'Relatorio', icon: FileText },
  { to: '/connect/localizacao', label: 'Localizacao', icon: MapPin },
]

export function ConnectSidebar({ collapsed, mobileOpen = false, onMobileClose }: ConnectSidebarProps) {
  const isCollapsed = collapsed && !mobileOpen
  const location = useLocation()
  const [contractsOpen, setContractsOpen] = useState(location.pathname.startsWith('/connect/contratos'))
  const [supportOpen, setSupportOpen] = useState(false)
  const supportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (location.pathname.startsWith('/connect/contratos')) {
      setContractsOpen(true)
    }
  }, [location.pathname])

  useEffect(() => {
    if (!supportOpen) return
    const onClickOutside = (event: MouseEvent) => {
      if (supportRef.current && !supportRef.current.contains(event.target as Node)) {
        setSupportOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [supportOpen])

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
      isActive ? 'bg-hub-red text-white' : 'text-white/85 hover:bg-white/10'
    } ${isCollapsed ? 'justify-center px-3' : ''}`

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex h-[100dvh] max-h-screen shrink-0 flex-col bg-hub-navy text-white transition-all duration-300 lg:sticky lg:top-0 lg:z-auto lg:h-screen ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } ${isCollapsed ? 'w-[88px] px-4 lg:w-[88px]' : 'w-[85vw] max-w-[280px] px-6 lg:w-[280px]'} py-6 sm:py-8`}
    >
      <div className={`mb-4 shrink-0 flex items-start justify-between gap-2 sm:mb-6 ${isCollapsed ? 'flex-col items-center' : ''}`}>
        <div className={isCollapsed ? 'flex justify-center' : 'min-w-0 flex-1'}>
          <img
            src={logoConnectBlack}
            alt="SENAI Connect"
            className={`object-contain ${isCollapsed ? 'h-10 w-10' : 'h-auto w-full max-w-[200px]'}`}
          />
          {!isCollapsed && (
            <p className="mt-2 text-xs text-white/60">Sistema de Gestao Academica</p>
          )}
        </div>
        {mobileOpen && (
          <button
            type="button"
            onClick={onMobileClose}
            className="rounded-lg p-2 hover:bg-white/10 lg:hidden"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain pr-1">
        {mainNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={linkClass}
            title={item.label}
            onClick={onMobileClose}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>{item.label}</span>}
          </NavLink>
        ))}

        <div className="relative">
          <button
            type="button"
            onClick={() => setContractsOpen((open) => !open)}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
              location.pathname.startsWith('/connect/contratos')
                ? 'bg-hub-red text-white'
                : 'text-white/85 hover:bg-white/10'
            } ${isCollapsed ? 'justify-center px-3' : ''}`}
            aria-expanded={contractsOpen}
          >
            <FileText className="h-5 w-5 shrink-0" />
            {!isCollapsed && (
              <>
                <span className="flex-1">Contratos</span>
                <ChevronRight className={`h-4 w-4 transition ${contractsOpen ? 'rotate-90' : ''}`} />
              </>
            )}
          </button>

          {contractsOpen && !isCollapsed && (
            <div className="ml-4 mt-1 space-y-1 border-l border-white/20 pl-3">
              <NavLink
                to="/connect/contratos/alunos"
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2 text-sm transition ${
                    isActive ? 'bg-hub-red text-white' : 'text-white/80 hover:bg-white/10'
                  }`
                }
                onClick={onMobileClose}
              >
                Contrato Alunos
              </NavLink>
            </div>
          )}
        </div>

        <NavLink to="/connect/salario" className={linkClass} title="Salario" onClick={onMobileClose}>
          <Wallet className="h-5 w-5 shrink-0" />
          {!isCollapsed && <span>Salario</span>}
        </NavLink>
      </nav>

      <div className="mt-auto shrink-0 pt-4">
      {!isCollapsed && (
        <div className="mb-4 flex items-start gap-2 text-xs leading-relaxed text-white/60">
          <Shield className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Menus exibidos conforme perfil de acesso.</p>
        </div>
      )}

      <div className="relative" ref={supportRef}>
        <button
          type="button"
          onClick={() => setSupportOpen((open) => !open)}
          className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/85 transition hover:bg-white/10 ${
            isCollapsed ? 'justify-center px-3' : ''
          }`}
        >
          <Headphones className="h-5 w-5 shrink-0" />
          {!isCollapsed && (
            <>
              <span className="flex-1 text-left">Suporte</span>
              <ChevronRight className={`h-4 w-4 ${supportOpen ? 'rotate-90' : ''}`} />
            </>
          )}
        </button>
        {supportOpen && !isCollapsed && (
          <div className="mt-1 rounded-xl border border-white/10 bg-[#002847] p-3 text-sm">
            <div className="mb-2 flex justify-between">
              <span className="text-xs font-semibold uppercase text-white/70">Suporte</span>
              <button type="button" onClick={() => setSupportOpen(false)} aria-label="Fechar">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <a href="mailto:suporte@senaihub.local" className="block rounded-lg px-2 py-2 hover:bg-white/10">
              suporte@senaihub.local
            </a>
          </div>
        )}
      </div>
      </div>
    </aside>
  )
}

