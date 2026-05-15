import { useState } from 'react';
import { User, Lock, Bell, Users, Database, Shield, Save } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';

export default function Configuracoes() {
  const [notificacaoEmail, setNotificacaoEmail] = useState(true);
  const [notificacaoPush, setNotificacaoPush] = useState(true);
  const [notificacaoSMS, setNotificacaoSMS] = useState(false);

  const usuarios = [
    { id: 1, nome: 'João Silva', email: 'joao@senai.br', papel: 'Administrador', status: 'Ativo' },
    { id: 2, nome: 'Maria Santos', email: 'maria@senai.br', papel: 'Solicitante', status: 'Ativo' },
    { id: 3, nome: 'Carlos Mendes', email: 'carlos@senai.br', papel: 'Analista', status: 'Ativo' },
    { id: 4, nome: 'Pedro Silva', email: 'pedro@senai.br', papel: 'Técnico', status: 'Ativo' },
    { id: 5, nome: 'Ana Paula', email: 'ana@senai.br', papel: 'Solicitante', status: 'Ativo' },
  ];

  const handleSalvarPerfil = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Perfil atualizado com sucesso!');
  };

  const handleAlterarSenha = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Senha alterada com sucesso!');
  };

  const handleExportarDados = () => {
    alert('Exportando dados do sistema...');
  };

  const handleImportarDados = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        alert(`Importando arquivo: ${file.name}`);
      }
    };
    input.click();
  };

  const getPapelBadge = (papel: string) => {
    const variants = {
      'Administrador': 'bg-purple-100 text-purple-800 border-purple-200',
      'Analista': 'bg-blue-100 text-blue-800 border-blue-200',
      'Técnico': 'bg-green-100 text-green-800 border-green-200',
      'Solicitante': 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return <Badge className={`${variants[papel as keyof typeof variants]} border`}>{papel}</Badge>;
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl text-gray-900">Configurações</h1>
        <p className="text-gray-600 mt-1">Gerencie seu perfil e preferências do sistema</p>
      </div>

      <Tabs defaultValue="perfil" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-gray-100">
          <TabsTrigger value="perfil" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="seguranca" className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="notificacoes" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="dados" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Dados
          </TabsTrigger>
        </TabsList>

        {/* Perfil */}
        <TabsContent value="perfil">
          <Card className="p-6 bg-white border border-gray-200 shadow-sm">
            <h2 className="text-xl text-gray-900 mb-6">Informações do Perfil</h2>
            <form onSubmit={handleSalvarPerfil} className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-[#005EB8] rounded-full flex items-center justify-center">
                  <User className="w-12 h-12 text-white" />
                </div>
                <div>
                  <button
                    type="button"
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                  >
                    Alterar Foto
                  </button>
                  <p className="text-sm text-gray-500 mt-2">JPG ou PNG, máximo 2MB</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input
                    id="nome"
                    defaultValue="João Silva"
                    className="bg-white border-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue="joao.silva@senai.br"
                    className="bg-white border-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    defaultValue="(11) 98765-4321"
                    className="bg-white border-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cargo">Cargo</Label>
                  <Input
                    id="cargo"
                    defaultValue="Coordenador de Manutenção"
                    className="bg-white border-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unidade">Unidade SENAI</Label>
                  <Input
                    id="unidade"
                    defaultValue="SENAI São Paulo - Vila Leopoldina"
                    className="bg-white border-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ramal">Ramal</Label>
                  <Input
                    id="ramal"
                    defaultValue="4532"
                    className="bg-white border-gray-300"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="bg-[#005EB8] hover:bg-[#004a8f] text-white px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Salvar Alterações
                </button>
              </div>
            </form>
          </Card>
        </TabsContent>

        {/* Segurança */}
        <TabsContent value="seguranca">
          <Card className="p-6 bg-white border border-gray-200 shadow-sm">
            <h2 className="text-xl text-gray-900 mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Segurança da Conta
            </h2>
            <form onSubmit={handleAlterarSenha} className="space-y-6">
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="senha-atual">Senha Atual</Label>
                  <Input
                    id="senha-atual"
                    type="password"
                    className="bg-white border-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senha-nova">Nova Senha</Label>
                  <Input
                    id="senha-nova"
                    type="password"
                    className="bg-white border-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senha-confirma">Confirmar Nova Senha</Label>
                  <Input
                    id="senha-confirma"
                    type="password"
                    className="bg-white border-gray-300"
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-900 font-medium mb-2">Requisitos da senha:</p>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Mínimo de 8 caracteres</li>
                    <li>• Pelo menos uma letra maiúscula</li>
                    <li>• Pelo menos um número</li>
                    <li>• Pelo menos um caractere especial</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="bg-[#005EB8] hover:bg-[#004a8f] text-white px-6 py-2.5 rounded-lg transition-colors"
                >
                  Alterar Senha
                </button>
              </div>
            </form>
          </Card>
        </TabsContent>

        {/* Notificações */}
        <TabsContent value="notificacoes">
          <Card className="p-6 bg-white border border-gray-200 shadow-sm">
            <h2 className="text-xl text-gray-900 mb-6">Preferências de Notificações</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between py-4 border-b border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">Notificações por E-mail</p>
                  <p className="text-sm text-gray-600">Receber atualizações de chamados por e-mail</p>
                </div>
                <Switch checked={notificacaoEmail} onCheckedChange={setNotificacaoEmail} />
              </div>

              <div className="flex items-center justify-between py-4 border-b border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">Notificações Push</p>
                  <p className="text-sm text-gray-600">Receber notificações no navegador</p>
                </div>
                <Switch checked={notificacaoPush} onCheckedChange={setNotificacaoPush} />
              </div>

              <div className="flex items-center justify-between py-4 border-b border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">Notificações por SMS</p>
                  <p className="text-sm text-gray-600">Receber alertas críticos por SMS</p>
                </div>
                <Switch checked={notificacaoSMS} onCheckedChange={setNotificacaoSMS} />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium text-gray-900 mb-3">Tipos de Notificação:</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm text-gray-700">Novo chamado atribuído</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm text-gray-700">Chamado atualizado</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm text-gray-700">Chamado concluído</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm text-gray-700">Relatórios semanais</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button className="bg-[#005EB8] hover:bg-[#004a8f] text-white px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Salvar Preferências
                </button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Usuários */}
        <TabsContent value="usuarios">
          <Card className="p-6 bg-white border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl text-gray-900">Gerenciar Usuários</h2>
              <button className="bg-[#005EB8] hover:bg-[#004a8f] text-white px-4 py-2 rounded-lg transition-colors">
                Adicionar Usuário
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">E-mail</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Papel</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">{usuario.nome}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{usuario.email}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPapelBadge(usuario.papel)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className="bg-green-100 text-green-800 border-green-200 border">
                          {usuario.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button className="text-[#005EB8] hover:underline text-sm mr-3">
                          Editar
                        </button>
                        <button className="text-red-600 hover:underline text-sm">
                          Desativar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Dados */}
        <TabsContent value="dados">
          <Card className="p-6 bg-white border border-gray-200 shadow-sm">
            <h2 className="text-xl text-gray-900 mb-6">Importação e Exportação de Dados</h2>
            
            <div className="space-y-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Exportar Dados do Sistema</h3>
                <p className="text-sm text-blue-800 mb-4">
                  Exporta todos os chamados, usuários e configurações em formato JSON ou Excel
                </p>
                <button 
                  onClick={handleExportarDados}
                  className="bg-[#005EB8] hover:bg-[#004a8f] text-white px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Database className="w-4 h-4" />
                  Exportar Dados Completos
                </button>
              </div>

              <div className="bg-orange-50 p-6 rounded-lg">
                <h3 className="font-medium text-orange-900 mb-2">Importar Dados Históricos</h3>
                <p className="text-sm text-orange-800 mb-4">
                  Importe dados de sistemas antigos em formato CSV ou JSON
                </p>
                <button 
                  onClick={handleImportarDados}
                  className="bg-[#F15A22] hover:bg-[#d94d1a] text-white px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Database className="w-4 h-4" />
                  Importar Arquivo
                </button>
              </div>

              <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                <h3 className="font-medium text-red-900 mb-2">⚠️ Zona de Perigo</h3>
                <p className="text-sm text-red-800 mb-4">
                  Cuidado! Estas ações são irreversíveis e podem causar perda de dados.
                </p>
                <div className="flex gap-3">
                  <button className="bg-white hover:bg-red-50 text-red-700 px-4 py-2 rounded-lg border border-red-300 transition-colors">
                    Limpar Dados Antigos
                  </button>
                  <button className="bg-white hover:bg-red-50 text-red-700 px-4 py-2 rounded-lg border border-red-300 transition-colors">
                    Resetar Sistema
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
