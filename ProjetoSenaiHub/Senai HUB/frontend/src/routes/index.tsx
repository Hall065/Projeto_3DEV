import { Navigate, Route, Routes } from 'react-router-dom'
import { LandingPage } from '../pages/LandingPage'
import { HubLayout } from '../layouts/HubLayout'
import { ConnectLayout } from '../layouts/ConnectLayout'
import { AuthLayout } from '../layouts/AuthLayout'
import { LoginPage } from '../pages/LoginPage'
import { RegisterPage } from '../pages/RegisterPage'
import { ApplicationHubPage } from '../pages/ApplicationHubPage'
import { GridLayout } from '../layouts/GridLayout'
import { GridDashboardPage } from '../pages/grid/GridDashboardPage'
import { GridTicketsPage } from '../pages/grid/GridTicketsPage'
import { GridTicketControlPage } from '../pages/grid/GridTicketControlPage'
import { GridTasksPage } from '../pages/grid/GridTasksPage'
import { GridReportsPage } from '../pages/grid/GridReportsPage'
import { GridInventoryPage } from '../pages/grid/GridInventoryPage'
import { GridTaskMapPage } from '../pages/grid/GridTaskMapPage'
import { GridUsersPage } from '../pages/grid/GridUsersPage'
import { SettingsPage } from '../pages/SettingsPage'
import { ThemesPage } from '../pages/ThemesPage'
import { ProfilePage } from '../pages/ProfilePage'
import { ProtectedRoute } from './ProtectedRoute'
import { ModuleAccessRoute } from './ModuleAccessRoute'
import { PermissionRoute } from './PermissionRoute'
import { AdminRoute } from './AdminRoute'
import { HubUsersPage } from '../pages/hub/HubUsersPage'
import { ConnectOverviewPage } from '../pages/connect/ConnectOverviewPage'
import { PeoplePage } from '../pages/connect/PeoplePage'
import { StudentsPage } from '../pages/connect/StudentsPage'
import { TeachersPage } from '../pages/connect/TeachersPage'
import { ClassesPage } from '../pages/connect/ClassesPage'
import { CoursesPage } from '../pages/connect/CoursesPage'
import { AttendancePage } from '../pages/connect/AttendancePage'
import { CalendarPage } from '../pages/connect/CalendarPage'
import { AttendanceManagePage } from '../pages/connect/AttendanceManagePage'
import { ConnectReportsPage } from '../pages/connect/ConnectReportsPage'
import { LocationPage } from '../pages/connect/LocationPage'
import { ContractsPage } from '../pages/connect/ContractsPage'
import { SalaryPage } from '../pages/connect/SalaryPage'
import { SpreadsheetHubPage } from '../pages/spreadsheet/SpreadsheetHubPage'
import { AccessDeniedPage } from '../pages/AccessDeniedPage'
import { NotFoundPage } from '../pages/NotFoundPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<HubLayout />}>
          <Route path="/hub" element={<ApplicationHubPage />} />
          <Route element={<AdminRoute />}>
            <Route path="/hub/usuarios" element={<HubUsersPage />} />
          </Route>
          <Route path="/configuracoes" element={<SettingsPage />} />
          <Route path="/temas" element={<ThemesPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="/acesso-negado" element={<AccessDeniedPage />} />
        </Route>

        <Route element={<ModuleAccessRoute module="grid" />}>
        <Route element={<PermissionRoute module="grid" />}>
        <Route element={<GridLayout />}>
          <Route path="/grid" element={<GridDashboardPage />} />
          <Route path="/grid/chamados" element={<GridTicketsPage />} />
          <Route path="/grid/controle" element={<GridTicketControlPage />} />
          <Route path="/grid/tarefas" element={<GridTasksPage />} />
          <Route path="/grid/relatorios" element={<GridReportsPage />} />
          <Route path="/grid/estoque" element={<GridInventoryPage />} />
          <Route path="/grid/mapa" element={<GridTaskMapPage />} />
          <Route path="/grid/usuarios" element={<GridUsersPage />} />
          <Route path="/grid/planilhas" element={<SpreadsheetHubPage module="grid" />} />
        </Route>
        </Route>
        </Route>

        <Route element={<ModuleAccessRoute module="connect" />}>
        <Route element={<PermissionRoute module="connect" />}>
        <Route element={<ConnectLayout />}>
          <Route path="/connect" element={<ConnectOverviewPage />} />
          <Route path="/connect/pessoas" element={<PeoplePage />} />
          <Route path="/connect/alunos" element={<StudentsPage />} />
          <Route path="/connect/professores" element={<TeachersPage />} />
          <Route path="/connect/turmas" element={<ClassesPage />} />
          <Route path="/connect/cursos" element={<CoursesPage />} />
          <Route path="/connect/calendario" element={<CalendarPage />} />
          <Route path="/connect/frequencia" element={<AttendancePage />} />
          <Route path="/connect/gerenciar-frequencia" element={<AttendanceManagePage />} />
          <Route path="/connect/relatorio" element={<ConnectReportsPage />} />
          <Route path="/connect/localizacao" element={<LocationPage />} />
          <Route path="/connect/contratos/alunos" element={<ContractsPage />} />
          <Route path="/connect/salario" element={<SalaryPage />} />
          <Route path="/connect/planilhas" element={<SpreadsheetHubPage module="connect" />} />
        </Route>
        </Route>
        </Route>
      </Route>

      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<Navigate to="/hub" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
