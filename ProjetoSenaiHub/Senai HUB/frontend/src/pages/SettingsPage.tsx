import { AppearanceSettings } from '../components/settings/AppearanceSettings'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export function SettingsPage() {
  return (
    <section className="px-8 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-hub-navy">Configuracoes</h1>
        <p className="mt-2 text-hub-text-muted">Preferencias do sistema</p>
      </header>

      <div className="mx-auto max-w-2xl space-y-6">
        <AppearanceSettings />

        <section className="glass-panel rounded-2xl p-6">
          <header className="mb-4">
            <h2 className="text-lg font-semibold text-hub-navy">Perfil</h2>
            <p className="mt-1 text-sm text-hub-text-muted">Dados do usuario (mock)</p>
          </header>
          <div className="space-y-4">
            <Input label="Nome" defaultValue="Usuario Demo" />
            <Input label="E-mail" type="email" defaultValue="demo@senaihub.local" />
            <Button>Salvar alteracoes</Button>
          </div>
        </section>

        <section className="glass-panel rounded-2xl p-6">
          <header className="mb-4">
            <h2 className="text-lg font-semibold text-hub-navy">Notificacoes</h2>
            <p className="mt-1 text-sm text-hub-text-muted">Alertas e avisos</p>
          </header>
          <p className="text-sm text-hub-text-muted">
            Configuracoes de notificacao serao implementadas na proxima fase.
          </p>
        </section>

        <section className="glass-panel rounded-2xl p-6">
          <header className="mb-4">
            <h2 className="text-lg font-semibold text-hub-navy">Integracao Supabase</h2>
            <p className="mt-1 text-sm text-hub-text-muted">Em breve</p>
          </header>
          <p className="text-sm text-hub-text-muted">
            Conexao com Supabase para dados em tempo real e autenticacao.
          </p>
        </section>
      </div>
    </section>
  )
}
