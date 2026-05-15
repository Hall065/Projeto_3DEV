import { useState } from 'react';
import { Upload, CheckCircle2, Pause, Play } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';

const meusChamados = [
  {
    id: 'MAN-2026-040',
    titulo: 'Ar condicionado sem refrigeração - Lab 5',
    descricao: 'Equipamento liga mas não refrigera. Verificar gás e compressor.',
    area: 'HVAC',
    prioridade: 'Alta',
    dataAtribuicao: '18/03/2026 10:30',
    status: 'inProgress',
    anexosProblema: ['foto-ac-1.jpg', 'foto-ac-2.jpg'],
  },
  {
    id: 'MAN-2026-038',
    titulo: 'Cadeira quebrada - Sala Professores',
    descricao: 'Cadeira giratória com assento solto e base rachada.',
    area: 'Marcenaria',
    prioridade: 'Média',
    dataAtribuicao: '17/03/2026 14:00',
    status: 'pending',
    anexosProblema: ['foto-cadeira.jpg'],
  },
  {
    id: 'MAN-2026-035',
    titulo: 'Vazamento tubulação externa - Pátio',
    descricao: 'Vazamento visível na tubulação externa próximo ao portão principal.',
    area: 'Hidráulica',
    prioridade: 'Alta',
    dataAtribuicao: '17/03/2026 09:00',
    status: 'paused',
    anexosProblema: ['foto-vazamento.jpg'],
  },
];

export default function MeusChamados() {
  const [chamadoExpandido, setChamadoExpandido] = useState<string | null>(null);
  const [solucoes, setSolucoes] = useState<{ [key: string]: string }>({});
  const [arquivosSolucao, setArquivosSolucao] = useState<{ [key: string]: File[] }>({});

  const handleFileChange = (chamadoId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setArquivosSolucao(prev => ({
        ...prev,
        [chamadoId]: [...(prev[chamadoId] || []), ...newFiles]
      }));
    }
  };

  const handleConcluir = (chamadoId: string) => {
    if (!solucoes[chamadoId] || !arquivosSolucao[chamadoId]?.length) {
      alert('Por favor, descreva a solução e anexe fotos comprobatórias');
      return;
    }
    alert(`Chamado ${chamadoId} marcado como concluído!`);
  };

  const handleStatus = (chamadoId: string, status: string) => {
    alert(`Chamado ${chamadoId} marcado como ${status}`);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      inProgress: { label: 'Em Andamento', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      paused: { label: 'Pausado', className: 'bg-gray-100 text-gray-800 border-gray-200' },
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-gray-900">Meus Chamados</h1>
        <p className="text-gray-600 mt-1">Chamados atribuídos para você</p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-600">Em Andamento</p>
          <p className="text-2xl font-bold text-blue-600">
            {meusChamados.filter(c => c.status === 'inProgress').length}
          </p>
        </Card>
        <Card className="p-4 bg-white border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-600">Pendentes</p>
          <p className="text-2xl font-bold text-yellow-600">
            {meusChamados.filter(c => c.status === 'pending').length}
          </p>
        </Card>
        <Card className="p-4 bg-white border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-600">Pausados</p>
          <p className="text-2xl font-bold text-gray-600">
            {meusChamados.filter(c => c.status === 'paused').length}
          </p>
        </Card>
      </div>

      {/* Lista de Chamados */}
      <div className="space-y-4">
        {meusChamados.map((chamado) => (
          <Card key={chamado.id} className="bg-white border border-gray-200 shadow-sm overflow-hidden">
            {/* Header do Card */}
            <div 
              className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setChamadoExpandido(chamadoExpandido === chamado.id ? null : chamado.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{chamado.titulo}</h3>
                    {getStatusBadge(chamado.status)}
                    {getPrioridadeBadge(chamado.prioridade)}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">#{chamado.id} • {chamado.area}</p>
                  <p className="text-sm text-gray-500">Atribuído em: {chamado.dataAtribuicao}</p>
                </div>
              </div>
            </div>

            {/* Conteúdo Expandido */}
            {chamadoExpandido === chamado.id && (
              <div className="px-6 pb-6 border-t border-gray-200 pt-6 space-y-6">
                {/* Descrição do Problema */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Descrição do Problema</h4>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{chamado.descricao}</p>
                </div>

                {/* Anexos do Problema */}
                {chamado.anexosProblema.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Fotos do Problema</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {chamado.anexosProblema.map((anexo, index) => (
                        <div key={index} className="aspect-square bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                          <span className="text-xs text-gray-500">{anexo}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Solução */}
                <div className="bg-blue-50 p-6 rounded-lg space-y-4">
                  <h4 className="font-medium text-gray-900">Registrar Solução</h4>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">O que foi feito?</label>
                    <Textarea
                      value={solucoes[chamado.id] || ''}
                      onChange={(e) => setSolucoes({ ...solucoes, [chamado.id]: e.target.value })}
                      placeholder="Descreva detalhadamente a solução aplicada, peças trocadas, materiais utilizados..."
                      className="min-h-24 bg-white border-gray-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Provas da Solução (Fotos)</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-[#005EB8] transition-colors bg-white">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleFileChange(chamado.id, e)}
                        className="hidden"
                        id={`file-upload-${chamado.id}`}
                      />
                      <label htmlFor={`file-upload-${chamado.id}`} className="cursor-pointer">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Clique para anexar fotos da solução</p>
                      </label>
                    </div>

                    {arquivosSolucao[chamado.id]?.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                        {arquivosSolucao[chamado.id].map((file, index) => (
                          <div key={index} className="aspect-square bg-gray-100 rounded-lg border border-gray-200 p-2 flex items-center justify-center">
                            <span className="text-xs text-gray-600 text-center truncate">{file.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex gap-3 pt-4">
                  {chamado.status === 'paused' ? (
                    <button
                      onClick={() => handleStatus(chamado.id, 'Em Andamento')}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Retomar
                    </button>
                  ) : chamado.status === 'pending' ? (
                    <button
                      onClick={() => handleStatus(chamado.id, 'Em Andamento')}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Iniciar
                    </button>
                  ) : null}

                  {chamado.status === 'inProgress' && (
                    <button
                      onClick={() => handleStatus(chamado.id, 'Pausado')}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Pause className="w-4 h-4" />
                      Pausar
                    </button>
                  )}

                  <button
                    onClick={() => handleConcluir(chamado.id)}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Marcar como Concluído
                  </button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
