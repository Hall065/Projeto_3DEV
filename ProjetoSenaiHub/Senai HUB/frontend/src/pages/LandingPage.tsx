import { LandingAudience } from '../components/landing/LandingAudience'
import { LandingCta } from '../components/landing/LandingCta'
import { LandingFeatures } from '../components/landing/LandingFeatures'
import { LandingFooter } from '../components/landing/LandingFooter'
import { LandingHeader } from '../components/landing/LandingHeader'
import { LandingHero } from '../components/landing/LandingHero'
import { LandingPlatform } from '../components/landing/LandingPlatform'
import { LandingThemesPreview } from '../components/landing/LandingThemesPreview'
import { GlassShell } from '../components/layout/GlassShell'

export function LandingPage() {
  return (
    <GlassShell className="min-h-screen">
      <LandingHeader />
      <main className="relative z-0">
        <LandingHero />
        <LandingPlatform />
        <LandingThemesPreview />
        <LandingAudience />
        <LandingFeatures />
        <LandingCta />
      </main>
      <LandingFooter />
    </GlassShell>
  )
}
