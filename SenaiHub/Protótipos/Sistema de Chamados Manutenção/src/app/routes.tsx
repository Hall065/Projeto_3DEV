import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import Dashboard from './pages/Dashboard';
import ListaChamados from './pages/ListaChamados';
import AbrirChamado from './pages/AbrirChamado';
import DetalhesChamado from './pages/DetalhesChamado';
import AnaliseDelegacao from './pages/AnaliseDelegacao';
import MeusChamados from './pages/MeusChamados';
import Relatorios from './pages/Relatorios';
import Configuracoes from './pages/Configuracoes';
import Estoque from './pages/Estoque';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout><Dashboard /></Layout>,
  },
  {
    path: '/meus-chamados',
    element: <Layout><MeusChamados /></Layout>,
  },
  {
    path: '/abrir-chamado',
    element: <Layout><AbrirChamado /></Layout>,
  },
  {
    path: '/lista-chamados',
    element: <Layout><ListaChamados /></Layout>,
  },
  {
    path: '/chamado/:id',
    element: <Layout><DetalhesChamado /></Layout>,
  },
  {
    path: '/analise/:id',
    element: <Layout><AnaliseDelegacao /></Layout>,
  },
  {
    path: '/relatorios',
    element: <Layout><Relatorios /></Layout>,
  },
  {
    path: '/estoque',
    element: <Layout><Estoque /></Layout>,
  },
  {
    path: '/configuracoes',
    element: <Layout><Configuracoes /></Layout>,
  },
]);