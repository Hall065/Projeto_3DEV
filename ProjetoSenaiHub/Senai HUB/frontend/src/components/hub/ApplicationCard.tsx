import { ArrowUpRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppearance } from '../../contexts/AppearanceContext'
import type { HubApplication } from '../../types/application'
import { getAppBrandMark } from '../../utils/appBrandMarks'
import { getApplicationCover } from '../../utils/applicationCovers'

interface ApplicationCardProps {
  application: HubApplication
}

export function ApplicationCard({ application }: ApplicationCardProps) {
  const navigate = useNavigate()
  const { wallpaperTone } = useAppearance()
  const appMark = getAppBrandMark(application.slug, wallpaperTone)
  const cover = getApplicationCover(application.slug)

  return (
    <article className="glass-panel-solid flex flex-col overflow-hidden rounded-2xl shadow-[0_4px_24px_rgba(2,26,58,0.08)]">
      <div className="overflow-hidden bg-hub-bg">
        <img src={cover} alt="" className="block h-auto w-full" />
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="mb-4 flex items-center gap-3">
          {appMark ? (
            <img
              src={appMark}
              alt=""
              className="h-10 w-10 shrink-0 object-contain"
              aria-hidden
            />
          ) : (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-hub-bg text-hub-navy">
              {application.name.charAt(0)}
            </span>
          )}
          <h2 className="text-xl font-bold text-hub-navy">{application.name}</h2>
        </div>

        <p className="mb-6 flex-1 text-sm leading-relaxed text-hub-text-muted">{application.description}</p>

        <button
          type="button"
          onClick={() => navigate(application.route_path)}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-hub-navy/20 text-sm font-medium text-hub-navy transition hover:border-hub-navy hover:bg-hub-bg"
        >
          Acessar Aplicativo
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>
    </article>
  )
}
