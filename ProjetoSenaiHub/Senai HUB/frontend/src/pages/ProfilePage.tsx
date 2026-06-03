import {
  ArrowUpRight,
  Building2,
  CheckCircle2,
  KeyRound,
  LayoutGrid,
  LogOut,
  Paintbrush,
  Settings,
  Shield,
  User as UserIcon,
  Users,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ConnectCard,
  ConnectLoadingSpinner,
  ConnectPageHeader,
  FormField,
  inputClass,
  OutlineButton,
  PrimaryButton,
  selectClass,
} from '../components/connect/ConnectShared'
import { UserAvatar } from '../components/ui/UserAvatar'
import { ProfileAvatarModal } from '../components/profile/ProfileAvatarModal'
import { useAuth } from '../contexts/AuthContext'
import { usePermissions } from '../hooks/usePermissions'
import { fetchApplications } from '../services/applicationService'
import type { HubApplication } from '../types/application'
import { getApplicationCover } from '../utils/applicationCovers'
import { groupPermissions } from '../utils/profileLabels'

const appIcons = {
  users: Users,
  building: Building2,
} as const

function formatMemberSince(iso?: string | null): string | null {
  if (!iso) {
    return null
  }

  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return null
  }
}

function AlertBanner({ type, message }: { type: 'success' | 'error'; message: string }) {
  const isSuccess = type === 'success'

  return (
    <p
      role="status"
      className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
        isSuccess
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-red-200 bg-red-50 text-red-700'
      }`}
    >
      {isSuccess && <CheckCircle2 className="mr-2 inline h-4 w-4" aria-hidden />}
      {message}
    </p>
  )
}

export function ProfilePage() {
  const navigate = useNavigate()
  const { user, updateProfile, changePassword, logout, isSubmitting, refreshUser } = useAuth()
  const { isAdmin } = usePermissions()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [applications, setApplications] = useState<HubApplication[]>([])
  const [appsLoading, setAppsLoading] = useState(true)
  const [showPermissions, setShowPermissions] = useState(false)
  const [avatarModalOpen, setAvatarModalOpen] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    if (user) {
      setName(user.name)
      setEmail(user.email)
    }
  }, [user])

  useEffect(() => {
    refreshUser().catch(() => undefined)
  }, [refreshUser])

  useEffect(() => {
    fetchApplications()
      .then(setApplications)
      .catch(() => setApplications([]))
      .finally(() => setAppsLoading(false))
  }, [])

  const profileDirty = user ? name.trim() !== user.name || email.trim() !== user.email : false
  const passwordDirty = currentPassword !== '' || password !== '' || passwordConfirmation !== ''
  const memberSince = formatMemberSince(user?.created_at)
  const permissionGroups = useMemo(() => groupPermissions(user?.permissions ?? []), [user?.permissions])

  function showMessage(type: 'success' | 'error', message: string) {
    setFeedback({ type, message })
    window.setTimeout(() => setFeedback(null), 4000)
  }

  async function handleSaveProfile() {
    setFeedback(null)
    try {
      await updateProfile({ name: name.trim(), email: email.trim() })
      showMessage('success', 'Dados pessoais atualizados com sucesso.')
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Nao foi possivel salvar o perfil.')
    }
  }

  async function handleChangePassword() {
    setFeedback(null)
    if (password !== passwordConfirmation) {
      showMessage('error', 'As senhas nao conferem.')
      return
    }
    if (password.length < 8) {
      showMessage('error', 'A nova senha deve ter pelo menos 8 caracteres.')
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
      showMessage('success', 'Senha alterada com sucesso.')
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Nao foi possivel alterar a senha.')
    }
  }

  function handleResetProfileForm() {
    if (user) {
      setName(user.name)
      setEmail(user.email)
    }
  }

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  if (!user) {
    return (
      <section className="w-full min-w-0">
        <ConnectLoadingSpinner label="Carregando perfil..." className="min-h-[320px]" />
      </section>
    )
  }

  return (
    <section className="w-full min-w-0">
      <ConnectPageHeader
        title="Meu perfil"
        subtitle="Visualize e atualize seus dados, seguranca e aplicativos disponiveis."
        actions={
          <Link
            to="/configuracoes"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-hub-border px-4 text-sm font-medium text-hub-navy transition hover:bg-hub-bg"
          >
            <Paintbrush className="h-4 w-4" />
            Preferências
          </Link>
        }
      />

      {feedback && <AlertBanner type={feedback.type} message={feedback.message} />}

      <div className="grid gap-6 lg:grid-cols-12">
        <aside className="lg:col-span-4 xl:col-span-3">
          <ConnectCard className="p-6">
            <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
              <UserAvatar
                name={user.name}
                avatarUrl={user.avatar_url}
                size="lg"
                className="ring-4 ring-white shadow-md"
                interactive
                onClick={() => setAvatarModalOpen(true)}
              />
              <h2 className="mt-4 text-xl font-bold text-hub-navy">{user.name}</h2>
              <p className="mt-1 text-sm text-hub-text-muted">{user.email}</p>

              <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    isAdmin ? 'bg-hub-navy text-white' : 'bg-hub-bg text-hub-navy'
                  }`}
                >
                  {user.role_label ?? user.role ?? 'Usuario'}
                </span>
                {user.is_admin && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                    <Shield className="h-3.5 w-3.5" />
                    Admin
                  </span>
                )}
              </div>

              {user.company_name && (
                <p className="mt-3 flex items-center justify-center gap-2 text-sm text-hub-text-muted sm:justify-start">
                  <Building2 className="h-4 w-4 shrink-0" />
                  {user.company_name}
                </p>
              )}

              <dl className="mt-6 w-full space-y-3 border-t border-hub-border/50 pt-4 text-left text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-hub-text-muted">ID da conta</dt>
                  <dd className="font-medium text-hub-navy">#{user.id}</dd>
                </div>
                {memberSince && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-hub-text-muted">Membro desde</dt>
                    <dd className="text-right font-medium text-hub-navy">{memberSince}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <dt className="text-hub-text-muted">Aplicativos</dt>
                  <dd className="font-medium text-hub-navy">{applications.length}</dd>
                </div>
              </dl>
            </div>

            <nav className="mt-6 space-y-1 border-t border-hub-border/50 pt-4" aria-label="Atalhos da conta">
              <Link
                to="/hub"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-hub-text transition hover:bg-hub-bg"
              >
                <LayoutGrid className="h-4 w-4 text-hub-text-muted" />
                Hub de aplicativos
              </Link>
              <Link
                to="/temas"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-hub-text transition hover:bg-hub-bg"
              >
                <Paintbrush className="h-4 w-4 text-hub-text-muted" />
                Temas e aparencia
              </Link>
              <Link
                to="/configuracoes"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-hub-text transition hover:bg-hub-bg"
              >
                <Settings className="h-4 w-4 text-hub-text-muted" />
                Preferências do sistema
              </Link>
            </nav>

            <div className="mt-4 [&>button]:w-full">
              <OutlineButton type="button" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Sair da conta
              </OutlineButton>
            </div>
          </ConnectCard>
        </aside>

        <div className="space-y-6 lg:col-span-8 xl:col-span-9">
          <ConnectCard className="p-6">
            <header className="mb-5 flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-hub-red/10 text-hub-red">
                <UserIcon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-hub-navy">Dados pessoais</h3>
                <p className="mt-0.5 text-sm text-hub-text-muted">Nome e e-mail usados no login e na identificacao no sistema.</p>
              </div>
            </header>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Nome completo" required>
                <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              </FormField>
              <FormField label="E-mail" required>
                <input
                  type="email"
                  className={inputClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </FormField>
              <FormField label="Perfil de acesso" hint="Definido pelo administrador.">
                <select className={selectClass} value={user.role ?? ''} disabled>
                  <option value={user.role ?? ''}>{user.role_label ?? user.role ?? '—'}</option>
                </select>
              </FormField>
              {user.company_name != null && user.company_name !== '' && (
                <FormField label="Empresa vinculada">
                  <input className={inputClass} value={user.company_name} disabled />
                </FormField>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <PrimaryButton type="button" onClick={handleSaveProfile} disabled={!profileDirty || isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar alteracoes'}
              </PrimaryButton>
              <OutlineButton type="button" onClick={handleResetProfileForm} disabled={!profileDirty || isSubmitting}>
                Descartar
              </OutlineButton>
            </div>
          </ConnectCard>

          <ConnectCard className="p-6">
            <header className="mb-5 flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-hub-navy/10 text-hub-navy">
                <KeyRound className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-hub-navy">Seguranca</h3>
                <p className="mt-0.5 text-sm text-hub-text-muted">Altere sua senha periodicamente. Minimo de 8 caracteres.</p>
              </div>
            </header>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FormField label="Senha atual">
                  <input
                    type="password"
                    className={inputClass}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </FormField>
              </div>
              <FormField label="Nova senha">
                <input
                  type="password"
                  className={inputClass}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </FormField>
              <FormField label="Confirmar nova senha">
                <input
                  type="password"
                  className={inputClass}
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  autoComplete="new-password"
                />
              </FormField>
            </div>

            <div className="mt-6">
              <OutlineButton type="button" onClick={handleChangePassword} disabled={!passwordDirty || isSubmitting}>
                {isSubmitting ? 'Aguarde...' : 'Alterar senha'}
              </OutlineButton>
            </div>
          </ConnectCard>

          <ConnectCard className="p-6">
            <header className="mb-5">
              <h3 className="text-lg font-semibold text-hub-navy">Meus aplicativos</h3>
              <p className="mt-0.5 text-sm text-hub-text-muted">Modulos liberados para o seu perfil no SENAI HUB.</p>
            </header>

            {appsLoading ? (
              <ConnectLoadingSpinner label="Carregando aplicativos..." className="min-h-[120px]" />
            ) : applications.length === 0 ? (
              <p className="rounded-xl border border-dashed border-hub-border bg-hub-bg/50 px-4 py-8 text-center text-sm text-hub-text-muted">
                Nenhum aplicativo disponivel para o seu perfil. Entre em contato com o administrador.
              </p>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2">
                {applications.map((app) => {
                  const Icon = appIcons[app.icon as keyof typeof appIcons] ?? Users
                  const cover = getApplicationCover(app.slug)

                  return (
                    <li
                      key={app.id}
                      className="flex overflow-hidden rounded-xl border border-hub-border/60 bg-white shadow-sm transition hover:border-hub-navy/20 hover:shadow-md"
                    >
                      <img src={cover} alt="" className="hidden h-auto w-24 shrink-0 object-cover sm:block" />
                      <div className="flex min-w-0 flex-1 flex-col p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-hub-red text-white">
                            <Icon className="h-4 w-4" />
                          </span>
                          <h4 className="truncate font-semibold text-hub-navy">{app.name}</h4>
                        </div>
                        <p className="mb-3 line-clamp-2 flex-1 text-xs text-hub-text-muted">{app.description}</p>
                        <Link
                          to={app.route_path}
                          className="inline-flex items-center gap-1 text-sm font-medium text-hub-red hover:underline"
                        >
                          Abrir
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </ConnectCard>

          <ConnectCard className="p-6">
            <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-hub-navy">Permissoes do perfil</h3>
                <p className="mt-0.5 text-sm text-hub-text-muted">
                  {user.permissions?.includes('*')
                    ? 'Voce possui acesso administrativo completo.'
                    : `${user.permissions?.length ?? 0} permissoes ativas no sistema.`}
                </p>
              </div>
              {!user.permissions?.includes('*') && (user.permissions?.length ?? 0) > 0 && (
                <OutlineButton type="button" onClick={() => setShowPermissions((open) => !open)}>
                  {showPermissions ? 'Ocultar lista' : 'Ver detalhes'}
                </OutlineButton>
              )}
            </header>

            {permissionGroups.length === 0 ? (
              <p className="text-sm text-hub-text-muted">Nenhuma permissao registrada.</p>
            ) : showPermissions || user.permissions?.includes('*') ? (
              <div className="space-y-4">
                {permissionGroups.map((group) => (
                  <div key={group.module}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-hub-text-muted">{group.module}</p>
                    <ul className="flex flex-wrap gap-2">
                      {group.items.map((item) => (
                        <li
                          key={item}
                          className="rounded-lg border border-hub-border/60 bg-hub-bg/80 px-3 py-1.5 text-xs font-medium text-hub-navy"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-hub-text-muted">
                Clique em &quot;Ver detalhes&quot; para listar as acoes permitidas no Connect, Grid e Hub.
              </p>
            )}
          </ConnectCard>
        </div>
      </div>

      <ProfileAvatarModal
        open={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        onSuccess={(message) => showMessage('success', message)}
        onError={(message) => showMessage('error', message)}
      />
    </section>
  )
}
