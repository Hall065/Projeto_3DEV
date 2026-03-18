import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Upload, X, CheckCircle2 } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';

export default function AbrirChamado() {
  const navigate = useNavigate();
  const [area, setArea] = useState('');
  const [descricao, setDescricao] = useState('');
  const [impacto, setImpacto] = useState('');
  const [item, setItem] = useState('');
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setArquivos([...arquivos, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setArquivos(arquivos.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuccess(true);
    
    setTimeout(() => {
      navigate('/meus-chamados');
    }, 2000);
  };

  const currentDateTime = new Date().toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl text-gray-900">Abrir Chamado</h1>
        <p className="text-gray-600 mt-1">Preencha os dados do problema para abertura do chamado</p>
      </div>

      {showSuccess && (
        <Card className="p-4 bg-green-50 border-green-200 border">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-green-900">Chamado aberto com sucesso!</p>
              <p className="text-sm text-green-700">Redirecionando para lista de chamados...</p>
            </div>
          </div>
        </Card>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="p-6 bg-white border border-gray-200 shadow-sm">
          <div className="space-y-6">
            {/* Área */}
            <div className="space-y-2">
              <Label htmlFor="area">Minha Área *</Label>
              <Select value={area} onValueChange={setArea} required>
                <SelectTrigger id="area" className="bg-white border-gray-300">
                  <SelectValue placeholder="Selecione sua área" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="administrativa">Administrativa</SelectItem>
                  <SelectItem value="producao">Produção</SelectItem>
                  <SelectItem value="laboratorio">Laboratório</SelectItem>
                  <SelectItem value="oficina">Oficina</SelectItem>
                  <SelectItem value="sala-aula">Sala de Aula</SelectItem>
                  <SelectItem value="biblioteca">Biblioteca</SelectItem>
                  <SelectItem value="refeitorio">Refeitório</SelectItem>
                  <SelectItem value="vestiario">Vestiário</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="descricao">Descreva o Problema *</Label>
              <Textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva detalhadamente o problema encontrado..."
                className="min-h-32 bg-white border-gray-300"
                required
              />
              <p className="text-xs text-gray-500">Seja o mais detalhado possível para agilizar o atendimento</p>
            </div>

            {/* Upload de Arquivos */}
            <div className="space-y-2">
              <Label>Anexar Fotos/Arquivos</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#005EB8] transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Clique para selecionar ou arraste arquivos aqui
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Formatos aceitos: JPG, PNG, PDF, DOC (máx. 10MB cada)
                  </p>
                </label>
              </div>

              {/* Lista de arquivos */}
              {arquivos.length > 0 && (
                <div className="mt-4 space-y-2">
                  {arquivos.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <span className="text-sm text-gray-700 truncate flex-1">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-600 hover:text-red-800 ml-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Grau de Impacto */}
            <div className="space-y-2">
              <Label htmlFor="impacto">Grau de Impacto *</Label>
              <Select value={impacto} onValueChange={setImpacto} required>
                <SelectTrigger id="impacto" className="bg-white border-gray-300">
                  <SelectValue placeholder="Selecione o impacto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixo">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                      <span>Baixo - Não interfere nas atividades</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="medio">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <span>Médio - Interfere parcialmente</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="alto">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <span>Alto - Interfere significativamente</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="critico">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-600"></div>
                      <span>Crítico - Paralisa as atividades</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Item Danificado */}
            <div className="space-y-2">
              <Label htmlFor="item">Item/Equipamento Danificado</Label>
              <Select value={item} onValueChange={setItem}>
                <SelectTrigger id="item" className="bg-white border-gray-300">
                  <SelectValue placeholder="Selecione o item (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="torneira">Torneira</SelectItem>
                  <SelectItem value="lampada">Lâmpada</SelectItem>
                  <SelectItem value="ar-condicionado">Ar Condicionado</SelectItem>
                  <SelectItem value="ventilador">Ventilador</SelectItem>
                  <SelectItem value="cadeira">Cadeira</SelectItem>
                  <SelectItem value="mesa">Mesa</SelectItem>
                  <SelectItem value="porta">Porta</SelectItem>
                  <SelectItem value="janela">Janela</SelectItem>
                  <SelectItem value="computador">Computador</SelectItem>
                  <SelectItem value="projetor">Projetor</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Data/Hora */}
            <div className="space-y-2">
              <Label>Data e Hora da Abertura</Label>
              <Input
                type="text"
                value={currentDateTime}
                disabled
                className="bg-gray-100 border-gray-300"
              />
            </div>

            {/* Botão Submit */}
            <div className="flex gap-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 bg-[#F15A22] hover:bg-[#d94d1a] text-white px-6 py-2.5 rounded-lg transition-colors shadow-sm"
                disabled={!area || !descricao || !impacto}
              >
                Enviar Chamado
              </button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}
