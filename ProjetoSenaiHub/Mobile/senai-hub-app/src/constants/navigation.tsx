import { ClipboardList, GraduationCap, Home, Package, Users, Wrench } from 'lucide-react-native';
import type { DrawerMenuItem } from '@/components/layout/SidebarDrawer';
import type { NavItem } from '@/components/layout/BottomNav';
import { connectTheme, gridTheme } from '@/constants/colors';
import { ROUTES } from '@/constants/routes';

export const CONNECT_DRAWER_ITEMS: DrawerMenuItem[] = [
  { label: 'Visão geral', route: ROUTES.connect.index },
  { label: 'Alunos', route: ROUTES.connect.alunos },
  { label: 'Professores', route: ROUTES.connect.professores },
  { label: 'Turmas', route: ROUTES.connect.turmas },
  { label: 'Cursos', route: ROUTES.connect.cursos },
  { label: 'Empresas', route: ROUTES.connect.empresas },
  { label: 'Frequência', route: ROUTES.connect.frequencia },
  { label: 'Gerenciar frequência', route: ROUTES.connect.gerenciarFrequencia },
  { label: 'Relatórios', route: ROUTES.connect.relatorios },
  { label: 'Localização', route: ROUTES.connect.localizacao },
  { label: 'Contratos', route: ROUTES.connect.contratos },
  { label: 'Contrato alunos', route: ROUTES.connect.contratoAlunos },
  { label: 'Salário', route: ROUTES.connect.salario },
];

export const GRID_DRAWER_ITEMS: DrawerMenuItem[] = [
  { label: 'Dashboard', route: ROUTES.grid.index },
  { label: 'Chamados', route: ROUTES.grid.chamados },
  { label: 'Tarefas', route: ROUTES.grid.tarefas },
  { label: 'Relatórios', route: ROUTES.grid.relatorios },
  { label: 'Estoque', route: ROUTES.grid.estoque },
  { label: 'Mapa de tarefas', route: ROUTES.grid.mapaTarefas },
  { label: 'Usuários', route: ROUTES.grid.usuarios },
];

export const CONNECT_BOTTOM_NAV: NavItem[] = [
  { label: 'Início', route: ROUTES.connect.index, icon: <Home size={20} color={connectTheme.primary} /> },
  { label: 'Alunos', route: ROUTES.connect.alunos, icon: <Users size={20} color={connectTheme.primary} /> },
  { label: 'Turmas', route: ROUTES.connect.turmas, icon: <GraduationCap size={20} color={connectTheme.primary} /> },
  { label: 'Frequência', route: ROUTES.connect.frequencia, icon: <ClipboardList size={20} color={connectTheme.primary} /> },
];

export const GRID_BOTTOM_NAV: NavItem[] = [
  { label: 'Início', route: ROUTES.grid.index, icon: <Home size={20} color={gridTheme.primary} /> },
  { label: 'Chamados', route: ROUTES.grid.chamados, icon: <Wrench size={20} color={gridTheme.primary} /> },
  { label: 'Tarefas', route: ROUTES.grid.tarefas, icon: <ClipboardList size={20} color={gridTheme.primary} /> },
  { label: 'Estoque', route: ROUTES.grid.estoque, icon: <Package size={20} color={gridTheme.primary} /> },
];
