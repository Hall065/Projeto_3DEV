import { type FormEvent, useState } from 'react'
import { Lock, Mail } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { AuthButton } from '../components/auth/AuthButton'
import { AuthField } from '../components/auth/AuthField'
import { AuthFormCard } from '../components/auth/AuthFormCard'
import { PasswordToggle } from '../components/auth/PasswordToggle'
import { useAuth } from '../contexts/AuthContext'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, isAuthenticated, isSubmitting, isInitializing } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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

    try {
      await login({ email, password })
      navigate('/hub')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'E-mail ou senha invalidos.')
    }
  }

  return (
    <AuthFormCard
      title="Acesse sua conta"
      subtitle="Informe seu e-mail e senha para continuar"
      footer={
        <p className="text-hub-text-muted">
          Nao possui conta?{' '}
          <Link to="/cadastro" className="font-medium text-hub-red-link hover:underline">
            Cadastre-se
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
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
          autoComplete="current-password"
          required
          rightSlot={
            <PasswordToggle
              visible={showPassword}
              onToggle={() => setShowPassword((visible) => !visible)}
              labelShow="Mostrar senha"
              labelHide="Ocultar senha"
            />
          }
        />

        <div className="flex justify-end">
          <button type="button" className="text-sm font-medium text-hub-red-link hover:underline">
            Recuperar senha
          </button>
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <AuthButton isLoading={isSubmitting}>Entrar</AuthButton>
      </form>
    </AuthFormCard>
  )
}
