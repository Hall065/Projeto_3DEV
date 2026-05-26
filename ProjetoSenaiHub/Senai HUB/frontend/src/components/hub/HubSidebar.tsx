import { ChevronRight, Headphones, LayoutGrid, Mail, MessageCircle, Shield, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { logoSenaiHub } from '../../assets/brand'

interface HubSidebarProps {
  collapsed: boolean
}

export function HubSidebar({ collapsed }: HubSidebarProps) {
  const [supportOpen, setSupportOpen] = useState(false)
  const supportRef = useRef<HTMLDivElement>(null)

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

  return (
    <aside
      className={`hub-chrome-sidebar flex min-h-screen flex-col text-white transition-all duration-300 ${
        collapsed ? 'w-[88px] px-4' : 'w-[280px] px-6'
      } py-8`}
    >
      <div className={`mb-10 ${collapsed ? 'flex justify-center' : ''}`}>
        <img
          src={logoSenaiHub}
          alt="SENAI HUB"
          className={`object-contain ${collapsed ? 'h-10 w-10' : 'h-auto w-full max-w-[220px]'}`}
        />
      </div>

      <nav className="flex flex-1 flex-col gap-2">
        <NavLink
          to="/hub"
          end
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
              isActive ? 'bg-hub-red text-white' : 'text-white/85 hover:bg-white/10'
            } ${collapsed ? 'justify-center px-3' : ''}`
          }
          title="Hub de Aplicacoes"
        >
          <LayoutGrid className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Hub de Aplicacoes</span>}
        </NavLink>

        <div className="relative" ref={supportRef}>
          <button
            type="button"
            onClick={() => setSupportOpen((open) => !open)}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-white/85 transition hover:bg-white/10 ${
              collapsed ? 'justify-center px-3' : ''
            }`}
            aria-expanded={supportOpen}
          >
            <Headphones className="h-5 w-5 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1">Suporte</span>
                <ChevronRight className={`h-4 w-4 transition ${supportOpen ? 'rotate-90' : ''}`} />
              </>
            )}
          </button>

          {supportOpen && !collapsed && (
            <div className="mt-1 rounded-xl border border-white/10 bg-[#002847] p-3 shadow-lg">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Suporte</p>
                <button type="button" onClick={() => setSupportOpen(false)} className="rounded p-1 hover:bg-white/10" aria-label="Fechar">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <ul className="space-y-1 text-sm">
                <li>
                  <a href="mailto:suporte@senaihub.local" className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-white/10">
                    <Mail className="h-4 w-4" />
                    suporte@senaihub.local
                  </a>
                </li>
                <li>
                  <button type="button" className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-white/10">
                    <MessageCircle className="h-4 w-4" />
                    Abrir chat
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </nav>

      {!collapsed && (
        <div className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-white/60">
          <Shield className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Menus exibidos conforme perfil de acesso.</p>
        </div>
      )}
    </aside>
  )
}

