import { ArrowUpRight, Building2, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { HubApplication } from '../../types/application'
import { getApplicationCover } from '../../utils/applicationCovers'

interface ApplicationCardProps {
  application: HubApplication
}

const iconMap = {
  users: Users,
  building: Building2,
}

export function ApplicationCard({ application }: ApplicationCardProps) {
  const navigate = useNavigate()
  const Icon = iconMap[application.icon as keyof typeof iconMap] ?? Users
  const cover = getApplicationCover(application.slug)

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-hub-border/80 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
      <div className="h-44 overflow-hidden bg-hub-bg">
        <img src={cover} alt="" className="h-full w-full object-cover" />
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-hub-red text-white">
            <Icon className="h-5 w-5" />
          </span>
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
