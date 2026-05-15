import { Link } from 'react-router';
import { AlertCircle, Clock, CheckCircle2, TrendingUp, ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const statusData = [
  { name: 'Abertos', value: 12, color: '#dc2626' },
  { name: 'Pendentes', value: 8, color: '#f59e0b' },
  { name: 'Em Andamento', value: 15, color: '#3b82f6' },
  { name: 'Resolvidos', value: 45, color: '#10b981' },
];

const recentTickets = [
  {
    id: 'MAN-2026-042',
    title: 'Vazamento na torneira do banheiro - Bloco A',
    area: 'Hidráulica',
    status: 'urgent',
    date: '18/03/2026 09:30',
    user: 'Maria Santos'
  },
  {
    id: 'MAN-2026-041',
    title: 'Lâmpada queimada sala 203',
    area: 'Elétrica',
    status: 'pending',
    date: '18/03/2026 08:15',
    user: 'Carlos Oliveira'
  },
  {
    id: 'MAN-2026-040',
    title: 'Ar condicionado sem refrigeração - Lab 5',
    area: 'HVAC',
    status: 'inProgress',
    date: '17/03/2026 16:45',
    user: 'Ana Paula'
  },
  {
    id: 'MAN-2026-039',
    title: 'Porta travada - Almoxarifado',
    area: 'Serralheria',
    status: 'resolved',
    date: '17/03/2026 14:20',
    user: 'Pedro Costa'
  },
  {
    id: 'MAN-2026-038',
    title: 'Cadeira quebrada - Sala Professores',
    area: 'Marcenaria',
    status: 'pending',
    date: '17/03/2026 11:00',
    user: 'Julia Ferreira'
  },
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

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl text-gray-900">Dashboard</h1>
        <Link 
          to="/abrir-chamado"
          className="bg-[#F15A22] hover:bg-[#d94d1a] text-white px-6 py-2.5 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        >
          <span>Abrir Chamado</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/lista-chamados">
          <Card className="p-6 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Chamados Abertos Hoje</p>
                <p className="text-3xl font-bold text-red-600">12</p>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +3 desde ontem
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </Card>
        </Link>

        <Card className="p-6 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pendentes</p>
              <p className="text-3xl font-bold text-yellow-600">8</p>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Aguardando análise
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Resolvidos Semana</p>
              <p className="text-3xl font-bold text-green-600">45</p>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Meta: 40/semana
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Chart */}
        <Card className="p-6 bg-white border border-gray-200 shadow-sm">
          <h2 className="text-xl text-gray-900 mb-4">Status dos Chamados</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Recent Tickets Feed */}
        <Card className="p-6 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl text-gray-900">Últimos Chamados</h2>
            <Link to="/lista-chamados" className="text-sm text-[#005EB8] hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="space-y-4">
            {recentTickets.map((ticket) => (
              <Link
                key={ticket.id}
                to={`/chamado/${ticket.id}`}
                className="block border border-gray-200 rounded-lg p-4 hover:border-[#005EB8] hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-gray-700">
                      {ticket.user.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-medium text-gray-900 text-sm">{ticket.title}</p>
                      {getStatusBadge(ticket.status)}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <span>#{ticket.id}</span>
                      <span>•</span>
                      <span>{ticket.area}</span>
                      <span>•</span>
                      <span>{ticket.date}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">por {ticket.user}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}