import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { logoSenaiHub } from '../../assets/brand'
import { useAuth } from '../../contexts/AuthContext'

const navLinks = [
  { label: 'Recursos', href: '#recursos' },
  { label: 'Soluções', href: '#solucoes' },
  { label: 'Benefícios', href: '#beneficios' },
  { label: 'Para quem é', href: '#para-quem' },
  { label: 'Suporte', href: '#suporte' },
]

export function LandingHeader() {
  const { isAuthenticated } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="hub-chrome sticky top-0 z-50 border-b">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="shrink-0">
          <img
            src={logoSenaiHub}
            alt="SENAI HUB"
            className="h-10 w-auto sm:h-12 lg:h-14"
          />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Principal">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-white/90 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 sm:flex">
          {isAuthenticated ? (
            <Link
              to="/hub"
              className="rounded-lg bg-hub-red px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-hub-red-hover"
            >
              Acessar o Hub
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Entrar
              </Link>
              <Link
                to="/cadastro"
                className="rounded-lg bg-hub-red px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-hub-red-hover"
              >
                Criar conta
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg p-2 text-white lg:hidden"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-white/15 bg-hub-navy px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-white/90 hover:bg-white/10"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2">
            {isAuthenticated ? (
              <Link
                to="/hub"
                className="rounded-lg bg-hub-red px-4 py-2.5 text-center text-sm font-semibold text-white"
                onClick={() => setMenuOpen(false)}
              >
                Acessar o Hub
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-lg border border-white/40 px-4 py-2.5 text-center text-sm font-semibold text-white"
                  onClick={() => setMenuOpen(false)}
                >
                  Entrar
                </Link>
                <Link
                  to="/cadastro"
                  className="rounded-lg bg-hub-red px-4 py-2.5 text-center text-sm font-semibold text-white"
                  onClick={() => setMenuOpen(false)}
                >
                  Criar conta
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
