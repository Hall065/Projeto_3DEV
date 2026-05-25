import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  fetchCurrentUser,
  loginRequest,
  logoutRequest,
  parseAuthError,
  registerRequest,
} from '../services/authService'
import type { AuthState, LoginCredentials, RegisterCredentials, User } from '../types/auth'

interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>
  register: (credentials: RegisterCredentials) => Promise<void>
  logout: () => Promise<void>
}

const TOKEN_KEY = 'senai_hub_token'
const USER_KEY = 'senai_hub_user'

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

function persistSession(user: User, token: string) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readStoredUser())
  const [isInitializing, setIsInitializing] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)

    if (!token) {
      setUser(null)
      setIsInitializing(false)
      return
    }

    fetchCurrentUser()
      .then((currentUser) => {
        setUser(currentUser)
        localStorage.setItem(USER_KEY, JSON.stringify(currentUser))
      })
      .catch(() => {
        clearSession()
        setUser(null)
      })
      .finally(() => setIsInitializing(false))
  }, [])

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsSubmitting(true)

    try {
      const result = await loginRequest(credentials.email, credentials.password)
      persistSession(result.user, result.token)
      setUser(result.user)
    } catch (error) {
      throw new Error(parseAuthError(error))
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  const register = useCallback(async (credentials: RegisterCredentials) => {
    setIsSubmitting(true)

    try {
      const result = await registerRequest(credentials)
      persistSession(result.user, result.token)
      setUser(result.user)
    } catch (error) {
      throw new Error(parseAuthError(error))
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      if (localStorage.getItem(TOKEN_KEY)) {
        await logoutRequest()
      }
    } catch {
      // Ignora falha de logout remoto e limpa sessao localmente.
    } finally {
      clearSession()
      setUser(null)
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isInitializing,
      isSubmitting,
      login,
      register,
      logout,
    }),
    [user, isInitializing, isSubmitting, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }

  return context
}
