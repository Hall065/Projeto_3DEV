import { type FormEvent, useState } from 'react'
import { Mail } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AuthButton } from '../components/auth/AuthButton'
import { AuthField } from '../components/auth/AuthField'
import { AuthFormCard } from '../components/auth/AuthFormCard'
import { useAuth } from '../contexts/AuthContext'
import { useCrudToast } from '../hooks/useCrudToast'
import { forgotPasswordRequest, parseAuthError } from '../services/authService'

export function ForgotPasswordPage() {
  const { t } = useTranslation()
  const crudToast = useCrudToast()
  const { isAuthenticated, isInitializing } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/hub" replace />
  }

  if (isInitializing) {
    return null
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const response = await forgotPasswordRequest(email)
      crudToast.notifySuccess(response || t('auth.forgotSuccess'))
    } catch (err) {
      setError(parseAuthError(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthFormCard
      title={t('auth.forgotTitle')}
      subtitle={t('auth.forgotSubtitle')}
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
          label={t('auth.email')}
          type="email"
          icon={Mail}
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <AuthButton isLoading={isSubmitting}>{t('auth.sendLink')}</AuthButton>
      </form>
    </AuthFormCard>
  )
}
