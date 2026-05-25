import { Navigate, Route, Routes } from 'react-router-dom'
import { HubLayout } from '../layouts/HubLayout'
import { ConnectLayout } from '../layouts/ConnectLayout'
import { AuthLayout } from '../layouts/AuthLayout'
import { LoginPage } from '../pages/LoginPage'
import { RegisterPage } from '../pages/RegisterPage'
import { ApplicationHubPage } from '../pages/ApplicationHubPage'
import { GridLayout } from '../layouts/GridLayout'
import { GridDashboardPage } from '../pages/grid/GridDashboardPage'
import { GridTicketsPage } from '../pages/grid/GridTicketsPage'
import { GridTasksPage } from '../pages/grid/GridTasksPage'
import { GridReportsPage } from '../pages/grid/GridReportsPage'
import { GridInventoryPage } from '../pages/grid/GridInventoryPage'
import { GridTaskMapPage } from '../pages/grid/GridTaskMapPage'
import { GridUsersPage } from '../pages/grid/GridUsersPage'
import { SettingsPage } from '../pages/SettingsPage'
import { ProfilePage } from '../pages/ProfilePage'
import { ProtectedRoute } from './ProtectedRoute'
import { ConnectOverviewPage } from '../pages/connect/ConnectOverviewPage'
import { StudentsPage } from '../pages/connect/StudentsPage'
import { TeachersPage } from '../pages/connect/TeachersPage'
import { ClassesPage } from '../pages/connect/ClassesPage'
import { CoursesPage } from '../pages/connect/CoursesPage'
import { AttendancePage } from '../pages/connect/AttendancePage'
import { AttendanceManagePage } from '../pages/connect/AttendanceManagePage'
import { ReportPage } from '../pages/connect/ReportPage'
import { LocationPage } from '../pages/connect/LocationPage'
import { ContractsPage } from '../pages/connect/ContractsPage'
import { SalaryPage } from '../pages/connect/SalaryPage'

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
          <Route path="/configuracoes" element={<SettingsPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
        </Route>

        <Route element={<GridLayout />}>
          <Route path="/grid" element={<GridDashboardPage />} />
          <Route path="/grid/chamados" element={<GridTicketsPage />} />
          <Route path="/grid/tarefas" element={<GridTasksPage />} />
          <Route path="/grid/relatorios" element={<GridReportsPage />} />
          <Route path="/grid/estoque" element={<GridInventoryPage />} />
          <Route path="/grid/mapa" element={<GridTaskMapPage />} />
          <Route path="/grid/usuarios" element={<GridUsersPage />} />
        </Route>

        <Route element={<ConnectLayout />}>
          <Route path="/connect" element={<ConnectOverviewPage />} />
          <Route path="/connect/alunos" element={<StudentsPage />} />
          <Route path="/connect/professores" element={<TeachersPage />} />
          <Route path="/connect/turmas" element={<ClassesPage />} />
          <Route path="/connect/cursos" element={<CoursesPage />} />
          <Route path="/connect/frequencia" element={<AttendancePage />} />
          <Route path="/connect/gerenciar-frequencia" element={<AttendanceManagePage />} />
          <Route path="/connect/relatorio" element={<ReportPage />} />
          <Route path="/connect/localizacao" element={<LocationPage />} />
          <Route path="/connect/contratos/alunos" element={<ContractsPage />} />
          <Route path="/connect/salario" element={<SalaryPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/hub" replace />} />
      <Route path="/dashboard" element={<Navigate to="/hub" replace />} />
      <Route path="*" element={<Navigate to="/hub" replace />} />
    </Routes>
  )
}
