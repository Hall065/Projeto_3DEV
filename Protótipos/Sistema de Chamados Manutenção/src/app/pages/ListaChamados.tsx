import { useState } from 'react';
import { Link } from 'react-router';
import { Plus, Download, Search } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const chamados = [
  { id: 'MAN-2026-042', area: 'Hidráulica', solicitante: 'Maria Santos', status: 'urgent', prioridade: 'Alta', dataAbertura: '18/03/2026', prazo: '20/03/2026' },
  { id: 'MAN-2026-041', area: 'Elétrica', solicitante: 'Carlos Oliveira', status: 'pending', prioridade: 'Média', dataAbertura: '18/03/2026', prazo: '25/03/2026' },
  { id: 'MAN-2026-040', area: 'HVAC', solicitante: 'Ana Paula', status: 'inProgress', prioridade: 'Alta', dataAbertura: '17/03/2026', prazo: '22/03/2026' },
  { id: 'MAN-2026-039', area: 'Serralheria', solicitante: 'Pedro Costa', status: 'resolved', prioridade: 'Baixa', dataAbertura: '17/03/2026', prazo: '24/03/2026' },
  { id: 'MAN-2026-038', area: 'Marcenaria', solicitante: 'Julia Ferreira', status: 'pending', prioridade: 'Média', dataAbertura: '17/03/2026', prazo: '24/03/2026' },
  { id: 'MAN-2026-037', area: 'Pintura', solicitante: 'Roberto Lima', status: 'inProgress', prioridade: 'Baixa', dataAbertura: '16/03/2026', prazo: '30/03/2026' },
  { id: 'MAN-2026-036', area: 'Elétrica', solicitante: 'Fernanda Silva', status: 'resolved', prioridade: 'Crítica', dataAbertura: '16/03/2026', prazo: '17/03/2026' },
  { id: 'MAN-2026-035', area: 'Hidráulica', solicitante: 'Lucas Martins', status: 'urgent', prioridade: 'Alta', dataAbertura: '15/03/2026', prazo: '19/03/2026' },
];

const getStatusBadge = (status: string) => {
  const variants = {
    urgent: { label: 'Urgente', className: 'bg-red-100 text-red-800 border-red-200' },
    pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    inProgress: { label: 'Em Andamento', className: 'bg-blue-100 text-blue-800 border-blue-200' },
    resolved: { label: 'Resolvido', className: 'bg-green-100 text-green-800 border-green-200' },
  };
  const variant = variants[status as keyof typeof variants];
  return <Badge className={`${variant.className} border`}>{variant.label}</Badge>;
};

const getPrioridadeBadge = (prioridade: string) => {
  const variants = {
    'Crítica': 'bg-purple-100 text-purple-800 border-purple-200',
    'Alta': 'bg-red-100 text-red-800 border-red-200',
    'Média': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Baixa': 'bg-gray-100 text-gray-800 border-gray-200',
  };
  return <Badge className={`${variants[prioridade as keyof typeof variants]} border`}>{prioridade}</Badge>;
};

export default function ListaChamados() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSetor, setFilterSetor] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredChamados = chamados.filter(chamado => {
    const matchSearch = chamado.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       chamado.solicitante.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSetor = filterSetor === 'all' || chamado.area === filterSetor;
    const matchStatus = filterStatus === 'all' || chamado.status === filterStatus;
    return matchSearch && matchSetor && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl text-gray-900">Lista de Chamados</h1>
        <div className="flex gap-3">
          <button className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg flex items-center gap-2 border border-gray-300 transition-colors shadow-sm">
            <Download className="w-4 h-4" />
            <span>Exportar Excel</span>
          </button>
          <Link
            to="/abrir-chamado"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Abrir Chamado</span>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-white border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Buscar por código ou solicitante..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-gray-300"
            />
          </div>

          <Select value={filterSetor} onValueChange={setFilterSetor}>
            <SelectTrigger className="bg-white border-gray-300">
              <SelectValue placeholder="Todos os Setores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Setores</SelectItem>
              <SelectItem value="Hidráulica">Hidráulica</SelectItem>
              <SelectItem value="Elétrica">Elétrica</SelectItem>
              <SelectItem value="HVAC">HVAC</SelectItem>
              <SelectItem value="Serralheria">Serralheria</SelectItem>
              <SelectItem value="Marcenaria">Marcenaria</SelectItem>
              <SelectItem value="Pintura">Pintura</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="bg-white border-gray-300">
              <SelectValue placeholder="Todos os Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="inProgress">Em Andamento</SelectItem>
              <SelectItem value="resolved">Resolvido</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center justify-end">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">{filteredChamados.length}</span> chamados encontrados
            </p>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Código</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Área</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Solicitante</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Prioridade</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Abertura</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Prazo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredChamados.map((chamado) => (
                <tr 
                  key={chamado.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => window.location.href = `/chamado/${chamado.id}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-[#005EB8]">{chamado.id}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{chamado.area}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{chamado.solicitante}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(chamado.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getPrioridadeBadge(chamado.prioridade)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">{chamado.dataAbertura}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">{chamado.prazo}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
