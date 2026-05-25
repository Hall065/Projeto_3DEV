import { Header } from '../components/layout/Header'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'

export function SettingsPage() {
  return (
    <>
      <Header title="Configuracoes" subtitle="Preferencias do sistema" />

      <section className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-2xl space-y-6">
          <Card title="Perfil" description="Dados do usuario (mock)">
            <div className="space-y-4">
              <Input label="Nome" defaultValue="Usuario Demo" />
              <Input label="E-mail" type="email" defaultValue="demo@senaihub.local" />
              <Button>Salvar alteracoes</Button>
            </div>
          </Card>

          <Card title="Notificacoes" description="Alertas e avisos">
            <p className="text-sm text-slate-500">
              Configuracoes de notificacao serao implementadas na proxima fase.
            </p>
          </Card>

          <Card title="Integracao Supabase" description="Em breve">
            <p className="text-sm text-slate-500">
              Conexao com Supabase para dados em tempo real e autenticacao.
            </p>
          </Card>
        </div>
      </section>
    </>
  )
}
