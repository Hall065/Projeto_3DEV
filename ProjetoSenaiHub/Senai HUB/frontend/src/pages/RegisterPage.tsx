import { type FormEvent, useState } from 'react'
import { Lock, Mail, User } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { AuthButton } from '../components/auth/AuthButton'
import { AuthField } from '../components/auth/AuthField'
import { AuthFormCard } from '../components/auth/AuthFormCard'
import { PasswordToggle } from '../components/auth/PasswordToggle'
import { useAuth } from '../contexts/AuthContext'

export function RegisterPage() {
  const navigate = useNavigate()
  const { register, isAuthenticated, isSubmitting, isInitializing } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (isAuthenticated) {
    return <Navigate to="/hub" replace />
  }

  if (isInitializing) {
    return null
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (password !== passwordConfirmation) {
      setError('As senhas nao conferem.')
      return
    }

    try {
      await register({ name, email, password, password_confirmation: passwordConfirmation })
      navigate('/hub')
    } catch (err: unknown) {
      const message =
        typeof err === 'object' && err !== null && 'message' in err && typeof err.message === 'string'
          ? err.message
          : 'Nao foi possivel concluir o cadastro.'
      setError(message)
    }
  }

  const passwordToggle = (visible: boolean, toggle: () => void, labelShow: string, labelHide: string) => (
    <PasswordToggle visible={visible} onToggle={toggle} labelShow={labelShow} labelHide={labelHide} />
  )

  return (
    <AuthFormCard
      title="Crie sua conta"
      subtitle="Preencha os dados abaixo para se cadastrar"
      footer={
        <p className="text-hub-text-muted">
          Ja possui uma conta?{' '}
          <Link to="/login" className="font-medium text-hub-red-link hover:underline">
            Entre aqui
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthField
          label="Nome Completo"
          type="text"
          icon={User}
          placeholder="Seu nome completo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          required
        />

        <AuthField
          label="E-mail"
          type="email"
          icon={Mail}
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />

        <AuthField
          label="Senha"
          type={showPassword ? 'text' : 'password'}
          icon={Lock}
          placeholder="........"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
          rightSlot={passwordToggle(showPassword, () => setShowPassword((v) => !v), 'Mostrar senha', 'Ocultar senha')}
        />

        <AuthField
          label="Confirmar Senha"
          type={showConfirmPassword ? 'text' : 'password'}
          icon={Lock}
          placeholder="........"
          value={passwordConfirmation}
          onChange={(e) => setPasswordConfirmation(e.target.value)}
          autoComplete="new-password"
          required
          rightSlot={passwordToggle(
            showConfirmPassword,
            () => setShowConfirmPassword((v) => !v),
            'Mostrar confirmacao',
            'Ocultar confirmacao',
          )}
        />

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <AuthButton isLoading={isSubmitting}>Cadastrar</AuthButton>
      </form>
    </AuthFormCard>
  )
}
