import { AppearanceSettings } from '../components/settings/AppearanceSettings'

export function ThemesPage() {
  return (
    <section className="px-4 py-8 sm:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-hub-navy">Temas</h1>
        <p className="mt-2 text-hub-text-muted">Personalize o plano de fundo e a aparência visual do sistema.</p>
      </header>

      <div className="mx-auto max-w-2xl">
        <AppearanceSettings />
      </div>
    </section>
  )
}
