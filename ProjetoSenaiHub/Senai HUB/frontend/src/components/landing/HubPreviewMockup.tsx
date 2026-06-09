import { ArrowRight, ChevronDown, Headphones, LayoutGrid } from 'lucide-react'
import { logoSenaiHub } from '../../assets/brand'
import { AppBrandMark } from '../brand/AppBrandMark'
import coverConnect from '../../assets/hub/cover-connect.png'
import coverGrid from '../../assets/hub/cover-grid.png'
import coverSafe from '../../assets/hub/cover-safe.png'
import { APP_BRAND_ASSETS, MODULE_BRAND_SLUGS } from '../../utils/appBrandAssets'

const previewApps = MODULE_BRAND_SLUGS.map((slug) => ({
  slug,
  name: APP_BRAND_ASSETS[slug].name,
  cover: slug === 'connect' ? coverConnect : slug === 'grid' ? coverGrid : coverSafe,
}))

export function HubPreviewMockup() {
  return (
    <div className="glass-panel-solid overflow-hidden rounded-2xl shadow-[0_8px_40px_rgba(2,26,58,0.12)]">
      <div className="flex items-center gap-1.5 border-b border-white/40 bg-white/40 px-3 py-2 backdrop-blur-md">
        <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
        <span className="h-2 w-2 rounded-full bg-[#febc2e]" />
        <span className="h-2 w-2 rounded-full bg-[#28c840]" />
      </div>

      <div className="flex min-h-[300px] sm:min-h-[320px]">
        <aside className="flex w-[118px] shrink-0 flex-col bg-hub-navy px-3 py-4 sm:w-[132px] sm:px-3.5">
          <img
            src={logoSenaiHub}
            alt="SENAI HUB"
            className="h-auto w-full max-w-[100px] object-contain"
          />

          <nav className="mt-5 space-y-2">
            <div className="flex items-center gap-1.5 rounded-md bg-hub-red px-2 py-1.5 text-[9px] font-semibold leading-tight text-white sm:text-[10px]">
              <LayoutGrid className="h-3 w-3 shrink-0" />
              Hub de Aplicações
            </div>
            <div className="flex items-center gap-1.5 rounded-md bg-hub-navy px-2 py-1.5 text-[9px] font-medium leading-tight text-white/90 sm:text-[10px]">
              <Headphones className="h-3 w-3 shrink-0" />
              Suporte
            </div>
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col bg-white/20 backdrop-blur-sm">
          <div className="hub-chrome flex items-center justify-end gap-2 border-b border-white/10 px-3 py-2 sm:px-4">
            <span className="h-6 w-6 rounded-full bg-hub-navy/10" />
            <span className="hidden text-[10px] font-medium text-white sm:inline">Ana Maria</span>
            <ChevronDown className="h-3 w-3 text-white/70" />
          </div>

          <div className="flex-1 p-3 sm:p-4">
            <h3 className="text-sm font-bold text-hub-navy sm:text-base">Hub de Aplicações</h3>
            <p className="mt-0.5 text-[10px] text-hub-text-muted sm:text-[11px]">
              Acesse os sistemas disponíveis para o seu perfil.
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2.5 sm:mt-4 sm:gap-3">
              {previewApps.map(({ slug, name, cover }) => (
                <article
                  key={slug}
                  className="glass-panel flex flex-col overflow-hidden rounded-lg shadow-sm"
                >
                  <div className="h-[72px] overflow-hidden sm:h-[80px]">
                    <img src={cover} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex flex-1 flex-col p-2 sm:p-2.5">
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <AppBrandMark slug={slug} name={name} size="sm" className="!h-5 !w-5 [&_img]:!h-3 [&_img]:!w-3" />
                      <span className="text-[9px] font-bold uppercase tracking-wide text-hub-navy sm:text-[10px]">
                        {name}
                      </span>
                    </div>
                    <span className="mt-auto flex items-center justify-center gap-1 rounded border border-hub-navy/15 py-1 text-[8px] font-medium text-hub-navy sm:text-[9px]">
                      Acessar Sistema
                      <ArrowRight className="h-2.5 w-2.5" />
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
