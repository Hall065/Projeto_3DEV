import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Headphones, Mail, MessageCircle, X } from 'lucide-react'
import { logoSenaiHub } from '../../assets/brand'

export function AuthSidebar() {
  const { t } = useTranslation()
  const [supportOpen, setSupportOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!supportOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setSupportOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [supportOpen])

  return (
    <aside className="hub-chrome-sidebar relative flex min-h-screen w-[34%] min-w-[300px] max-w-[440px] flex-col items-center justify-start px-10 py-10 text-white">
      <Link to="/" className="block w-full max-w-[340px] transition-opacity hover:opacity-90" aria-label={t('common.home')}>
        <img src={logoSenaiHub} alt="SENAI HUB" className="h-auto w-full object-contain" />
      </Link>

      <div className="my-auto w-full py-10">
        <h2 className="text-[2rem] font-bold leading-tight">{t('authSidebar.welcome')}</h2>
        <p className="mt-5 max-w-sm text-[0.95rem] leading-relaxed text-white/85">{t('authSidebar.tagline')}</p>
      </div>

      <div className="relative w-full" ref={panelRef}>
        <button
          type="button"
          onClick={() => setSupportOpen((open) => !open)}
          className="flex w-full items-start gap-3 rounded-xl p-2 text-left transition hover:bg-white/10"
          aria-expanded={supportOpen}
          aria-haspopup="dialog"
        >
          <Headphones className="mt-0.5 h-5 w-5 shrink-0" />
          <span>
            <span className="block text-sm font-semibold">{t('authSidebar.support')}</span>
            <span className="mt-1 block text-xs text-white/75">{t('authSidebar.supportHint')}</span>
          </span>
        </button>

        {supportOpen && (
          <div
            role="dialog"
            aria-label={t('authSidebar.support')}
            className="absolute bottom-full left-0 z-20 mb-3 w-full rounded-xl border border-white/10 bg-[#002847] p-4 shadow-xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">{t('authSidebar.supportTitle')}</p>
              <button
                type="button"
                onClick={() => setSupportOpen(false)}
                className="rounded-md p-1 hover:bg-white/10"
                aria-label={t('authSidebar.closeSupport')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <a
              href="mailto:suporte@senaihub.local"
              className="mb-2 flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-white/10"
            >
              <Mail className="h-4 w-4" />
              suporte@senaihub.local
            </a>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-white/10"
            >
              <MessageCircle className="h-4 w-4" />
              {t('authSidebar.chatSupport')}
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
