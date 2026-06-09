import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  changePasswordRequest,
  fetchCurrentUser,
  loginRequest,
  logoutRequest,
  parseAuthError,
  removeAvatarRequest,
  updateProfileRequest,
  uploadAvatarRequest,
} from '../services/authService'
import { fetchPermissionsCatalog } from '../services/permissionsCatalogService'
import type { AuthState, LoginCredentials, User } from '../types/auth'

interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (payload: { name: string; email: string }) => Promise<User>
  uploadAvatar: (file: File) => Promise<User>
  removeAvatar: () => Promise<User>
  changePassword: (payload: {
    current_password: string
    password: string
    password_confirmation: string
  }) => Promise<void>
  refreshUser: () => Promise<void>
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

  useEffect(() => {
    const syncSession = () => {
      if (!localStorage.getItem(TOKEN_KEY)) {
        return
      }

      fetchCurrentUser()
        .then((currentUser) => {
          setUser(currentUser)
          localStorage.setItem(USER_KEY, JSON.stringify(currentUser))
        })
        .catch(() => undefined)
    }

    window.addEventListener('focus', syncSession)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        syncSession()
      }
    })

    return () => {
      window.removeEventListener('focus', syncSession)
    }
  }, [])

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsSubmitting(true)

    try {
      const result = await loginRequest(credentials.email, credentials.password)
      persistSession(result.user, result.token)
      setUser(result.user)
      fetchPermissionsCatalog().catch(() => undefined)
    } catch (error) {
      throw new Error(parseAuthError(error))
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  const refreshUser = useCallback(async () => {
    const currentUser = await fetchCurrentUser()
    setUser(currentUser)
    localStorage.setItem(USER_KEY, JSON.stringify(currentUser))
  }, [])

  const updateProfile = useCallback(async (payload: { name: string; email: string }): Promise<User> => {
    setIsSubmitting(true)
    try {
      const updated = await updateProfileRequest(payload)
      setUser(updated)
      localStorage.setItem(USER_KEY, JSON.stringify(updated))
      return updated
    } catch (error) {
      throw new Error(parseAuthError(error))
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  const uploadAvatar = useCallback(async (file: File): Promise<User> => {
    setIsSubmitting(true)
    try {
      const updated = await uploadAvatarRequest(file)
      setUser(updated)
      localStorage.setItem(USER_KEY, JSON.stringify(updated))
      return updated
    } catch (error) {
      throw new Error(parseAuthError(error))
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  const removeAvatar = useCallback(async (): Promise<User> => {
    setIsSubmitting(true)
    try {
      const updated = await removeAvatarRequest()
      setUser(updated)
      localStorage.setItem(USER_KEY, JSON.stringify(updated))
      return updated
    } catch (error) {
      throw new Error(parseAuthError(error))
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  const changePassword = useCallback(
    async (payload: { current_password: string; password: string; password_confirmation: string }) => {
      setIsSubmitting(true)
      try {
        await changePasswordRequest(payload)
      } catch (error) {
        throw new Error(parseAuthError(error))
      } finally {
        setIsSubmitting(false)
      }
    },
    [],
  )

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
      logout,
      updateProfile,
      uploadAvatar,
      removeAvatar,
      changePassword,
      refreshUser,
    }),
    [user, isInitializing, isSubmitting, login, logout, updateProfile, uploadAvatar, removeAvatar, changePassword, refreshUser],
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
