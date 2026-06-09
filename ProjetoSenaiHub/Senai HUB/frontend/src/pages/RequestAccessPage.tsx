import { type FormEvent, useState } from 'react'
import { Building2, Mail, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AuthButton } from '../components/auth/AuthButton'
import { AuthField } from '../components/auth/AuthField'
import { AuthFormCard } from '../components/auth/AuthFormCard'
import { submitAccessRequest } from '../services/accessRequestService'
import { parseApiError } from '../utils/parseApiError'

export function RequestAccessPage() {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [organization, setOrganization] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setSubmitting(true)

    try {
      const responseMessage = await submitAccessRequest({
        name: name.trim(),
        email: email.trim(),
        organization: organization.trim() || undefined,
        message: message.trim() || undefined,
      })
      setSuccess(responseMessage)
      setName('')
      setEmail('')
      setOrganization('')
      setMessage('')
    } catch (err) {
      setError(parseApiError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthFormCard
      title={t('accessRequest.title')}
      subtitle={t('accessRequest.subtitle')}
      footer={
        <Link to="/login" className="text-sm font-medium text-hub-red hover:underline">
          {t('auth.backToLogin')}
        </Link>
      }
    >
      {success && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {success}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          id="access-name"
          label={t('accessRequest.name')}
          icon={User}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
        />
        <AuthField
          id="access-email"
          label={t('accessRequest.email')}
          icon={Mail}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <AuthField
          id="access-org"
          label={t('accessRequest.organization')}
          icon={Building2}
          value={organization}
          onChange={(e) => setOrganization(e.target.value)}
        />
        <div className="flex flex-col gap-2">
          <label htmlFor="access-message" className="text-sm font-medium text-hub-text">
            {t('accessRequest.message')}
          </label>
          <textarea
            id="access-message"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-xl border border-hub-border bg-white px-4 py-3 text-sm text-hub-text outline-none transition placeholder:text-hub-text-muted/70 focus:border-hub-red focus:ring-2 focus:ring-hub-red/15"
            placeholder={t('accessRequest.messagePlaceholder')}
          />
        </div>
        <AuthButton type="submit" isLoading={submitting}>
          {t('accessRequest.submit')}
        </AuthButton>
      </form>
    </AuthFormCard>
  )
}
