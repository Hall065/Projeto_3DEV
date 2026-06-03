import { AppearanceSettings } from '../components/settings/AppearanceSettings'

export function ThemesPage() {
  return (
    <section className="w-full min-w-0">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-hub-navy">Temas</h1>
        <p className="mt-2 text-hub-text-muted">Personalize o plano de fundo e a aparência visual do sistema.</p>
      </header>

      <div className="mx-auto max-w-5xl">
        <AppearanceSettings />
      </div>
    </section>
  )
}
