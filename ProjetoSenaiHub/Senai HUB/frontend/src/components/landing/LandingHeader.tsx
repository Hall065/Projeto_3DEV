import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, X } from 'lucide-react'
import { HUB_BRAND_ASSETS } from '../../utils/appBrandAssets'
import { useAuth } from '../../contexts/AuthContext'
import { SupportChatTrigger } from '../support/SupportChatTrigger'

export function LandingHeader() {
  const { t } = useTranslation()
  const { isAuthenticated } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const navLinks = [
    { label: t('landing.navFeatures'), href: '#recursos' },
    { label: t('landing.navSolutions'), href: '#solucoes' },
    { label: t('landing.navBenefits'), href: '#beneficios' },
    { label: t('landing.navAudience'), href: '#para-quem' },
    { label: t('landing.navSupport'), href: '#suporte' },
  ]

  return (
    <header className="hub-chrome sticky top-0 z-50 border-b">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="shrink-0">
          <img src={HUB_BRAND_ASSETS.expanded} alt={HUB_BRAND_ASSETS.name} className="h-10 w-auto sm:h-12 lg:h-14" />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Principal">
          {navLinks.map((link) =>
            link.href === '#suporte' ? (
              <SupportChatTrigger
                key={link.href}
                className="text-sm font-medium text-white/90 transition-colors hover:text-white"
              >
                {link.label}
              </SupportChatTrigger>
            ) : (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-white/90 transition-colors hover:text-white"
              >
                {link.label}
              </a>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-3 sm:flex">
          {isAuthenticated ? (
            <Link
              to="/hub"
              className="rounded-lg bg-hub-red px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-hub-red-hover"
            >
              {t('landing.accessHub')}
            </Link>
          ) : (
            <Link
              to="/login"
              className="rounded-lg bg-hub-red px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-hub-red-hover"
            >
              {t('landing.login')}
            </Link>
          )}
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg p-2 text-white lg:hidden"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? t('header.closeMenu') : t('header.openMenu')}
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-white/15 bg-hub-navy px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {navLinks.map((link) =>
              link.href === '#suporte' ? (
                <SupportChatTrigger
                  key={link.href}
                  className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-white/90 hover:bg-white/10"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </SupportChatTrigger>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-white/90 hover:bg-white/10"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </a>
              ),
            )}
          </nav>
          <div className="mt-4 flex flex-col gap-2">
            {isAuthenticated ? (
              <Link
                to="/hub"
                className="rounded-lg bg-hub-red px-4 py-2.5 text-center text-sm font-semibold text-white"
                onClick={() => setMenuOpen(false)}
              >
                {t('landing.accessHub')}
              </Link>
            ) : (
              <Link
                to="/login"
                className="rounded-lg bg-hub-red px-4 py-2.5 text-center text-sm font-semibold text-white"
                onClick={() => setMenuOpen(false)}
              >
                {t('landing.login')}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
