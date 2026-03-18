import { useState } from 'react';
import { Plus, Search, Package, AlertTriangle, TrendingDown } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const itensEstoque = [
  { id: 1, codigo: 'EST-001', nome: 'Torneira 1/2"', categoria: 'Hidráulica', quantidade: 45, minimo: 20, status: 'ok' },
  { id: 2, codigo: 'EST-002', nome: 'Lâmpada LED 12W', categoria: 'Elétrica', quantidade: 8, minimo: 15, status: 'baixo' },
  { id: 3, codigo: 'EST-003', nome: 'Filtro Ar Condicionado', categoria: 'HVAC', quantidade: 12, minimo: 10, status: 'ok' },
  { id: 4, codigo: 'EST-004', nome: 'Fechadura Porta', categoria: 'Serralheria', quantidade: 3, minimo: 8, status: 'critico' },
  { id: 5, codigo: 'EST-005', nome: 'Tinta Branca 18L', categoria: 'Pintura', quantidade: 25, minimo: 10, status: 'ok' },
  { id: 6, codigo: 'EST-006', nome: 'Cano PVC 3/4"', categoria: 'Hidráulica', quantidade: 6, minimo: 15, status: 'baixo' },
  { id: 7, codigo: 'EST-007', nome: 'Disjuntor 20A', categoria: 'Elétrica', quantidade: 18, minimo: 10, status: 'ok' },
  { id: 8, codigo: 'EST-008', nome: 'Dobradiça 3"', categoria: 'Serralheria', quantidade: 32, minimo: 20, status: 'ok' },
];

export default function Estoque() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredItens = itensEstoque.filter(item => {
    const matchSearch = item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       item.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategoria = filterCategoria === 'all' || item.categoria === filterCategoria;
    const matchStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchSearch && matchCategoria && matchStatus;
  });

  const getStatusBadge = (status: string, quantidade: number, minimo: number) => {
    if (status === 'critico') {
      return <Badge className="bg-red-100 text-red-800 border-red-200 border">Crítico</Badge>;
    } else if (status === 'baixo') {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 border">Baixo</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800 border-green-200 border">OK</Badge>;
  };

  const itensCriticos = itensEstoque.filter(i => i.status === 'critico').length;
  const itensBaixos = itensEstoque.filter(i => i.status === 'baixo').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900">Estoque</h1>
          <p className="text-gray-600 mt-1">Gerenciamento de materiais e peças</p>
        </div>
        <button className="bg-[#005EB8] hover:bg-[#004a8f] text-white px-6 py-2.5 rounded-lg flex items-center gap-2 transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          <span>Adicionar Item</span>
        </button>
      </div>

      {/* Cards KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total de Itens</p>
              <p className="text-3xl font-bold text-[#005EB8]">{itensEstoque.length}</p>
              <p className="text-xs text-gray-500 mt-1">Categorias diversas</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Package className="w-6 h-6 text-[#005EB8]" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Estoque Baixo</p>
              <p className="text-3xl font-bold text-yellow-600">{itensBaixos}</p>
              <p className="text-xs text-gray-500 mt-1">Atenção necessária</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <TrendingDown className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Nível Crítico</p>
              <p className="text-3xl font-bold text-red-600">{itensCriticos}</p>
              <p className="text-xs text-gray-500 mt-1">Reposição urgente</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-4 bg-white border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Buscar por nome ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-gray-300"
            />
          </div>

          <Select value={filterCategoria} onValueChange={setFilterCategoria}>
            <SelectTrigger className="bg-white border-gray-300">
              <SelectValue placeholder="Todas as Categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Categorias</SelectItem>
              <SelectItem value="Hidráulica">Hidráulica</SelectItem>
              <SelectItem value="Elétrica">Elétrica</SelectItem>
              <SelectItem value="HVAC">HVAC</SelectItem>
              <SelectItem value="Serralheria">Serralheria</SelectItem>
              <SelectItem value="Pintura">Pintura</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="bg-white border-gray-300">
              <SelectValue placeholder="Todos os Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="ok">OK</SelectItem>
              <SelectItem value="baixo">Estoque Baixo</SelectItem>
              <SelectItem value="critico">Crítico</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center justify-end">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">{filteredItens.length}</span> itens
            </p>
          </div>
        </div>
      </Card>

      {/* Tabela de Estoque */}
      <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Código</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Categoria</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Quantidade</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Mínimo</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredItens.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-[#005EB8]">{item.codigo}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{item.nome}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">{item.categoria}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-semibold ${
                      item.quantidade <= item.minimo ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {item.quantidade}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">{item.minimo}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(item.status, item.quantidade, item.minimo)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button className="text-[#005EB8] hover:underline text-sm mr-3">
                      Editar
                    </button>
                    <button className="text-[#F15A22] hover:underline text-sm">
                      Requisitar
                    </button>
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
