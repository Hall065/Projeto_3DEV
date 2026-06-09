import { ArrowUpRight } from 'lucide-react'

import { useNavigate } from 'react-router-dom'

import { useTranslation } from 'react-i18next'

import { AppBrandMark } from '../brand/AppBrandMark'

import type { HubApplication } from '../../types/application'

import { getAppBrandAssets } from '../../utils/appBrandAssets'
import { getApplicationCover } from '../../utils/applicationCovers'



interface ApplicationCardProps {

  application: HubApplication

}



export function ApplicationCard({ application }: ApplicationCardProps) {

  const { t } = useTranslation()

  const navigate = useNavigate()

  const cover = getApplicationCover(application.slug)
  const brandName = getAppBrandAssets(application.slug)?.name ?? application.name



  return (

    <article className="glass-panel-solid flex flex-col overflow-hidden rounded-2xl shadow-[0_4px_24px_rgba(2,26,58,0.08)]">

      <div className="overflow-hidden rounded-t-2xl bg-hub-bg">

        <img src={cover} alt="" className="block h-auto w-full" />

      </div>



      <div className="flex flex-1 flex-col p-6">

        <div className="mb-4 flex items-center gap-3">

          <AppBrandMark slug={application.slug} name={brandName} size="md" />

          <h2 className="text-xl font-bold text-hub-navy">{brandName}</h2>

        </div>



        <p className="mb-6 flex-1 text-sm leading-relaxed text-hub-text-muted">{application.description}</p>



        <button

          type="button"

          onClick={() => navigate(application.route_path)}

          className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-hub-navy/20 text-sm font-medium text-hub-navy transition hover:border-hub-navy hover:bg-hub-bg"

        >

          {t('appCard.openApp')}

          <ArrowUpRight className="h-4 w-4" />

        </button>

      </div>

    </article>

  )

}


