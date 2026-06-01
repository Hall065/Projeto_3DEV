import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SettingsPageFooter } from '../components/settings/SettingsPageFooter'
import { Input } from '../components/ui/Input'
import { useAuth } from '../contexts/AuthContext'
import { navigateBack } from '../utils/navigation'

export function SettingsPage() {
  const navigate = useNavigate()
  const { user, updateProfile, changePassword, isSubmitting } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setName(user.name)
      setEmail(user.email)
    }
  }, [user])

  const profileDirty = user ? name !== user.name || email !== user.email : false
  const passwordDirty = currentPassword !== '' || password !== '' || passwordConfirmation !== ''

  async function handleSaveProfile() {
    setError(null)
    try {
      await updateProfile({ name, email })
      setSavedMessage('Perfil atualizado com sucesso.')
      window.setTimeout(() => setSavedMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nao foi possivel salvar o perfil.')
    }
  }

  async function handleChangePassword() {
    setError(null)
    if (password !== passwordConfirmation) {
      setError('As senhas nao conferem.')
      return
    }
    try {
      await changePassword({
        current_password: currentPassword,
        password,
        password_confirmation: passwordConfirmation,
      })
      setCurrentPassword('')
      setPassword('')
      setPasswordConfirmation('')
      setSavedMessage('Senha alterada com sucesso.')
      window.setTimeout(() => setSavedMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nao foi possivel alterar a senha.')
    }
  }

  function handleBack() {
    if (user) {
      setName(user.name)
      setEmail(user.email)
    }
    navigateBack(navigate)
  }

  return (
    <section className="px-8 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-hub-navy">Configuracoes</h1>
        <p className="mt-2 text-hub-text-muted">Perfil e seguranca da sua conta</p>
      </header>

      <div className="mx-auto max-w-2xl space-y-6">
        <section className="glass-panel rounded-2xl p-6">
          <header className="mb-4">
            <h2 className="text-lg font-semibold text-hub-navy">Perfil</h2>
            <p className="mt-1 text-sm text-hub-text-muted">
              {user?.role_label ? `Perfil atual: ${user.role_label}` : 'Dados da conta'}
            </p>
          </header>
          <div className="space-y-4">
            <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="mt-4">
            <button
              type="button"
              disabled={!profileDirty || isSubmitting}
              onClick={handleSaveProfile}
              className="rounded-lg bg-hub-red px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar perfil'}
            </button>
          </div>
        </section>

        <section className="glass-panel rounded-2xl p-6">
          <header className="mb-4">
            <h2 className="text-lg font-semibold text-hub-navy">Trocar senha</h2>
            <p className="mt-1 text-sm text-hub-text-muted">Use uma senha forte com pelo menos 8 caracteres.</p>
          </header>
          <div className="space-y-4">
            <Input
              label="Senha atual"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <Input label="Nova senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Input
              label="Confirmar nova senha"
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
            />
          </div>
          <div className="mt-4">
            <button
              type="button"
              disabled={!passwordDirty || isSubmitting}
              onClick={handleChangePassword}
              className="rounded-lg border border-hub-border px-4 py-2 text-sm font-medium text-hub-navy disabled:opacity-50"
            >
              Alterar senha
            </button>
          </div>
        </section>

        <section className="glass-panel rounded-2xl p-6">
          <header className="mb-4">
            <h2 className="text-lg font-semibold text-hub-navy">Notificacoes</h2>
          </header>
          <p className="text-sm text-hub-text-muted">Configuracoes de notificacao serao implementadas na proxima fase.</p>
        </section>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
        )}
        {savedMessage && (
          <p className="text-sm font-medium text-emerald-700" role="status">
            {savedMessage}
          </p>
        )}

        <SettingsPageFooter onSave={handleSaveProfile} onBack={handleBack} saveDisabled={!profileDirty || isSubmitting} />
      </div>
    </section>
  )
}
