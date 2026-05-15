import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { ArrowLeft, Paperclip, MessageSquare, Clock, User, Calendar } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';

export default function DetalhesChamado() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [novoComentario, setNovoComentario] = useState('');

  const chamado = {
    id: id || 'MAN-2026-001',
    titulo: 'Vazamento na torneira do banheiro - Bloco A',
    area: 'Hidráulica',
    solicitante: 'Maria Santos',
    status: 'inProgress',
    prioridade: 'Alta',
    impacto: 'Alto',
    dataAbertura: '18/03/2026 09:30',
    prazo: '20/03/2026 17:00',
    descricao: 'Torneira do banheiro feminino do 2º andar está com vazamento constante. A água fica pingando mesmo com o registro fechado, causando desperdício e ruído. O problema começou ontem à tarde após uma limpeza.',
    anexos: [
      { nome: 'foto-torneira-1.jpg', url: '#' },
      { nome: 'foto-torneira-2.jpg', url: '#' },
    ],
    timeline: [
      {
        tipo: 'abertura',
        responsavel: 'Maria Santos',
        data: '18/03/2026 09:30',
        descricao: 'Chamado aberto'
      },
      {
        tipo: 'analise',
        responsavel: 'Carlos Mendes (Analista)',
        data: '18/03/2026 10:15',
        descricao: 'Chamado analisado e classificado como prioridade Alta'
      },
      {
        tipo: 'delegacao',
        responsavel: 'Carlos Mendes (Analista)',
        data: '18/03/2026 10:20',
        descricao: 'Delegado para Pedro Silva - Equipe Hidráulica'
      },
      {
        tipo: 'andamento',
        responsavel: 'Pedro Silva (Técnico)',
        data: '18/03/2026 11:00',
        descricao: 'Iniciado atendimento. Verificando necessidade de troca do registro.'
      },
    ],
    comentarios: [
      {
        usuario: 'Carlos Mendes',
        cargo: 'Analista de Manutenção',
        data: '18/03/2026 10:18',
        texto: 'Verificado que é necessária troca do registro. Material disponível no almoxarifado.'
      },
      {
        usuario: 'Pedro Silva',
        cargo: 'Técnico Hidráulica',
        data: '18/03/2026 11:05',
        texto: 'Confirmo necessidade de troca. Previsão de conclusão até amanhã meio-dia.'
      },
    ]
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      urgent: { label: 'Urgente', className: 'bg-red-100 text-red-800 border-red-200' },
      pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      inProgress: { label: 'Em Andamento', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      resolved: { label: 'Resolvido', className: 'bg-green-100 text-green-800 border-green-200' },
    };
    const variant = variants[status as keyof typeof variants];
    return <Badge className={`${variant.className} border text-sm`}>{variant.label}</Badge>;
  };

  const getPrioridadeBadge = (prioridade: string) => {
    const variants = {
      'Crítica': 'bg-purple-100 text-purple-800 border-purple-200',
      'Alta': 'bg-red-100 text-red-800 border-red-200',
      'Média': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Baixa': 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return <Badge className={`${variants[prioridade as keyof typeof variants]} border text-sm`}>{prioridade}</Badge>;
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    // Aqui seria a lógica para adicionar o comentário
    setNovoComentario('');
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl text-gray-900">#{chamado.id}</h1>
          <p className="text-gray-600 mt-1">{chamado.titulo}</p>
        </div>
        <Link
          to={`/analise/${chamado.id}`}
          className="bg-[#005EB8] hover:bg-[#004a8f] text-white px-6 py-2.5 rounded-lg transition-colors shadow-sm"
        >
          Analisar/Delegar
        </Link>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">Status</p>
          {getStatusBadge(chamado.status)}
        </Card>
        <Card className="p-4 bg-white border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">Prioridade</p>
          {getPrioridadeBadge(chamado.prioridade)}
        </Card>
        <Card className="p-4 bg-white border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">Área</p>
          <p className="font-medium text-gray-900">{chamado.area}</p>
        </Card>
        <Card className="p-4 bg-white border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">Prazo</p>
          <p className="font-medium text-gray-900">{chamado.prazo}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Descrição */}
          <Card className="p-6 bg-white border border-gray-200 shadow-sm">
            <h2 className="text-xl text-gray-900 mb-4">Descrição do Problema</h2>
            <p className="text-gray-700 leading-relaxed">{chamado.descricao}</p>
          </Card>

          {/* Anexos */}
          {chamado.anexos.length > 0 && (
            <Card className="p-6 bg-white border border-gray-200 shadow-sm">
              <h2 className="text-xl text-gray-900 mb-4">Anexos</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {chamado.anexos.map((anexo, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-[#005EB8] transition-colors cursor-pointer">
                    <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                      <Paperclip className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-700 truncate">{anexo.nome}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Comentários */}
          <Card className="p-6 bg-white border border-gray-200 shadow-sm">
            <h2 className="text-xl text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Comentários
            </h2>
            
            <div className="space-y-4 mb-6">
              {chamado.comentarios.map((comentario, index) => (
                <div key={index} className="border-l-4 border-[#005EB8] pl-4 py-2">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-[#005EB8] rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900">{comentario.usuario}</p>
                        <span className="text-sm text-gray-500">• {comentario.cargo}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-1">{comentario.texto}</p>
                      <p className="text-xs text-gray-500">{comentario.data}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Adicionar Comentário */}
            <form onSubmit={handleAddComment} className="space-y-3 border-t pt-4">
              <Textarea
                value={novoComentario}
                onChange={(e) => setNovoComentario(e.target.value)}
                placeholder="Adicionar comentário..."
                className="bg-white border-gray-300"
              />
              <button
                type="submit"
                className="bg-[#005EB8] hover:bg-[#004a8f] text-white px-6 py-2 rounded-lg transition-colors"
                disabled={!novoComentario.trim()}
              >
                Enviar Comentário
              </button>
            </form>
          </Card>
        </div>

        {/* Sidebar - Timeline */}
        <div className="space-y-6">
          <Card className="p-6 bg-white border border-gray-200 shadow-sm">
            <h2 className="text-xl text-gray-900 mb-4">Informações</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Solicitante</p>
                  <p className="font-medium text-gray-900">{chamado.solicitante}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Data Abertura</p>
                  <p className="font-medium text-gray-900">{chamado.dataAbertura}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Impacto</p>
                  <p className="font-medium text-gray-900">{chamado.impacto}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border border-gray-200 shadow-sm">
            <h2 className="text-xl text-gray-900 mb-4">Histórico</h2>
            <div className="space-y-4">
              {chamado.timeline.map((item, index) => (
                <div key={index} className="relative pl-6 pb-4 border-l-2 border-gray-200 last:border-l-0 last:pb-0">
                  <div className="absolute left-0 top-0 w-4 h-4 bg-[#005EB8] rounded-full -translate-x-[9px]"></div>
                  <p className="text-sm font-medium text-gray-900">{item.descricao}</p>
                  <p className="text-xs text-gray-600 mt-1">{item.responsavel}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.data}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
