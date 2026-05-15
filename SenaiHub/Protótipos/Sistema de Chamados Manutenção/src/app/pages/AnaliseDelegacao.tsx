import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, CheckCircle2, Send } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { Input } from '../components/ui/input';

export default function AnaliseDelegacao() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [prioridade, setPrioridade] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [precisaExterno, setPrecisaExterno] = useState(false);
  const [empresa, setEmpresa] = useState('');
  const [orcamento, setOrcamento] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const chamado = {
    id: id || 'MAN-2026-001',
    titulo: 'Vazamento na torneira do banheiro - Bloco A',
    area: 'Hidráulica',
    solicitante: 'Maria Santos',
    statusAtual: 'pending',
    descricao: 'Torneira do banheiro feminino do 2º andar está com vazamento constante. A água fica pingando mesmo com o registro fechado.',
    dataAbertura: '18/03/2026 09:30',
  };

  const tecnicos = [
    { id: '1', nome: 'Pedro Silva', especialidade: 'Hidráulica' },
    { id: '2', nome: 'João Pereira', especialidade: 'Hidráulica' },
    { id: '3', nome: 'Roberto Santos', especialidade: 'Elétrica' },
    { id: '4', nome: 'Carlos Mendes', especialidade: 'HVAC' },
    { id: '5', nome: 'José Oliveira', especialidade: 'Serralheria' },
  ];

  const handleDelegar = () => {
    setShowSuccess(true);
    setTimeout(() => {
      navigate(`/chamado/${id}`);
    }, 2000);
  };

  const handleEncaminharFinanceiro = () => {
    // Lógica para encaminhar ao financeiro
    alert('Chamado encaminhado ao setor financeiro para aprovação de orçamento');
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl text-gray-900">Análise e Delegação</h1>
          <p className="text-gray-600 mt-1">Chamado #{chamado.id}</p>
        </div>
      </div>

      {showSuccess && (
        <Card className="p-4 bg-green-50 border-green-200 border">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-green-900">Chamado delegado com sucesso!</p>
              <p className="text-sm text-green-700">O técnico receberá a notificação.</p>
            </div>
          </div>
        </Card>
      )}

      {/* Informações do Chamado */}
      <Card className="p-6 bg-white border border-gray-200 shadow-sm">
        <h2 className="text-xl text-gray-900 mb-4">Informações do Chamado</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Solicitante</p>
            <p className="font-medium text-gray-900">{chamado.solicitante}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Área</p>
            <p className="font-medium text-gray-900">{chamado.area}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-gray-600 mb-2">Descrição</p>
            <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{chamado.descricao}</p>
          </div>
        </div>
      </Card>

      {/* Formulário de Análise */}
      <Card className="p-6 bg-white border border-gray-200 shadow-sm">
        <h2 className="text-xl text-gray-900 mb-6">Análise Técnica</h2>

        <div className="space-y-6">
          {/* Prioridade Real */}
          <div className="space-y-3">
            <Label>Prioridade Real *</Label>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => setPrioridade('critica')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  prioridade === 'critica'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-purple-600 mx-auto mb-2"></div>
                <p className="font-medium text-sm">Crítica</p>
                <p className="text-xs text-gray-600">Urgente</p>
              </button>

              <button
                type="button"
                onClick={() => setPrioridade('alta')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  prioridade === 'alta'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-red-300'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-red-600 mx-auto mb-2"></div>
                <p className="font-medium text-sm">Alta</p>
                <p className="text-xs text-gray-600">&lt; 24h</p>
              </button>

              <button
                type="button"
                onClick={() => setPrioridade('media')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  prioridade === 'media'
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-gray-200 hover:border-yellow-300'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-yellow-600 mx-auto mb-2"></div>
                <p className="font-medium text-sm">Média</p>
                <p className="text-xs text-gray-600">&lt; 3 dias</p>
              </button>

              <button
                type="button"
                onClick={() => setPrioridade('baixa')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  prioridade === 'baixa'
                    ? 'border-gray-500 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-gray-600 mx-auto mb-2"></div>
                <p className="font-medium text-sm">Baixa</p>
                <p className="text-xs text-gray-600">&lt; 7 dias</p>
              </button>
            </div>
          </div>

          {/* Responsável */}
          <div className="space-y-2">
            <Label htmlFor="responsavel">Técnico Responsável *</Label>
            <Select value={responsavel} onValueChange={setResponsavel}>
              <SelectTrigger id="responsavel" className="bg-white border-gray-300">
                <SelectValue placeholder="Selecione o técnico" />
              </SelectTrigger>
              <SelectContent>
                {tecnicos.map((tecnico) => (
                  <SelectItem key={tecnico.id} value={tecnico.id}>
                    {tecnico.nome} - {tecnico.especialidade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Serviço Externo */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="externo" 
                checked={precisaExterno}
                onCheckedChange={(checked) => setPrecisaExterno(checked as boolean)}
              />
              <Label 
                htmlFor="externo"
                className="cursor-pointer"
              >
                Precisa de Serviço Externo (Terceirizado)
              </Label>
            </div>

            {precisaExterno && (
              <div className="space-y-4 mt-4 pl-6">
                <div className="space-y-2">
                  <Label htmlFor="empresa">Empresa/Prestador</Label>
                  <Input
                    id="empresa"
                    value={empresa}
                    onChange={(e) => setEmpresa(e.target.value)}
                    placeholder="Nome da empresa terceirizada"
                    className="bg-white border-gray-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orcamento">Valor Orçamento (R$)</Label>
                  <Input
                    id="orcamento"
                    type="number"
                    value={orcamento}
                    onChange={(e) => setOrcamento(e.target.value)}
                    placeholder="0,00"
                    className="bg-white border-gray-300"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Complexidade/Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Complexidade e Observações</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Descreva a complexidade do problema, materiais necessários, tempo estimado, etc..."
              className="min-h-32 bg-white border-gray-300"
            />
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            
            {precisaExterno && (
              <button
                type="button"
                onClick={handleEncaminharFinanceiro}
                className="px-6 py-2.5 bg-[#F15A22] hover:bg-[#d94d1a] text-white rounded-lg transition-colors flex items-center gap-2"
                disabled={!prioridade || !responsavel || !empresa || !orcamento}
              >
                <Send className="w-4 h-4" />
                Encaminhar Financeiro
              </button>
            )}
            
            <button
              type="button"
              onClick={handleDelegar}
              className="flex-1 bg-[#005EB8] hover:bg-[#004a8f] text-white px-6 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
              disabled={!prioridade || !responsavel}
            >
              <CheckCircle2 className="w-4 h-4" />
              Delegar Chamado
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
