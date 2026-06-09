import { type FormEvent, useState } from 'react'
import { Lock } from 'lucide-react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AuthButton } from '../components/auth/AuthButton'
import { AuthField } from '../components/auth/AuthField'
import { AuthFormCard } from '../components/auth/AuthFormCard'
import { PasswordToggle } from '../components/auth/PasswordToggle'
import { useAuth } from '../contexts/AuthContext'
import { parseAuthError, resetPasswordRequest } from '../services/authService'

export function ResetPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { isAuthenticated, isInitializing } = useAuth()
  const token = params.get('token') ?? ''
  const email = params.get('email') ?? ''
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/hub" replace />
  }

  if (isInitializing) {
    return null
  }

  if (!token || !email) {
    return <Navigate to="/recuperar-senha" replace />
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await resetPasswordRequest({
        email,
        token,
        password,
        password_confirmation: passwordConfirmation,
      })
      navigate('/login', { state: { resetSuccess: true } })
    } catch (err) {
      setError(parseAuthError(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthFormCard
      title={t('auth.resetTitle')}
      subtitle={t('auth.resetSubtitle')}
      footer={
        <p className="text-hub-text-muted">
          <Link to="/login" className="font-medium text-hub-red-link hover:underline">
            {t('auth.backToLogin')}
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthField
          label={t('auth.newPassword')}
          type={showPassword ? 'text' : 'password'}
          icon={Lock}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
          rightSlot={
            <PasswordToggle
              visible={showPassword}
              onToggle={() => setShowPassword((visible) => !visible)}
              labelShow={t('auth.showPassword')}
              labelHide={t('auth.hidePassword')}
            />
          }
        />

        <AuthField
          label={t('auth.confirmPassword')}
          type={showPassword ? 'text' : 'password'}
          icon={Lock}
          value={passwordConfirmation}
          onChange={(e) => setPasswordConfirmation(e.target.value)}
          autoComplete="new-password"
          required
        />

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <AuthButton isLoading={isSubmitting}>{t('auth.resetSubmit')}</AuthButton>
      </form>
    </AuthFormCard>
  )
}
