import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SettingsPageFooter } from '../components/settings/SettingsPageFooter'
import { Input } from '../components/ui/Input'
import { navigateBack } from '../utils/navigation'

const PROFILE_STORAGE_KEY = 'senai_hub_settings_profile'

const DEFAULT_PROFILE = {
  name: 'Usuario Demo',
  email: 'demo@senaihub.local',
}

function readStoredProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as { name?: string; email?: string }
      return {
        name: parsed.name ?? DEFAULT_PROFILE.name,
        email: parsed.email ?? DEFAULT_PROFILE.email,
      }
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_PROFILE
}

export function SettingsPage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(readStoredProfile)
  const [savedProfile, setSavedProfile] = useState(readStoredProfile)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

  const dirty =
    profile.name !== savedProfile.name || profile.email !== savedProfile.email

  function handleSave() {
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
    } catch {
      /* ignore */
    }
    setSavedProfile(profile)
    setSavedMessage('Configurações salvas com sucesso.')
    window.setTimeout(() => setSavedMessage(null), 3000)
  }

  function handleBack() {
    setProfile(savedProfile)
    navigateBack(navigate)
  }

  return (
    <section className="px-8 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-hub-navy">Configuracoes</h1>
        <p className="mt-2 text-hub-text-muted">Preferencias do sistema</p>
      </header>

      <div className="mx-auto max-w-2xl space-y-6">
        <section className="glass-panel rounded-2xl p-6">
          <header className="mb-4">
            <h2 className="text-lg font-semibold text-hub-navy">Perfil</h2>
            <p className="mt-1 text-sm text-hub-text-muted">Dados do usuario (mock)</p>
          </header>
          <div className="space-y-4">
            <Input
              label="Nome"
              value={profile.name}
              onChange={(e) => {
                setProfile((prev) => ({ ...prev, name: e.target.value }))
                setSavedMessage(null)
              }}
            />
            <Input
              label="E-mail"
              type="email"
              value={profile.email}
              onChange={(e) => {
                setProfile((prev) => ({ ...prev, email: e.target.value }))
                setSavedMessage(null)
              }}
            />
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

        {savedMessage && (
          <p className="text-sm font-medium text-emerald-700" role="status">
            {savedMessage}
          </p>
        )}

        <SettingsPageFooter onSave={handleSave} onBack={handleBack} saveDisabled={!dirty} />
      </div>
    </section>
  )
}
