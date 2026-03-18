import { useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const chamadosPorSetor = [
  { setor: 'Hidráulica', quantidade: 45 },
  { setor: 'Elétrica', quantidade: 38 },
  { setor: 'HVAC', quantidade: 32 },
  { setor: 'Marcenaria', quantidade: 28 },
  { setor: 'Serralheria', quantidade: 22 },
  { setor: 'Pintura', quantidade: 18 },
];

const tempoMedioResolucao = [
  { mes: 'Jan', dias: 3.2 },
  { mes: 'Fev', dias: 2.8 },
  { mes: 'Mar', dias: 2.5 },
  { mes: 'Abr', dias: 3.1 },
  { mes: 'Mai', dias: 2.9 },
  { mes: 'Jun', dias: 2.6 },
];

const relatorioDados = [
  { id: 'MAN-2026-042', area: 'Hidráulica', status: 'Resolvido', prioridade: 'Alta', abertura: '18/03/2026', conclusao: '19/03/2026', tempo: '1 dia' },
  { id: 'MAN-2026-041', area: 'Elétrica', status: 'Em Andamento', prioridade: 'Média', abertura: '18/03/2026', conclusao: '-', tempo: '-' },
  { id: 'MAN-2026-040', area: 'HVAC', status: 'Em Andamento', prioridade: 'Alta', abertura: '17/03/2026', conclusao: '-', tempo: '-' },
  { id: 'MAN-2026-039', area: 'Serralheria', status: 'Resolvido', prioridade: 'Baixa', abertura: '17/03/2026', conclusao: '17/03/2026', tempo: '4 horas' },
  { id: 'MAN-2026-038', area: 'Marcenaria', status: 'Pendente', prioridade: 'Média', abertura: '17/03/2026', conclusao: '-', tempo: '-' },
  { id: 'MAN-2026-037', area: 'Pintura', status: 'Em Andamento', prioridade: 'Baixa', abertura: '16/03/2026', conclusao: '-', tempo: '-' },
  { id: 'MAN-2026-036', area: 'Elétrica', status: 'Resolvido', prioridade: 'Crítica', abertura: '16/03/2026', conclusao: '16/03/2026', tempo: '2 horas' },
];

export default function Relatorios() {
  const [filtroArea, setFiltroArea] = useState('all');
  const [filtroPeriodo, setFiltroPeriodo] = useState('mensal');

  const handleExportExcel = () => {
    alert('Exportando relatório para Excel...');
  };

  const handleImportCSV = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        alert(`Importando arquivo: ${file.name}`);
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900">Relatórios</h1>
          <p className="text-gray-600 mt-1">Análise e estatísticas do sistema</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleImportCSV}
            className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg flex items-center gap-2 border border-gray-300 transition-colors shadow-sm"
          >
            <Upload className="w-4 h-4" />
            <span>Importar CSV</span>
          </button>
          <button 
            onClick={handleExportExcel}
            className="bg-[#005EB8] hover:bg-[#004a8f] text-white px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Excel</span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="p-4 bg-white border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select value={filtroArea} onValueChange={setFiltroArea}>
            <SelectTrigger className="bg-white border-gray-300">
              <SelectValue placeholder="Todas as Áreas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Áreas</SelectItem>
              <SelectItem value="hidraulica">Hidráulica</SelectItem>
              <SelectItem value="eletrica">Elétrica</SelectItem>
              <SelectItem value="hvac">HVAC</SelectItem>
              <SelectItem value="marcenaria">Marcenaria</SelectItem>
              <SelectItem value="serralheria">Serralheria</SelectItem>
              <SelectItem value="pintura">Pintura</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filtroPeriodo} onValueChange={setFiltroPeriodo}>
            <SelectTrigger className="bg-white border-gray-300">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semanal">Última Semana</SelectItem>
              <SelectItem value="mensal">Último Mês</SelectItem>
              <SelectItem value="trimestral">Último Trimestre</SelectItem>
              <SelectItem value="anual">Último Ano</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center justify-end">
            <p className="text-sm text-gray-600">
              Período: <span className="font-semibold">Março 2026</span>
            </p>
          </div>
        </div>
      </Card>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chamados por Setor */}
        <Card className="p-6 bg-white border border-gray-200 shadow-sm">
          <h2 className="text-xl text-gray-900 mb-4">Chamados por Setor</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chamadosPorSetor}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="setor" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="quantidade" fill="#005EB8" name="Quantidade" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Tempo Médio de Resolução */}
        <Card className="p-6 bg-white border border-gray-200 shadow-sm">
          <h2 className="text-xl text-gray-900 mb-4">Tempo Médio de Resolução</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={tempoMedioResolucao}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="dias" stroke="#F15A22" strokeWidth={2} name="Dias" />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-sm text-gray-600 mt-4 text-center">
            Média atual: <span className="font-semibold text-[#005EB8]">2.6 dias</span>
          </p>
        </Card>
      </div>

      {/* Tabela Detalhada */}
      <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl text-gray-900">Relatório Detalhado</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Código</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Área</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Prioridade</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Abertura</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Conclusão</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Tempo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {relatorioDados.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-[#005EB8]">{item.id}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{item.area}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm px-2 py-1 rounded ${
                      item.status === 'Resolvido' ? 'bg-green-100 text-green-800' :
                      item.status === 'Em Andamento' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{item.prioridade}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">{item.abertura}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">{item.conclusao}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">{item.tempo}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-600">Total de Chamados</p>
          <p className="text-2xl font-bold text-[#005EB8]">183</p>
          <p className="text-xs text-gray-500 mt-1">Março 2026</p>
        </Card>
        <Card className="p-4 bg-white border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-600">Taxa de Resolução</p>
          <p className="text-2xl font-bold text-green-600">87%</p>
          <p className="text-xs text-gray-500 mt-1">Meta: 85%</p>
        </Card>
        <Card className="p-4 bg-white border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-600">SLA Cumprido</p>
          <p className="text-2xl font-bold text-[#F15A22]">92%</p>
          <p className="text-xs text-gray-500 mt-1">Meta: 90%</p>
        </Card>
        <Card className="p-4 bg-white border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-600">Custo Total</p>
          <p className="text-2xl font-bold text-gray-900">R$ 12.450</p>
          <p className="text-xs text-gray-500 mt-1">Orçado: R$ 15.000</p>
        </Card>
      </div>
    </div>
  );
}
